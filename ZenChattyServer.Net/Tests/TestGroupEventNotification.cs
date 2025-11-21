using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace ZenChattyServer.Net.Tests
{
    public class TestGroupEventNotification
    {
        private readonly HttpClient _httpClient;
        private readonly string _baseUrl = "http://localhost:5637";
        
        public TestGroupEventNotification()
        {
            _httpClient = new HttpClient();
            _httpClient.BaseAddress = new Uri(_baseUrl);
        }

        /// <summary>
        /// 测试设置管理员功能
        /// </summary>
        public async Task TestSetAdminAsync(string accessToken, string groupId, string targetUserId, bool isAdmin = true)
        {
            try
            {
                Console.WriteLine($"=== 测试{(isAdmin ? "设置" : "取消")}管理员功能 ===");
                
                // 设置请求头
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                
                // 构造设置管理员请求
                var request = new
                {
                    GroupId = groupId,
                    TargetUserId = targetUserId,
                    Reason = $"测试{(isAdmin ? "设置" : "取消")}管理员"
                };
                
                var jsonContent = JsonSerializer.Serialize(request);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
                
                // 发送设置管理员请求
                var response = await _httpClient.PostAsync($"/api/social/group/set-admin?isAdmin={isAdmin}", content);
                
                if (response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"✅ {(isAdmin ? "设置" : "取消")}管理员成功");
                    var responseContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"响应: {responseContent}");
                }
                else
                {
                    Console.WriteLine($"❌ {(isAdmin ? "设置" : "取消")}管理员失败: {response.StatusCode}");
                    var errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"错误信息: {errorContent}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ 设置管理员测试异常: {ex.Message}");
            }
        }

        /// <summary>
        /// 测试邀请成员功能
        /// </summary>
        public async Task TestInviteMemberAsync(string accessToken, string groupId, string targetUserId)
        {
            try
            {
                Console.WriteLine("=== 测试邀请成员功能 ===");
                
                // 设置请求头
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                
                // 构造邀请成员请求
                var request = new
                {
                    GroupId = groupId,
                    TargetUserId = targetUserId,
                    Reason = "测试邀请成员"
                };
                
                var jsonContent = JsonSerializer.Serialize(request);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
                
                // 发送邀请成员请求
                var response = await _httpClient.PostAsync("/api/social/group/invite", content);
                
                if (response.IsSuccessStatusCode)
                {
                    Console.WriteLine("✅ 邀请成员成功");
                    var responseContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"响应: {responseContent}");
                }
                else
                {
                    Console.WriteLine($"❌ 邀请成员失败: {response.StatusCode}");
                    var errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"错误信息: {errorContent}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ 邀请成员测试异常: {ex.Message}");
            }
        }

        /// <summary>
        /// 测试移除成员功能
        /// </summary>
        public async Task TestRemoveMemberAsync(string accessToken, string groupId, string targetUserId)
        {
            try
            {
                Console.WriteLine("=== 测试移除成员功能 ===");
                
                // 设置请求头
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                
                // 构造移除成员请求
                var request = new
                {
                    GroupId = groupId,
                    TargetUserId = targetUserId,
                    Reason = "测试移除成员"
                };
                
                var jsonContent = JsonSerializer.Serialize(request);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
                
                // 发送移除成员请求
                var response = await _httpClient.PostAsync("/api/social/group/remove", content);
                
                if (response.IsSuccessStatusCode)
                {
                    Console.WriteLine("✅ 移除成员成功");
                    var responseContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"响应: {responseContent}");
                }
                else
                {
                    Console.WriteLine($"❌ 移除成员失败: {response.StatusCode}");
                    var errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"错误信息: {errorContent}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ 移除成员测试异常: {ex.Message}");
            }
        }

        /// <summary>
        /// 测试设置成员昵称功能
        /// </summary>
        public async Task TestSetMemberNicknameAsync(string accessToken, string groupId, string targetUserId, string nickname)
        {
            try
            {
                Console.WriteLine("=== 测试设置成员昵称功能 ===");
                
                // 设置请求头
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                
                // 构造设置昵称请求
                var request = new
                {
                    GroupId = groupId,
                    TargetUserId = targetUserId,
                    NewTitle = nickname,
                    Reason = "测试设置昵称"
                };
                
                var jsonContent = JsonSerializer.Serialize(request);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
                
                // 发送设置昵称请求
                var response = await _httpClient.PostAsync("/api/social/group/set-title", content);
                
                if (response.IsSuccessStatusCode)
                {
                    Console.WriteLine("✅ 设置成员昵称成功");
                    var responseContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"响应: {responseContent}");
                }
                else
                {
                    Console.WriteLine($"❌ 设置成员昵称失败: {response.StatusCode}");
                    var errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"错误信息: {errorContent}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ 设置成员昵称测试异常: {ex.Message}");
            }
        }

        /// <summary>
        /// 测试标记消息为公告功能
        /// </summary>
        public async Task TestMarkMessageAsAnnouncementAsync(string accessToken, string messageId)
        {
            try
            {
                Console.WriteLine("=== 测试标记消息为公告功能 ===");
                
                // 设置请求头
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                
                // 发送标记公告请求
                var response = await _httpClient.PostAsync($"/api/social/group/announcement/mark?messageId={messageId}", null);
                
                if (response.IsSuccessStatusCode)
                {
                    Console.WriteLine("✅ 标记消息为公告成功");
                    var responseContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"响应: {responseContent}");
                }
                else
                {
                    Console.WriteLine($"❌ 标记消息为公告失败: {response.StatusCode}");
                    var errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"错误信息: {errorContent}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ 标记公告测试异常: {ex.Message}");
            }
        }

        /// <summary>
        /// 完整测试流程
        /// </summary>
        public async Task RunCompleteTestAsync(string accessToken, string groupId, string targetUserId, string messageId = null)
        {
            Console.WriteLine("🚀 开始群事件通知功能完整测试\n");
            
            // 1. 测试设置管理员
            await TestSetAdminAsync(accessToken, groupId, targetUserId, true);
            
            // 2. 测试取消管理员
            await TestSetAdminAsync(accessToken, groupId, targetUserId, false);
            
            // 3. 测试邀请成员
            await TestInviteMemberAsync(accessToken, groupId, targetUserId);
            
            // 4. 测试设置成员昵称
            await TestSetMemberNicknameAsync(accessToken, groupId, targetUserId, "测试昵称");
            
            // 5. 测试移除成员
            await TestRemoveMemberAsync(accessToken, groupId, targetUserId);
            
            // 6. 如果提供了消息ID，测试标记公告
            if (!string.IsNullOrEmpty(messageId))
            {
                await TestMarkMessageAsAnnouncementAsync(accessToken, messageId);
            }
            else
            {
                Console.WriteLine("⚠️ 未提供消息ID，跳过公告标记测试");
            }
            
            Console.WriteLine("\n🎉 群事件通知功能完整测试完成");
        }

        /// <summary>
        /// 主测试方法
        /// </summary>
        public static async Task Main(string[] args)
        {
            if (args.Length < 3)
            {
                Console.WriteLine("使用方法: TestGroupEventNotification <accessToken> <groupId> <targetUserId> [messageId]");
                Console.WriteLine("示例: TestGroupEventNotification abc123 group-123 user-456 msg-789");
                return;
            }
            
            var accessToken = args[0];
            var groupId = args[1];
            var targetUserId = args[2];
            var messageId = args.Length > 3 ? args[3] : null;
            
            var tester = new TestGroupEventNotification();
            await tester.RunCompleteTestAsync(accessToken, groupId, targetUserId, messageId);
        }
    }
}