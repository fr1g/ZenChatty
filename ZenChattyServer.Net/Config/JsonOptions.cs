using System.Text.Json;

namespace ZenChattyServer.Net.Config;

public class JsonOptions
{
    public static readonly JsonSerializerOptions DefaultNaming = new JsonSerializerOptions {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };
}