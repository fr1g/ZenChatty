namespace ZenChattyServer.Net.Models.Response;
using ZenChattyServer.Net.Models.Enums;

/// <summary>
    /// 隐私设置响应模型
    /// </summary>
    public class PrivacySettingsResponse()
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public bool IsDiscoverableViaSearch { get; set; }
        public bool IsAddableFromGroup { get; set; }
        public bool IsGroupInviteAllowed { get; set; }
        public bool IsInvitableToGroup { get; set; }
        public bool IsNewChatKeepSilent { get; set; }
        public bool AllowViewInfoFromGroupChat { get; set; }
        public EPrivacyVisibilityRange ContactVisibility { get; set; }
        public EPrivacyVisibilityRange BioVisibility { get; set; }
        public EPrivacyVisibilityRange GenderVisibility { get; set; }
        public EPrivacyVisibilityRange BirthdayVisibility { get; set; }

        public PrivacySettingsResponse(PrivacySettings settings) : this()
        {
            this.IsDiscoverableViaSearch = settings.IsDiscoverableViaSearch;
            this.IsInvitableToGroup = settings.IsInvitableToGroup;
            this.IsAddableFromGroup = settings.IsAddableFromGroup;
            this.IsNewChatKeepSilent = settings.IsNewChatKeepSilent;
            this.AllowViewInfoFromGroupChat = settings.AllowViewInfoFromGroupChat;
            this.ContactVisibility = settings.ContactVisibility;
            this.BioVisibility = settings.BioVisibility;
            this.GenderVisibility = settings.GenderVisibility;
            this.BirthdayVisibility = settings.BirthdayVisibility;

        }
    }