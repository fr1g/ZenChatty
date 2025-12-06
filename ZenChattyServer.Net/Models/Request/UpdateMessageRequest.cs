using System.ComponentModel.DataAnnotations;
using ZenChattyServer.Net.Models.Enums;

namespace ZenChattyServer.Net.Models.Request;

/// <summary>
/// 更新消息请求模型
/// </summary>
public class UpdateMessageRequest
{
    /// <summary>
    /// 消息的唯一标识符
    /// </summary>
    [Required]
    public string MessageTraceId { get; set; } = string.Empty;

    /// <summary>
    /// 聊天唯一标识符
    /// </summary>
    [Required]
    public string ChatUniqueMark { get; set; } = string.Empty;

    /// <summary>
    /// 新的消息内容（仅当IsCanceled为false时可修改）
    /// </summary>
    public string? NewContent { get; set; }

    /// <summary>
    /// 消息是否被取消（撤回）
    /// </summary>
    public bool IsCanceled { get; set; } = false;

    /// <summary>
    /// 是否为公告消息
    /// </summary>
    public bool IsAnnouncement { get; set; } = false;

    /// <summary>
    /// 消息附加信息
    /// </summary>
    public string? Info { get; set; }

    /// <summary>
    /// 消息类型
    /// </summary>
    public EMessageType MessageType { get; set; } = EMessageType.Normal;
}