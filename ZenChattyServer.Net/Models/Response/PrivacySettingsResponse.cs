namespace ZenChattyServer.Net.Models.Response;
using ZenChattyServer.Net.Models.Enums;

/// <summary>
    /// 隐私设置响应模型
    /// </summary>
    public class PrivacySettingsResponse
    {
        public bool success { get; set; }
        public string message { get; set; } = string.Empty;
        public EPrivacyVisibilityRange IsDiscoverableViaSearch { get; set; }
        public EPrivacyVisibilityRange IsAddableFromGroup { get; set; }
        public EPrivacyVisibilityRange IsGroupInviteAllowed { get; set; }
        public EPrivacyVisibilityRange ContactVisibility { get; set; }
        public EPrivacyVisibilityRange BioVisibility { get; set; }
        public EPrivacyVisibilityRange GenderVisibility { get; set; }
    }