# 检查数据库中的用户
$baseUrl = "http://localhost:5637"

# 尝试直接查询用户信息（如果API支持）
Write-Host "尝试查询用户信息..."

# 先尝试注册一个新用户来测试注册功能
Write-Host "注册测试用户..."
$registerRequest = @{
    username = "testuser3"
    password = "password123"
    email = "test3@example.com"
    displayName = "Test User 3"
}

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body ($registerRequest | ConvertTo-Json) -ContentType "application/json"
    Write-Host "注册成功: $($response.message)"
} catch {
    Write-Host "注册失败: $($_.Exception.Message)"
    Write-Host "响应详情: $($_.ErrorDetails.Message)"
}

# 然后尝试登录新用户
Write-Host "登录新用户..."
$loginRequest = @{
    username = "testuser3"
    password = "password123"
    deviceId = "test-device-3"
}

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body ($loginRequest | ConvertTo-Json) -ContentType "application/json"
    Write-Host "登录成功: $($response.accessToken)"
} catch {
    Write-Host "登录失败: $($_.Exception.Message)"
    Write-Host "响应详情: $($_.ErrorDetails.Message)"
}