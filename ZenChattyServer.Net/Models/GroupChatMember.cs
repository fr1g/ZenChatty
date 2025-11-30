using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ZenChattyServer.Net.Models.Enums;

namespace ZenChattyServer.Net.Models;

public class GroupChatMember(User member)
{
    public GroupChatMember() : this(null!){}
    
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid TheGuyId { get; set; }
    public virtual User TheGuy { get; set; } = member;
    
    public string GroupChatId { get; set; } = null!;
    public virtual GroupChat GroupChat { get; set; } = null!;
    public Guid? InvitedById { get; set; } = null;
    public virtual User? InvitedBy { get; set; } = null;

    public EGroupMemberType Type { get; set; } = EGroupMemberType.Member;
    
    [MaxLength(16)]
    public string? GivenTitle { get; set; }
    public string Nickname { get; set; } = "";
    public bool IsSilent { get; set; } = false;
    public DateTime JoinedAt { get; set; } = DateTime.Now;
    public DateTime? SilentUntil { get; set; }
}