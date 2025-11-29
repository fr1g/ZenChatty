using Microsoft.AspNetCore.Mvc;
using ZenChattyServer.Net.Helpers;
using ZenChattyServer.Net.Models;
using ZenChattyServer.Net.Models.Enums;
using ZenChattyServer.Net.Models.Request;
using ZenChattyServer.Net.Models.Response;
using ZenChattyServer.Net.Services;

namespace ZenChattyServer.Net.Controllers;

[ApiController]
[Route("api/group-management")]
public class GroupManageController(
    GroupManageService groupManageService,
    UserSocialService userSocialService,
    GroupInviteLinkService groupInviteLinkService,
    GroupAnnouncementService groupAnnouncementService,
    AuthService authService)
    : AuthedControllerBase(authService)
{
    private readonly AuthService _authService = authService;

    #region GroupSettings管理接口

    /// <summary>
    /// 更新群设置（群主可更新所有属性，管理员仅可开关全员禁言）
    /// </summary>
    [HttpPost("group-management/settings")]
    public async Task<ActionResult<BasicResponse>> UpdateGroupSettings([FromBody] UpdateGroupSettingsRequest request)
    {
        var refer = await AuthenticateAsync();
        if (refer.failResult != null) return Unauthorized(refer.failResult);

        var result = await UpdateGroupSettingsInternalAsync(refer.user!.LocalId.ToString(), request);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// 开关全体禁言（管理员权限）
    /// </summary>
    [HttpPost("group-management/toggle-silent-all/{groupId}")]
    public async Task<ActionResult<BasicResponse>> ToggleGroupSilent(string groupId, [FromQuery] bool isSilent = true, [FromQuery] string? reason = null)
    {
        var refer = await AuthenticateAsync();
        if (refer.failResult != null) return Unauthorized(refer.failResult);

        var result = await groupManageService.ToggleGroupSilentAsync(refer.user!.LocalId.ToString(), groupId, isSilent, reason);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    #endregion
    
    #region 群公告接口

    /// <summary>
    /// 标记消息为公告
    /// </summary>
    [HttpPost("announcements/add/{messageId}")]
    public async Task<ActionResult<BasicResponse>> MarkMessageAsAnnouncement(string messageId)
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), _authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult); // Combined (well maybe better using filter?)

        var result = await groupAnnouncementService.MarkMessageAsAnnouncementAsync(refer.user!.LocalId.ToString(), messageId);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// Unmark as ann
    /// </summary>
    [HttpPost("announcements/del/{messageId}")]
    public async Task<ActionResult<BasicResponse>> UnmarkAnnouncement(string messageId)
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), _authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult); // Combined (well maybe better using filter?)

        var result = await groupAnnouncementService.UnmarkAnnouncementAsync(refer.user!.LocalId.ToString(), messageId);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    

    #endregion

    #region 群状态管理接口

    /// <summary>
    /// 禁用群聊（仅群主权限）
    /// </summary>
    [HttpPost("disable/{groupId}")]
    public async Task<ActionResult<BasicResponse>> DisableGroupChat(string groupId)
    {
        var refer = await AuthenticateAsync();
        if (refer.failResult != null) return Unauthorized(refer.failResult);

        var result = await userSocialService.DisableGroupChatAsync(refer.user!.LocalId.ToString(), groupId);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// 启用群聊（仅群主权限）
    /// </summary>
    [HttpPost("enable/{groupId}")]
    public async Task<ActionResult<BasicResponse>> EnableGroupChat(string groupId)
    {
        var refer = await AuthenticateAsync();
        if (refer.failResult != null) return Unauthorized(refer.failResult);

        var result = await EnableGroupChatInternalAsync(refer.user!.LocalId.ToString(), groupId);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    #endregion

    #region 成员管理接口（从UserSocialController迁移）

    /// <summary>
    /// 设置/取消管理员（仅群主权限）
    /// </summary>
    [HttpPost("toggle-admin/{isAdmin:bool}")]
    public async Task<ActionResult<BasicResponse>> SetGroupAdmin([FromBody] GroupManagementRequest request, bool isAdmin = true)
    {
        var refer = await AuthenticateAsync();
        if (refer.failResult != null) return Unauthorized(refer.failResult);

        var result = await groupManageService.SetAdminAsync(refer.user!.LocalId.ToString(), request, isAdmin);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// 禁言/取消禁言成员（管理员权限）
    /// </summary>
    [HttpPost("set-silent-status")]
    public async Task<ActionResult<BasicResponse>> SetMemberSilent([FromBody] GroupManagementRequest request, [FromQuery] bool isSilent = true)
    {
        var refer = await AuthenticateAsync();
        if (refer.failResult != null) return Unauthorized(refer.failResult);

        var result = await groupManageService.SetMemberSilentAsync(refer.user!.LocalId.ToString(), request, isSilent);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// 移除群成员（管理员权限）
    /// </summary>
    [HttpPost("remove-member")]
    public async Task<ActionResult<BasicResponse>> RemoveGroupMember([FromBody] GroupManagementRequest request)
    {
        var refer = await AuthenticateAsync();
        if (refer.failResult != null) return Unauthorized(refer.failResult);

        var result = await groupManageService.LeaveGroupAsync(refer.user!.LocalId.ToString(), request.GroupId, request.TargetUserId);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }



    /// <summary>
    /// 设置成员昵称（管理员权限或自己设置）
    /// </summary>
    [HttpPost("nickname")]
    public async Task<ActionResult<BasicResponse>> SetMemberNickname([FromBody] GroupManagementRequest request)
    {
        var refer = await AuthenticateAsync();
        if (refer.failResult != null) return Unauthorized(refer.failResult);

        var result = await groupManageService.SetMemberNicknameAsync(refer.user!.LocalId.ToString(), request);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// 设置成员title（仅群主权限）
    /// </summary>
    [HttpPost("set-title")]
    public async Task<ActionResult<BasicResponse>> SetMemberTitle([FromBody] GroupManagementRequest request)
    {
        var refer = await AuthenticateAsync();
        if (refer.failResult != null) return Unauthorized(refer.failResult);

        var result = await groupManageService.SetMemberTitleAsync(refer.user!.LocalId.ToString(), request);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }
    
    /// <summary>
    /// 邀请成员加入群聊
    /// </summary>
    [HttpPost("debug/group-management/invite-member")] // !!!!!
    public async Task<ActionResult<BasicResponse>> InviteGroupMember([FromBody] GroupManagementRequest request)
    {
        var refer = await AuthHelper.RejectOrNotAsync(AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault()), _authService);
        if (refer.failResult != null) return Unauthorized(refer.failResult); // Combined (well maybe better using filter?)

        var result = await groupManageService.InviteMemberAsync(refer.user!.LocalId.ToString(), request);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    #endregion
#region 群邀请链接接口

    /// <summary>
    /// 创建群邀请链接
    /// </summary>
    [HttpPost("invite-link/new")]
    public async Task<ActionResult<BasicResponse>> CreateGroupInviteLink([FromBody] GroupInviteLinkRequest request)
    {
        var refer = await AuthenticateAsync();
        if (refer.failResult != null) return Unauthorized(refer.failResult);

        var result = await groupInviteLinkService.CreateInviteLinkAsync(refer.user!.LocalId.ToString(), request);
        
        return result.success ? 
            Ok(new BasicResponse { content = $"Created successfully, invite code: {result.link?.InviteCode}", success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// 通过邀请链接加入群聊
    /// </summary>
    [HttpPost("invite-link/consume/{inviteCode}")]
    public async Task<ActionResult<BasicResponse>> JoinGroupByInviteLink(string inviteCode)
    {
        var refer = await AuthenticateAsync();
        if (refer.failResult != null) return Unauthorized(refer.failResult);

        var result = await groupInviteLinkService.JoinGroupByInviteLinkAsync(inviteCode, refer.user!.LocalId.ToString());
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// 获取群聊邀请链接
    /// </summary>
    [HttpGet("invite-link/list/{groupId}")]
    public async Task<ActionResult<List<GroupInviteLink>>> GetGroupInviteLinks(string groupId)
    {
        var refer = await AuthenticateAsync();
        if (refer.failResult != null) return Unauthorized(refer.failResult);

        var links = await groupInviteLinkService.GetValidInviteLinksAsync(groupId, refer.user!.LocalId.ToString());
        
        return Ok(links);
    }

    /// <summary>
    /// 撤销邀请链接
    /// </summary>
    [HttpDelete("invite-link/del/{inviteCode}")]
    public async Task<ActionResult<BasicResponse>> RevokeGroupInviteLink(string inviteCode)
    {
        var refer = await AuthenticateAsync();
        if (refer.failResult != null) return Unauthorized(refer.failResult);

        var result = await groupInviteLinkService.RevokeInviteLinkAsync(refer.user!.LocalId.ToString(), inviteCode);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    #endregion
    #region 内部实现方法

    /// <summary>
    /// 更新群设置内部实现
    /// </summary>
    private async Task<(bool success, string message)> UpdateGroupSettingsInternalAsync(string operatorUserId, UpdateGroupSettingsRequest request)
    {
        try
        {
            var groupChat = await groupManageService.GetGroupChatAsync(request.GroupId);
            if (groupChat == null)
                return (false, "群聊不存在");

            var operatorMember = groupChat.Members.FirstOrDefault(m => m.TheGuyId.ToString() == operatorUserId);
            if (operatorMember == null)
                return (false, "不是群成员");

            var check = AuthHelper.CanManageGroupDetailed(operatorMember);
            if (!check.isAllowed) return check;

            var settings = groupChat.Settings;
            bool hasChanges = false;

            // 群主可以更新所有属性
            if (operatorMember.Type == EGroupMemberType.Owner)
            {
                if (!string.IsNullOrEmpty(request.DisplayName) && settings.DisplayName != request.DisplayName)
                {
                    settings.DisplayName = request.DisplayName;
                    hasChanges = true;
                }

                if (!string.IsNullOrEmpty(request.AvatarFileLocator) && settings.AvatarFileLocator != request.AvatarFileLocator)
                {
                    settings.AvatarFileLocator = request.AvatarFileLocator;
                    hasChanges = true;
                }

                if (settings.IsInviteOnly != request.IsInviteOnly)
                {
                    settings.IsInviteOnly = request.IsInviteOnly;
                    hasChanges = true;
                }

                if (settings.IsPrivateChatAllowed != request.IsPrivateChatAllowed)
                {
                    settings.IsPrivateChatAllowed = request.IsPrivateChatAllowed;
                    hasChanges = true;
                }
            }

            // 管理员仅可开关全员禁言
            if (settings.IsAllSilent != request.IsAllSilent)
            {
                // 管理员只能开关全员禁言，不能修改其他设置
                if (operatorMember.Type == EGroupMemberType.Admin && 
                    (request.DisplayName != null || request.AvatarFileLocator != null || 
                     request.IsInviteOnly != settings.IsInviteOnly || request.IsPrivateChatAllowed != settings.IsPrivateChatAllowed))
                {
                    return (false, "only allowed to update all-mute status");
                }

                settings.IsAllSilent = request.IsAllSilent;
                hasChanges = true;

                // 发送全体禁言通知
                await groupManageService.SendGroupSilentMessageAsync(request.GroupId, operatorUserId, 
                    request.IsAllSilent, request.Reason);
            }

            if (!hasChanges)
                return (true, "群设置未发生变化");

            // 发送群设置更新通知
            await SendGroupSettingsUpdatedMessageAsync(request.GroupId, operatorUserId, request);

            await groupManageService.SaveChangesAsync();
            return (true, "群设置更新成功");
        }
        catch (Exception ex)
        {
            return (false, $"更新群设置失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 启用群聊内部实现
    /// </summary>
    private async Task<(bool success, string message)> EnableGroupChatInternalAsync(string operatorUserId, string groupId)
    {
        try
        {
            var groupChat = await groupManageService.GetGroupChatAsync(groupId);
            if (groupChat == null)
                return (false, "群聊不存在");

            var operatorMember = groupChat.Members.FirstOrDefault(m => m.TheGuyId.ToString() == operatorUserId);
            if (operatorMember == null)
                return (false, "不是群成员");

            // 检查权限：只有群主可以启用群聊
            if (operatorMember.Type != EGroupMemberType.Owner)
                return (false, "只有群主可以启用群聊");

            // 检查当前状态
            if (groupChat.Status != EChatStatus.GroupDisabled)
                return (false, "群聊当前未被禁用");

            // 启用群聊
            groupChat.Status = EChatStatus.Normal;

            // 发送群启用通知
            await SendGroupEnabledMessageAsync(groupId, operatorUserId);

            await groupManageService.SaveChangesAsync();
            return (true, "群聊已启用");
        }
        catch (Exception ex)
        {
            return (false, $"启用群聊失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 发送群设置更新通知
    /// </summary>
    private async Task SendGroupSettingsUpdatedMessageAsync(string groupId, string operatorId, UpdateGroupSettingsRequest request)
    {
        try
        {
            var message = new Message
            {
                TraceId = Guid.NewGuid().ToString(),
                SenderId = Guid.Parse(operatorId),
                OfChatId = groupId,
                Content = $"群设置已更新: {GetSettingsChangeDescription(request, operatorId)}",
                Type = EMessageType.Event,
                SentTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            };

            await groupManageService.AddMessageAsync(message);
        }
        catch (Exception ex)
        {
            // 记录错误但不影响主流程
            Console.WriteLine($"发送群设置更新通知失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 发送群启用通知
    /// </summary>
    private async Task SendGroupEnabledMessageAsync(string groupId, string operatorId)
    {
        try
        {
            var message = new Message
            {
                TraceId = Guid.NewGuid().ToString(),
                SenderId = Guid.Parse(operatorId),
                OfChatId = groupId,
                Content = "群聊已启用",
                Type = EMessageType.Event,
                SentTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            };

            await groupManageService.AddMessageAsync(message);
        }
        catch (Exception ex)
        {
            // 记录错误但不影响主流程
            Console.WriteLine($"发送群启用通知失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 获取设置变更描述
    /// </summary>
    private string GetSettingsChangeDescription(UpdateGroupSettingsRequest request, string operatorCustomId)
    {
        var changes = new List<string>();

        if (!string.IsNullOrEmpty(request.DisplayName))
            changes.Add($"{operatorCustomId} Updated: 群名称: {request.DisplayName}");

        if (!string.IsNullOrEmpty(request.AvatarFileLocator))
            changes.Add($"{operatorCustomId} Updated: 群头像已更新");

        if (request.IsAllSilent)
            changes.Add($"{operatorCustomId} Updated: All-Silent ON");
        else
            changes.Add($"{operatorCustomId} Updated: All-Silent OFF");

        if (request.IsInviteOnly) // todo ? open invite: unlimited invite link; narrow invite: only by using receiver-declared invite link
            changes.Add($"{operatorCustomId} Updated: 仅邀请加入");
        else
            changes.Add($"{operatorCustomId} Updated: 开放加入");

        if (request.IsPrivateChatAllowed)
            changes.Add($"{operatorCustomId} Updated: 允许私聊");
        else
            changes.Add($"{operatorCustomId} Updated: 禁止私聊");

        return string.Join(", ", changes);
    }

    #endregion
}