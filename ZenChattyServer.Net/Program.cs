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
builder.Services.AddScoped<ChatService>();
builder.Services.AddScoped<ChatQueryHelper>();
builder.Services.AddScoped<RelationshipHelper>();
builder.Services.AddScoped<MessageValidationService>();
builder.Services.AddScoped<IMessageQueueService, RabbitMQMessageQueueService>();
builder.Services.AddSingleton<MessageCacheService>();
builder.Services.AddScoped<CacheSyncService>();
builder.Services.AddScoped<UserSocialService>();
builder.Services.AddScoped<GroupManagementService>();
builder.Services.AddScoped<GroupInviteLinkService>();
builder.Services.AddScoped<GroupAnnouncementService>();
builder.Services.AddDbContext<UserRelatedContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 添加SignalR服务
builder.Services.AddSignalR();

// 添加消息批量存储服务
builder.Services.AddHostedService<MessageBatchStorageService>();

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

// HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    
    // dev test scope
    using var scope = app.Services.CreateScope();
    var userContext = scope.ServiceProvider.GetRequiredService<UserRelatedContext>();
    userContext.Database.EnsureDeleted();
    userContext.Database.EnsureCreated();
    
    var testUser = new User("testify@me.org");
    userContext.Add(testUser);
    userContext.SaveChanges();
        
    var getFromDb = userContext.Users.Include(user => user.Privacies).FirstOrDefault(user => user.Email == testUser.Email);
    Console.WriteLine(getFromDb!.Bio);
    Console.WriteLine(getFromDb!.Privacies.BioVisibility);
        
    // Test creating a private chat
    var anotherUser = new User("another@test.org");
    userContext.Add(anotherUser);
    userContext.SaveChanges();
        
    var privateChat = new PrivateChat(testUser, anotherUser);
    userContext.Add(privateChat);
    userContext.SaveChanges();
        
    Console.WriteLine($"Created private chat with ID: {privateChat.UniqueMark}");
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

// 添加SignalR Hub路由
app.MapHub<ChatHub>("/chatHub");

app.Run();