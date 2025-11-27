using ZenChattyServer.Net.Models.Enums;

namespace ZenChattyServer.Net.Models.Response;

/// <summary>
/// 消息发送响应
/// </summary>
public class SendMessageResponse(EMessageSendResult resultCanBe, Guid? messageId = null, string? errorMessage = null)
{
    /// <summary>
    /// 发送结果(can be)
    /// </summary>
    public EMessageSendResult ResultCanBe { get; set; } = resultCanBe;

    /// <summary>
    /// 消息ID（发送成功时返回）
    /// </summary>
    public Guid? MessageId { get; set; } = messageId;

    /// <summary>
    /// 错误消息
    /// </summary>
    public string? ErrorMessage { get; set; } = errorMessage;

    /// <summary>
    /// 发送时间
    /// </summary>
    public DateTime? SentAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 是否被消息队列缓存
    /// </summary>
    public bool IsQueued { get; set; } = resultCanBe == EMessageSendResult.Success;

    public static SendMessageResponse Success(Guid messageId) => new(EMessageSendResult.Success, messageId);
    public static SendMessageResponse Unauthorized(string message = "未授权访问") => new(EMessageSendResult.Unauthorized, null, message);
    public static SendMessageResponse Forbidden(string message = "禁止访问") => new(EMessageSendResult.Forbidden, null, message);
    public static SendMessageResponse ChatNotFound() => new(EMessageSendResult.ChatNotFound, null, "聊天不存在");
    public static SendMessageResponse SenderNotFound() => new(EMessageSendResult.SenderNotFound, null, "发送者不存在");
    public static SendMessageResponse ContentEmpty() => new(EMessageSendResult.ContentEmpty, null, "消息内容不能为空");
    public static SendMessageResponse PrivateChatBlocked() => new(EMessageSendResult.PrivateChatBlocked, null, "私聊被拒收");
    public static SendMessageResponse GroupChatDisabled() => new(EMessageSendResult.GroupChatDisabled, null, "群聊已被禁用");
    public static SendMessageResponse PrivateChatNotAllowed() => new(EMessageSendResult.PrivateChatNotAllowed, null, "群聊禁止私聊");
    public static SendMessageResponse NotInGroup() => new(EMessageSendResult.NotInGroup, null, "您不在该群聊中");
    public static SendMessageResponse UserMuted() => new(EMessageSendResult.UserMuted, null, "您已被禁言");
    public static SendMessageResponse ViaGroupChatValidationFailed() => new(EMessageSendResult.ViaGroupChatValidationFailed, null, "通过群聊发起的私聊验证失败");
    public static SendMessageResponse InternalError(string message = "服务器内部错误") => new(EMessageSendResult.InternalError, null, message);
}