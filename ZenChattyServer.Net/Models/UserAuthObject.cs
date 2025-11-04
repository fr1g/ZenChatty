namespace ZenChattyServer.Net.Models;

public class UserAuthObject (User user, string passwd, string token)
{
    public User User { get; set; } = user;
    public string EncryptedPassword { get; set; } = passwd;
    public string LastGeneratedAuthToken { get; set; } = token;
}