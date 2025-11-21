using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ZenChattyServer.Net.Models.Enums;

namespace ZenChattyServer.Net.Models;

[Table("UserFiles")]
public class UserFile
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public EFileType FileType { get; set; }
    
    [Required]
    [MaxLength(10)]
    public string FileExtension { get; set; } = null!;
    
    [Required]
    [MaxLength(50)]
    public string Locator { get; set; } = null!;
    
    [Required]
    [MaxLength(255)]
    public string OriginalFileName { get; set; } = null!;
    
    [Required]
    public Guid UploaderId { get; set; }
    
    [Required]
    public DateTime UploadTime { get; set; }
    
    [Required]
    public long FileSize { get; set; }
    
    [Required]
    [MaxLength(32)]
    public string Md5Hash { get; set; } = null!;
    
    [Required]
    [MaxLength(500)]
    public string StoragePath { get; set; } = null!;
    
    // 导航属性
    public virtual User Uploader { get; set; } = null!;
    
    public UserFile() { }
    
    public UserFile(EFileType fileType, string fileExtension, string locator, string originalFileName, Guid uploaderId, long fileSize, string md5Hash, string storagePath)
    {
        FileType = fileType;
        FileExtension = fileExtension;
        Locator = locator;
        OriginalFileName = originalFileName;
        UploaderId = uploaderId;
        UploadTime = DateTime.UtcNow;
        FileSize = fileSize;
        Md5Hash = md5Hash;
        StoragePath = storagePath;
    }
}