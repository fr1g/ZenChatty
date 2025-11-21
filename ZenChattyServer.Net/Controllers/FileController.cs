using Microsoft.AspNetCore.Mvc;
using ZenChattyServer.Net.Helpers;
using ZenChattyServer.Net.Models;
using ZenChattyServer.Net.Models.Enums;
using ZenChattyServer.Net.Models.Response;
using ZenChattyServer.Net.Services;

namespace ZenChattyServer.Net.Controllers;

[ApiController]
[Route("/api/file")]
public class FileController : ControllerBase
{
    private readonly FileStorageService _fileStorageService;
    private readonly AuthService _authService;
    private readonly ILogger<FileController> _logger;

    public FileController(FileStorageService fileStorageService, AuthService authService, ILogger<FileController> logger)
    {
        _fileStorageService = fileStorageService;
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// 上传文件
    /// </summary>
    [HttpPost("upload")]
    [RequestSizeLimit(128 * 1024 * 1024)] // 限制上传大小为128MB
    public async Task<ActionResult<FileUploadResponse>> UploadFile([FromForm] FileUploadRequest request)
    {
        // 验证用户身份
        var (isValid, user) = await ValidateUserTokenAsync();
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token invalid", success = false });

        // 验证文件是否存在
        if (request.File == null || request.File.Length == 0)
            return BadRequest(new BasicResponse { content = "Please select a file to upload", success = false });

        // 验证文件类型
        var fileType = GetFileTypeFromExtension(request.FileExtension);
        if (fileType == null)
            return BadRequest(new BasicResponse { content = "Unsupported file type", success = false });

        try
        {
            // 上传文件（带进度报告）
            var progress = new Progress<(long bytesRead, long totalBytes)>(report =>
            {
                var percentage = (double)report.bytesRead / report.totalBytes * 100;
                _logger.LogInformation("文件上传进度: {BytesRead}/{TotalBytes} ({Percentage:F1}%)", 
                    report.bytesRead, report.totalBytes, percentage);
            });
            
            var result = await _fileStorageService.UploadFileAsync(
                user.LocalId.ToString(),
                request.File.OpenReadStream(),
                request.File.FileName,
                fileType.Value,
                request.FileExtension,
                progress
            );

            if (!result.success || result.userFile == null)
                return BadRequest(new BasicResponse { content = result.message, success = false });

            return Ok(new FileUploadResponse
            {
                success = true,
                content = result.message,
                locator = result.userFile.Locator,
                fileSize = result.userFile.FileSize,
                uploadTime = result.userFile.UploadTime
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new BasicResponse { content = "File upload failed", success = false });
        }
    }

    /// <summary>
    /// 获取文件信息
    /// </summary>
    [HttpGet("info/{locator}")]
    public async Task<ActionResult<FileInfoResponse>> GetFileInfo(string locator)
    {
        // 验证用户身份
        var (isValid, user) = await ValidateUserTokenAsync();
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        try
        {
            var result = await _fileStorageService.GetFileInfoAsync(locator);

            if (!result.success || result.userFile == null)
                return NotFound(new BasicResponse { content = result.message, success = false });

            return Ok(new FileInfoResponse
            {
                success = true,
                content = result.message,
                locator = result.userFile.Locator,
                fileType = result.userFile.FileType.ToString(),
                fileExtension = result.userFile.FileExtension,
                originalFileName = result.userFile.OriginalFileName,
                fileSize = result.userFile.FileSize,
                uploadTime = result.userFile.UploadTime,
                uploaderId = result.userFile.UploaderId.ToString(),
                md5Hash = result.userFile.Md5Hash
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new BasicResponse { content = "Failed to get file information", success = false });
        }
    }

    /// <summary>
    /// 下载文件
    /// </summary>
    [HttpGet("download/{locator}")]
    public async Task<IActionResult> DownloadFile(string locator)
    {
        // 验证用户身份
        var (isValid, user) = await ValidateUserTokenAsync();
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        try
        {
            var result = await _fileStorageService.DownloadFileAsync(locator);

            if (!result.success || result.fileStream == null)
                return NotFound(new BasicResponse { content = result.message, success = false });

            // 设置响应头
            Response.Headers.Append("Content-Disposition", $"attachment; filename=\"{result.fileName}\"");
            
            // 根据文件类型设置Content-Type
            var contentType = GetContentTypeFromLocator(locator);
            
            return File(result.fileStream, contentType, result.fileName);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new BasicResponse { content = "File download failed", success = false });
        }
    }

    /// <summary>
    /// 删除文件
    /// </summary>
    [HttpDelete("delete/{locator}")]
    public async Task<ActionResult<BasicResponse>> DeleteFile(string locator)
    {
        // 验证用户身份
        var (isValid, user) = await ValidateUserTokenAsync();
        if (!isValid || user == null)
            return Unauthorized(new BasicResponse { content = "Token无效", success = false });

        try
        {
            var result = await _fileStorageService.DeleteFileAsync(locator, user.LocalId.ToString());

            if (!result.success)
                return BadRequest(new BasicResponse { content = result.message, success = false });

            return Ok(new BasicResponse { content = result.message, success = true });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new BasicResponse { content = "File deletion failed", success = false });
        }
    }

    /// <summary>
    /// 验证用户Token
    /// </summary>
    private async Task<(bool isValid, User? user)> ValidateUserTokenAsync()
    {
        var token = AuthHelper.Unbear(Request.Headers.Authorization.FirstOrDefault());
        if (string.IsNullOrEmpty(token))
            return (false, null);

        return await _authService.ValidateAccessTokenAsync(token);
    }

    /// <summary>
    /// 根据文件扩展名获取文件类型
    /// </summary>
    private EFileType? GetFileTypeFromExtension(string extension)
    {
        var ext = extension.ToLowerInvariant();
        
        return ext switch
        {
            "jpg" or "jpeg" or "png" or "gif" or "tiff" => EFileType.Image,
            "mp3" => EFileType.Audio,
            "mp4" => EFileType.Video,
            "zip" => EFileType.Archive,
            _ => null
        };
    }

    /// <summary>
    /// 根据定位器获取Content-Type
    /// </summary>
    private string GetContentTypeFromLocator(string locator)
    {
        var parts = locator.Split('+');
        if (parts.Length != 3) return "application/octet-stream";
        
        var extension = parts[2].ToLowerInvariant();
        
        return extension switch
        {
            "jpg" or "jpeg" => "image/jpeg",
            "png" => "image/png",
            "gif" => "image/gif",
            "tiff" => "image/tiff",
            "mp3" => "audio/mpeg",
            "mp4" => "video/mp4",
            "zip" => "application/zip",
            _ => "application/octet-stream"
        };
    }
}

/// <summary>
/// 文件上传请求模型
/// </summary>
public class FileUploadRequest
{
    /// <summary>
    /// 上传的文件
    /// </summary>
    public IFormFile File { get; set; } = null!;
    
    /// <summary>
    /// 文件扩展名
    /// </summary>
    public string FileExtension { get; set; } = null!;
}

/// <summary>
/// 文件上传响应模型
/// </summary>
public class FileUploadResponse : BasicResponse
{
    /// <summary>
    /// 文件定位器
    /// </summary>
    public string locator { get; set; } = null!;
    
    /// <summary>
    /// 文件大小（字节）
    /// </summary>
    public long fileSize { get; set; }
    
    /// <summary>
    /// 上传时间
    /// </summary>
    public DateTime uploadTime { get; set; }
}

/// <summary>
/// 文件信息响应模型
/// </summary>
public class FileInfoResponse : BasicResponse
{
    /// <summary>
    /// 文件定位器
    /// </summary>
    public string locator { get; set; } = null!;
    
    /// <summary>
    /// 文件类型
    /// </summary>
    public string fileType { get; set; } = null!;
    
    /// <summary>
    /// 文件扩展名
    /// </summary>
    public string fileExtension { get; set; } = null!;
    
    /// <summary>
    /// 原始文件名
    /// </summary>
    public string originalFileName { get; set; } = null!;
    
    /// <summary>
    /// 文件大小（字节）
    /// </summary>
    public long fileSize { get; set; }
    
    /// <summary>
    /// 上传时间
    /// </summary>
    public DateTime uploadTime { get; set; }
    
    /// <summary>
    /// 上传者ID
    /// </summary>
    public string uploaderId { get; set; } = null!;
    
    /// <summary>
    /// 文件MD5哈希值
    /// </summary>
    public string md5Hash { get; set; } = null!;
}