namespace ZenChattyServer.Net.Config;

public class JwtConfig
{
    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public TimeSpan AccessTokenExpiration { get; set; } = TimeSpan.FromDays(3); // 3d
    public TimeSpan RefreshTokenExpiration { get; set; } = TimeSpan.FromDays(30);     // 30d
    public int MaxDevicesPerUser { get; set; } = 3;              // 最多3台设备
    public int DeviceIdLength { get; set; } = 64;               // 设备ID长度，支持手机IMEI(15-16位)和SN码(通常10-20位)
}