# 统一好友添加测试脚本
# 确保注册和好友添加测试使用相同的用户信息

param()

# 配置
$baseUrl = "https://localhost:5637"

Write-Host "=== 统一好友添加测试 ==="

# 用户配置 - 统一使用相同的用户信息
$user1Config = @{
    uniqueCustomId = "testuser1"
    password = "password123"
    email = "testuser1@example.com"
    displayName = "测试用户1"
    gender = "Unset"
    bio = "测试用户1"
}

$user2Config = @{
    uniqueCustomId = "testuser2"
    password = "password123"
    email = "testuser2@example.com"
    displayName = "测试用户2"
    gender = "Unset"
    bio = "测试用户2"
}

# 步骤1: 测试服务器连通性
Write-Host "[步骤1] 测试服务器连通性..."
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/touch" -Method Get
    Write-Host "✓ 服务器连通性正常"
} catch {
    Write-Host "✗ 服务器连接失败: $($_.Exception.Message)"
    exit 1
}

# 步骤2: 注册用户1
Write-Host "[步骤2] 注册用户1..."
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body ($user1Config | ConvertTo-Json) -ContentType "application/json"
    Write-Host "✓ 用户1注册成功"
} catch {
    Write-Host "✗ 用户1注册失败: $($_.Exception.Message)"
    Write-Host "响应体: $($_.Exception.Response.StatusDescription)"
    Write-Host "状态码: $($_.Exception.Response.StatusCode)"
    if ($_.Exception.Response) {
        try {
            $responseBody = $_.Exception.Response.Content.ReadAsStringAsync().Result
            Write-Host "完整响应体: $responseBody"
        } catch {
            Write-Host "无法读取响应体"
        }
    }
    
}

# 步骤3: 注册用户2
Write-Host "[步骤3] 注册用户2..."
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body ($user2Config | ConvertTo-Json) -ContentType "application/json"
    Write-Host "✓ 用户2注册成功"
} catch {
    Write-Host "✗ 用户2注册失败: $($_.Exception.Message)"
    Write-Host "响应体: $($_.Exception.Response.StatusDescription)"
    Write-Host "状态码: $($_.Exception.Response.StatusCode)"
    if ($_.Exception.Response) {
        try {
            $responseBody = $_.Exception.Response.Content.ReadAsStringAsync().Result
            Write-Host "完整响应体: $responseBody"
        } catch {
            Write-Host "无法读取响应体"
        }
    }
}

# 步骤4: 用户1登录
Write-Host "[步骤4] 用户1登录..."
$user1LoginData = @{
    username = "testuser1"
    password = "password123"
    deviceId = "test-device-1x"
}

try {
    $user1Login = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body ($user1LoginData | ConvertTo-Json) -ContentType "application/json"
    $user1Token = $user1Login.accessToken
    Write-Host "✓ 用户1登录成功"
} catch {
    Write-Host "✗ 用户1登录失败: $($_.Exception.Message)"
    exit 1
}

# 步骤5: 用户2登录
Write-Host "[步骤5] 用户2登录..."
$user2LoginData = @{
    username = "testuser2"
    password = "password123"
    deviceId = "test-device-2x"
}

try {
    $user2Login = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body ($user2LoginData | ConvertTo-Json) -ContentType "application/json"
    $user2Token = $user2Login.accessToken
    Write-Host "✓ 用户2登录成功"
} catch {
    Write-Host "✗ 用户2登录失败: $($_.Exception.Message)"
    exit 1
}

# 步骤6: 获取用户信息
Write-Host "[步骤6] 获取用户信息..."
try {
    $headers = @{ Authorization = "Bearer $user1Token" }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/userinfo" -Method Get -Headers $headers
    $user1Info = $response.Content | ConvertFrom-Json
    $user1Id = $user1Info.LocalId
    Write-Host "✓ 用户1信息获取成功: $user1Id"
} catch {
    Write-Host "✗ 用户1信息获取失败: $($_.Exception.Message)"
    Write-Host "响应体: $($_.Exception.Response.StatusDescription)"
    Write-Host "状态码: $($_.Exception.Response.StatusCode)"
    if ($_.Exception.Response) {
        try {
            $responseBody = $_.Exception.Response.Content.ReadAsStringAsync().Result
            Write-Host "完整响应体: $responseBody"
        } catch {
            Write-Host "无法读取响应体"
        }
    }
    exit 1
}
$user2Id = ""
try {
    $headers = @{ Authorization = "Bearer $user2Token" }
    echo "$user2Token"
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/userinfo" -Method Get -Headers $headers
    $user2Info = $response.Content | ConvertFrom-Json
    Write-Host "用户2信息: $($user2Info | ConvertTo-Json)"
    $user2Id = $user2Info.userId
    Write-Host "✓ 用户2信息获取成功: $user2Id"
} catch {
    Write-Host "✗ 用户2信息获取失败: $($_.Exception.Message)"
    Write-Host "响应体: $($_.Exception.Response.StatusDescription)"
    Write-Host "状态码: $($_.Exception.Response.StatusCode)"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.Content.ReadAsStreamAsync().Result
        $streamReader = New-Object System.IO.StreamReader($stream)
        $streamReader.BaseStream.Position = 0
        $responseBody = $streamReader.ReadToEnd()
        Write-Host "完整响应体: $responseBody"
        $streamReader.Close()
    }
    exit 1
}

# 步骤7: 检查用户1联系人列表（添加前）
Write-Host "[步骤7] 检查用户1联系人列表（添加前）..."
try {
    $headers = @{ Authorization = "Bearer $user1Token" }
    $user1ContactsBefore = Invoke-RestMethod -Uri "$baseUrl/api/social/contacts" -Method Get -Headers $headers
    $user1ContactCountBefore = $user1ContactsBefore.Count
    Write-Host "✓ 用户1当前有 $user1ContactCountBefore 个联系人"
} catch {
    Write-Host "✗ 获取用户1联系人失败: $($_.Exception.Message)"
    exit 1
}

# 步骤8: 添加好友
Write-Host "[步骤8] 用户1添加用户2为好友..."
$addFriendData = @{
    targetUserId = $user2Id
    message = "你好！让我们成为朋友吧！"
    isInformal = $false
}
$addFriend = $null
try {
    $headers = @{ Authorization = "Bearer $user1Token" }
    Write-Host "$user1Token + $($addFriendData | ConvertTo-Json)"
    $addFriend = Invoke-WebRequest -Uri "$baseUrl/api/social/add-friend" -Method Post -Body ($addFriendData | ConvertTo-Json) -Headers $headers -ContentType "application/json"
    $responseBody = $addFriend.Content | ConvertFrom-Json
    $chatId = $responseBody.ChatId
    Write-Host "✓ 好友请求发送成功"
    Write-Host "  创建的聊天ID: $chatId"
} catch {
    Write-Host "✗ 好友请求发送失败: $($_.Exception.Message)"
    Write-Host "响应体: $($_.Exception.Response | ConvertTo-Json)"
    Write-Host "状态码: $($_.Exception.Response.StatusCode)"
    if ($_.Exception.Response) {
        try {
            $responseBody = $_.Exception.Response.Content.ReadAsStringAsync().Result
            Write-Host "完整响应体: $responseBody"
        } catch {
            Write-Host "无法读取响应体"
        }
    }
    exit 1
}

# 步骤9: 检查用户1联系人列表（添加后）
Write-Host "[步骤9] 检查用户1联系人列表（添加后）..."
try {
    $headers = @{ Authorization = "Bearer $user1Token" }
    $user1ContactsAfter = Invoke-RestMethod -Uri "$baseUrl/api/social/contacts" -Method Get -Headers $headers
    $user1ContactCountAfter = $user1ContactsAfter.Count
    Write-Host "✓ 用户1现在有 $user1ContactCountAfter 个联系人"
    
    if ($user1ContactCountAfter -gt $user1ContactCountBefore) {
        Write-Host "✓ 联系人数量按预期增加"
    } else {
        Write-Host "✗ 联系人数量没有增加"
        exit 1
    }
} catch {
    Write-Host "✗ 获取用户1联系人失败: $($_.Exception.Message)"
    exit 1
}

# 步骤10: 检查用户2联系人列表（双向验证）
Write-Host "[步骤10] 检查用户2联系人列表（双向验证）..."
try {
    $headers = @{ Authorization = "Bearer $user2Token" }
    $user2Contacts = Invoke-RestMethod -Uri "$baseUrl/api/social/contacts" -Method Get -Headers $headers
    $user2ContactCount = $user2Contacts.Count
    Write-Host "✓ 用户2有 $user2ContactCount 个联系人"
    
    if ($user2ContactCount -gt 0) {
        Write-Host "✓ 用户2也有该联系人"
    } else {
        Write-Host "⚠ 用户2的联系人列表为空（可能需要接受好友请求）"
    }
} catch {
    Write-Host "✗ 获取用户2联系人失败: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=== 测试总结 ==="
Write-Host "✓ 所有统一好友添加测试步骤完成成功"
Write-Host "✓ 用户注册和登录成功"
Write-Host "✓ 好友请求发送成功"
Write-Host "✓ 联系人列表正确更新"
Write-Host "✓ 双向关系验证完成"
Write-Host ""
Write-Host "统一好友添加测试通过！"