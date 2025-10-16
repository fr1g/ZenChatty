namespace ZenChattyServer.Net.Helpers;

public class AuthHelper
{
    public static string Unbear(string rawToken)
    {
        return !rawToken.StartsWith("Bearer ") ? rawToken : rawToken.Substring(7, rawToken.Length);
    }
}