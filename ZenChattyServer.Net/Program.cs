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
{
    var config = provider.GetRequiredService<Microsoft.Extensions.Options.IOptions<JwtConfig>>().Value;
    return config;
});

// config File Storage
builder.Services.Configure<FileStorageOptions>(builder.Configuration.GetSection("FileStorage"));
builder.Services.AddScoped<FileStorageService>();

builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<ChatService>(); // todo ??
builder.Services.AddScoped<ChatQueryHelper>();
builder.Services.AddScoped<RelationshipHelper>();
builder.Services.AddScoped<MessageValidationService>();
builder.Services.AddScoped<IMessageQueueService, RabbitMQMessageQueueService>();
builder.Services.AddSingleton<MessageCacheService>();
builder.Services.AddScoped<CacheSyncService>();
builder.Services.AddScoped<ChatHubService>();
builder.Services.AddScoped<UserSocialService>();
builder.Services.AddScoped<GroupManageService>();
builder.Services.AddScoped<GroupInviteLinkService>();
builder.Services.AddScoped<GroupAnnouncementService>();
builder.Services.AddScoped<ContactService>();
builder.Services.AddDbContext<UserRelatedContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 添加SignalR服务
builder.Services.AddSignalR();

// 添加CORS配置
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactNativeApp", policy =>
    {
        policy.WithOrigins(
                "http://localhost:8081", // Expo开发服务器
                "http://localhost:19000", // Expo Metro bundler
                "http://localhost:19006", // Expo开发工具
                "http://chatty.vot.moe", 
                "http://rus.kami.su" // 您的frp映射域名
                // todo i still want to ensure support of https. open client. then let's just allow all cors!
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// 配置RabbitMQ
builder.Services.Configure<RabbitMQConfig>(builder.Configuration.GetSection("RabbitMQ"));
builder.Services.AddSingleton<RabbitMQConfig>(provider =>
{
    var config = new RabbitMQConfig();
    builder.Configuration.GetSection("RabbitMQ").Bind(config);
    return config;
});

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
    
    // 启用CORS（开发环境）
    app.UseCors("ReactNativeApp");
    
    // dev test scope

    userContext.Database.EnsureDeleted();
    userContext.Database.EnsureCreated();
    
}

app.UseHttpsRedirection();
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

// 启动RabbitMQ消费者服务
try
{
    // using var scope = app.Services.CreateScope();
    var messageQueueService = scope.ServiceProvider.GetRequiredService<IMessageQueueService>();
    await messageQueueService.StartConsumingAsync();
    Console.WriteLine("RabbitMQ消费者服务已启动");
}
catch (Exception ex)
{
    Console.WriteLine($"启动RabbitMQ消费者服务失败: {ex.Message}");
    throw;
}

await app.RunAsync();