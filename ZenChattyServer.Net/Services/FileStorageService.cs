using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using ZenChattyServer.Net.Helpers.Context;
using ZenChattyServer.Net.Models;
using ZenChattyServer.Net.Models.Enums;

namespace ZenChattyServer.Net.Services;

public class FileStorageService
{
    private readonly UserRelatedContext _context;
    private readonly ILogger<FileStorageService> _logger;
    private readonly FileStorageOptions _options;
    private readonly string _baseStoragePath;

    public FileStorageService(UserRelatedContext context, ILogger<FileStorageService> logger, 
        IOptions<FileStorageOptions> options)
    {
        _context = context;
        _logger = logger;
        _options = options.Value;
        _baseStoragePath = Path.Combine(Directory.GetCurrentDirectory(), _options.StoragePath);
        
        // 确保存储目录存在
        if (!Directory.Exists(_baseStoragePath))
        {
            Directory.CreateDirectory(_baseStoragePath);
        }
    }

    /// <summary>
    /// 生成文件定位器
    /// </summary>
    public string GenerateFileLocator(EFileType fileType, string fileExtension)
    {
        // 生成32字符的随机字符串（A-Za-z0-9，包含特殊符号-_）
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
        var random = new Random();
        var randomPart = new string(Enumerable.Repeat(chars, 32)
            .Select(s => s[random.Next(s.Length)]).ToArray());
        
        return $"{fileType}+{randomPart}+{fileExtension}";
    }

    /// <summary>
    /// 获取文件存储路径（使用前2字母分目录）
    /// </summary>
    public string GetStoragePath(string locator)
    {
        // 提取随机部分的前2个字符作为目录名
        var parts = locator.Split('+');
        if (parts.Length != 3) 
            throw new ArgumentException("无效的文件定位器格式");
        
        var randomPart = parts[1];
        if (randomPart.Length < 2)
            throw new ArgumentException("文件定位器随机部分长度不足");
        
        var directoryName = randomPart.Substring(0, 2);
        var directoryPath = Path.Combine(_baseStoragePath, directoryName);
        
        // 确保目录存在
        if (!Directory.Exists(directoryPath))
        {
            Directory.CreateDirectory(directoryPath);
        }
        
        return Path.Combine(directoryPath, locator);
    }

    /// <summary>
    /// 计算文件的MD5哈希值
    /// </summary>
    public static async Task<string> CalculateFileHashAsync(string filePath)
    {
        using var sha256 = SHA256.Create();
        await using var stream = File.OpenRead(filePath);
        var hashBytes = await sha256.ComputeHashAsync(stream);
        return BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
    }

    /// <summary>
    /// 上传文件
    /// </summary>
    public async Task<(bool success, UserFile? userFile, string message)> UploadFileAsync(
        string uploaderId, Stream fileStream, string fileName, EFileType fileType, string fileExtension,
        IProgress<(long bytesRead, long totalBytes)>? progress = null)
    {
        try
        {
            // 验证文件类型
            if (!IsValidFileType(fileType, fileExtension))
                return (false, null, "不支持的文件类型");

            // 生成文件定位器
            var locator = GenerateFileLocator(fileType, fileExtension);
            var storagePath = GetStoragePath(locator);

            // 检查文件是否已存在
            if (File.Exists(storagePath))
                return (false, null, "文件已存在，请重试");

            // 保存文件到磁盘（带进度报告）
            await using var file = File.Create(storagePath);
            var buffer = new byte[81920]; // 80KB buffer
            long totalBytesRead = 0;
            int bytesRead;
            
            while ((bytesRead = await fileStream.ReadAsync(buffer)) > 0)
            {
                await file.WriteAsync(buffer.AsMemory(0, bytesRead));
                totalBytesRead += bytesRead;
                progress?.Report((totalBytesRead, fileStream.Length));
            }

            // 获取文件信息
            var fileInfo = new FileInfo(storagePath);
            
            // 验证文件大小
            if (fileInfo.Length > _options.MaxFileSizeBytes)
            {
                File.Delete(storagePath); // 删除超大的文件
                return (false, null, "文件大小超过限制");
            }

            var hash = await CalculateFileHashAsync(storagePath);

            var userFile = new UserFile
            {
                FileType = fileType,
                FileExtension = fileExtension,
                Locator = locator,
                OriginalFileName = fileName,
                UploaderId = Guid.Parse(uploaderId),
                UploadTime = DateTime.UtcNow,
                FileSize = fileInfo.Length,
                Hash = hash,
                StoragePath = storagePath
            };

            _context.UserFiles.Add(userFile);
            await _context.SaveChangesAsync();

            return (true, userFile, "文件上传成功");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "文件上传失败");
            
            // 清理可能已创建的文件
            var storagePath = GetStoragePath(GenerateFileLocator(fileType, fileExtension));
            if (File.Exists(storagePath))
            {
                try
                {
                    File.Delete(storagePath);
                    _logger.LogInformation("已清理上传失败的文件: {FilePath}", storagePath);
                }
                catch (Exception deleteEx)
                {
                    _logger.LogWarning(deleteEx, "清理上传失败文件时出错: {FilePath}", storagePath);
                }
            }
            
            return (false, null, "文件上传失败");
        }
    }
    
    public async Task<(bool success, UserFile? userFile, string message)> GetFileInfoAsync(string locator)
    {
        try
        {
            var userFile = await _context.UserFiles
                .FirstOrDefaultAsync(uf => uf.Locator == locator);

            return userFile == null ? (false, null, "文件不存在") : (true, userFile, "文件信息获取成功");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取文件信息失败");
            return (false, null, "获取文件信息失败");
        }
    }

    /// <summary>
    /// 下载文件
    /// </summary>
    public async Task<(bool success, FileStream? fileStream, string message, string fileName, EFileType? fileType)> DownloadFileAsync(string locator)
    {
        try
        {
            var userFile = await _context.UserFiles
                .FirstOrDefaultAsync(uf => uf.Locator == locator);

            if (userFile == null)
                return (false, null, "文件不存在", "", null);

            if (!File.Exists(userFile.StoragePath))
                return (false, null, "文件不存在于磁盘", "", null);

            var fileStream = File.OpenRead(userFile.StoragePath);
            var fileName = $"{userFile.OriginalFileName}";

            return (true, fileStream, "文件下载成功", fileName, userFile.FileType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "文件下载失败");
            return (false, null, "文件下载失败", "", null);
        }
    }

    /// <summary>
    /// 验证文件类型是否支持
    /// </summary>
    private bool IsValidFileType(EFileType fileType, string fileExtension)
    {
        var validTypes = new Dictionary<EFileType, string[]>
        {
            { EFileType.Image, new[] { "jpg", "jpeg", "png", "gif", "tiff" } },
            { EFileType.Audio, new[] { "mp3" } },
            { EFileType.Video, new[] { "mp4" } },
            { EFileType.Archive, new[] { "zip" } }
        };

        return validTypes.ContainsKey(fileType) && 
               validTypes[fileType].Contains(fileExtension.ToLowerInvariant());
    }

    /// <summary>
    /// 删除文件
    /// </summary>
    public async Task<(bool success, string message)> DeleteFileAsync(string locator, string userId)
    {
        try
        {
            var userFile = await _context.UserFiles
                .FirstOrDefaultAsync(uf => uf.Locator == locator && uf.UploaderId.ToString() == userId);

            if (userFile == null)
                return (false, "文件不存在或无权删除");

            // 删除磁盘文件
            if (File.Exists(userFile.StoragePath))
            {
                File.Delete(userFile.StoragePath);
            }

            // 删除数据库记录
            _context.UserFiles.Remove(userFile);
            await _context.SaveChangesAsync();

            return (true, "文件删除成功");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "文件删除失败");
            return (false, "文件删除失败");
        }
    }
}

/// <summary>
/// 文件存储配置选项
/// </summary>
public class FileStorageOptions
{
    public string StoragePath { get; set; } = "UploadedFiles";
    public long MaxFileSizeBytes { get; set; } = 128 * 1024 * 1024; // 128MB
}