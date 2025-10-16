using Microsoft.AspNetCore.Mvc;
using ZenChattyServer.Net.Models.Response;

namespace ZenChattyServer.Net.Controllers;

[ApiController]
[Route("/api/auth")]
public class AuthenticationController : ControllerBase
{
    [HttpGet("touch")]
    public async Task<ActionResult<BasicResponse>> Touch()
    {
        return Ok((new BasicResponse{content = "it do works!"}));
    }
    
    
    
}