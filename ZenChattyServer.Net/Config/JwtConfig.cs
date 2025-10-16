namespace ZenChattyServer.Net.Config;

public class JwtConfig
{
    public string Secret { get; set; }
    public string Issuer { get; set; }
    public string Audience { get; set; }
    public int AccessTokenExpirationMinutes { get; set; } = 60; // 1小时
    public int RefreshTokenExpirationDays { get; set; } = 7;    // 7天
}