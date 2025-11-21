using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace ZenChattyServer.Net.Tests
{
    public class TestRecallFunction
    {
        private static readonly HttpClient _httpClient = new HttpClient();
        private static readonly string _baseUrl = "http://localhost:5637/api/message";
        
        public static async Task Main(string[] args)
        {
            Console.WriteLine("=== 测试消息撤回功能 ===\n");
            
            // 注意：在实际测试中，需要替换为有效的用户认证token、聊天ID和消息ID
            var authToken = "your-auth-token-here"; // 需要从登录接口获取
            var chatUniqueMark = "test-chat-id"; // 需要从聊天列表获取
            var messageTraceId = "test-message-id"; // 需要从发送消息接口获取
            
            // 设置认证头
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {authToken}");
            
            // 测试撤回消息API
            await TestRecallMessage(chatUniqueMark, messageTraceId);
        }
        
        private static async Task TestRecallMessage(string chatUniqueMark, string messageTraceId)
        {
            try
            {
                Console.WriteLine("1. 测试撤回消息API");
                
                var recallRequest = new
                {
                    MessageTraceId = messageTraceId,
                    ChatUniqueMark = chatUniqueMark
                };
                
                var json = JsonSerializer.Serialize(recallRequest);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                
                var response = await _httpClient.PostAsync($"{_baseUrl}/recall", content);
                
                Console.WriteLine($"撤回请求状态码: {response.StatusCode}");
                
                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"撤回成功: {responseContent}");
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"撤回失败: {errorContent}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"测试撤回功能时出错: {ex.Message}");
            }
        }
    }
}