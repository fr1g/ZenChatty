using Microsoft.AspNetCore.Mvc;
using ZenChattyServer.Net.Config;
using ZenChattyServer.Net.Models;
using ZenChattyServer.Net.Models.Enums;
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
        return $"{fromHead[..3]}{fromMedium.Substring(19, 6)}{fromEnd[..3]}";
    }
    public static string? Unbear(string? rawToken)
    {
        if (string.IsNullOrEmpty(rawToken)) return null;
        return !rawToken.StartsWith("Bearer ") ? rawToken : rawToken[7..];
    }

    public static bool CanManageGroup(GroupChatMember user)
    {
        return user.Type is not (EGroupMemberType.Owner or EGroupMemberType.Admin);
    }

    public static (bool isAllowed, string message) CanManageGroupDetailed(GroupChatMember user)
    {
        var result = CanManageGroup(user);
        return result ? (true, "allowed") : (false, "no permission");
    }
    
    public static bool CanOperateMember(GroupChatMember operatorMember, GroupChatMember targetMember)
    {
        return (operatorMember.Type == EGroupMemberType.Owner) || 
               (operatorMember.Type == EGroupMemberType.Admin && targetMember.Type == EGroupMemberType.Member);
    }
    
    public static string GenerateDeviceId(JwtConfig jwtConfig)
    {
        var random = new Random();
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        return new string(Enumerable.Repeat(chars, jwtConfig.DeviceIdLength)
            .Select(s => s[random.Next(s.Length)]).ToArray());
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