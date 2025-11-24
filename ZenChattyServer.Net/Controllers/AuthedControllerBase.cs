using Microsoft.AspNetCore.Mvc;
using ZenChattyServer.Net.Helpers;
using ZenChattyServer.Net.Models;
using ZenChattyServer.Net.Models.Response;
using ZenChattyServer.Net.Services;

namespace ZenChattyServer.Net.Controllers;

public class AuthedControllerBase(AuthService authService) : ControllerBase
{
    
    protected async Task<(BasicResponse? failResult, bool isValid, User? user)> AuthenticateAsync()
    {
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        return await AuthHelper.RejectOrNotAsync(token, authService);
    }
}