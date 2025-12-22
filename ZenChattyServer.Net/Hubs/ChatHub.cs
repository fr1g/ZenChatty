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

public class ChatHub : Hub
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ChatHub> _logger;

    public ChatHub(IServiceScopeFactory scopeFactory, ILogger<ChatHub> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _logger.LogInformation("ChatHub online");
    }
    
    #region 连接与断开连接管理
    public override async Task OnConnectedAsync()
    {
        Console.WriteLine($"========================================");
        Console.WriteLine($"========== OnConnectedAsync ==========");
        Console.WriteLine($"ConnectionId: {Context.ConnectionId}");
        Console.WriteLine($"at: {DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}");
        
        Console.WriteLine($"Context.User: {(Context.User != null ? "EXIST" : "null")}");
        if (Context.User != null)
        {
            Console.WriteLine($"Context.User.Identity.IsAuthenticated: {Context.User.Identity?.IsAuthenticated}");
            Console.WriteLine($"Context.User.Identity.Name: {Context.User.Identity?.Name ?? "null"}");
            
            Console.WriteLine("Claims:");
            foreach (var claim in Context.User.Claims)
                Console.WriteLine($"  - {claim.Type}: {claim.Value}");
        }
        
        var userId = GetCurrentUserId();
        if (userId.HasValue)
        {
            _logger.LogInformation("{UserId} +ID: {ConnectionId}", userId, Context.ConnectionId);
            // 自动加入用户个人通知组，用于接收 UpdateRecents 等全局通知
            var userGroupName = $"user-{userId}";
            await Groups.AddToGroupAsync(Context.ConnectionId, userGroupName);
            _logger.LogInformation("{UserId} SUBSCR: {GroupName}", userId, userGroupName);
        }
        else
            _logger.LogWarning("Unauth Try: {ConnectionId}", Context.ConnectionId);

        try
        {
            await base.OnConnectedAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"EX OnConnectedAsync: {ex.Message}");
            Console.WriteLine($"trace: {ex.StackTrace}");
            throw;
        }
        Console.WriteLine($"========================================");
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        Console.WriteLine($"========================================");
        Console.WriteLine($"========== OnDisconnectedAsync ==========");
        Console.WriteLine($"ConnectionId: {Context.ConnectionId}");
        Console.WriteLine($"at: {DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}");
        
        if (exception != null)
        {
            Console.WriteLine($"EX disconnect({exception.GetType().Name}): {exception.Message}");
            
            if (exception.InnerException != null)
                Console.WriteLine($"EX internal: {exception.InnerException.Message}");

            
            _logger.LogError(exception, "SignalR Disc ID: {ConnectionId}", Context.ConnectionId);
        }
        
        var userId = GetCurrentUserId();
        if (userId.HasValue)
            _logger.LogInformation("Out: {UserId} ID: {ConnectionId}", userId, Context.ConnectionId);

        try
        {
            await base.OnDisconnectedAsync(exception);
            Console.WriteLine("OnDisconnectedAsync");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"OnDisconnectedAsync base: {ex.Message}");
            throw;
        }
        Console.WriteLine($"========================================");
    }
    
    #endregion
    
    #region 客户端事件
    
    public async Task JoinChat(string chatUniqueMark)
    {
        Console.WriteLine($"========================================");
        Console.WriteLine($"========== JoinChat ==========");
        Console.WriteLine($"at: {DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}");
        Console.WriteLine($"chatUniqueMark: {chatUniqueMark}");
        Console.WriteLine($"ConnectionId: {Context.ConnectionId}");
        Console.WriteLine($"ConnectionAborted: {Context.ConnectionAborted.IsCancellationRequested}");
        
        _logger.LogInformation("========== JoinChat : chatUniqueMark={ChatId}, ConnectionId={ConnectionId} ==========", 
            chatUniqueMark, Context.ConnectionId);
        
        try
        {
            var userId = GetCurrentUserId();
            Console.WriteLine($"GetCurrentUserId <- : {userId?.ToString() ?? "null"}");
            
            if (!userId.HasValue)
            {
                _logger.LogWarning("Not-authed: {ChatId}", chatUniqueMark);
            }
            
            if (Context.ConnectionAborted.IsCancellationRequested)
            {
                Console.WriteLine("ECONNABRT");
            }
            
            Console.WriteLine($"call Groups.AddToGroupAsync...");
            await Groups.AddToGroupAsync(Context.ConnectionId, chatUniqueMark);
            Console.WriteLine($"done Groups.AddToGroupAsync {chatUniqueMark} <- {userId}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"EX JoinChat:");
            Console.WriteLine($"  - E ({ex.GetType().Name}) msg: {ex.Message}");
            Console.WriteLine($"  - E Trace: {ex.StackTrace}");
            
            if (ex.InnerException != null)
                Console.WriteLine($"  - E Internal ({ex.InnerException.GetType().Name}): {ex.InnerException.Message}");
            
            _logger.LogError(ex, "failed to join: {ChatId}", chatUniqueMark);
            throw; 
        }
        
        Console.WriteLine("========== JoinChat END ==========");
        Console.WriteLine($"========================================");
    }

    public async Task LeaveChat(string chatUniqueMark)
    {
        Console.WriteLine($"========== LeaveChat -> chatUniqueMark={chatUniqueMark}, ConnectionId={Context.ConnectionId} ==========");
        
        try
        {
            // 离开SignalR组
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, chatUniqueMark);
            _logger.LogInformation("Left: {ChatId}", chatUniqueMark);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed Leave: {ChatId}", chatUniqueMark);
            throw;
        }
        
        Console.WriteLine("========== LeaveChat End ==========");
    }
    
    #endregion
    
    #region 辅助方法
    
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
