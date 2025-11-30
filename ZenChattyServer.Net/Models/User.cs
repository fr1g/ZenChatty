using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using ZenChattyServer.Net.Helpers;
using ZenChattyServer.Net.Models.Enums;

namespace ZenChattyServer.Net.Models;


[Table("Users")] [Index(nameof(PhoneNumber), nameof(Email), nameof(CustomId), IsUnique = true)]
public class User(string email)
{
    public User() : this(null!) { }
    
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid LocalId { get; set; } = Guid.NewGuid();
    
    [EmailAddress] [Required] [MaxLength(192)]
    public string Email { get; set; } = email;
    
    [MaxLength(128)]
    public string DisplayName { get; set; } = "anonymous";
        
    [MaxLength(128)]
    public string AvatarFileLocator { get; set; } = "";
    
    [MaxLength(128)]
    public string BackgroundFileLocator { get; set; } = "";
    
    [MaxLength(256)]
    public string Bio { get; set; } = "This guy is pleased with default bio.";

    [MaxLength(32)] 
    public string? CustomId { get; set; } = AuthHelper.DefaultShortIdGenerator();
    
    [MaxLength(64)]
    public string? PhoneNumber { get; set; }
    
    public EUserStatus Status { get; set; } = EUserStatus.Unknown; // just registered: new; new object: unknown
    public EGender Gender { get; set; } = EGender.Unset;
    public DateTime? Birth { get; set; } = null;
    public DateTime RegisteredAt { get; set; } = DateTime.Now;
    
    [JsonIgnore]
    public virtual PrivacySettings Privacies { get; set; } = new();
    
    [JsonIgnore]
    public virtual UserAuthObject? AuthObject { get; set; }
    
    public virtual ICollection<Contact> Contacts { get; set; } = new List<Contact>();
    public virtual ICollection<GroupChatMember> GroupMemberships { get; set; } = new List<GroupChatMember>();
    
    
}