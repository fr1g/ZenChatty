using Microsoft.EntityFrameworkCore;
using ZenChattyServer.Net.Models;
using ZenChattyServer.Net.Shared;

namespace ZenChattyServer.Net.Helpers.Context;

public class UserRelatedContext : DbContext
{
    private string _connectionString = Constants.Connection;

    public UserRelatedContext() { }
    
    public UserRelatedContext(DbContextOptions<UserRelatedContext> options) : base(options) { }
    
    public DbSet<User> Users { get; set; }
    public DbSet<PrivacySettings> PrivacySettings { get; set; }
    public DbSet<Chat> Chats { get; set; }
    public DbSet<PrivateChat> PrivateChats { get; set; }
    public DbSet<GroupChat> GroupChats { get; set; }
    public DbSet<Message> Messages { get; set; }
    public DbSet<Contact> Contacts { get; set; }
    public DbSet<GroupChatMember> GroupChatMembers { get; set; }
    public DbSet<GroupSettings> GroupSettings { get; set; }
    public DbSet<UserAuthObject> UserAuthObjects { get; set; }
    public DbSet<GroupInviteLink> GroupInviteLinks { get; set; }
    public DbSet<UserFile> UserFiles { get; set; }
    public DbSet<DeviceSession> DeviceSessions { get; set; }
    
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder
            .UseSqlServer(_connectionString)
            .UseLazyLoadingProxies(); // 启用延迟加载
    }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {

        modelBuilder.Entity<User>()
            .HasOne(u => u.Privacies)
            .WithOne(p => p.User)
            .HasForeignKey<PrivacySettings>(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);
            
        // can user only have relationship via contact.
        // User -> Contact -> PrivateChat(Chat) <- Contact <- User ...OR
        // User Created Group --> Group <- GroupMembers <-- ...Users (1v1)
        
        // modelBuilder.Entity<Chat>()
        //     .HasOne(c => c.InitBy)
        //     .WithMany(u => u.Chats)
        //     .HasForeignKey("InitById")
        //     .OnDelete(DeleteBehavior.Restrict);
        //     
        // modelBuilder.Entity<PrivateChat>()
        //     .HasOne(pc => pc.Receiver)
        //     .WithMany(u => u.PrivateChats)
        //     .HasForeignKey("ReceiverId")
        //     .OnDelete(DeleteBehavior.Restrict);
        
        // ?
            
        modelBuilder.Entity<Message>()
            .HasOne(m => m.OfChat)
            .WithMany(c => c.History)
            .HasForeignKey("OfChatId")
            .OnDelete(DeleteBehavior.Restrict);
            
        modelBuilder.Entity<Contact>()
            .HasOne(c => c.Host)
            .WithMany(u => u.Contacts)
            .HasForeignKey("HostId")
            .OnDelete(DeleteBehavior.Restrict);
            
        modelBuilder.Entity<Contact>()
            .HasOne(c => c.Object)
            .WithMany(ch => ch.Contacts)
            .HasForeignKey("ObjectId")
            .OnDelete(DeleteBehavior.Cascade);
            
        modelBuilder.Entity<GroupChatMember>()
            .HasOne(gcm => gcm.TheGuy)
            .WithMany(u => u.GroupMemberships)
            .HasForeignKey("TheGuyId")
            .OnDelete(DeleteBehavior.Restrict);
            
        modelBuilder.Entity<GroupChatMember>()
            .HasOne(gcm => gcm.InvitedBy)
            .WithMany()
            .HasForeignKey("InvitedById")
            .OnDelete(DeleteBehavior.Restrict);
            
        modelBuilder.Entity<GroupChat>()
            .HasMany(gc => gc.Members)
            .WithOne(gcm => gcm.GroupChat)
            .HasForeignKey(gcm => gcm.GroupChatId)
            .OnDelete(DeleteBehavior.Cascade);
            
        modelBuilder.Entity<GroupChat>()
            .HasMany(gc => gc.AnnouncementMessages)
            .WithOne()
            .OnDelete(DeleteBehavior.Cascade);
            
        modelBuilder.Entity<UserAuthObject>()
            .HasKey(uao => uao.Id); // with
        modelBuilder.Entity<UserAuthObject>()
            .HasOne(uao => uao.User)
            .WithOne()
            .HasForeignKey<UserAuthObject>(uao => uao.Id)
            .OnDelete(DeleteBehavior.Cascade);
            
        modelBuilder.Entity<UserAuthObject>()
            .HasMany(uao => uao.DeviceSessions)
            .WithOne()
            .HasForeignKey(ds => ds.UserAuthObjectId)
            .OnDelete(DeleteBehavior.Cascade);
            
        modelBuilder.Entity<DeviceSession>()
            .Property(ds => ds.RowVersion)
            .IsRowVersion(); // deprecated?

        // configure TPT inheritance for chat hierarchy
        modelBuilder.Entity<Chat>().ToTable("Chats");
        modelBuilder.Entity<PrivateChat>().ToTable("PrivateChats");
        modelBuilder.Entity<GroupChat>().ToTable("GroupChats");
        
        modelBuilder.Entity<GroupChatMember>()
            .HasIndex(gcm => gcm.TheGuyId);
            
        modelBuilder.Entity<GroupChatMember>()
            .HasIndex(gcm => gcm.GroupChatId);
            
        modelBuilder.Entity<GroupChatMember>()
            .HasIndex(gcm => gcm.InvitedById);

        base.OnModelCreating(modelBuilder);
    }
}