using Microsoft.AspNetCore.Mvc;
using ZenChattyServer.Net.Helpers;
using ZenChattyServer.Net.Models;
using ZenChattyServer.Net.Models.Enums;
using ZenChattyServer.Net.Models.Request;
using ZenChattyServer.Net.Models.Response;
using ZenChattyServer.Net.Services;

namespace ZenChattyServer.Net.Controllers;

[ApiController]
[Route("/api/group-management")]
public class GroupManagementAPIController : ControllerBase
{
    private readonly GroupManagementService _groupManagementService;
    private readonly UserSocialService _userSocialService;
    private readonly AuthService _authService;

    public GroupManagementAPIController(
        GroupManagementService groupManagementService,
        UserSocialService userSocialService,
        AuthService authService)
    {
        _groupManagementService = groupManagementService;
        _userSocialService = userSocialService;
        _authService = authService;
    }

    #region GroupSettings管理接口

    /// <summary>
    /// 更新群设置（群主可更新所有属性，管理员仅可开关全员禁言）
    /// </summary>
    [HttpPost("settings")]
    public async Task<ActionResult<BasicResponse>> UpdateGroupSettings([FromBody] UpdateGroupSettingsRequest request)
    {
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "缺少AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        var result = await UpdateGroupSettingsInternalAsync(user.LocalId.ToString(), request);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    /// <summary>
    /// 开关全体禁言（管理员权限）
    /// </summary>
    [HttpPost("{groupId}/silent-all")]
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

    #endregion

    #region 群状态管理接口

    /// <summary>
    /// 禁用群聊（仅群主权限）
    /// </summary>
    [HttpPost("{groupId}/disable")]
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

    /// <summary>
    /// 启用群聊（仅群主权限）
    /// </summary>
    [HttpPost("{groupId}/enable")]
    public async Task<ActionResult<BasicResponse>> EnableGroupChat(string groupId)
    {
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "缺少AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        var result = await EnableGroupChatInternalAsync(user.LocalId.ToString(), groupId);
        
        return result.success ? 
            Ok(new BasicResponse { content = result.message, success = true }) : 
            BadRequest(new BasicResponse { content = result.message, success = false });
    }

    #endregion

    #region 成员管理接口（从UserSocialController迁移）

    /// <summary>
    /// 设置/取消管理员（仅群主权限）
    /// </summary>
    [HttpPost("admin")]
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
    /// 禁言/取消禁言成员（管理员权限）
    /// </summary>
    [HttpPost("silent")]
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
    /// 移除群成员（管理员权限）
    /// </summary>
    [HttpPost("remove-member")]
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
    /// 邀请成员加入群聊（管理员权限）
    /// </summary>
    [HttpPost("invite-member")]
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
    /// 设置成员昵称（管理员权限或自己设置）
    /// </summary>
    [HttpPost("nickname")]
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
    /// 设置成员title（仅群主权限）
    /// </summary>
    [HttpPost("title")]
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

    /// <summary>
    /// 退出群聊（群成员权限）
    /// </summary>
    [HttpPost("leave")]
    public async Task<ActionResult<BasicResponse>> LeaveGroup([FromBody] GroupManagementRequest request)
    {
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new BasicResponse { content = "缺少AccessToken", success = false });

        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        var result = await _groupManagementService.LeaveGroupAsync(user.LocalId.ToString(), request.GroupId);
        
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
            var groupChat = await _groupManagementService.GetGroupChatAsync(request.GroupId);
            if (groupChat == null)
                return (false, "群聊不存在");

            var operatorMember = groupChat.Members.FirstOrDefault(m => m.TheGuyId.ToString() == operatorUserId);
            if (operatorMember == null)
                return (false, "不是群成员");

            // 检查权限
            if (operatorMember.Type != EGroupMemberType.Owner && 
                operatorMember.Type != EGroupMemberType.Admin)
                return (false, "没有权限更新群设置");

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
                    return (false, "管理员只能开关全员禁言，不能修改其他群设置");
                }

                settings.IsAllSilent = request.IsAllSilent;
                hasChanges = true;

                // 发送全体禁言通知
                await _groupManagementService.SendGroupSilentMessageAsync(request.GroupId, operatorUserId, 
                    request.IsAllSilent, request.Reason);
            }

            if (!hasChanges)
                return (true, "群设置未发生变化");

            // 发送群设置更新通知
            await SendGroupSettingsUpdatedMessageAsync(request.GroupId, operatorUserId, request);

            await _groupManagementService.SaveChangesAsync();
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
            var groupChat = await _groupManagementService.GetGroupChatAsync(groupId);
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

            await _groupManagementService.SaveChangesAsync();
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
                Content = $"群设置已更新: {GetSettingsChangeDescription(request)}",
                Type = EMessageType.Event,
                SentTimestamp = DateTime.UtcNow.ToFileTimeUtc()
            };

            await _groupManagementService.AddMessageAsync(message);
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
                SentTimestamp = DateTime.UtcNow.ToFileTimeUtc()
            };

            await _groupManagementService.AddMessageAsync(message);
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
    private string GetSettingsChangeDescription(UpdateGroupSettingsRequest request)
    {
        var changes = new List<string>();

        if (!string.IsNullOrEmpty(request.DisplayName))
            changes.Add($"群名称: {request.DisplayName}");

        if (!string.IsNullOrEmpty(request.AvatarFileLocator))
            changes.Add("群头像已更新");

        if (request.IsAllSilent)
            changes.Add("开启全体禁言");
        else
            changes.Add("关闭全体禁言");

        if (request.IsInviteOnly)
            changes.Add("仅邀请加入");
        else
            changes.Add("开放加入");

        if (request.IsPrivateChatAllowed)
            changes.Add("允许私聊");
        else
            changes.Add("禁止私聊");

        return string.Join(", ", changes);
    }

    #endregion
}