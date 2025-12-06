using ZenChattyServer.Net.Models.Enums;

namespace ZenChattyServer.Net.Models.Response;

/// <summary>
/// 更新消息响应
/// </summary>
public class UpdateMessageResponse
{
    /// <summary>
    /// 更新结果
    /// </summary>
    public EMessageUpdateResult Result { get; set; }
    
    /// <summary>
    /// 错误消息
    /// </summary>
    public string? ErrorMessage { get; set; }
    
    /// <summary>
    /// 是否成功
    /// </summary>
    public bool IsSuccess => Result == EMessageUpdateResult.Success;

    private UpdateMessageResponse(EMessageUpdateResult result, string? errorMessage = null)
    {
        Result = result;
        ErrorMessage = errorMessage;
    }

    /// <summary>
    /// 创建成功响应
    /// </summary>
    public static UpdateMessageResponse Success()
    {
        return new UpdateMessageResponse(EMessageUpdateResult.Success);
    }

    /// <summary>
    /// 创建未认证响应
    /// </summary>
    public static UpdateMessageResponse Unauthorized(string message = "用户未认证")
    {
        return new UpdateMessageResponse(EMessageUpdateResult.Unauthorized, message);
    }

    /// <summary>
    /// 创建消息未找到响应
    /// </summary>
    public static UpdateMessageResponse MessageNotFound()
    {
        return new UpdateMessageResponse(EMessageUpdateResult.MessageNotFound, "消息未找到");
    }

    /// <summary>
    /// 创建无效操作响应
    /// </summary>
    public static UpdateMessageResponse InvalidOperation(string message)
    {
        return new UpdateMessageResponse(EMessageUpdateResult.InvalidOperation, message);
    }

    /// <summary>
    /// 创建无效内容响应
    /// </summary>
    public static UpdateMessageResponse InvalidContent(string message)
    {
        return new UpdateMessageResponse(EMessageUpdateResult.InvalidContent, message);
    }

    /// <summary>
    /// 创建内部错误响应
    /// </summary>
    public static UpdateMessageResponse InternalError(string message)
    {
        return new UpdateMessageResponse(EMessageUpdateResult.InternalError, message);
    }
}

/// <summary>
/// 消息更新结果枚举
/// </summary>
public enum EMessageUpdateResult
{
    /// <summary>
    /// 成功
    /// </summary>
    Success,
    
    /// <summary>
    /// 未认证
    /// </summary>
    Unauthorized,
    
    /// <summary>
    /// 消息未找到
    /// </summary>
    MessageNotFound,
    
    /// <summary>
    /// 无效操作
    /// </summary>
    InvalidOperation,
    
    /// <summary>
    /// 无效内容
    /// </summary>
    InvalidContent,
    
    /// <summary>
    /// 内部错误
    /// </summary>
    InternalError
}