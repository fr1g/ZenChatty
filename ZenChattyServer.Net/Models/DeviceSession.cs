using System.ComponentModel.DataAnnotations;

namespace ZenChattyServer.Net.Models;

public class DeviceSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserAuthObjectId { get; set; } // 外键指向UserAuthObject
    
    [MaxLength(64)]
    public string DeviceId { get; set; } = string.Empty;
    
    [MaxLength(64)]
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime RefreshTokenExpiresAt { get; set; }
    public DateTime LastAccessedAt { get; set; }
    public bool IsActive { get; set; } = true;
    
    // 新增属性用于在线状态管理
    public DateTime? LastHeartbeatAt { get; set; }
    public bool IsOnline { get; set; } = false;
    
    [MaxLength(8)]
    public string? DeviceType { get; set; }
    
    // 并发控制令牌
    public byte[] RowVersion { get; set; } = [];
    
    public DeviceSession() { }
    
    public DeviceSession(string deviceId, string refreshToken, DateTime expiresAt)
    {
        DeviceId = deviceId;
        RefreshToken = refreshToken;
        RefreshTokenExpiresAt = expiresAt;
        LastAccessedAt = DateTime.UtcNow;
        IsActive = true;
    }
}