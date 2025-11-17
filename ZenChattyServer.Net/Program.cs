using Microsoft.EntityFrameworkCore;
using ZenChattyServer.Net.Helpers.Context;
using ZenChattyServer.Net.Models;
using Constants = ZenChattyServer.Net.Shared.Constants;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    using (var userContext = new UserRelatedContext())
    {
        userContext.Database.EnsureDeleted();
        userContext.Database.EnsureCreated();
        
        // Test creating a user with privacy settings
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
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();