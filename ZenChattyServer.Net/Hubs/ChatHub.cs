using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ZenChattyServer.Net.Helpers.Context;
using ZenChattyServer.Net.Models;
using ZenChattyServer.Net.Models.Enums;
using ZenChattyServer.Net.Models.Request;
using ZenChattyServer.Net.Models.Response;
using ZenChattyServer.Net.Models.Events;
using ZenChattyServer.Net.Services;

namespace ZenChattyServer.Net.Hubs;

/// <summary>
/// 聊天中心Hub，负责实时消息推送和聊天组管理
/// 注意：使用 IServiceScopeFactory 创建作用域，避免 Scoped 服务生命周期问题
/// </summary>
public class ChatHub : Hub
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ChatHub> _logger;

    public ChatHub(IServiceScopeFactory scopeFactory, ILogger<ChatHub> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        Console.WriteLine("========== ChatHub 构造函数被调用 ==========");
        _logger.LogInformation("ChatHub 实例已创建");
    }
    
    #region 连接与断开连接管理
    
    /// <summary>
    /// 客户端连接时调用
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        Console.WriteLine($"========================================");
        Console.WriteLine($"========== OnConnectedAsync 被调用 ==========");
        Console.WriteLine($"ConnectionId: {Context.ConnectionId}");
        Console.WriteLine($"时间: {DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}");
        
        // 输出认证信息
        Console.WriteLine($"Context.User: {(Context.User != null ? "存在" : "null")}");
        if (Context.User != null)
        {
            Console.WriteLine($"Context.User.Identity.IsAuthenticated: {Context.User.Identity?.IsAuthenticated}");
            Console.WriteLine($"Context.User.Identity.Name: {Context.User.Identity?.Name ?? "null"}");
            
            // 输出所有 Claims
            Console.WriteLine("Claims:");
            foreach (var claim in Context.User.Claims)
            {
                Console.WriteLine($"  - {claim.Type}: {claim.Value}");
            }
        }
        
        var userId = GetCurrentUserId();
        if (userId.HasValue)
        {
            Console.WriteLine($"✅ 用户 {userId} 已连接，ConnectionId: {Context.ConnectionId}");
            _logger.LogInformation("用户 {UserId} 已连接到聊天中心，连接ID: {ConnectionId}", userId, Context.ConnectionId);
            
            // 自动加入用户个人通知组，用于接收 UpdateRecents 等全局通知
            var userGroupName = $"user-{userId}";
            await Groups.AddToGroupAsync(Context.ConnectionId, userGroupName);
            Console.WriteLine($"✅ 用户 {userId} 已加入个人通知组: {userGroupName}");
            _logger.LogInformation("用户 {UserId} 已加入个人通知组: {GroupName}", userId, userGroupName);
        }
        else
        {
            Console.WriteLine($"⚠️ 未认证用户连接，ConnectionId: {Context.ConnectionId}");
            _logger.LogWarning("未认证用户尝试连接，连接ID: {ConnectionId}", Context.ConnectionId);
        }

        try
        {
            await base.OnConnectedAsync();
            Console.WriteLine("✅ OnConnectedAsync 完成");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ OnConnectedAsync 异常: {ex.Message}");
            Console.WriteLine($"异常堆栈: {ex.StackTrace}");
            throw;
        }
        Console.WriteLine($"========================================");
    }

    /// <summary>
    /// 客户端断开连接时调用
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        Console.WriteLine($"========================================");
        Console.WriteLine($"========== OnDisconnectedAsync 被调用 ==========");
        Console.WriteLine($"ConnectionId: {Context.ConnectionId}");
        Console.WriteLine($"时间: {DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}");
        
        if (exception != null)
        {
            Console.WriteLine($"❌ 断开连接异常: {exception.Message}");
            Console.WriteLine($"❌ 异常类型: {exception.GetType().Name}");
            Console.WriteLine($"❌ 异常堆栈: {exception.StackTrace}");
            
            if (exception.InnerException != null)
            {
                Console.WriteLine($"❌ 内部异常: {exception.InnerException.Message}");
                Console.WriteLine($"❌ 内部异常类型: {exception.InnerException.GetType().Name}");
            }
            
            _logger.LogError(exception, "SignalR连接异常断开，连接ID: {ConnectionId}", Context.ConnectionId);
        }
        else
        {
            Console.WriteLine("ℹ️ 正常断开连接（无异常）");
        }
        
        var userId = GetCurrentUserId();
        if (userId.HasValue)
        {
            Console.WriteLine($"用户 {userId} 已断开连接，ConnectionId: {Context.ConnectionId}");
            _logger.LogInformation("用户 {UserId} 已断开连接，连接ID: {ConnectionId}", userId, Context.ConnectionId);
        }

        try
        {
            await base.OnDisconnectedAsync(exception);
            Console.WriteLine("✅ OnDisconnectedAsync 完成");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ OnDisconnectedAsync base 调用异常: {ex.Message}");
            Console.WriteLine($"异常堆栈: {ex.StackTrace}");
            throw;
        }
        Console.WriteLine($"========================================");
    }
    
    #endregion
    
    #region 客户端事件
    
    /// <summary>
    /// 客户端事件：加入聊天组
    /// 用于实时获取IncomeMessage和PatchMessage事件
    /// </summary>
    public async Task JoinChat(string chatUniqueMark)
    {
        Console.WriteLine($"========================================");
        Console.WriteLine($"========== JoinChat 被调用 ==========");
        Console.WriteLine($"时间: {DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}");
        Console.WriteLine($"chatUniqueMark: {chatUniqueMark}");
        Console.WriteLine($"ConnectionId: {Context.ConnectionId}");
        Console.WriteLine($"ConnectionAborted: {Context.ConnectionAborted.IsCancellationRequested}");
        
        _logger.LogInformation("========== JoinChat 被调用！chatUniqueMark={ChatId}, ConnectionId={ConnectionId} ==========", 
            chatUniqueMark, Context.ConnectionId);
        
        try
        {
            var userId = GetCurrentUserId();
            Console.WriteLine($"GetCurrentUserId 返回: {userId?.ToString() ?? "null"}");
            
            if (!userId.HasValue)
            {
                Console.WriteLine("⚠️ 警告：用户未认证");
                _logger.LogWarning("用户未认证，但仍然加入聊天组: {ChatId}", chatUniqueMark);
            }
            else
            {
                Console.WriteLine($"✅ 用户已认证: {userId}");
            }
            
            // 检查连接状态
            if (Context.ConnectionAborted.IsCancellationRequested)
            {
                Console.WriteLine("⚠️ 警告：连接已被取消");
            }
            
            // 加入SignalR组
            Console.WriteLine($"⏳ 正在调用 Groups.AddToGroupAsync...");
            await Groups.AddToGroupAsync(Context.ConnectionId, chatUniqueMark);
            Console.WriteLine($"✅ Groups.AddToGroupAsync 完成");
            
            Console.WriteLine($"✅ 成功加入聊天组: {chatUniqueMark}");
            _logger.LogInformation("✅ 成功加入聊天组: {ChatId}, 用户: {UserId}", chatUniqueMark, userId);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ JoinChat 异常:");
            Console.WriteLine($"  - 消息: {ex.Message}");
            Console.WriteLine($"  - 类型: {ex.GetType().Name}");
            Console.WriteLine($"  - 堆栈: {ex.StackTrace}");
            
            if (ex.InnerException != null)
            {
                Console.WriteLine($"  - 内部异常: {ex.InnerException.Message}");
                Console.WriteLine($"  - 内部异常类型: {ex.InnerException.GetType().Name}");
            }
            
            _logger.LogError(ex, "加入聊天组时发生错误，聊天: {ChatId}", chatUniqueMark);
            throw; // 重新抛出异常让客户端知道操作失败
        }
        
        Console.WriteLine("========== JoinChat 方法结束 ==========");
        Console.WriteLine($"========================================");
    }

    /// <summary>
    /// 客户端事件：离开聊天组
    /// 在Hub发现断开网络连接或在客户端上退出聊天界面的时候调用
    /// </summary>
    public async Task LeaveChat(string chatUniqueMark)
    {
        Console.WriteLine($"========== LeaveChat 被调用！chatUniqueMark={chatUniqueMark}, ConnectionId={Context.ConnectionId} ==========");
        _logger.LogInformation("LeaveChat 被调用，chatUniqueMark={ChatId}", chatUniqueMark);
        
        try
        {
            // 离开SignalR组
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, chatUniqueMark);
            
            Console.WriteLine($"✅ 成功离开聊天组: {chatUniqueMark}");
            _logger.LogInformation("✅ 成功离开聊天组: {ChatId}", chatUniqueMark);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ LeaveChat 异常: {ex.Message}");
            _logger.LogError(ex, "离开聊天组时发生错误，聊天: {ChatId}", chatUniqueMark);
            throw;
        }
        
        Console.WriteLine("========== LeaveChat 方法结束 ==========");
    }
    
    #endregion
    
    #region 辅助方法
    
    /// <summary>
    /// 获取当前用户ID（从 JWT Claim 中解析）
    /// </summary>
    private Guid? GetCurrentUserId()
    {
        var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userIdClaim))
        {
            return null;
        }

        if (Guid.TryParse(userIdClaim, out var userId))
        {
            return userId;
        }

        return null;
    }
    
    #endregion
}
