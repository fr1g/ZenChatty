using System.ComponentModel.DataAnnotations;

namespace ZenChattyServer.Net.Models.Request;

/// <summary>
/// 更新群设置请求模型
/// </summary>
public class UpdateGroupSettingsRequest
{
    /// <summary>
    /// 群聊ID
    /// </summary>
    [Required]
    public string GroupId { get; set; } = string.Empty;

    /// <summary>
    /// 群聊显示名称
    /// </summary>
    public string? DisplayName { get; set; }

    /// <summary>
    /// 群聊头像文件定位器
    /// </summary>
    public string? AvatarFileLocator { get; set; }

    /// <summary>
    /// 是否全体禁言
    /// </summary>
    public bool IsAllSilent { get; set; }

    /// <summary>
    /// 是否仅邀请加入
    /// </summary>
    public bool IsInviteOnly { get; set; }

    /// <summary>
    /// 是否允许私聊
    /// </summary>
    public bool IsPrivateChatAllowed { get; set; }

    /// <summary>
    /// 变更原因
    /// </summary>
    public string? Reason { get; set; }
}