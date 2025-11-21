# 群聊管理API - 设置成员title功能测试指南

## 功能概述
已成功为群聊管理API添加了设置成员title的功能，该功能具有以下特点：

### 权限控制
- **仅群主**可以设置群成员的title
- 管理员和普通成员无法设置他人title
- 操作者可以设置自己的title（如果自己是群主）

### API端点
- **URL**: `POST /api/social/group/title`
- **请求体**: 使用现有的 `GroupManagementRequest` 模型
- **权限验证**: JWT Token验证 + 群主权限检查

## 请求参数

### GroupManagementRequest 模型
```json
{
  "GroupId": "群聊ID",
  "TargetUserId": "目标用户ID",
  "Reason": "操作原因（可选）",
  "Nickname": "title内容（在此API中用作title字段）"
}
```

## 使用示例

### 1. 设置成员title
```bash
POST /api/social/group/title
Authorization: Bearer {your_jwt_token}
Content-Type: application/json

{
  "GroupId": "group123",
  "TargetUserId": "user456",
  "Nickname": "技术总监",
  "Reason": "表彰技术贡献"
}
```

### 2. 取消成员title（设置为空）
```bash
POST /api/social/group/title
Authorization: Bearer {your_jwt_token}
Content-Type: application/json

{
  "GroupId": "group123",
  "TargetUserId": "user456",
  "Nickname": "",
  "Reason": "取消title"
}
```

## 响应示例

### 成功响应
```json
{
  "content": "成员title设置成功",
  "success": true
}
```

### 权限不足错误
```json
{
  "content": "只有群主可以设置成员title",
  "success": false
}
```

### 群聊不存在错误
```json
{
  "content": "群聊不存在",
  "success": false
}
```

## 实现细节

### 1. 服务层方法
在 `GroupManagementService` 中添加了：
- `SetMemberTitleAsync` - 核心业务逻辑方法
- `SendMemberTitleSetMessageAsync` - 发送操作通知消息

### 2. 权限验证
- 使用现有的 `ValidateGroupOperationAsync` 方法进行基础权限验证
- 新增群主权限检查：`CanManageMember` 方法确保只有群主可操作

### 3. 数据库操作
- 更新 `GroupChatMember` 实体的 `GivenTitle` 字段
- 自动保存到数据库

### 4. 事件通知
- 自动发送群聊事件消息，通知所有成员title变更
- 消息格式："用户 {targetId} 的title被设置为：{title}"

## 测试步骤

### 1. 准备测试数据
1. 创建群聊（群主：user1）
2. 添加成员（user2, user3）
3. 获取有效的JWT Token

### 2. 权限测试
1. 使用群主token设置成员title - 应成功
2. 使用管理员token设置成员title - 应失败
3. 使用普通成员token设置成员title - 应失败

### 3. 功能测试
1. 设置title为有效值
2. 设置title为空值（取消title）
3. 设置title为特殊字符
4. 验证数据库字段更新
5. 验证群聊事件消息发送

## 相关文件

### 已修改文件
1. `Services/GroupManagementService.cs` - 添加SetMemberTitleAsync方法
2. `Controllers/UserSocialController.cs` - 添加API端点

### 相关模型
1. `Models/GroupChatMember.cs` - 包含GivenTitle属性
2. `Models/Request/GroupManagementRequest.cs` - 请求模型

## 注意事项

1. **权限控制**: 确保只有群主可以调用此API
2. **数据验证**: title长度限制应与昵称保持一致
3. **事件通知**: 所有群成员都会收到title变更通知
4. **错误处理**: 完善的异常处理和错误消息返回

## 扩展建议

1. 可考虑添加title类型（如：职位、荣誉、自定义等）
2. 可添加title有效期设置
3. 可添加title颜色或样式配置

---

此功能已完整实现并集成到现有的群聊管理API中，可以立即投入使用。