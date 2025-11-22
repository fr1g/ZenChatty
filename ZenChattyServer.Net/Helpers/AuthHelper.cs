using Microsoft.AspNetCore.Mvc;
using ZenChattyServer.Net.Models;
using ZenChattyServer.Net.Models.Response;
using ZenChattyServer.Net.Services;


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
    
    public static async Task<(BasicResponse? failResult, bool isValid, User? user)> RejectOrNotAsync(string? token, AuthService authService)
    {
        (BasicResponse? failResult, bool isValid, User? user) result = (null, false, null);

        if (string.IsNullOrEmpty(token))
        {
            result.failResult = new BasicResponse { content = "Lacking: AccessToken", success = false };
            return result;
        }

        var (valid, user) = await authService.ValidateAccessTokenAsync(token);
        if (!valid || user == null)
            result.failResult = new BasicResponse { content = "Invalid: AccessToken", success = false };
        else
        {
            result.isValid = valid;
            result.user = user;
        }

        return result;
    }
}