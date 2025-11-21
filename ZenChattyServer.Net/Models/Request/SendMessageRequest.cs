using System.ComponentModel.DataAnnotations;
using ZenChattyServer.Net.Models.Enums;

namespace ZenChattyServer.Net.Models.Request;

/// <summary>
/// 消息发送请求
/// </summary>
public class SendMessageRequest
{
    [Required]
    public string ChatUniqueMark { get; set; } = string.Empty;
    
    [Required]
    public string Content { get; set; } = string.Empty;
    
    public EMessageType MessageType { get; set; } = EMessageType.Normal;
    
    /// <summary>
    /// 通过群聊发起的私聊的群聊ID
    /// </summary>
    public string? ViaGroupChatId { get; set; }
    
    /// <summary>
    /// 是否提及所有人
    /// </summary>
    public bool IsMentioningAll { get; set; } = false;
    
    /// <summary>
    /// 被提及的用户ID列表
    /// </summary>
    public List<Guid>? MentionedUserIds { get; set; }
    
    /// <summary>
    /// 消息附加信息
    /// </summary>
    public string? Info { get; set; }
}