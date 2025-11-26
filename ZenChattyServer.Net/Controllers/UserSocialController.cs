using Microsoft.AspNetCore.Mvc;
using ZenChattyServer.Net.Helpers;
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
    AuthService authService)
    : AuthedControllerBase(authService)
{
    #region 用户信息查询接口

    /// <summary>
    /// 查询用户信息（根据隐私设置过滤）
    /// </summary>
    [HttpPost("get-user-info")]
    public async Task<ActionResult<UserInfoResponse>> QueryUserInfo([FromBody] UserInfoQueryRequest request)
    {
        var refer = await AuthenticateAsync();
        if (refer.failResult != null) return Unauthorized(refer.failResult);

        var result = await userSocialService.QueryUserInfoAsync(refer.user!.LocalId.ToString(), request.Email, request.CustomId);
        
        if (!result.success)
            return BadRequest(result);
        
        return Ok(result);
    }

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
        
        var result = await userSocialService.UnblockAndAddFriendAsync(refer.user!.LocalId.ToString(), targetUserId);
        
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

        var isBlocked = await userSocialService.CheckBlockStatusAsync(refer.user!.LocalId.ToString(), targetUserId);
        
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

        var contacts = await userSocialService.GetContactsAsync(refer.user!.LocalId.ToString());
        
        return Ok(contacts);
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

        var result = await userSocialService.GetPrivacySettingsAsync(refer.user!.LocalId.ToString());
        
        return result.success ? 
            Ok(result) : 
            BadRequest(result);
    }

    #endregion

    #endregion
}