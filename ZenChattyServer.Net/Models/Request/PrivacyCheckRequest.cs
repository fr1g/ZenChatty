using System.ComponentModel.DataAnnotations;
using ZenChattyServer.Net.Models.Enums;

namespace ZenChattyServer.Net.Models.Request;

public class PrivacyCheckRequest
{
    [Required]
    public string TargetUserId { get; set; } = string.Empty;
    
    [Required]
    public bool IsGroupInvite { get; set; } = false;
}

public class UserInfoQueryRequest
{
    [Required]
    public string Email { get; set; } = string.Empty;
    
    public string? CustomId { get; set; }
}

/// <summary>
/// 隐私设置更新请求模型
/// </summary>
public class UpdatePrivacySettingsRequest
{
    /// <summary>
    /// 搜索可见性范围
    /// </summary>
    public EPrivacyVisibilityRange? IsDiscoverableViaSearch { get; set; }

    /// <summary>
    /// 允许谁发送好友请求
    /// </summary>
    public EPrivacyVisibilityRange? IsAddableFromGroup { get; set; }

    /// <summary>
    /// 允许谁发送群聊邀请
    /// </summary>
    public EPrivacyVisibilityRange? IsGroupInviteAllowed { get; set; }

    /// <summary>
    /// 是否允许通过电话号码查找
    /// </summary>
    public bool? AllowPhoneNumberSearch { get; set; }

    /// <summary>
    /// 是否允许通过邮箱查找
    /// </summary>
    public bool? AllowEmailSearch { get; set; }

    /// <summary>
    /// 是否允许通过自定义ID查找
    /// </summary>
    public bool? AllowCustomIdSearch { get; set; }

    /// <summary>
    /// 是否显示在线状态
    /// </summary>
    public bool? ShowOnlineStatus { get; set; }

    /// <summary>
    /// 是否显示最后在线时间
    /// </summary>
    public bool? ShowLastSeen { get; set; }

    /// <summary>
    /// 是否显示头像
    /// </summary>
    public bool? ShowAvatar { get; set; }

    /// <summary>
    /// 是否显示个人背景
    /// </summary>
    public bool? ShowBackground { get; set; }

    /// <summary>
    /// 是否显示个人简介
    /// </summary>
    public bool? ShowBio { get; set; }

    /// <summary>
    /// 是否显示性别
    /// </summary>
    public bool? ShowGender { get; set; }

    /// <summary>
    /// 是否显示生日
    /// </summary>
    public bool? ShowBirthday { get; set; }
}