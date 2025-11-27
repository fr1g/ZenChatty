namespace ZenChattyServer.Net.Models;

public class UserAuthObject
{
    public Guid Id { get; set; } = Guid.NewGuid(); // actually is user guid
    
    public virtual User User { get; set; } = new();
    public string EncryptedPassword { get; set; } = string.Empty;
    public string LastGeneratedAuthToken { get; set; } = string.Empty; // is this useless? !!!
    public virtual List<DeviceSession> DeviceSessions { get; set; } = []; // yes... the refreshTokens are oriented to devices, and already saved here...
    
    public UserAuthObject() { }
    
    public UserAuthObject(User user, string passwd, string token)
    {
        User = user;
        EncryptedPassword = passwd;
        LastGeneratedAuthToken = token;
        DeviceSessions = new List<DeviceSession>();
    }
}