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
public class UserSocialController : ControllerBase
{
    private readonly UserSocialService _userSocialService;
    private readonly GroupManagementService _groupManagementService;
    private readonly GroupInviteLinkService _groupInviteLinkService;
    private readonly GroupAnnouncementService _groupAnnouncementService;
    private readonly AuthService _authService;

    public UserSocialController(
        UserSocialService userSocialService,
        GroupManagementService groupManagementService,
        GroupInviteLinkService groupInviteLinkService,
        GroupAnnouncementService groupAnnouncementService,
        AuthService authService)
    {
        _userSocialService = userSocialService;
        _groupManagementService = groupManagementService;
        _groupInviteLinkService = groupInviteLinkService;
        _groupAnnouncementService = groupAnnouncementService;
        _authService = authService;
    }

    #region 用户信息查询接口

    /// <summary>
    /// 查询用户信息（根据隐私设置过滤）
    /// </summary>
    [HttpPost("query-user-info")]
    public async Task<ActionResult<UserInfoResponse>> QueryUserInfo([FromBody] UserInfoQueryRequest request)
    {
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "Missing AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token invalid", success = false });

        var result = await _userSocialService.QueryUserInfoAsync(user.LocalId.ToString(), request.Email, request.CustomId);
        
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
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "Missing AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token invalid", success = false });

        var result = await _userSocialService.CreatePrivateChatAsync(user.LocalId.ToString(), request);
        
        return result.success ? 
            Ok(new ChatResponse { ChatId = result.chatId }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// 检查拉黑状态
    /// </summary>
    [HttpGet("is-blocked/{targetUserId}")]
    public async Task<ActionResult<BasicResponse>> CheckBlockedStatus(string targetUserId)
    {
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "Missing AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        var isBlocked = await _userSocialService.CheckBlockStatusAsync(user.LocalId.ToString(), targetUserId);
        
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
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "缺少AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        var result = await _userSocialService.BlockUserAsync(user.LocalId.ToString(), targetUserId);
        
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
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "缺少AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        var result = await _userSocialService.UnblockAndAddFriendAsync(user.LocalId.ToString(), targetUserId);
        
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
        Console.WriteLine("income new friend add request");
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "缺少AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        var result = await _userSocialService.AddFriendAsync(user.LocalId.ToString(), request);
        Console.WriteLine(result.message);
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
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "缺少AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        var result = await _userSocialService.CreateGroupChatAsync(user.LocalId.ToString(), request);
        
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
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "缺少AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        var result = await _userSocialService.DisableGroupChatAsync(user.LocalId.ToString(), groupId);
        
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
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "缺少AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        var result = await _groupManagementService.SetAdminAsync(user.LocalId.ToString(), request, isAdmin);
        
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
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "缺少AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        var result = await _groupManagementService.SetMemberSilentAsync(user.LocalId.ToString(), request, isSilent);
        
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
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "缺少AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        var result = await _groupManagementService.ToggleGroupSilentAsync(user.LocalId.ToString(), groupId, isSilent, reason);
        
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
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "缺少AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        var result = await _groupManagementService.LeaveGroupAsync(user.LocalId.ToString(), request.GroupId, request.TargetUserId);
        
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
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "缺少AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        var result = await _groupManagementService.InviteMemberAsync(user.LocalId.ToString(), request);
        
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
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "缺少AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        var result = await _groupManagementService.SetMemberNicknameAsync(user.LocalId.ToString(), request);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// 设置成员title（仅群主可操作）
    /// </summary>
    [HttpPost("group/title")]
    public async Task<ActionResult<BasicResponse>> SetMemberTitle([FromBody] GroupManagementRequest request)
    {
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "缺少AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        var result = await _groupManagementService.SetMemberTitleAsync(user.LocalId.ToString(), request);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    #endregion

    #region 群邀请链接接口

    /// <summary>
    /// 创建群邀请链接
    /// </summary>
    [HttpPost("group/invite-link")]
    public async Task<ActionResult<BasicResponse>> CreateGroupInviteLink([FromBody] GroupInviteLinkRequest request)
    {
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "缺少AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        var result = await _groupInviteLinkService.CreateInviteLinkAsync(user.LocalId.ToString(), request);
        
        return result.success ? 
            Ok(new BasicResponse { content = $"Created successfully, invite code: {result.link?.InviteCode}", success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// 通过邀请链接加入群聊
    /// </summary>
    [HttpPost("group/join/{inviteCode}")]
    public async Task<ActionResult<BasicResponse>> JoinGroupByInviteLink(string inviteCode)
    {
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "缺少AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        var result = await _groupInviteLinkService.JoinGroupByInviteLinkAsync(inviteCode, user.LocalId.ToString());
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// 获取群聊邀请链接
    /// </summary>
    [HttpGet("group/{groupId}/invite-links")]
    public async Task<ActionResult<List<GroupInviteLink>>> GetGroupInviteLinks(string groupId)
    {
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "缺少AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        var links = await _groupInviteLinkService.GetValidInviteLinksAsync(groupId, user.LocalId.ToString());
        
        return Ok(links);
    }

    /// <summary>
    /// 撤销邀请链接
    /// </summary>
    [HttpDelete("group/invite-link/{inviteCode}")]
    public async Task<ActionResult<BasicResponse>> RevokeGroupInviteLink(string inviteCode)
    {
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "缺少AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        var result = await _groupInviteLinkService.RevokeInviteLinkAsync(user.LocalId.ToString(), inviteCode);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    #endregion

    #region 群公告接口

    /// <summary>
    /// 标记消息为公告
    /// </summary>
    [HttpPost("group/message/{messageId}/mark-as-announcement")]
    public async Task<ActionResult<BasicResponse>> MarkMessageAsAnnouncement(string messageId)
    {
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "缺少AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        var result = await _groupAnnouncementService.MarkMessageAsAnnouncementAsync(user.LocalId.ToString(), messageId);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// 取消消息的公告标记
    /// </summary>
    [HttpPost("group/message/{messageId}/unmark-announcement")]
    public async Task<ActionResult<BasicResponse>> UnmarkAnnouncement(string messageId)
    {
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "缺少AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        var result = await _groupAnnouncementService.UnmarkAnnouncementAsync(user.LocalId.ToString(), messageId);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// 获取群公告列表
    /// </summary>
    [HttpGet("group/{groupId}/announcements")]
    public async Task<ActionResult<List<Message>>> GetGroupAnnouncements(string groupId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "缺少AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        var announcements = await _groupAnnouncementService.GetAnnouncementsAsync(groupId, page, pageSize);
        
        return Ok(announcements);
    }

    #endregion

    #region 隐私设置检查接口

    /// <summary>
    /// 检查隐私设置是否允许发送好友请求或群聊邀请
    /// </summary>
    [HttpPost("privacy/check-request")]
    public async Task<ActionResult<BasicResponse>> CheckPrivacyForRequest([FromBody] PrivacyCheckRequest request)
    {
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "缺少AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        var result = await _userSocialService.CheckPrivacySettingsForRequestAsync(
            request.TargetUserId, user.LocalId.ToString(), request.IsGroupInvite);
        
        return result.allowed ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// 检查两个用户之间的拉黑状态
    /// </summary>
    [HttpGet("privacy/block-status/{targetUserId}")]
    public async Task<ActionResult<BasicResponse>> CheckBlockStatus(string targetUserId)
    {
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "缺少AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        var isBlocked = await _userSocialService.CheckBlockStatusAsync(user.LocalId.ToString(), targetUserId);
        
        return Ok(new BasicResponse { 
            content = isBlocked ? "Block relationship exists" : "No block relationship", 
            success = true
        });
    }

    /// <summary>
    /// 解除拉黑状态并添加好友（隐私设置检查版本）
    /// </summary>
    [HttpPost("privacy/unblock-and-add/{targetUserId}")]
    public async Task<ActionResult<BasicResponse>> UnblockAndAddFriendWithPrivacyCheck(string targetUserId)
    {
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "缺少AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        var result = await _userSocialService.UnblockAndAddFriendAsync(user.LocalId.ToString(), targetUserId);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    #endregion

    #region 其他接口

    /// <summary>
    /// 更新未读消息计数
    /// </summary>
    [HttpPost("contact/{contactId}/unread")]
    public async Task<ActionResult<BasicResponse>> UpdateUnreadCount(string contactId, [FromQuery] int unreadCount)
    {
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "缺少AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        var result = await _userSocialService.UpdateUnreadCountAsync(contactId, (ushort)unreadCount);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// 获取用户联系人列表
    /// </summary>
    [HttpGet("contacts")]
    public async Task<ActionResult<List<Contact>>> GetContacts()
    {
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "缺少AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        var contacts = await _userSocialService.GetContactsAsync(user.LocalId.ToString());
        
        return Ok(contacts);
    }

    #endregion

    #region 隐私设置管理接口

    /// <summary>
    /// 更新用户隐私设置
    /// </summary>
    [HttpPost("privacy/update")]
    public async Task<ActionResult<BasicResponse>> UpdatePrivacySettings([FromBody] UpdatePrivacySettingsRequest request)
    {
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "缺少AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        var result = await _userSocialService.UpdatePrivacySettingsAsync(user.LocalId.ToString(), request);
        
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
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "缺少AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        var result = await _userSocialService.GetPrivacySettingsAsync(user.LocalId.ToString());
        
        return result.success ? 
            Ok(result) : 
            BadRequest(result);
    }

    #endregion

    #endregion
}