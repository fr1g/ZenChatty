using Microsoft.AspNetCore.Mvc;
using ZenChattyServer.Net.Config;
using ZenChattyServer.Net.Helpers;
using ZenChattyServer.Net.Models.Request;
using ZenChattyServer.Net.Models.Response;
using ZenChattyServer.Net.Services;
using ZenChattyServer.Net.Shared;

namespace ZenChattyServer.Net.Controllers;

[ApiController]
[Route("/api/auth")]
public class AuthenticationController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly JwtConfig _jwtConfig;
    
    public AuthenticationController(AuthService authService, JwtConfig jwtConfig)
    {
        _authService = authService;
        _jwtConfig = jwtConfig;
    }
    
    [HttpPost("register")]
    public async Task<ActionResult<BasicResponse>> Register([FromBody] RegisterRequest request)
    {
        var authObject = await _authService.RegisterAsync(request);
        if (authObject == null)
        {
            return BadRequest(new BasicResponse 
            { 
                content = "Username or email already exists",
                success = false 
            });
        }
        
        return Ok(new BasicResponse 
        { 
            content = "success",
            success = true 
        });
    }
    
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        
        if (string.IsNullOrEmpty(request.DeviceId))
        {
            request.DeviceId = GenerateDeviceId();
        }
        
        (AuthResponse? response, string? reason) authResponse = await _authService.LoginAsync(request);
        if (authResponse.response == null)
        {
            return Unauthorized(new BasicResponse 
            { 
                content = $"Invalid username or password, or account disabled: {authResponse.reason}",
                success = false 
            });
        }
        
        return Ok(authResponse.response);
    }
    
    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        var authResponse = await _authService.RefreshTokenAsync(request);
        if (authResponse == null)
        {
            return StatusCode(403, new BasicResponse 
            { 
                content = "RefreshToken Expired / Invalid",
                success = false 
            });
        }
        
        return Ok(authResponse);
    }
    
    [HttpPost("logout")]
    public async Task<ActionResult<BasicResponse>> Logout()
    {
        var deviceId = Request.Headers["X-Device-Id"].FirstOrDefault();
        var refreshToken = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        
        if (string.IsNullOrEmpty(deviceId) || string.IsNullOrEmpty(refreshToken))
        {
            return BadRequest(new BasicResponse 
            { 
                content = "Lacking: Which one is going to logoff?",
                success = false 
            });
        }
        
        var result = await _authService.LogoutAsync(deviceId, refreshToken);
        
        return result ? 
            Ok(new BasicResponse { content = "Logout successful", success = true }) :
            BadRequest(new BasicResponse { content = "Logout failed", success = false });
    }
    
    [HttpGet("validate")]
    public async Task<ActionResult<BasicResponse>> ValidateToken()
    {
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        
        if (string.IsNullOrEmpty(token))
        {
            return Unauthorized(new BasicResponse 
            { 
                content = "Lacking: AccessToken",
                success = false 
            });
        }
        
        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        
        return isValid ? 
            Ok(new BasicResponse { content = "Token valid", success = true }) :
            Unauthorized(new BasicResponse { content = "Token Expired / Invalid [v]", success = false });
    }
    
    // todo: the authentication should become one single function
    
    [HttpGet("userinfo")]
    public async Task<ActionResult<UserInfo>> GetUserInfo()
    {
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        
        if (string.IsNullOrEmpty(token))
        {
            return BadRequest(new BasicResponse 
            { 
                content = "Lacking: AccessToken",
                success = false 
            });
        }
        
        var (isValid, user) = await _authService.ValidateAccessTokenAsync(token);
        
        if (!isValid || user == null)
        {
            return Unauthorized(new BasicResponse 
            { 
                content = $"Token Expired / Invalid [{(user != null ? user.LocalId.ToString() : "nullUser")}]",
                success = false 
            });
        }
        
        var userInfo = await _authService.GetUserInfoAsync(user.LocalId);
        
        return userInfo != null ? 
            Ok(userInfo) :
            NotFound(new BasicResponse { content = "No Such User", success = false });
    }
    
    [HttpPost("disable/{userId}")]
    public async Task<ActionResult<BasicResponse>> DisableUser(Guid userId)
    {
        var result = await _authService.DisableUserAsync(userId);
        
        return result.isSuccess ? 
            Ok(new BasicResponse { content = "User disabled", success = true }) :
            BadRequest(new BasicResponse { content = $"failed to disable this user: {result.uniqueId}", success = false });
    }
    
    [HttpGet("touch")]
    public ActionResult<BasicResponse> Touch()
    {
        return Ok(new BasicResponse{ content = "it do works!", success = true });
    }
    
    private string GenerateDeviceId()
    {
        var random = new Random();
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        return new string(Enumerable.Repeat(chars, _jwtConfig.DeviceIdLength)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }
}