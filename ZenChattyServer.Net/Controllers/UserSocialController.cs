using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZenChattyServer.Net.Helpers;
using ZenChattyServer.Net.Helpers.Context;
using ZenChattyServer.Net.Models;
using ZenChattyServer.Net.Models.Enums;
using ZenChattyServer.Net.Models.Request;
using ZenChattyServer.Net.Models.Response;
using ZenChattyServer.Net.Services;
using ZenChattyServer.Net.Shared;

namespace ZenChattyServer.Net.Controllers;

[ApiController]
[Route("/api/social")]
public class UserSocialController(
    UserSocialService userSocialService,
    GroupManageService groupManageService,
    GroupAnnouncementService groupAnnouncementService,
    ChatHubService chatHub,
    UserRelatedContext context,
    AuthService authService)
    : AuthedControllerBase(authService)
{
    #region 用户信息查询接口

    /// <summary>
    /// 查询用户信息（根据隐私设置过滤）
    /// 支持通过 Email、CustomId 或 LocalId (GUID) 查找
    /// </summary>
    [HttpPost("get-user-info/{targetSeekBy}")]
    public async Task<ActionResult<UserInfoResponse>> QueryUserInfo(string targetSeekBy)
    {
        Console.WriteLine($"[API get-user-info] 收到请求 - targetSeekBy: {targetSeekBy}");
        
        var refer = await AuthenticateAsync();
        if (refer.failResult != null)
        {
            Console.WriteLine($"[API get-user-info] 认证失败");
            return Unauthorized(refer.failResult);
        }

        Console.WriteLine($"[API get-user-info] 认证成功 - 请求者: {refer.user!.LocalId}");
        
        // 不再强制转小写，保留原始参数（GUID需要保持原样）
        var result = await userSocialService.QueryUserInfoAsync(refer.user!, targetSeekBy);
        
        Console.WriteLine($"[API get-user-info] 查询结果 - success: {result.success}, message: {result.message}");
        
        if (!result.success)
            return BadRequest(result);
        
        return Ok(result);
    }
    
    #endregion

    #region 私聊相关接口

    /// <summary>
    /// 创建私聊
    /// </summary>
    [HttpPost("private-chat")]
    public async Task<ActionResult<ChatResponse>> CreatePrivateChat([FromBody] CreatePrivateChatRequest request)
    {
        var refer = await AuthenticateAsync();
        if (refer.failResult != null) return Unauthorized(refer.failResult);

        var result = await userSocialService.CreatePrivateChatAsync(refer.user!.LocalId.ToString(), request);
        
        return result.success ? 
            Ok(new ChatResponse { ChatId = result.chatId }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// Check if user disabled
    /// </summary>
    [HttpGet("is-disabled/{targetUserId}")]
    public async Task<ActionResult<BasicResponse>> CheckUserIsDisabled(string targetUserId)
    {
        var refer = await AuthenticateAsync();
        if (refer.failResult != null) return Unauthorized(refer.failResult);

        var isBlocked = refer.user!.Status == EUserStatus.Disabled;
        
        return Ok(new BasicResponse 
        { 
            content = isBlocked ? "Blocked" : "Not blocked", 
            success = true 
        });
    }

    /// <summary>
    /// 拉黑/取消拉黑用户
    /// </summary>
    [HttpPost("block/{targetUserId}")]
    public async Task<ActionResult<BasicResponse>> BlockUser(string targetUserId, [FromQuery] bool block = true)
    {
        var refer = await AuthenticateAsync();
        if (refer.failResult != null) return Unauthorized(refer.failResult);

        var result = await userSocialService.BlockUserAsync(refer.user!.LocalId.ToString(), targetUserId);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }


    
    /// <summary>
    /// 解除拉黑并添加好友
    /// </summary>
    [HttpPost("unblock-and-add/{targetUserId}")]
    public async Task<ActionResult<BasicResponse>> UnblockAndAddFriend(string targetUserId)
    {
        var refer = await AuthenticateAsync();
        if (refer.failResult != null) return Unauthorized(refer.failResult);
        
        var result = await userSocialService.UnblockPrivateChat(refer.user!.LocalId.ToString(), targetUserId);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// 添加好友
    /// </summary>
    [HttpPost("add-friend/{targetUserGuid}")]
    public async Task<ActionResult<ChatResponse>> AddFriend(string targetUserGuid)
    {
        var refer = await AuthenticateAsync();
        if (refer.failResult != null) return Unauthorized(refer.failResult);
        // verify if the request is valid
        // ...
        
        var result = await userSocialService.AddFriendAsync(refer.user!.LocalId.ToString(), targetUserGuid);
        return result.success ? 
            Ok(new ChatResponse { ChatId = result.chatId }) : 
            UnprocessableEntity(new BasicResponse { content = result.message, success = false });
    }

    #endregion
    
    #region UserGroupActons
    
    /// <summary>
    /// 创建群聊
    /// </summary>
    [HttpPost("group/create")]
    public async Task<ActionResult<ChatResponse>> CreateGroupChat([FromBody] CreateGroupChatRequest request)
    {
        var refer = await AuthenticateAsync();
        if (refer.failResult != null) return Unauthorized(refer.failResult);

        var result = await userSocialService.CreateGroupChatAsync(refer.user!.LocalId.ToString(), request);
        
        return result.success ? 
            Ok(new ChatResponse { ChatId = result.groupId }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    [HttpPost("group/leave-from/{groupId}")]
    public async Task<ActionResult<BasicResponse>> LeaveGroup(string groupId)
    {
        var refer = await AuthenticateAsync();
        if (refer.failResult != null) return Unauthorized(refer.failResult);

        var result = await groupManageService.LeaveGroupAsync(refer.user!.LocalId.ToString(), groupId);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }
    
    /// <summary>
    /// Get group anns 
    /// </summary>
    [HttpGet("group/get-announcements/{groupId}")]
    public async Task<ActionResult<List<Message>>> GetGroupAnnouncements(string groupId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult); // Combined (well maybe better using filter?)

        var announcements = await groupAnnouncementService.GetAnnouncementsAsync(groupId, refer.user!, page, pageSize);
        
        return Ok(announcements);
    }
    #endregion
    
    #region 隐私设置检查接口
    // here removed a checking api which checks if one is addable - from group or by other ways.
    // anyway, it's useless, since every check should be done during every action.

    /// <summary>
    /// 检查两个用户之间的拉黑状态
    /// </summary>
    [HttpGet("is-blocked/{targetUserId}")]
    public async Task<ActionResult<BasicResponse>> CheckBlockStatus(string targetUserId)
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult); // Combined (well maybe better using filter?)

        var isBlocked = await RelationshipHelper.CheckBlockStatusAsync(refer.user!.LocalId.ToString(), targetUserId, context);
        
        return Ok(new BasicResponse { 
            content = isBlocked ? "Block relationship exists" : "No block relationship", 
            success = true
        });
    }
    
    #endregion

    #region 其他接口

    /// <summary>
    /// Update unread msgs
    /// </summary>
    [HttpPost("contact/get-unread/{contactId}")]
    public async Task<ActionResult<BasicResponse>> UpdateUnreadCount(string contactId, [FromQuery] int unreadCount)
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult); // Combined (well maybe better using filter?)

        var result = await userSocialService.UpdateUnreadCountAsync(contactId, (ushort)unreadCount, refer.user!);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// Get contacts of oneself
    /// </summary>
    [HttpPost("contact/list")]
    public async Task<ActionResult<List<Contact>>> GetContacts()
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult); // Combined (well maybe better using filter?)

        var contacts = await userSocialService.GetContactsAsync(refer.user!.LocalId.ToString(), true, false);
        
        return Ok(contacts);
    }
    
    
    [HttpPost("contact/recent")]
    public async Task<ActionResult<List<Contact>>> GetRecentContact()
    {
        var refer = await AuthenticateAsync();
        if (refer.failResult != null) return Unauthorized(refer.failResult);
        
        var contacts = await userSocialService.GetContactsAsync(refer.user!.LocalId.ToString());
        return Ok(contacts);
    }

    /// <summary>
    /// 删除对话（从联系人列表中移除，不删除聊天记录）
    /// </summary>
    [HttpDelete("contact/{contactId}")]
    public async Task<ActionResult<BasicResponse>> DeleteContact(string contactId)
    {
        Console.WriteLine($"[DeleteContact] 收到请求 - contactId: {contactId}");
        
        var refer = await AuthenticateAsync();
        if (refer.failResult != null)
        {
            Console.WriteLine($"[DeleteContact] 认证失败");
            return Unauthorized(refer.failResult);
        }

        try
        {
            var userId = refer.user!.LocalId;
            Console.WriteLine($"[DeleteContact] 当前用户: {userId}");
            
            if (!Guid.TryParse(contactId, out var contactGuid))
            {
                Console.WriteLine($"[DeleteContact] 无效的 contactId 格式: {contactId}");
                return BadRequest(new BasicResponse { content = "无效的联系人ID", success = false });
            }

            // 查找联系人记录
            var contact = await context.Contacts
                .FirstOrDefaultAsync(c => c.ContactId == contactGuid && c.HostId == userId);

            if (contact == null)
            {
                Console.WriteLine($"[DeleteContact] 联系人不存在或无权删除");
                return NotFound(new BasicResponse { content = "联系人不存在或无权删除", success = false });
            }

            Console.WriteLine($"[DeleteContact] 找到联系人 - DisplayName: {contact.DisplayName}, ObjectId: {contact.ObjectId}");

            // 删除联系人记录
            context.Contacts.Remove(contact);
            await context.SaveChangesAsync();

            Console.WriteLine($"[DeleteContact] 成功删除联系人");
            return Ok(new BasicResponse { content = "已删除对话", success = true });
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[DeleteContact] 异常: {ex.Message}");
            return StatusCode(500, new BasicResponse { content = "服务器错误", success = false });
        }
    }

    #endregion

    #region 隐私设置管理接口

    /// <summary>
    /// Update one's privacies
    /// </summary>
    [HttpPatch("privacy/update")]
    public async Task<ActionResult<BasicResponse>> UpdatePrivacySettings([FromBody] PrivacySettings newObject)
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult); // Combined (well maybe better using filter?)

        var result = await userSocialService.UpdatePrivacySettingsAsync(refer.user!.LocalId.ToString(), newObject);
        
        return result.success ? 
            Ok(result) : 
            BadRequest(result);
    }

    /// <summary>
    /// 获取用户隐私设置
    /// </summary>
    [HttpGet("privacy/get")]
    public async Task<ActionResult<PrivacySettingsResponse>> GetPrivacySettings()
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult); // Combined (well maybe better using filter?)

        var result = await userSocialService.GetPrivacySettingsAsync(refer.user!);
        
        return result.Success ? 
            Ok(result) : 
            BadRequest(result);
    }

    #endregion

    #region 好友请求接口

    /// <summary>
    /// 发送好友请求 send request to add, if receiver need to accept, press accept button to post another request: ~add-friend/{targetUserGuid}
    /// </summary>
    [HttpPost("add-friend-request")]
    public async Task<ActionResult<BasicResponse>> SendFriendRequest(
        [FromQuery] Guid targetUserId,
        [FromQuery] string? viaGroupId = null)
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult);
        
        // agile fast adding function, not gonna add new service function.
        
        var targetUser = context.Users.FirstOrDefault(user => user.LocalId == targetUserId);
        if (targetUser == null)
            return NotFound(new BasicResponse
            {
                content = "No such user",
                success = false
            });
        
        if (RelationshipHelper.IsUserAFriend(context, refer.user!, targetUser))
            return BadRequest(new BasicResponse
            {
                content = "Already friend",
                success = false
            });
        var isViaGroup = !string.IsNullOrEmpty(viaGroupId) && viaGroupId != targetUserId.ToString(); // linq ignored viaGroupId != null && ... so no need
        
        Message requestMessage;
        if (isViaGroup)
        {
            var g = await context.GroupChats.FirstOrDefaultAsync(gc => gc.UniqueMark == viaGroupId);
            if (g is null)
                return BadRequest(new BasicResponse
                {
                    content = "Wrong usage: no such via-group",
                    success = false
                });
            if(!RelationshipHelper.IsUserGroupMate(refer.user!,  targetUser, g))
                return BadRequest(new BasicResponse
                {
                    content = "You're not in same group!",
                    success = false
                });
            
            var created = await ChatAgent.CreatePrivateChatFromGroupAsync(refer.user!, targetUser, g, context);
            
            if(!created.success || created.chat is null) 
                return BadRequest(new BasicResponse
                {
                    content = $"Failed: {created.message}",
                    success = false
                });
            
            requestMessage = new Message
            {
                Content = @$"requestBy:{refer.user!.LocalId};receiver:{targetUserId};thru-group:{viaGroupId};i-wanna-add-u-as-friend",
                Type = EMessageType.Requesting,
                OfChat = created.chat!,
                OfChatId = created.chat.UniqueMark,
                ViaGroupChatId = viaGroupId,
                Info = "NFR::Group",
                SenderId = refer.user!.LocalId,
                SenderName = refer.user!.DisplayName ?? refer.user!.CustomId
            };
        }
        else
        {
            if (!targetUser.Privacies.IsDiscoverableViaSearch) return BadRequest(new BasicResponse
            {
                content = "Not discoverable",
                success = false
            });
            var creationInternalRequest = new CreatePrivateChatRequest
            {
                ReceiverId = targetUserId.ToString(),
                IsInformal = true
            };
            var created = await userSocialService.CreatePrivateChatAsync(refer.user!.LocalId.ToString(), creationInternalRequest);
            requestMessage = new Message
            {
                Content = @$"requestBy:{refer.user!.LocalId};receiver:{targetUserId};i-wanna-add-u-as-friend",
                Type = EMessageType.Requesting,
                OfChat = created.chat!,
                OfChatId = created.chatId,
                Info = "NFR::Dir",
                SenderId = refer.user!.LocalId,
                SenderName = refer.user!.DisplayName ?? refer.user!.CustomId
            };
        }
        
        await ChatAgent.Say(context, requestMessage, chatHub);
        
        return Ok(new BasicResponse { 
            content = "好友请求已发送", 
            success = true 
        });
    }

    /// <summary>
    /// 接受好友请求
    /// </summary>
    [HttpPost("accept-friend-request")]
    public async Task<ActionResult<BasicResponse>> AcceptFriendRequest([FromQuery] string requestMessageId)
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult);

        try
        {
            // 查找好友请求消息
            var requestMessage = await context.Messages
                .FirstOrDefaultAsync(m => m.TraceId == requestMessageId && m.Type == EMessageType.Requesting);
            
            if (requestMessage == null)
                return NotFound(new BasicResponse
                {
                    content = "好友请求不存在",
                    success = false
                });

            // 解析请求内容，提取请求发起者ID
            // Content格式: "requestBy:{guid};receiver:{guid};i-wanna-add-u-as-friend" 或 "requestBy:{guid};receiver:{guid};thru-group:{guid};i-wanna-add-u-as-friend"
            var content = requestMessage.Content;
            var requestByStart = content.IndexOf("requestBy:") + 10;
            var requestByEnd = content.IndexOf(";", requestByStart);
            var requesterIdStr = content.Substring(requestByStart, requestByEnd - requestByStart);
            
            if (!Guid.TryParse(requesterIdStr, out var requesterId))
                return BadRequest(new BasicResponse
                {
                    content = "无效的请求格式",
                    success = false
                });

            // 确认当前用户是请求的接收者
            var receiverStart = content.IndexOf("receiver:") + 9;
            var receiverEnd = content.IndexOf(";", receiverStart);
            var receiverIdStr = content.Substring(receiverStart, receiverEnd - receiverStart);
            
            if (!Guid.TryParse(receiverIdStr, out var receiverId) || receiverId != refer.user!.LocalId)
                return Forbid();

            // 检查是否已经接受过（通过检查是否已有正式好友关系）
            var existingFriendship = await context.PrivateChats
                .FirstOrDefaultAsync(pc => 
                    ((pc.InitById == requesterId && pc.ReceiverId == receiverId) ||
                     (pc.InitById == receiverId && pc.ReceiverId == requesterId)) &&
                    !pc.IsInformal);

            if (existingFriendship != null)
                return BadRequest(new BasicResponse
                {
                    content = "已经是好友关系",
                    success = false
                });

            // 调用添加好友方法
            var result = await userSocialService.AddFriendAsync(receiverId.ToString(), requesterId.ToString(), true);
            
            if (!result.success)
                return BadRequest(new BasicResponse
                {
                    content = result.message,
                    success = false
                });

            // 更新请求消息状态（添加标记）
            requestMessage.Info = requestMessage.Info?.Replace("NFR::", "NFR::Accepted::");
            context.Messages.Update(requestMessage);
            await context.SaveChangesAsync();

            // 发送系统通知消息给请求发起者
            var acceptNotification = new Message
            {
                Content = $"{refer.user.DisplayName} 接受了你的好友请求",
                Type = EMessageType.Event,
                OfChatId = result.chatId,
                SenderId = refer.user.LocalId,
                Info = "FriendRequestAccepted"
            };
            await ChatAgent.Say(context, acceptNotification, chatHub);

            return Ok(new BasicResponse
            {
                content = "已接受好友请求",
                success = true
            });
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"接受好友请求失败: {ex.Message}");
            return StatusCode(500, new BasicResponse
            {
                content = "服务器错误",
                success = false
            });
        }
    }

    /// <summary>
    /// 拒绝好友请求
    /// </summary>
    [HttpPost("reject-friend-request")]
    public async Task<ActionResult<BasicResponse>> RejectFriendRequest([FromQuery] string requestMessageId)
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult);

        try
        {
            // 查找好友请求消息
            var requestMessage = await context.Messages
                .FirstOrDefaultAsync(m => m.TraceId == requestMessageId && m.Type == EMessageType.Requesting);
            
            if (requestMessage == null)
                return NotFound(new BasicResponse
                {
                    content = "好友请求不存在",
                    success = false
                });

            // 解析请求内容
            var content = requestMessage.Content;
            var receiverStart = content.IndexOf("receiver:") + 9;
            var receiverEnd = content.IndexOf(";", receiverStart);
            var receiverIdStr = content.Substring(receiverStart, receiverEnd - receiverStart);
            
            if (!Guid.TryParse(receiverIdStr, out var receiverId) || receiverId != refer.user!.LocalId)
                return Forbid();

            // 更新请求消息状态
            requestMessage.Info = requestMessage.Info?.Replace("NFR::", "NFR::Rejected::");
            context.Messages.Update(requestMessage);
            await context.SaveChangesAsync();

            // 可选：发送拒绝通知（取决于产品需求）
            // var rejectNotification = new Message { ... };
            // await ChatAgent.Say(context, rejectNotification, chatHub);

            return Ok(new BasicResponse
            {
                content = "已拒绝好友请求",
                success = true
            });
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"拒绝好友请求失败: {ex.Message}");
            return StatusCode(500, new BasicResponse
            {
                content = "服务器错误",
                success = false
            });
        }
    }

    /// <summary>
    /// 获取收到的待处理好友请求
    /// </summary>
    [HttpGet("friend-requests/pending")]
    public async Task<ActionResult<List<Message>>> GetPendingFriendRequests()
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult);

        try
        {
            var userId = refer.user!.LocalId;

            // 查找所有发给当前用户的、类型为Requesting的消息
            var pendingRequests = await context.Messages
                .Where(m => m.Type == EMessageType.Requesting && 
                           m.Content.Contains($"receiver:{userId}") &&
                           (m.Info.StartsWith("NFR::Dir") || m.Info.StartsWith("NFR::Group")) &&
                           !m.Info.Contains("Accepted") &&
                           !m.Info.Contains("Rejected"))
                .OrderByDescending(m => m.SentTimestamp)
                .ToListAsync();

            return Ok(pendingRequests);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"获取待处理好友请求失败: {ex.Message}");
            return StatusCode(500, new BasicResponse
            {
                content = "服务器错误",
                success = false
            });
        }
    }

    /// <summary>
    /// 获取已发送的好友请求
    /// </summary>
    [HttpGet("friend-requests/sent")]
    public async Task<ActionResult<List<Message>>> GetSentFriendRequests()
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult);

        try
        {
            var userId = refer.user!.LocalId;

            // 查找当前用户发送的所有Requesting类型消息
            var sentRequests = await context.Messages
                .Where(m => m.Type == EMessageType.Requesting && 
                           m.SenderId == userId)
                .OrderByDescending(m => m.SentTimestamp)
                .ToListAsync();

            return Ok(sentRequests);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"获取已发送好友请求失败: {ex.Message}");
            return StatusCode(500, new BasicResponse
            {
                content = "服务器错误",
                success = false
            });
        }
    }

    /// <summary>
    /// 撤销好友请求
    /// </summary>
    [HttpPost("revoke-friend-request")]
    public async Task<ActionResult<BasicResponse>> RevokeFriendRequest([FromQuery] string requestMessageId)
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult);

        try
        {
            var requestMessage = await context.Messages
                .FirstOrDefaultAsync(m => m.TraceId == requestMessageId && 
                                        m.Type == EMessageType.Requesting &&
                                        m.SenderId == refer.user!.LocalId);
            
            if (requestMessage == null)
                return NotFound(new BasicResponse
                {
                    content = "好友请求不存在或无权撤销",
                    success = false
                });

            // 标记为已撤销
            requestMessage.Info = requestMessage.Info?.Replace("NFR::", "NFR::Revoked::");
            requestMessage.IsCanceled = true;
            context.Messages.Update(requestMessage);
            await context.SaveChangesAsync();

            return Ok(new BasicResponse
            {
                content = "已撤销好友请求",
                success = true
            });
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"撤销好友请求失败: {ex.Message}");
            return StatusCode(500, new BasicResponse
            {
                content = "服务器错误",
                success = false
            });
        }
    }

    /// <summary>
    /// 解除好友关系
    /// </summary>
    [HttpPost("remove-friend/{targetUserId}")]
    public async Task<ActionResult<BasicResponse>> RemoveFriend(string targetUserId)
    {
        Console.WriteLine($"[RemoveFriend] 收到请求 - targetUserId: {targetUserId}");
        
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null)
        {
            Console.WriteLine($"[RemoveFriend] 认证失败");
            return Unauthorized(refer.failResult);
        }

        try
        {
            var userId = refer.user!.LocalId;
            Console.WriteLine($"[RemoveFriend] 当前用户: {userId}");
            
            if (!Guid.TryParse(targetUserId, out var targetGuid))
            {
                Console.WriteLine($"[RemoveFriend] 无效的用户ID格式: {targetUserId}");
                return BadRequest(new BasicResponse { content = "无效的用户ID", success = false });
            }

            Console.WriteLine($"[RemoveFriend] 查找私聊关系 - userId: {userId}, targetGuid: {targetGuid}");
            
            // 查找私聊关系
            var privateChat = await context.PrivateChats
                .FirstOrDefaultAsync(pc => 
                    ((pc.InitById == userId && pc.ReceiverId == targetGuid) ||
                     (pc.InitById == targetGuid && pc.ReceiverId == userId)) &&
                    !pc.IsInformal);

            if (privateChat == null)
            {
                Console.WriteLine($"[RemoveFriend] 好友关系不存在 - 查找 informal 私聊...");
                // 调试：检查是否存在任何私聊（包括 informal）
                var anyChat = await context.PrivateChats
                    .FirstOrDefaultAsync(pc => 
                        (pc.InitById == userId && pc.ReceiverId == targetGuid) ||
                        (pc.InitById == targetGuid && pc.ReceiverId == userId));
                if (anyChat != null)
                {
                    Console.WriteLine($"[RemoveFriend] 找到私聊但已是 informal - InitById: {anyChat.InitById}, ReceiverId: {anyChat.ReceiverId}, IsInformal: {anyChat.IsInformal}");
                }
                else
                {
                    Console.WriteLine($"[RemoveFriend] 完全没有找到私聊关系");
                }
                return NotFound(new BasicResponse { content = "好友关系不存在", success = false });
            }

            Console.WriteLine($"[RemoveFriend] 找到私聊 - UniqueMark: {privateChat.UniqueMark}, IsInformal: {privateChat.IsInformal}");

            // 将好友关系标记为非正式（解除好友但保留聊天记录）
            privateChat.IsInformal = true;
            context.PrivateChats.Update(privateChat);
            await context.SaveChangesAsync();

            Console.WriteLine($"[RemoveFriend] 成功解除好友关系");
            return Ok(new BasicResponse { content = "已解除好友关系", success = true });
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[RemoveFriend] 异常: {ex.Message}");
            Console.Error.WriteLine($"[RemoveFriend] 堆栈: {ex.StackTrace}");
            return StatusCode(500, new BasicResponse { content = "服务器错误", success = false });
        }
    }

    /// <summary>
    /// 获取好友列表（非临时私聊的联系人）
    /// </summary>
    [HttpGet("friends")]
    public async Task<ActionResult<List<Contact>>> GetFriends()
    {
        Console.WriteLine($"[GetFriends] 收到请求");
        
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null)
        {
            Console.WriteLine($"[GetFriends] 认证失败");
            return Unauthorized(refer.failResult);
        }

        try
        {
            var userId = refer.user!.LocalId;
            Console.WriteLine($"[GetFriends] 当前用户: {userId}");

            // 获取所有非临时的私聊联系人（即好友）
            // 使用 AsNoTracking 避免 EF Core 生成代理类，否则 JSON 多态序列化会失败
            var friends = await context.Contacts
                .AsNoTracking()
                .Include(c => c.Object)
                .Where(c => c.HostId == userId && 
                           c.Object is PrivateChat &&
                           !(c.Object as PrivateChat)!.IsInformal &&
                           !c.IsBlocked)
                .OrderByDescending(c => c.LastUsed)
                .ToListAsync();

            Console.WriteLine($"[GetFriends] 找到 {friends.Count} 个好友");
            
            // 调试：打印每个好友的详细信息
            foreach (var friend in friends)
            {
                var pc = friend.Object as PrivateChat;
                Console.WriteLine($"[GetFriends] 好友: ContactId={friend.ContactId}, DisplayName={friend.DisplayName}, ObjectId={friend.ObjectId}");
                Console.WriteLine($"[GetFriends]   PrivateChat: InitById={pc?.InitById}, ReceiverId={pc?.ReceiverId}, UniqueMark={pc?.UniqueMark}, IsInformal={pc?.IsInformal}");
            }

            return Ok(friends);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"获取好友列表失败: {ex.Message}");
            return StatusCode(500, new BasicResponse
            {
                content = "服务器错误",
                success = false
            });
        }
    }

    #endregion

}