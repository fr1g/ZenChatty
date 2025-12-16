using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ZenChattyServer.Net.Config;
using ZenChattyServer.Net.Helpers;
using ZenChattyServer.Net.Helpers.Context;
using ZenChattyServer.Net.Hubs;
using ZenChattyServer.Net.Models;
using ZenChattyServer.Net.Models.Enums;
using ZenChattyServer.Net.Models.Request;
using ZenChattyServer.Net.Models.Response;
using ZenChattyServer.Net.Shared;

namespace ZenChattyServer.Net.Services;

public class AuthService(
    UserRelatedContext context,
    JwtConfig jwtConfig,
    ChatHubService chatHubService,
    UserSocialService userSocialService)
{
    // 用户注册
    public async Task<(UserAuthObject?, User?, string)> RegisterAsync(RegisterRequest request)
    {
        Console.WriteLine("incoming new register");

        Console.WriteLine($"==={request.UniqueCustomId}");

        if (await context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower()))
            return (null, null, "Email occupied");

        if (!string.IsNullOrEmpty(request.UniqueCustomId) &&
            await context.Users.AnyAsync(u =>
                u.CustomId != null && u.CustomId.ToLower() == request.UniqueCustomId.ToLower()))
            return (null, null, "CustomId occupied");

        var customId = string.IsNullOrEmpty(request.UniqueCustomId)
            ? await GenerateUniqueCustomId()
            : request.UniqueCustomId.ToLower();

        // 创建用户 - 使用Email作为主要标识
        var user = new User(request.Email.ToLower())
        {
            DisplayName = request.DisplayName.IsNullOrEmpty() ? customId : request.DisplayName,
            Bio = request.Bio,
            Gender = Enum.Parse<EGender>(request.Gender),
            Birth = request.Birthday,
            CustomId = customId,
            Status = EUserStatus.New // 新注册用户设置为New状态
        };

        // 创建认证对象
        var encryptedPassword = EncryptPassword(request.Password);
        var authObject = new UserAuthObject(user, encryptedPassword, string.Empty);

        context.Users.Add(user);
        context.UserAuthObjects.Add(authObject);
        await context.SaveChangesAsync();

        return (authObject, user, "Wilkommen!");
    }

    // 生成唯一的10位CustomID
    private async Task<string> GenerateUniqueCustomId()
    {
        string customId;
        do customId = AuthHelper.DefaultShortIdGenerator();
        while (await context.Users.AnyAsync(u => u.CustomId != null && u.CustomId == customId));
        return customId;
    }

    public async Task<(AuthResponse?, string)> LoginAsync(LoginRequest request)
    {
        var username = request.Username.ToLower();
        Console.WriteLine($"login: {username}");
        // 1. 先在Users表查询用户
        var user = await context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == username ||
                                      (u.CustomId != null && u.CustomId.ToLower() == username));

        if (user == null || user.Status == EUserStatus.Disabled)
            return (null, $"notExistOrDisabled: {EUserStatus.Disabled} status");

        var authObject = await context.UserAuthObjects
            .Include(ao => ao.DeviceSessions)
            .FirstOrDefaultAsync(ao => ao.User.LocalId == user.LocalId);

        if (authObject == null)
            return (null, "authObjectNotFound");

        if (!VerifyPassword(request.Password, authObject.EncryptedPassword))
            return (null, "incorrect");

        if (user.Status == EUserStatus.New)
        {
            user.Status = EUserStatus.Online;
            context.Users.Update(user);
            await context.SaveChangesAsync();
            var newRelationChatId =
                (await userSocialService.AddFriendAsync(
                    Constants.SystemUser!.LocalId.ToString(),
                    user.LocalId.ToString(),
                    true)
                ).chatId;
            if (newRelationChatId.IsNullOrEmpty()) 
                throw new NullReferenceException("No expected chat id returned");
            // fuck
            var rererereregotTargetChat =
                await context.PrivateChats.FirstAsync(chat => chat.UniqueMark == newRelationChatId);
            await ChatAgent.Say(context, Constants.CreateWelcomeMessage(user, rererereregotTargetChat),
                chatHubService);
            // no more changes, right?
        }

        DeviceSession deviceSession;
        
        // 检查是否已有相同设备ID的活跃会话
        var existingSession = authObject.DeviceSessions
            .FirstOrDefault(ds => ds.DeviceId == request.DeviceId &&
                                  ds.IsActive &&
                                  ds.RefreshTokenExpiresAt > DateTime.UtcNow);

        if (existingSession != null)
        {
            // 如果已有相同设备的活跃会话，重新加载以获取最新的 RowVersion
            var sessionId = existingSession.Id;
            var freshSession = await context.DeviceSessions
                .FirstOrDefaultAsync(ds => ds.Id == sessionId);
            
            if (freshSession != null)
            {
                // 更新最后访问时间
                freshSession.LastAccessedAt = DateTime.UtcNow;
                context.DeviceSessions.Update(freshSession);
                deviceSession = freshSession;
            }
            else
            {
                // 会话已被删除，创建新会话
                deviceSession = await CreateDeviceSession(authObject, request.DeviceId);
                context.DeviceSessions.Add(deviceSession);
            }
        }
        else
        {
            // 检查是否达到最大设备数限制
            var activeSessions = authObject.DeviceSessions
                .Where(ds => ds.IsActive && ds.RefreshTokenExpiresAt > DateTime.UtcNow)
                .ToList();

            if (activeSessions.Count >= jwtConfig.MaxDevicesPerUser)
            {
                var oldestSession = activeSessions.OrderBy(ds => ds.LastAccessedAt).First();
                
                // 重新加载要删除的会话以获取最新的 RowVersion
                var sessionToRemove = await context.DeviceSessions
                    .FirstOrDefaultAsync(ds => ds.Id == oldestSession.Id);
                
                if (sessionToRemove != null)
                {
                    context.DeviceSessions.Remove(sessionToRemove);
                }
            }

            deviceSession = await CreateDeviceSession(authObject, request.DeviceId);
            context.DeviceSessions.Add(deviceSession);
        }

        // 使用重试机制处理并发冲突和主键冲突
        int maxRetries = 3;
        for (int i = 0; i < maxRetries; i++)
        {
            try
            {
                await context.SaveChangesAsync();
                break; // 成功保存，跳出循环
            }
            catch (DbUpdateConcurrencyException ex)
            {
                if (i == maxRetries - 1)
                {
                    throw new InvalidOperationException(
                        $"无法保存设备会话，已重试 {maxRetries} 次（并发冲突）。请稍后重试。", ex);
                }
                
                // 刷新实体以获取数据库中的最新值
                foreach (var entry in ex.Entries)
                {
                    await entry.ReloadAsync();
                }
                
                await Task.Delay(50 * (i + 1));
            }
            catch (DbUpdateException ex) when (ex.InnerException is Microsoft.Data.SqlClient.SqlException sqlEx 
                                               && sqlEx.Number == 2627) // 主键冲突
            {
                if (i == maxRetries - 1)
                {
                    throw new InvalidOperationException(
                        $"无法保存设备会话，已重试 {maxRetries} 次（主键冲突）。请稍后重试。", ex);
                }
                
                // 主键冲突：清理变更跟踪器，重新生成设备会话
                foreach (var entry in context.ChangeTracker.Entries<DeviceSession>())
                {
                    if (entry.State == EntityState.Added)
                    {
                        entry.State = EntityState.Detached;
                    }
                }
                
                // 重新创建设备会话（使用新的 ID）
                deviceSession = await CreateDeviceSession(authObject, request.DeviceId);
                context.DeviceSessions.Add(deviceSession);
                
                await Task.Delay(50 * (i + 1));
            }
        }

        var accessToken = GenerateAccessToken(user, deviceSession.DeviceId);

        return (
            new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = deviceSession.RefreshToken,
                AccessTokenExpiresAt = DateTime.UtcNow.Add(jwtConfig.AccessTokenExpiration),
                RefreshTokenExpiresAt = deviceSession.RefreshTokenExpiresAt,
                DeviceId = deviceSession.DeviceId,
                UserInfo = new UserInfo
                {
                    UserId = user.LocalId,
                    Username = user.CustomId ?? user.Email, // 优先使用CustomID，如果没有则使用Email
                    DisplayName = user.DisplayName,
                    Email = user.Email,
                    Status = user.Status.ToString()
                }
            }, "success"
        );


        return (null, "concurrencyConflict");
    }

    // 刷新AccessToken
    public async Task<AuthResponse?> RefreshTokenAsync(RefreshTokenRequest request)
    {
        var authObject = await context.UserAuthObjects
            .Include(ao => ao.User)
            .Include(ao => ao.DeviceSessions)
            .FirstOrDefaultAsync(ao => ao.DeviceSessions.Any(ds =>
                ds.DeviceId == request.DeviceId &&
                ds.RefreshToken == request.RefreshToken &&
                ds.IsActive &&
                ds.RefreshTokenExpiresAt > DateTime.UtcNow));

        if (authObject == null || authObject.User.Status == EUserStatus.Disabled)
            return null;

        var deviceSession = authObject.DeviceSessions
            .First(ds => ds.DeviceId == request.DeviceId && ds.RefreshToken == request.RefreshToken);

        // 更新访问时间
        deviceSession.LastAccessedAt = DateTime.UtcNow;

        // 生成新的AccessToken
        var accessToken = GenerateAccessToken(authObject.User, request.DeviceId);

        await context.SaveChangesAsync();

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = deviceSession.RefreshToken,
            AccessTokenExpiresAt = DateTime.UtcNow.Add(jwtConfig.AccessTokenExpiration),
            RefreshTokenExpiresAt = deviceSession.RefreshTokenExpiresAt,
            DeviceId = deviceSession.DeviceId,
            UserInfo = new UserInfo
            {
                UserId = authObject.User.LocalId,
                Username = authObject.User.CustomId ?? authObject.User.Email, // 优先使用CustomID，如果没有则使用Email
                DisplayName = authObject.User.DisplayName,
                Email = authObject.User.Email,
                Status = authObject.User.Status.ToString()
            }
        };
    }

    // 注销设备
    public async Task<bool> LogoutAsync(User user, string deviceId, string refreshToken)
    {
        var authObject = await context.UserAuthObjects
            .Include(ao => ao.DeviceSessions)
            .FirstOrDefaultAsync(ao => ao.User.LocalId == user.LocalId);

        Console.WriteLine($"stage y1");

        if (authObject == null)
            return false;

        var deviceSession = authObject.DeviceSessions
            .First(ds => ds.DeviceId == deviceId); // ignore refreshtoken for now... not carried...

        deviceSession.IsActive = false;
        authObject.DeviceSessions.Remove(deviceSession);
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<(bool isValid, User? user)> ValidateAccessTokenAsync(string accessToken)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(jwtConfig.Secret);

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = jwtConfig.Issuer,
                ValidateAudience = true,
                ValidAudience = jwtConfig.Audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            var principal = tokenHandler.ValidateToken(accessToken, validationParameters, out _);
            var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var deviceIdClaim = principal.FindFirst("deviceId")?.Value;


            if (string.IsNullOrEmpty(userIdClaim) || string.IsNullOrEmpty(deviceIdClaim))
                return (false, null);

            var userId = Guid.Parse(userIdClaim);

            // UserAuthObject nav User
            var authObject = await context.UserAuthObjects
                .Include(ao => ao.User)
                .Include(ao => ao.DeviceSessions)
                .FirstOrDefaultAsync(ao => ao.Id == userId);

            if (authObject == null)
                return (false, null);

            // 如果用户无效，直接返回
            if (authObject.User.Status == EUserStatus.Disabled)
                return (false, null);

            // 检查设备会话
            var deviceSession = authObject.DeviceSessions.FirstOrDefault(ds =>
                ds.DeviceId == deviceIdClaim);

            // Console.WriteLine($"{(deviceSession != null ? deviceSession.Id : "null")}");

            // 验证设备会话是否存在、是否激活以及刷新令牌是否过期
            var isSessionValid =
                deviceSession is { IsActive: true } && // deviceSession != null && deviceSession.IsActive
                deviceSession.RefreshTokenExpiresAt > DateTime.UtcNow;

            return (isSessionValid, isSessionValid ? authObject.User : null);
        }
        catch
        {
            return (false, null);
        }
    }

    public async Task<(bool isSuccess, string? uniqueId)> DisableUserAsync(Guid userId)
    {
        var user = await context.Users.FindAsync(userId);
        if (user == null)
            return (false, null);

        user.Status = EUserStatus.Disabled;
        try
        {
            await context.SaveChangesAsync();
        }
        catch (Exception e)
        {
            Console.WriteLine(e);
            return (false, $"User: {user.CustomId}; Reason: {e.Message}");
        }

        return (true, user.CustomId);
    }

    // 获取用户信息
    public async Task<UserInfo?> GetUserInfoAsync(Guid userId)
    {
        var user = await context.Users.FindAsync(userId);
        if (user == null)
            return null;

        return new UserInfo
        {
            UserId = user.LocalId,
            Username = user.CustomId ?? user.Email, // 优先使用CustomID，如果没有则使用Email
            DisplayName = user.DisplayName,
            Email = user.Email,
            Status = user.Status.ToString()
        };
    }

    // ----
    private async Task<DeviceSession> CreateDeviceSession(UserAuthObject authObject, string deviceId)
    {
        var refreshToken = GenerateRefreshToken();
        var expiresAt = DateTime.UtcNow.Add(jwtConfig.RefreshTokenExpiration);

        // 创建新的设备会话，使用全新的 ID
        var deviceSession = new DeviceSession
        {
            Id = Guid.NewGuid(), // 确保生成新的唯一 ID
            UserAuthObjectId = authObject.Id,
            DeviceId = deviceId,
            RefreshToken = refreshToken,
            RefreshTokenExpiresAt = expiresAt,
            LastAccessedAt = DateTime.UtcNow,
            IsActive = true
        };

        // 只返回新创建的会话，不要查询旧的
        // 调用方已经负责检查是否需要创建新会话
        return await Task.FromResult(deviceSession);
    }

    private string GenerateAccessToken(User user, string deviceId)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(jwtConfig.Secret);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.LocalId.ToString()),
            new Claim("deviceId", deviceId),
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.Add(jwtConfig.AccessTokenExpiration),
            Issuer = jwtConfig.Issuer,
            Audience = jwtConfig.Audience,
            SigningCredentials =
                new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    private static string EncryptPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(password);
        var hash = sha256.ComputeHash(bytes);
        return Convert.ToBase64String(hash);
    }

    private static bool VerifyPassword(string password, string encryptedPassword)
    {
        var encryptedInput = EncryptPassword(password);
        return encryptedInput == encryptedPassword;
    }
}