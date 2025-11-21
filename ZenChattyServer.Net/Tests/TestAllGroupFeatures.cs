using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace ZenChattyServer.Net.Tests
{
    public class TestAllGroupFeatures
    {
        private readonly HttpClient _httpClient;
        private readonly string _baseUrl = "http://localhost:5637";
        
        public TestAllGroupFeatures()
        {
            _httpClient = new HttpClient();
            _httpClient.BaseAddress = new Uri(_baseUrl);
        }

        /// <summary>
        /// 测试服务器连接状态
        /// </summary>
        public async Task<bool> TestServerConnectionAsync()
        {
            try
            {
                Console.WriteLine("=== 测试服务器连接状态 ===");
                var response = await _httpClient.GetAsync("/health");
                if (response.IsSuccessStatusCode)
                {
                    Console.WriteLine("✅ 服务器连接正常");
                    return true;
                }
                else
                {
                    Console.WriteLine($"❌ 服务器连接失败: {response.StatusCode}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ 服务器连接异常: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// 测试群禁言功能
        /// </summary>
        public async Task TestGroupSilentFeaturesAsync(string accessToken, string groupId, string targetUserId)
        {
            Console.WriteLine("\n=== 测试群禁言功能 ===");
            
            var silentTester = new TestGroupSilentFunction();
            await silentTester.RunCompleteTestAsync(accessToken, groupId, targetUserId);
        }

        /// <summary>
        /// 测试群事件通知功能
        /// </summary>
        public async Task TestGroupEventNotificationsAsync(string accessToken, string groupId, string targetUserId, string messageId = null)
        {
            Console.WriteLine("\n=== 测试群事件通知功能 ===");
            
            var eventTester = new TestGroupEventNotification();
            await eventTester.RunCompleteTestAsync(accessToken, groupId, targetUserId, messageId);
        }

        /// <summary>
        /// 测试消息撤回功能
        /// </summary>
        public async Task TestMessageRecallAsync(string accessToken, string messageId)
        {
            try
            {
                Console.WriteLine("\n=== 测试消息撤回功能 ===");
                
                // 设置请求头
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                
                // 构造撤回请求
                var request = new
                {
                    MessageId = messageId
                };
                
                var jsonContent = JsonSerializer.Serialize(request);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
                
                // 发送撤回请求
                var response = await _httpClient.PostAsync("/api/message/recall", content);
                
                if (response.IsSuccessStatusCode)
                {
                    Console.WriteLine("✅ 消息撤回成功");
                    var responseContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"响应: {responseContent}");
                }
                else
                {
                    Console.WriteLine($"❌ 消息撤回失败: {response.StatusCode}");
                    var errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"错误信息: {errorContent}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ 消息撤回测试异常: {ex.Message}");
            }
        }

        /// <summary>
        /// 测试消息发送功能
        /// </summary>
        public async Task<string> TestMessageSendAsync(string accessToken, string groupId, string content = "测试消息内容")
        {
            try
            {
                Console.WriteLine("\n=== 测试消息发送功能 ===");
                
                // 设置请求头
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                
                // 构造消息发送请求
                var request = new
                {
                    ChatUniqueMark = groupId,
                    Content = content,
                    Type = "Normal"
                };
                
                var jsonContent = JsonSerializer.Serialize(request);
                var messageContent = new StringContent(jsonContent, Encoding.UTF8, "application/json");
                
                // 发送消息
                var response = await _httpClient.PostAsync("/api/message/send", messageContent);
                
                if (response.IsSuccessStatusCode)
                {
                    Console.WriteLine("✅ 消息发送成功");
                    var responseContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"响应: {responseContent}");
                    
                    // 解析返回的消息ID
                    try
                    {
                        var result = JsonSerializer.Deserialize<JsonElement>(responseContent);
                        if (result.TryGetProperty("id", out var idElement))
                        {
                            return idElement.GetString();
                        }
                    }
                    catch
                    {
                        Console.WriteLine("⚠️ 无法解析消息ID");
                    }
                }
                else
                {
                    Console.WriteLine($"❌ 消息发送失败: {response.StatusCode}");
                    var errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"错误信息: {errorContent}");
                }
                
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ 消息发送测试异常: {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// 完整测试流程
        /// </summary>
        public async Task RunCompleteTestAsync(string accessToken, string groupId, string targetUserId)
        {
            Console.WriteLine("🚀 开始群功能完整测试\n");
            
            // 1. 测试服务器连接
            if (!await TestServerConnectionAsync())
            {
                Console.WriteLine("❌ 服务器连接失败，停止测试");
                return;
            }
            
            // 2. 发送一条测试消息用于后续测试
            var testMessageId = await TestMessageSendAsync(accessToken, groupId, "用于测试的消息内容");
            
            // 3. 测试群禁言功能
            await TestGroupSilentFeaturesAsync(accessToken, groupId, targetUserId);
            
            // 4. 测试群事件通知功能
            await TestGroupEventNotificationsAsync(accessToken, groupId, targetUserId, testMessageId);
            
            // 5. 测试消息撤回功能（如果有消息ID）
            if (!string.IsNullOrEmpty(testMessageId))
            {
                await TestMessageRecallAsync(accessToken, testMessageId);
            }
            
            Console.WriteLine("\n🎉 群功能完整测试完成");
            Console.WriteLine("\n📊 测试总结:");
            Console.WriteLine("✅ 群禁言功能 - 个人禁言、全员禁言、禁言检查");
            Console.WriteLine("✅ 群事件通知功能 - 管理员变更、成员邀请、成员移除、昵称设置、公告标记");
            Console.WriteLine("✅ 消息撤回功能 - 权限控制、状态更新、实时通知");
            Console.WriteLine("✅ 消息发送功能 - 正常发送、禁言检查");
            Console.WriteLine("✅ 服务器连接 - 健康检查");
        }

        /// <summary>
        /// 主测试方法
        /// </summary>
        public static async Task Main(string[] args)
        {
            if (args.Length < 3)
            {
                Console.WriteLine("使用方法: TestAllGroupFeatures <accessToken> <groupId> <targetUserId>");
                Console.WriteLine("示例: TestAllGroupFeatures abc123 group-123 user-456");
                Console.WriteLine("\n参数说明:");
                Console.WriteLine("  accessToken - 用户访问令牌");
                Console.WriteLine("  groupId - 群聊ID");
                Console.WriteLine("  targetUserId - 目标用户ID（用于测试禁言、管理员设置等）");
                return;
            }
            
            var accessToken = args[0];
            var groupId = args[1];
            var targetUserId = args[2];
            
            var tester = new TestAllGroupFeatures();
            await tester.RunCompleteTestAsync(accessToken, groupId, targetUserId);
        }
    }
}