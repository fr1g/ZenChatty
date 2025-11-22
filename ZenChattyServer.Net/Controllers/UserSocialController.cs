using Microsoft.AspNetCore.Mvc;
using ZenChattyServer.Net.Helpers;
using ZenChattyServer.Net.Models;
using ZenChattyServer.Net.Models.Request;
using ZenChattyServer.Net.Models.Response;
using ZenChattyServer.Net.Services;
using ZenChattyServer.Net.Shared;

namespace ZenChattyServer.Net.Controllers;

[ApiController]
[Route("/api/social")]
public class UserSocialController(
    UserSocialService userSocialService,
    GroupManagementService groupManagementService,
    GroupInviteLinkService groupInviteLinkService,
    GroupAnnouncementService groupAnnouncementService,
    AuthService authService)
    : ControllerBase
{
    #region 用户信息查询接口

    /// <summary>
    /// 查询用户信息（根据隐私设置过滤）
    /// </summary>
    [HttpPost("query-user-info")]
    public async Task<ActionResult<UserInfoResponse>> QueryUserInfo([FromBody] UserInfoQueryRequest request)
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult); // Combined (well maybe better using filter?)

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
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult); // Combined (well maybe better using filter?)

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
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult); // Combined (well maybe better using filter?)

        var isBlocked = await userSocialService.CheckBlockStatusAsync(refer.user!.LocalId.ToString(), targetUserId);
        
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
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult); // Combined (well maybe better using filter?)

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
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult); // Combined (well maybe better using filter?)
        
        var result = await userSocialService.UnblockAndAddFriendAsync(refer.user!.LocalId.ToString(), targetUserId);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// 添加好友
    /// </summary>
    [HttpPost("add-friend")]
    public async Task<ActionResult<ChatResponse>> AddFriend([FromBody] AddFriendRequest request)
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult); // Combined (well maybe better using filter?)

        var result = await userSocialService.AddFriendAsync(refer.user!.LocalId.ToString(), request);
        return result.success ? 
            Ok(new ChatResponse { ChatId = result.chatId }) : 
            UnprocessableEntity(new BasicResponse { content = result.message, success = false });
    }

    #endregion

    #region 群聊相关接口

    /// <summary>
    /// 创建群聊
    /// </summary>
    [HttpPost("group-chat")]
    public async Task<ActionResult<ChatResponse>> CreateGroupChat([FromBody] CreateGroupChatRequest request)
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult); // Combined (well maybe better using filter?)

        var result = await userSocialService.CreateGroupChatAsync(refer.user!.LocalId.ToString(), request);
        
        return result.success ? 
            Ok(new ChatResponse { ChatId = result.groupId }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// 禁用群聊
    /// </summary>
    [HttpPost("group/{groupId}/disable")]
    public async Task<ActionResult<BasicResponse>> DisableGroupChat(string groupId)
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult); // Combined (well maybe better using filter?)

        var result = await userSocialService.DisableGroupChatAsync(refer.user!.LocalId.ToString(), groupId);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    #endregion

    #region 群管理接口

    /// <summary>
    /// 设置/取消管理员
    /// </summary>
    [HttpPost("group/admin")]
    public async Task<ActionResult<BasicResponse>> SetGroupAdmin([FromBody] GroupManagementRequest request, [FromQuery] bool isAdmin = true)
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult); // Combined (well maybe better using filter?)

        var result = await groupManagementService.SetAdminAsync(refer.user!.LocalId.ToString(), request, isAdmin);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// 禁言/取消禁言成员
    /// </summary>
    [HttpPost("group/silent")]
    public async Task<ActionResult<BasicResponse>> SetMemberSilent([FromBody] GroupManagementRequest request, [FromQuery] bool isSilent = true)
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult); // Combined (well maybe better using filter?)

        var result = await groupManagementService.SetMemberSilentAsync(refer.user!.LocalId.ToString(), request, isSilent);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// 开关全体禁言
    /// </summary>
    [HttpPost("group/{groupId}/silent-all")]
    public async Task<ActionResult<BasicResponse>> ToggleGroupSilent(string groupId, [FromQuery] bool isSilent = true, [FromQuery] string? reason = null)
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult); // Combined (well maybe better using filter?)

        var result = await groupManagementService.ToggleGroupSilentAsync(refer.user!.LocalId.ToString(), groupId, isSilent, reason);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// 移除群成员
    /// </summary>
    [HttpPost("group/remove-member")]
    public async Task<ActionResult<BasicResponse>> RemoveGroupMember([FromBody] GroupManagementRequest request)
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult); // Combined (well maybe better using filter?)

        var result = await groupManagementService.LeaveGroupAsync(refer.user!.LocalId.ToString(), request.GroupId, request.TargetUserId);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// 邀请成员加入群聊
    /// </summary>
    [HttpPost("group/invite-member")]
    public async Task<ActionResult<BasicResponse>> InviteGroupMember([FromBody] GroupManagementRequest request)
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult); // Combined (well maybe better using filter?)

        var result = await groupManagementService.InviteMemberAsync(refer.user!.LocalId.ToString(), request);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// 设置成员昵称
    /// </summary>
    [HttpPost("group/nickname")]
    public async Task<ActionResult<BasicResponse>> SetMemberNickname([FromBody] GroupManagementRequest request)
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult); // Combined (well maybe better using filter?)

        var result = await groupManagementService.SetMemberNicknameAsync(refer.user!.LocalId.ToString(), request);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// 设置成员title（仅群主可操作）
    /// </summary>
    [HttpPost("group/set-title")]
    public async Task<ActionResult<BasicResponse>> SetMemberTitle([FromBody] GroupManagementRequest request)
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult); // Combined (well maybe better using filter?)
        if (request.NewTitle == null || request.NewTitle.Length > 9) return BadRequest(new BasicResponse{content = "Too long or Null as title", success = false});
        var result = await groupManagementService.SetMemberTitleAsync(refer.user!.LocalId.ToString(), request);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    #endregion

    #region 群邀请链接接口

    /// <summary>
    /// 创建群邀请链接
    /// </summary>
    [HttpPost("group/invite-link/add")]
    public async Task<ActionResult<BasicResponse>> CreateGroupInviteLink([FromBody] GroupInviteLinkRequest request)
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult); // Combined (well maybe better using filter?)

        var result = await groupInviteLinkService.CreateInviteLinkAsync(refer.user!.LocalId.ToString(), request);
        
        return result.success ? 
            Ok(new BasicResponse { content = $"Created successfully, invite code: {result.link?.InviteCode}", success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// 通过邀请链接加入群聊
    /// </summary>
    [HttpPost("group/invite-link/consume/{inviteCode}")]
    public async Task<ActionResult<BasicResponse>> JoinGroupByInviteLink(string inviteCode)
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult); // Combined (well maybe better using filter?)

        var result = await groupInviteLinkService.JoinGroupByInviteLinkAsync(inviteCode, refer.user!.LocalId.ToString());
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// 获取群聊邀请链接
    /// </summary>
    [HttpGet("group/invite-link/list/{groupId}")]
    public async Task<ActionResult<List<GroupInviteLink>>> GetGroupInviteLinks(string groupId)
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult); // Combined (well maybe better using filter?)

        var links = await groupInviteLinkService.GetValidInviteLinksAsync(groupId, refer.user!.LocalId.ToString());
        
        return Ok(links);
    }

    /// <summary>
    /// 撤销邀请链接
    /// </summary>
    [HttpDelete("group/invite-link/del/{inviteCode}")]
    public async Task<ActionResult<BasicResponse>> RevokeGroupInviteLink(string inviteCode)
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult); // Combined (well maybe better using filter?)

        var result = await groupInviteLinkService.RevokeInviteLinkAsync(refer.user!.LocalId.ToString(), inviteCode);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    #endregion

    #region 群公告接口

    /// <summary>
    /// 标记消息为公告
    /// </summary>
    [HttpPost("group/ann/add/{messageId}")]
    public async Task<ActionResult<BasicResponse>> MarkMessageAsAnnouncement(string messageId)
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult); // Combined (well maybe better using filter?)

        var result = await groupAnnouncementService.MarkMessageAsAnnouncementAsync(refer.user!.LocalId.ToString(), messageId);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// Unmark as ann
    /// </summary>
    [HttpPost("group/ann/del/{messageId}")]
    public async Task<ActionResult<BasicResponse>> UnmarkAnnouncement(string messageId)
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult); // Combined (well maybe better using filter?)

        var result = await groupAnnouncementService.UnmarkAnnouncementAsync(refer.user!.LocalId.ToString(), messageId);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// Get group anns 
    /// </summary>
    [HttpGet("group/ann/get/{groupId}")]
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
    [HttpPost("contact/{contactId}/unread")]
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
    [HttpPost("contacts")]
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
    public async Task<ActionResult<BasicResponse>> UpdatePrivacySettings([FromBody] UpdatePrivacySettingsRequest request)
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult); // Combined (well maybe better using filter?)

        var result = await userSocialService.UpdatePrivacySettingsAsync(refer.user!.LocalId.ToString(), request);
        
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