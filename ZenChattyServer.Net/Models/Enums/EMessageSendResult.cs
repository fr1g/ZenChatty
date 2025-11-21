namespace ZenChattyServer.Net.Models.Enums;

/// <summary>
/// 消息发送结果枚举
/// </summary>
public enum EMessageSendResult
{
    /// <summary>
    /// 发送成功
    /// </summary>
    Success = 200,
    
    /// <summary>
    /// 未授权（用户不在聊天中或被拉黑）
    /// </summary>
    Unauthorized = 401,
    
    /// <summary>
    /// 禁止访问（被禁言或群聊被禁用）
    /// </summary>
    Forbidden = 403,
    
    /// <summary>
    /// 聊天不存在
    /// </summary>
    ChatNotFound = 404,
    
    /// <summary>
    /// 发送者不存在
    /// </summary>
    SenderNotFound = 405,
    
    /// <summary>
    /// 消息内容为空
    /// </summary>
    ContentEmpty = 406,
    
    /// <summary>
    /// 私聊被拒收（对方已拉黑）
    /// </summary>
    PrivateChatBlocked = 407,
    
    /// <summary>
    /// 群聊被禁用
    /// </summary>
    GroupChatDisabled = 408,
    
    /// <summary>
    /// 群聊禁止私聊
    /// </summary>
    PrivateChatNotAllowed = 409,
    
    /// <summary>
    /// 发送者不在群聊中
    /// </summary>
    NotInGroup = 410,
    
    /// <summary>
    /// 发送者被禁言
    /// </summary>
    UserMuted = 411,
    
    /// <summary>
    /// 通过群聊发起的私聊验证失败
    /// </summary>
    ViaGroupChatValidationFailed = 412,
    
    /// <summary>
    /// 服务器内部错误
    /// </summary>
    InternalError = 500
}