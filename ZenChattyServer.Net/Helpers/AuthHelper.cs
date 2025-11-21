namespace ZenChattyServer.Net.Helpers;

public class AuthHelper
{
    public static string DefaultShortIdGenerator()
    {
        var fromHead = Guid.NewGuid().ToString("N");
        var fromMedium = Guid.NewGuid().ToString("N");
        var fromEnd = Guid.NewGuid().ToString("N");
        return $"{fromHead.Substring(0, 3)}{fromMedium.Substring(19, 6)}{fromEnd.Substring(0, 3)}";
    }
    public static string? Unbear(string? rawToken)
    {
        if (string.IsNullOrEmpty(rawToken)) return null;
        return !rawToken.StartsWith("Bearer ") ? rawToken : rawToken.Substring(7);
    }
}