using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using ZenChattyServer.Net.Models;

namespace ZenChattyServer.Net.Shared;

public class Constants
{
    public const string DbName = "ChattyServer";
    public static string Connection
        = $"""Server=localhost\\MSSQL,1433;Database={Constants.DbName};TrustServerCertificate=true;ConnectRetryCount=0;""";

    public static User? SystemUser = null;

    public static Message CreateWelcomeMessage(User user, Chat target)
    {
        return new Message
        {
            Content = $"Welcome, {user.DisplayName}! You can update all your personal settings later.",
            Info = user.DisplayName,
            IsAnnouncement = false,
            Sender = SystemUser!,
            IsCanceled = false,
            IsMentioningAll = false,
            OfChatId = target.UniqueMark
        };
    }

    public static void Initialize(string dbPass, ushort dbPort = 1433, string dbLocation = "localhost", string dbUserName = "sa", bool needTrustCert = true, bool useWindowsAuth = false)
    {
        var connectionStringBuilder = new SqlConnectionStringBuilder
        {
            DataSource = $"{dbLocation},{dbPort}",
            InitialCatalog = DbName,
            IntegratedSecurity = useWindowsAuth,
            TrustServerCertificate = needTrustCert,
            MultipleActiveResultSets = true,
            UserID = dbUserName,
            Password = dbPass,
            ApplicationName = "ZenChattyServer.Net",
            Pooling = true,
            MaxPoolSize = 100
            
        };
        Connection = connectionStringBuilder.ConnectionString;
    }
}
