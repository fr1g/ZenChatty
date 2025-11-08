using Microsoft.EntityFrameworkCore;
using ZenChattyServer.Net.Models;
using ZenChattyServer.Net.Shared;

namespace ZenChattyServer.Net.Helpers.Context;

public class UserRelatedContext : DbContext
{
    private string _connectionString = Constants.Connection;

    
    public DbSet<User>  Users { get; set; }
    public DbSet<PrivacySettings>  PrivacySettings { get; set; }
    
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.UseSqlServer(_connectionString);
    }
}