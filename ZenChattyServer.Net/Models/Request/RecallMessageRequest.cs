using System.ComponentModel.DataAnnotations;

namespace ZenChattyServer.Net.Models.Request;

/// <summary>
/// 撤回消息请求模型
/// </summary>
public class RecallMessageRequest
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
}