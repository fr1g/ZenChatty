using Microsoft.EntityFrameworkCore;
using ZenChattyServer.Net.Models;
using ZenChattyServer.Net.Shared;

namespace ZenChattyServer.Net.Helpers.Context;

public class UserRelatedContext : DbContext
{
    private string _connectionString = Constants.Connection;

    
    public DbSet<User> Users { get; set; }
    public DbSet<PrivacySettings> PrivacySettings { get; set; }
    public DbSet<Chat> Chats { get; set; }
    public DbSet<PrivateChat> PrivateChats { get; set; }
    public DbSet<GroupChat> GroupChats { get; set; }
    public DbSet<Message> Messages { get; set; }
    public DbSet<Contact> Contacts { get; set; }
    public DbSet<GroupChatMember> GroupChatMembers { get; set; }
    public DbSet<GroupSettings> GroupSettings { get; set; }
    
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.UseSqlServer(_connectionString);
    }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {

        modelBuilder.Entity<User>()
            .HasOne(u => u.Privacies)
            .WithOne(p => p.User)
            .HasForeignKey<PrivacySettings>(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);
            
        modelBuilder.Entity<Chat>()
            .HasOne(c => c.InitBy)
            .WithMany(u => u.Chats)
            .HasForeignKey("InitById")
            .OnDelete(DeleteBehavior.Restrict);
            
        modelBuilder.Entity<PrivateChat>()
            .HasOne(pc => pc.Receiver)
            .WithMany(u => u.PrivateChats)
            .HasForeignKey("ReceiverId")
            .OnDelete(DeleteBehavior.Restrict);
            
        modelBuilder.Entity<Message>()
            .HasOne(m => m.Sender)
            .WithMany(u => u.Messages)
            .HasForeignKey("SenderId")
            .OnDelete(DeleteBehavior.Restrict);
            
        modelBuilder.Entity<Message>()
            .HasOne(m => m.OfChat)
            .WithMany(c => c.History)
            .HasForeignKey("OfChatId")
            .OnDelete(DeleteBehavior.Restrict);
            
        modelBuilder.Entity<Contact>()
            .HasOne(c => c.Host)
            .WithMany(u => u.Contacts)
            .HasForeignKey("HostId")
            .OnDelete(DeleteBehavior.Cascade);
            
        modelBuilder.Entity<Contact>()
            .HasOne(c => c.Object)
            .WithMany(ch => ch.Contacts)
            .HasForeignKey("ObjectId")
            .OnDelete(DeleteBehavior.Cascade);
            
        modelBuilder.Entity<GroupChatMember>()
            .HasOne(gcm => gcm.TheGuy)
            .WithMany(u => u.GroupMemberships)
            .HasForeignKey("TheGuyId")
            .OnDelete(DeleteBehavior.Cascade);
            
        modelBuilder.Entity<GroupChat>()
            .HasMany(gc => gc.Members)
            .WithOne()
            .OnDelete(DeleteBehavior.Cascade);
            
        modelBuilder.Entity<GroupChat>()
            .HasMany(gc => gc.GroupAnnounce)
            .WithOne()
            .OnDelete(DeleteBehavior.Cascade);

        // configure TPT inheritance for chat hierarchy
        modelBuilder.Entity<Chat>().ToTable("Chats");
        modelBuilder.Entity<PrivateChat>().ToTable("PrivateChats");
        modelBuilder.Entity<GroupChat>().ToTable("GroupChats");

        base.OnModelCreating(modelBuilder);
    }
}