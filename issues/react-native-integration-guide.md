# React Native 集成指南

## 概述

本文档详细说明如何在React Native项目中集成和使用 `zen-core-chatty-typescript` SDK。该SDK提供了完整的聊天功能，包括认证、用户管理、实时消息、群组管理等功能。

## 兼容性确认

### ✅ 完全兼容的特性

1. **ES模块支持** - 包使用ES模块格式，React Native完全支持
2. **TypeScript支持** - React Native有完整的TypeScript支持
3. **HTTP客户端** - 使用axios，React Native有fetch API和axios支持
4. **WebSocket支持** - SignalR客户端使用WebSocket，React Native支持

### 🔧 依赖分析

**SDK依赖：**
- `axios` - HTTP客户端 ✅ React Native兼容
- `@microsoft/signalr` - WebSocket实时通信 ✅ React Native兼容

**React Native项目依赖检查：**
```json
{
  "zen-core-chatty-typescript": "./../../zencore.chatty"
}
```

**确认结果：** ✅ 项目已正确配置SDK依赖

## 快速开始

### 1. 基本使用

```typescript
import ZenCoreChattyClient from 'zen-core-chatty-typescript';

// 初始化客户端
const client = new ZenCoreChattyClient('https://your-chat-server.com', 5637);

// 用户认证
const authResponse = await client.auth.login({
    username: 'user@example.com',
    password: 'password123'
});

// 设置认证令牌
client.setAuthToken(authResponse.token);

// 创建私聊
const chatResponse = await client.chat.createPrivateChat({
    targetUserId: 'user-uuid-here'
});

// 发送消息
const messageResponse = await client.message.sendMessage({
    chatId: chatResponse.chatId,
    content: 'Hello, world!',
    messageType: 'text'
});
```

### 2. React Native专用配置

```typescript
import ZenCoreChattyClient from 'zen-core-chatty-typescript';

// React Native专用配置
const client = new ZenCoreChattyClient(
  'https://your-server.com', 
  5637,
  30000 // 较长的超时时间，适应移动网络
);

// 在React Native中处理网络状态变化
import { NetInfo } from '@react-native-community/netinfo';

NetInfo.addEventListener(state => {
  if (state.isConnected) {
    // 网络恢复时重新连接
    client.reconnect();
  }
});
```

## 完整集成示例

### 聊天屏幕组件

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList } from 'react-native';
import ZenCoreChattyClient from 'zen-core-chatty-typescript';
import SignalRClient from 'zen-core-chatty-typescript/signalr-client';

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [client, setClient] = useState(null);
  const [signalR, setSignalR] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const initChat = async () => {
      try {
        const chatClient = new ZenCoreChattyClient('https://your-server.com');
        const signalRClient = new SignalRClient('https://your-server.com');
        
        // 登录
        const auth = await chatClient.auth.login({
          username: 'user@example.com',
          password: 'password123'
        });
        
        chatClient.setAuthToken(auth.token);
        await signalRClient.connect(auth.token);
        
        // 监听实时消息
        signalRClient.onMessageReceived((message) => {
          setMessages(prev => [...prev, message]);
        });
        
        // 监听连接状态
        signalRClient.onConnectionStatusChanged((status) => {
          setIsConnected(status === 'Connected');
        });
        
        setClient(chatClient);
        setSignalR(signalRClient);
        setIsConnected(true);
        
      } catch (error) {
        console.error('初始化聊天失败:', error);
      }
    };

    initChat();
    
    return () => {
      // 清理连接
      signalR?.disconnect();
    };
  }, []);

  const sendMessage = async () => {
    if (client && inputText.trim()) {
      try {
        await client.message.sendMessage({
          chatId: 'your-chat-id',
          content: inputText,
          messageType: 'text'
        });
        setInputText('');
      } catch (error) {
        console.error('发送消息失败:', error);
      }
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
        聊天室 {isConnected ? '🟢' : '🔴'}
      </Text>
      
      {/* 消息列表 */}
      <FlatList
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={{ padding: 8, backgroundColor: '#f0f0f0', marginBottom: 8, borderRadius: 8 }}>
            <Text>{item.content}</Text>
            <Text style={{ fontSize: 12, color: '#666' }}>
              {new Date(item.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        )}
        style={{ flex: 1, marginBottom: 16 }}
      />
      
      {/* 输入框 */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="输入消息..."
          style={{ 
            flex: 1, 
            borderWidth: 1, 
            borderColor: '#ccc', 
            padding: 12, 
            borderRadius: 8,
            marginRight: 8
          }}
        />
        <Button 
          title="发送" 
          onPress={sendMessage} 
          disabled={!isConnected || !inputText.trim()}
        />
      </View>
    </View>
  );
};

export default ChatScreen;
```

### 用户认证组件

```typescript
import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import ZenCoreChattyClient from 'zen-core-chatty-typescript';

const LoginScreen = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('错误', '请输入用户名和密码');
      return;
    }

    setIsLoading(true);
    
    try {
      const client = new ZenCoreChattyClient('https://your-server.com');
      const authResponse = await client.auth.login({
        username,
        password
      });
      
      client.setAuthToken(authResponse.token);
      onLoginSuccess(client, authResponse);
      
    } catch (error) {
      Alert.alert('登录失败', error.response?.data?.message || '网络错误');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 40 }}>
        登录
      </Text>
      
      <TextInput
        placeholder="用户名或邮箱"
        value={username}
        onChangeText={setUsername}
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 12,
          borderRadius: 8,
          marginBottom: 16
        }}
      />
      
      <TextInput
        placeholder="密码"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 12,
          borderRadius: 8,
          marginBottom: 24
        }}
      />
      
      <Button 
        title={isLoading ? "登录中..." : "登录"} 
        onPress={handleLogin} 
        disabled={isLoading}
      />
    </View>
  );
};

export default LoginScreen;
```

## 移动端优化建议

### 1. 网络优化配置

```typescript
// 移动端网络优化
const mobileOptimizedClient = new ZenCoreChattyClient(
  'https://your-server.com',
  5637,
  30000, // 长超时
  {
    retryCount: 3, // 重试次数
    retryDelay: 1000 // 重试延迟
  }
);
```

### 2. 离线消息处理

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// 离线消息处理
const handleOfflineMessage = async (message) => {
  // 保存到本地存储
  const pendingMessages = await AsyncStorage.getItem('pending_messages');
  const messages = pendingMessages ? JSON.parse(pendingMessages) : [];
  
  messages.push({
    ...message, 
    timestamp: Date.now(),
    id: Date.now().toString()
  });
  
  await AsyncStorage.setItem('pending_messages', JSON.stringify(messages));
};

// 网络恢复后发送离线消息
const sendPendingMessages = async (client) => {
  try {
    const pendingMessages = await AsyncStorage.getItem('pending_messages');
    if (pendingMessages) {
      const messages = JSON.parse(pendingMessages);
      
      for (const msg of messages) {
        await client.message.sendMessage(msg);
      }
      
      await AsyncStorage.removeItem('pending_messages');
    }
  } catch (error) {
    console.error('发送离线消息失败:', error);
  }
};
```

### 3. 后台连接管理

```typescript
import { AppState } from 'react-native';

// 应用状态变化处理
useEffect(() => {
  const handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'background') {
      // 应用进入后台，断开连接
      signalR?.disconnect();
    } else if (nextAppState === 'active') {
      // 应用回到前台，重新连接
      signalR?.connect(client.getAuthToken());
    }
  };

  const subscription = AppState.addEventListener('change', handleAppStateChange);
  
  return () => {
    subscription.remove();
  };
}, [signalR, client]);
```

## 状态管理集成

### 使用Zustand进行状态管理

```typescript
import { create } from 'zustand';
import ZenCoreChattyClient from 'zen-core-chatty-typescript';

const useChatStore = create((set, get) => ({
  client: null,
  signalR: null,
  messages: [],
  isConnected: false,
  currentChat: null,
  
  // 初始化聊天客户端
  initializeClient: async (serverUrl, authToken) => {
    const client = new ZenCoreChattyClient(serverUrl);
    const signalR = new SignalRClient(serverUrl);
    
    client.setAuthToken(authToken);
    await signalR.connect(authToken);
    
    set({ client, signalR, isConnected: true });
  },
  
  // 发送消息
  sendMessage: async (content, chatId) => {
    const { client } = get();
    if (!client) return;
    
    try {
      await client.message.sendMessage({
        chatId,
        content,
        messageType: 'text'
      });
    } catch (error) {
      console.error('发送消息失败:', error);
    }
  },
  
  // 添加接收到的消息
  addMessage: (message) => {
    set(state => ({
      messages: [...state.messages, message]
    }));
  },
  
  // 断开连接
  disconnect: () => {
    const { signalR } = get();
    signalR?.disconnect();
    set({ isConnected: false });
  }
}));

export default useChatStore;
```

## 错误处理最佳实践

### 1. 网络错误处理

```typescript
const handleApiError = (error) => {
  if (error.response) {
    // 服务器返回错误
    switch (error.response.status) {
      case 401:
        // 认证失败，跳转到登录页
        navigation.navigate('Login');
        break;
      case 403:
        Alert.alert('权限不足', '您没有权限执行此操作');
        break;
      case 404:
        Alert.alert('资源不存在', '请求的资源不存在');
        break;
      default:
        Alert.alert('服务器错误', '请稍后重试');
    }
  } else if (error.request) {
    // 网络错误
    Alert.alert('网络错误', '请检查网络连接');
  } else {
    // 其他错误
    Alert.alert('错误', '发生未知错误');
  }
};
```

### 2. 重试机制

```typescript
const retryApiCall = async (apiCall, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

// 使用示例
const sendMessageWithRetry = async (message) => {
  return await retryApiCall(
    () => client.message.sendMessage(message),
    3,
    1000
  );
};
```

## 性能优化建议

### 1. 消息列表优化

```typescript
// 使用FlatList虚拟化长列表
<FlatList
  data={messages}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <MessageItem message={item} />}
  initialNumToRender={20}
  maxToRenderPerBatch={10}
  windowSize={21}
  removeClippedSubviews={true}
/>
```

### 2. 图片加载优化

```typescript
import FastImage from 'react-native-fast-image';

// 使用FastImage优化图片加载
<FastImage
  style={{ width: 50, height: 50 }}
  source={{
    uri: 'https://your-server.com/files/avatar.jpg',
    priority: FastImage.priority.normal,
  }}
  resizeMode={FastImage.resizeMode.contain}
/>
```

## 测试策略

### 1. 单元测试示例

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import useChatStore from './useChatStore';

// Mock SDK
jest.mock('zen-core-chatty-typescript', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    auth: {
      login: jest.fn().mockResolvedValue({ token: 'mock-token' })
    },
    setAuthToken: jest.fn(),
    message: {
      sendMessage: jest.fn().mockResolvedValue({})
    }
  }))
}));

describe('useChatStore', () => {
  it('should initialize client successfully', async () => {
    const { result } = renderHook(() => useChatStore());
    
    await act(async () => {
      await result.current.initializeClient('https://test.com', 'token');
    });
    
    expect(result.current.isConnected).toBe(true);
  });
});
```

## 部署注意事项

### 1. 生产环境配置

```typescript
// 生产环境配置
const getApiConfig = () => {
  if (__DEV__) {
    return {
      baseUrl: 'https://dev.your-server.com',
      port: 5637
    };
  } else {
    return {
      baseUrl: 'https://prod.your-server.com',
      port: 5637
    };
  }
};

const config = getApiConfig();
const client = new ZenCoreChattyClient(config.baseUrl, config.port);
```

### 2. 安全考虑

- 使用HTTPS加密通信
- 定期刷新认证令牌
- 实现安全的本地存储
- 使用适当的权限控制

## 故障排除

### 常见问题

1. **连接失败**
   - 检查网络连接
   - 验证服务器地址和端口
   - 检查防火墙设置

2. **认证错误**
   - 验证用户名和密码
   - 检查令牌有效期
   - 重新登录获取新令牌

3. **实时消息不接收**
   - 检查SignalR连接状态
   - 验证事件监听器
   - 检查网络连接

## 总结

`zen-core-chatty-typescript` SDK完全兼容React Native环境，提供了完整的聊天功能集成方案。通过遵循本文档的最佳实践，您可以快速构建功能丰富、性能优异的移动聊天应用。

**关键优势：**
- ✅ 完全TypeScript支持
- ✅ 实时消息功能
- ✅ 移动端优化
- ✅ 完善的错误处理
- ✅ 易于集成和维护

如需进一步帮助，请参考SDK的完整文档或联系开发团队。