using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using ZenChattyServer.Net.Models.Enums;

namespace ZenChattyServer.Net.Models;

// 添加多态序列化支持，确保子类特有字段能被正确序列化
[JsonDerivedType(typeof(PrivateChat), typeDiscriminator: "private")]
[JsonDerivedType(typeof(GroupChat), typeDiscriminator: "group")]
public class Chat(User initBy)
{
    public Chat() : this(null!)
    {
        this.InitById = Guid.Empty;
    }
    
    [Key] [MaxLength(64)]
    public string UniqueMark { get; set; }  = Guid.NewGuid().ToString(); // todo maycauseproblem !!! unknown if causes error: string type of primary key
    
    public Guid InitById { get; set; } = initBy?.LocalId ?? Guid.Empty;
    public string InitiatorAvatarLocator = initBy?.AvatarFileLocator ?? string.Empty;
    public string InitiatorName = initBy?.DisplayName ?? string.Empty;
    
    // public virtual User InitBy { get; set; } = initBy;
    
    public virtual ICollection<Message> History { get; set; } = new List<Message>();
    public EChatStatus Status { get; set; } = EChatStatus.Normal;
    
    [JsonIgnore]
    public virtual ICollection<Contact> Contacts { get; set; } = new List<Contact>();
}