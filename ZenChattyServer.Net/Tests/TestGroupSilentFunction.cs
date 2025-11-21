using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace ZenChattyServer.Net.Tests
{
    public class TestGroupSilentFunction
    {
        private readonly HttpClient _httpClient;
        private readonly string _baseUrl = "http://localhost:5637";
        
        public TestGroupSilentFunction()
        {
            _httpClient = new HttpClient();
            _httpClient.BaseAddress = new Uri(_baseUrl);
        }

        /// <summary>
        /// 测试个人禁言功能
        /// </summary>
        public async Task TestMemberSilentAsync(string accessToken, string groupId, string targetUserId, int durationMinutes = 60)
        {
            try
            {
                Console.WriteLine("=== 测试个人禁言功能 ===");
                
                // 设置请求头
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                
                // 构造禁言请求
                var request = new
                {
                    GroupId = groupId,
                    TargetUserId = targetUserId,
                    SilentDuration = TimeSpan.FromMinutes(durationMinutes),
                    Reason = "测试禁言"
                };
                
                var jsonContent = JsonSerializer.Serialize(request);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
                
                // 发送禁言请求
                var response = await _httpClient.PostAsync("/api/social/group/silent?isSilent=true", content);
                
                if (response.IsSuccessStatusCode)
                {
                    Console.WriteLine("✅ 个人禁言成功");
                    var responseContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"响应: {responseContent}");
                }
                else
                {
                    Console.WriteLine($"❌ 个人禁言失败: {response.StatusCode}");
                    var errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"错误信息: {errorContent}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ 个人禁言测试异常: {ex.Message}");
            }
        }

        /// <summary>
        /// 测试解除个人禁言功能
        /// </summary>
        public async Task TestMemberUnsilentAsync(string accessToken, string groupId, string targetUserId)
        {
            try
            {
                Console.WriteLine("\n=== 测试解除个人禁言功能 ===");
                
                // 设置请求头
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                
                // 构造解除禁言请求
                var request = new
                {
                    GroupId = groupId,
                    TargetUserId = targetUserId,
                    Reason = "测试解除禁言"
                };
                
                var jsonContent = JsonSerializer.Serialize(request);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
                
                // 发送解除禁言请求
                var response = await _httpClient.PostAsync("/api/social/group/silent?isSilent=false", content);
                
                if (response.IsSuccessStatusCode)
                {
                    Console.WriteLine("✅ 解除个人禁言成功");
                    var responseContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"响应: {responseContent}");
                }
                else
                {
                    Console.WriteLine($"❌ 解除个人禁言失败: {response.StatusCode}");
                    var errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"错误信息: {errorContent}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ 解除个人禁言测试异常: {ex.Message}");
            }
        }

        /// <summary>
        /// 测试全员禁言功能
        /// </summary>
        public async Task TestGroupSilentAsync(string accessToken, string groupId, bool isSilent = true, string reason = "测试全员禁言")
        {
            try
            {
                Console.WriteLine($"\n=== 测试{(isSilent ? "开启" : "关闭")}全员禁言功能 ===");
                
                // 设置请求头
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                
                // 发送全员禁言请求
                var response = await _httpClient.PostAsync($"/api/social/group/{groupId}/silent-all?isSilent={isSilent}&reason={Uri.EscapeDataString(reason)}", null);
                
                if (response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"✅ {(isSilent ? "开启" : "关闭")}全员禁言成功");
                    var responseContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"响应: {responseContent}");
                }
                else
                {
                    Console.WriteLine($"❌ {(isSilent ? "开启" : "关闭")}全员禁言失败: {response.StatusCode}");
                    var errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"错误信息: {errorContent}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ 全员禁言测试异常: {ex.Message}");
            }
        }

        /// <summary>
        /// 测试消息发送时的禁言检查
        /// </summary>
        public async Task TestMessageSendWithSilentCheckAsync(string accessToken, string groupId)
        {
            try
            {
                Console.WriteLine("\n=== 测试消息发送时的禁言检查 ===");
                
                // 设置请求头
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                
                // 构造消息发送请求
                var request = new
                {
                    ChatUniqueMark = groupId,
                    Content = "测试消息内容",
                    Type = "Normal"
                };
                
                var jsonContent = JsonSerializer.Serialize(request);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
                
                // 发送消息
                var response = await _httpClient.PostAsync("/api/message/send", content);
                
                if (response.IsSuccessStatusCode)
                {
                    Console.WriteLine("✅ 消息发送成功（用户未被禁言）");
                    var responseContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"响应: {responseContent}");
                }
                else
                {
                    Console.WriteLine($"❌ 消息发送失败: {response.StatusCode}");
                    var errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"错误信息: {errorContent}");
                    
                    // 检查是否为禁言导致的失败
                    if (errorContent.Contains("禁言") || errorContent.Contains("UserMuted"))
                    {
                        Console.WriteLine("✅ 禁言检查功能正常（用户被禁言，消息发送被阻止）");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ 消息发送测试异常: {ex.Message}");
            }
        }

        /// <summary>
        /// 完整测试流程
        /// </summary>
        public async Task RunCompleteTestAsync(string accessToken, string groupId, string targetUserId)
        {
            Console.WriteLine("🚀 开始群禁言功能完整测试\n");
            
            // 1. 测试消息发送（正常状态）
            await TestMessageSendWithSilentCheckAsync(accessToken, groupId);
            
            // 2. 测试个人禁言
            await TestMemberSilentAsync(accessToken, groupId, targetUserId);
            
            // 3. 测试被禁言用户的消息发送
            await TestMessageSendWithSilentCheckAsync(accessToken, groupId);
            
            // 4. 测试解除个人禁言
            await TestMemberUnsilentAsync(accessToken, groupId, targetUserId);
            
            // 5. 测试消息发送（解除禁言后）
            await TestMessageSendWithSilentCheckAsync(accessToken, groupId);
            
            // 6. 测试开启全员禁言
            await TestGroupSilentAsync(accessToken, groupId, true);
            
            // 7. 测试普通成员在全员禁言下的消息发送
            await TestMessageSendWithSilentCheckAsync(accessToken, groupId);
            
            // 8. 测试关闭全员禁言
            await TestGroupSilentAsync(accessToken, groupId, false);
            
            // 9. 测试消息发送（关闭全员禁言后）
            await TestMessageSendWithSilentCheckAsync(accessToken, groupId);
            
            Console.WriteLine("\n🎉 群禁言功能完整测试完成");
        }

        /// <summary>
        /// 主测试方法
        /// </summary>
        public static async Task Main(string[] args)
        {
            if (args.Length < 3)
            {
                Console.WriteLine("使用方法: TestGroupSilentFunction <accessToken> <groupId> <targetUserId>");
                Console.WriteLine("示例: TestGroupSilentFunction abc123 group-123 user-456");
                return;
            }
            
            var accessToken = args[0];
            var groupId = args[1];
            var targetUserId = args[2];
            
            var tester = new TestGroupSilentFunction();
            await tester.RunCompleteTestAsync(accessToken, groupId, targetUserId);
        }
    }
}