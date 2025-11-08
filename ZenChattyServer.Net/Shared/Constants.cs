using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace ZenChattyServer.Net.Shared;

public class Constants
{
    public const string DbName = "ChattyServer";
    public static string Connection
        = $@"Server=localhost\MSSQL,1433;Database={Constants.DbName};ConnectRetryCount=0;";


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