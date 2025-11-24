using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZenChattyServer.Net.Helpers;
using ZenChattyServer.Net.Helpers.Context;
using ZenChattyServer.Net.Models;
using ZenChattyServer.Net.Models.Enums;
using ZenChattyServer.Net.Models.Response;
using ZenChattyServer.Net.Services;

namespace ZenChattyServer.Net.Controllers;

[ApiController]
[Route("/api/file")]
public class FileController(
    FileStorageService fileStorageService,
    AuthService authService,
    ILogger<FileController> logger,
    UserRelatedContext context
    ) : AuthedControllerBase(authService)
{
    

    [HttpPost("upload")]
    [RequestSizeLimit(32 * 1024 * 1024)] // 32MB
    public async Task<ActionResult<FileUploadResponse>> UploadFile([FromForm] FileUploadRequest request)
    {
        var refer = await AuthenticateAsync();
        if (refer.failResult != null) return Unauthorized(refer.failResult);

        var tryGetExistingFile = await context.UserFiles.FirstOrDefaultAsync(f => f.Hash == request.ClientCalculatedSha256);
        
        if(tryGetExistingFile is not null) return Ok(new FileUploadResponse
        {
            success = true,
            content = "file already exist",
            locator = tryGetExistingFile.Locator,
            fileSize = tryGetExistingFile.FileSize,
            uploadTime = tryGetExistingFile.UploadTime
        }); // reuse
        
        if (request.File.Length == 0)
            return BadRequest(new BasicResponse { content = "File invalid", success = false });
        
        

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
                logger.LogInformation("文件上传进度: {BytesRead}/{TotalBytes} ({Percentage:F1}%)", 
                    report.bytesRead, report.totalBytes, percentage);
            });
            
            var result = await fileStorageService.UploadFileAsync(
                refer.user!.LocalId.ToString(),
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
        var refer = await AuthenticateAsync();
        if (refer.failResult != null) return Unauthorized(refer.failResult);
        
        try
        {
            var result = await fileStorageService.GetFileInfoAsync(locator);

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
                hash = result.userFile.Hash
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
        var refer = await AuthenticateAsync();
        if (refer.failResult != null) return Unauthorized(refer.failResult);

        try
        {
            var result = await fileStorageService.DownloadFileAsync(locator);

            if (!result.success || result.fileStream == null)
                return NotFound(new BasicResponse { content = result.message, success = false });

            Response.Headers.Append("Content-Disposition", $"attachment; filename=\"{result.fileName}\"");
            
            var contentType = GetContentTypeFromLocator(locator);
            
            return File(result.fileStream, contentType, result.fileName);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new BasicResponse { content = "File download failed", success = false });
        }
    }

    /// <summary>
    /// 删除文件 todo some of those apis should be only accessible to deployer
    /// </summary>
    [HttpDelete("delete/{locator}")]
    public async Task<ActionResult<BasicResponse>> DeleteFile(string locator)
    {
        var refer = await AuthenticateAsync();
        if (refer.failResult != null) return Unauthorized(refer.failResult);

        try
        {
            var result = await fileStorageService.DeleteFileAsync(locator, refer.user!.LocalId.ToString());

            if (!result.success)
                return BadRequest(new BasicResponse { content = result.message, success = false });

            return Ok(new BasicResponse { content = result.message, success = true });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new BasicResponse { content = "File deletion failed", success = false });
        }
    }
 
    private static EFileType? GetFileTypeFromExtension(string extension)
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

    private static string GetContentTypeFromLocator(string locator)
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
    public IFormFile File { get; set; } = null!;
    
    public string FileExtension { get; set; } = null!;

    public string ClientCalculatedSha256 { get; set; } = null!;
}

/// <summary>
/// 文件上传响应模型
/// </summary>
public class FileUploadResponse : BasicResponse
{

    public string locator { get; set; } = null!;
    
    public long fileSize { get; set; }

    public DateTime uploadTime { get; set; }
}

public class FileInfoResponse : BasicResponse // todo what happened here not using pascal case?
{
    public string locator { get; set; } = null!;
    public string fileType { get; set; } = null!;
    public string fileExtension { get; set; } = null!;
    public string originalFileName { get; set; } = null!;
    public long fileSize { get; set; }
    public DateTime uploadTime { get; set; }
    public string uploaderId { get; set; } = null!;
    public string hash { get; set; } = null!;
}