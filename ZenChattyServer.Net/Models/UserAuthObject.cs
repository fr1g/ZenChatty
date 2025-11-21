namespace ZenChattyServer.Net.Models;

public class UserAuthObject
{
    public Guid Id { get; set; } = Guid.NewGuid(); // actually is user guid
    
    public virtual User User { get; set; } = new();
    public string EncryptedPassword { get; set; } = string.Empty;
    public string LastGeneratedAuthToken { get; set; } = string.Empty;
    public virtual List<DeviceSession> DeviceSessions { get; set; } = new();
    
    public UserAuthObject() { }
    
    public UserAuthObject(User user, string passwd, string token)
    {
        User = user;
        EncryptedPassword = passwd;
        LastGeneratedAuthToken = token;
        DeviceSessions = new List<DeviceSession>();
    }
}