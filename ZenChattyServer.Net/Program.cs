using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using ZenChattyServer.Net.Config;
using ZenChattyServer.Net.Helpers;
using ZenChattyServer.Net.Helpers.Context;
using ZenChattyServer.Net.Hubs;
using ZenChattyServer.Net.Models;
using ZenChattyServer.Net.Services;
using Constants = ZenChattyServer.Net.Shared.Constants;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

builder.Services.AddMemoryCache();
builder.Services.AddLogging();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// config JWT
builder.Services.Configure<JwtConfig>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddSingleton<JwtConfig>(provider =>
    provider.GetRequiredService<Microsoft.Extensions.Options.IOptions<JwtConfig>>().Value
);

// JWT for SignalR (which, should for all controller as basic verification, but now I'm using a custom one, which embraces more conveniences)
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
            System.Text.Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"] ?? "")),
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
    
    // SignalR
    options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            
            Console.WriteLine($"========== JWT OnMessageReceived ==========");
            Console.WriteLine($"Path: {path}");
            Console.WriteLine($"Token from query: {(!string.IsNullOrEmpty(accessToken) ? $"存在 (长度: {accessToken.ToString().Length})" : "不存在")}");
            
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/chatHub"))
            {
                context.Token = accessToken;
                Console.WriteLine("✅ Token 已设置到上下文");
            }
            else
            {
                Console.WriteLine("⚠️ Token 未设置（路径不匹配或 Token 为空）");
            }
            Console.WriteLine("==========================================");
            
            return Task.CompletedTask;
        },
        OnAuthenticationFailed = context =>
        {
            Console.WriteLine($"❌ ========== JWT 认证失败 ==========");
            Console.WriteLine($"异常: {context.Exception.Message}");
            Console.WriteLine($"异常类型: {context.Exception.GetType().Name}");
            Console.WriteLine($"堆栈: {context.Exception.StackTrace}");
            Console.WriteLine("==========================================");
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            Console.WriteLine($"✅ ========== JWT Token 验证成功 ==========");
            var userId = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            Console.WriteLine($"用户ID: {userId ?? "未找到"}");
            Console.WriteLine("==========================================");
            return Task.CompletedTask;
        },
        OnChallenge = context =>
        {
            Console.WriteLine($"⚠️ ========== JWT 认证挑战 ==========");
            Console.WriteLine($"Error: {context.Error}");
            Console.WriteLine($"ErrorDescription: {context.ErrorDescription}");
            Console.WriteLine($"AuthenticateFailure: {context.AuthenticateFailure?.Message}");
            Console.WriteLine("==========================================");
            return Task.CompletedTask;
        }
    };
});

// config File Storage
builder.Services.Configure<FileStorageOptions>(builder.Configuration.GetSection("FileStorage"));
builder.Services.AddScoped<FileStorageService>();

builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<ChatService>(); // todo ??
builder.Services.AddScoped<ChatQueryHelper>();
builder.Services.AddScoped<RelationshipHelper>();
builder.Services.AddScoped<MessageValidationService>();
// 使用空操作消息队列服务（不需要 RabbitMQ）
// 如果需要启用 RabbitMQ，将下面一行改为：builder.Services.AddScoped<IMessageQueueService, RabbitMQMessageQueueService>();
builder.Services.AddScoped<IMessageQueueService, NoOpMessageQueueService>();
builder.Services.AddSingleton<MessageCacheService>();
// todo builder.Services.AddScoped<CacheSyncService>();
builder.Services.AddScoped<ChatHubService>();
builder.Services.AddScoped<UserSocialService>();
builder.Services.AddScoped<GroupManageService>();
builder.Services.AddScoped<GroupInviteLinkService>();
builder.Services.AddScoped<GroupAnnouncementService>();
builder.Services.AddScoped<ContactService>();
builder.Services.AddDbContext<UserRelatedContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 添加SignalR服务
builder.Services.AddSignalR(options =>
    {
        // 启用详细错误信息（开发环境）
        options.EnableDetailedErrors = true;
        
        // 配置超时时间
        options.ClientTimeoutInterval = TimeSpan.FromSeconds(60);
        options.HandshakeTimeout = TimeSpan.FromSeconds(30);
        options.KeepAliveInterval = TimeSpan.FromSeconds(15);
        
        Console.WriteLine("========== SignalR 配置 ==========");
        Console.WriteLine($"EnableDetailedErrors: {options.EnableDetailedErrors}");
        Console.WriteLine($"ClientTimeoutInterval: {options.ClientTimeoutInterval}");
        Console.WriteLine($"HandshakeTimeout: {options.HandshakeTimeout}");
        Console.WriteLine($"KeepAliveInterval: {options.KeepAliveInterval}");
        Console.WriteLine("==================================");
    })
    .AddJsonProtocol(options =>
    {
        options.PayloadSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

// 添加CORS配置 - 允许所有来源
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactNativeApp", policy =>
    {
        policy.SetIsOriginAllowed(_ => true) // 允许所有来源
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// 配置RabbitMQ（仅在启用 RabbitMQMessageQueueService 时需要）
// builder.Services.Configure<RabbitMQConfig>(builder.Configuration.GetSection("RabbitMQ"));
// builder.Services.AddSingleton<RabbitMQConfig>(provider =>
// {
//     var config = new RabbitMQConfig();
//     builder.Configuration.GetSection("RabbitMQ").Bind(config);
//     return config;
// });

var app = builder.Build();
try
{
    var passc = builder.Configuration["Chatty:Database:Password"];
    if(passc is null) throw new NullReferenceException("Chatty:Database:Password is not set.");
    Constants.Initialize(passc);
}
catch (Exception e)
{
    Console.WriteLine(e);
    return;
}

using var scope = app.Services.CreateScope();
var userContext = scope.ServiceProvider.GetRequiredService<UserRelatedContext>();
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    
    // dev test scope
    // ⚠️ 注释掉以下两行以保留数据库数据
    // 如果需要重置数据库，取消注释即可
    // userContext.Database.EnsureDeleted();
    // userContext.Database.EnsureCreated();
    
    // 确保数据库存在（不会删除现有数据）
    userContext.Database.EnsureCreated();
}

// 启用CORS（所有环境都需要）
app.UseCors("ReactNativeApp");

// 添加 WebSocket 和 SignalR 调试中间件
app.Use(async (context, next) =>
{
    var path = context.Request.Path;
    
    // 记录所有 /chatHub 的请求
    if (path.StartsWithSegments("/chatHub"))
    {
        Console.WriteLine($"========================================");
        Console.WriteLine($"========== 收到 chatHub 请求 ==========");
        Console.WriteLine($"时间: {DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}");
        Console.WriteLine($"路径: {path}");
        Console.WriteLine($"方法: {context.Request.Method}");
        Console.WriteLine($"协议: {context.Request.Protocol}");
        Console.WriteLine($"IsWebSocket: {context.WebSockets.IsWebSocketRequest}");
        Console.WriteLine($"QueryString: {context.Request.QueryString}");
        
        // 输出请求头
        Console.WriteLine("请求头:");
        foreach (var header in context.Request.Headers)
        {
            // 对于 Authorization 头，只显示是否存在
            if (header.Key.Equals("Authorization", StringComparison.OrdinalIgnoreCase))
            {
                Console.WriteLine($"  - {header.Key}: [存在]");
            }
            else if (header.Key.Equals("Cookie", StringComparison.OrdinalIgnoreCase))
            {
                Console.WriteLine($"  - {header.Key}: [存在]");
            }
            else
            {
                Console.WriteLine($"  - {header.Key}: {header.Value}");
            }
        }
        
        // 检查 access_token
        var accessToken = context.Request.Query["access_token"];
        Console.WriteLine($"access_token 查询参数: {(!string.IsNullOrEmpty(accessToken) ? $"存在 (长度: {accessToken.ToString().Length})" : "不存在")}");
        
        Console.WriteLine($"========================================");
    }
    
    try
    {
        await next();
        
        if (path.StartsWithSegments("/chatHub"))
        {
            Console.WriteLine($"========== chatHub 请求完成 ==========");
            Console.WriteLine($"状态码: {context.Response.StatusCode}");
            Console.WriteLine($"========================================");
        }
    }
    catch (Exception ex)
    {
        if (path.StartsWithSegments("/chatHub"))
        {
            Console.WriteLine($"❌ ========== chatHub 请求异常 ==========");
            Console.WriteLine($"异常: {ex.Message}");
            Console.WriteLine($"类型: {ex.GetType().Name}");
            Console.WriteLine($"堆栈: {ex.StackTrace}");
            Console.WriteLine($"========================================");
        }
        throw;
    }
});

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// 添加SignalR Hub路由
app.MapHub<ChatHub>("/chatHub");

// Creating System User, or ensure it is here.
try
{
    const string systemUserName = "system";
    var systemUser = await userContext.Users.FirstOrDefaultAsync(u => u.CustomId! == systemUserName);
    if (systemUser is null)
    {
        var sysUser = new User
        {
            CustomId = systemUserName,
            Email = "systemUser@chatty.me",
            DisplayName = "System Sayings"
        };
        try
        {
            userContext.Users.Add(sysUser);
            await userContext.SaveChangesAsync();
            systemUser = sysUser;
        }
        catch (Exception e)
        {
            Console.WriteLine($"Seems here's parallel: {e.Message}");
            systemUser = await userContext.Users.FirstOrDefaultAsync(u => u.CustomId! == systemUserName);
        }
    }
    Constants.SystemUser = systemUser;
}
catch (Exception e)
{
    Console.Error.WriteLine($"!!!CRIT System User maybe not exists: {e.Message}");
}

// 启动消息队列消费者服务（如果使用 RabbitMQ）
try
{
    var messageQueueService = scope.ServiceProvider.GetRequiredService<IMessageQueueService>();
    await messageQueueService.StartConsumingAsync();
    Console.WriteLine("消息队列服务已启动");
}
catch (Exception ex)
{
    // 不抛出异常，允许应用在没有消息队列的情况下运行
    Console.WriteLine($"消息队列服务启动跳过: {ex.Message}");
}

await app.RunAsync();