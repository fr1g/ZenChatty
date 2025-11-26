# ZenCore Chatty TypeScript SDK

A comprehensive TypeScript SDK for the ZenChatty chat application, providing full API coverage for authentication, user management, messaging, group management, file operations, and real-time communication.

## Features

- **Authentication & User Management**: Complete user authentication, registration, token management
- **Real-time Messaging**: WebSocket-based real-time chat with SignalR integration
- **Group Management**: Full group chat functionality with member management, settings, and announcements
- **File Operations**: File upload and management capabilities
- **Privacy Settings**: User privacy configuration and management
- **Contact Management**: Friend list and contact operations
- **TypeScript First**: Fully typed API with excellent IntelliSense support
- **Modular Architecture**: Import only what you need with tree-shaking support

## Installation

```bash
npm install zen-core-chatty-typescript
```

## Quick Start

### Basic Usage

```typescript
import ZenCoreChattyClient from 'zen-core-chatty-typescript';

// Initialize the client
const client = new ZenCoreChattyClient('https://your-chat-server.com', 5637);

// User authentication
const authResponse = await client.auth.login({
    username: 'user@example.com',
    password: 'password123'
});

// Set authentication token
client.setAuthToken(authResponse.token);

// Create a private chat
const chatResponse = await client.chat.createPrivateChat({
    targetUserId: 'user-uuid-here'
});

// Send a message
const messageResponse = await client.message.sendMessage({
    chatId: chatResponse.chatId,
    content: 'Hello, world!',
    messageType: 'text'
});
```

### Real-time Chat with SignalR

```typescript
import SignalRClient from 'zen-core-chatty-typescript/signalr-client';

// Initialize SignalR client for real-time communication
const signalRClient = new SignalRClient('https://your-chat-server.com');

// Connect to the hub
await signalRClient.connect(authResponse.token);

// Listen for incoming messages
signalRClient.onMessageReceived((message) => {
    console.log('New message:', message);
});

// Send real-time message
await signalRClient.sendMessage({
    chatId: 'chat-uuid',
    content: 'Hello from real-time!',
    messageType: 'text'
});
```

## API Reference

### Core Client

```typescript
import { ZenCoreChattyClient } from 'zen-core-chatty-typescript';

const client = new ZenCoreChattyClient(baseURL?: string, port?: number, timeout?: number);
```

### Authentication API

```typescript
// Login
await client.auth.login(request: LoginRequest): Promise<AuthResponse>

// Register
await client.auth.register(request: RegisterRequest): Promise<BasicResponse>

// Refresh token
await client.auth.refreshToken(request: RefreshTokenRequest): Promise<AuthResponse>

// Logout
await client.auth.logout(): Promise<BasicResponse>

// Validate token
await client.auth.validateToken(): Promise<BasicResponse>

// Get user info
await client.auth.getUserInfo(): Promise<UserInfo>
```

### User API

```typescript
// Get user information
await client.user.getUserInfo(request: UserInfoQueryRequest): Promise<UserInfoResponse>

// Check if user is disabled
await client.user.isUserDisabled(targetUserId: string): Promise<boolean>

// Block/unblock users
await client.user.blockUser(targetUserId: string): Promise<BasicResponse>
await client.user.unblockAndAddFriend(targetUserId: string): Promise<BasicResponse>

// Friend management
await client.user.addFriend(targetUserGuid: string): Promise<BasicResponse>
await client.user.checkBlockStatus(targetUserId: string): Promise<BasicResponse>

// Privacy settings
await client.user.updatePrivacySettings(settings: PrivacySettings): Promise<BasicResponse>
await client.user.getPrivacySettings(): Promise<PrivacySettingsResponse>

// Contact management
await client.user.getContacts(): Promise<Contact[]>
await client.user.updateUnreadCount(contactId: string, unreadCount: number): Promise<BasicResponse>
```

### Chat API

```typescript
// Create private chat
await client.chat.createPrivateChat(request: CreatePrivateChatRequest): Promise<ChatResponse>
```

### Message API

```typescript
// Send messages
await client.message.sendMessage(request: SendMessageRequest): Promise<SendMessageResponse>

// Get message history
await client.message.getMessageHistory(chatId: string, page?: number, pageSize?: number): Promise<Message[]>

// Message operations
await client.message.recallMessage(messageId: string): Promise<BasicResponse>
await client.message.editMessage(messageId: string, newContent: string): Promise<BasicResponse>
await client.message.deleteMessage(messageId: string): Promise<BasicResponse>

// Search messages
await client.message.searchMessages(query: string, chatId?: string): Promise<Message[]>
```

### Group API

```typescript
// Group creation and management
await client.group.createGroupChat(request: CreateGroupChatRequest): Promise<ChatResponse>
await client.group.leaveGroup(groupId: string): Promise<BasicResponse>

// Group settings
await client.group.updateGroupSettings(request: UpdateGroupSettingsRequest): Promise<BasicResponse>
await client.group.toggleSilentAll(groupId: string, isSilent?: boolean, reason?: string): Promise<BasicResponse>

// Member management
await client.group.setGroupAdmin(request: GroupManagementRequest, isAdmin?: boolean): Promise<BasicResponse>
await client.group.setMemberSilent(request: GroupManagementRequest, isSilent?: boolean): Promise<BasicResponse>
await client.group.removeGroupMember(request: GroupManagementRequest): Promise<BasicResponse>
await client.group.setMemberNickname(request: GroupManagementRequest): Promise<BasicResponse>
await client.group.inviteMember(request: GroupManagementRequest): Promise<BasicResponse>

// Announcements
await client.group.markMessageAsAnnouncement(messageId: string): Promise<BasicResponse>
await client.group.unmarkAnnouncement(messageId: string): Promise<BasicResponse>
await client.group.getGroupAnnouncements(groupId: string, page?: number, pageSize?: number): Promise<Message[]>

// Invite links
await client.group.createInviteLink(request: GroupInviteLinkRequest): Promise<GroupInviteLink>
await client.group.consumeInviteLink(inviteCode: string): Promise<BasicResponse>
await client.group.getInviteLinks(groupId: string): Promise<GroupInviteLink[]>
await client.group.deleteInviteLink(inviteCode: string): Promise<BasicResponse>

// Group status
await client.group.disableGroup(groupId: string): Promise<BasicResponse>
await client.group.enableGroup(groupId: string): Promise<BasicResponse>
```

### File API

```typescript
// File upload
await client.file.uploadFile(file: File, chatId?: string): Promise<FileUploadResponse>

// File operations
await client.file.getFileInfo(fileId: string): Promise<FileInfo>
await client.file.deleteFile(fileId: string): Promise<BasicResponse>
```

### Privacy API

```typescript
// Privacy settings
await client.privacy.updatePrivacySettings(settings: PrivacySettings): Promise<BasicResponse>
await client.privacy.getPrivacySettings(): Promise<PrivacySettingsResponse>
await client.privacy.checkPrivacySettings(): Promise<BasicResponse>
```

### Contact API

```typescript
// Contact management
await client.contact.getContacts(): Promise<Contact[]>
await client.contact.getContactInfo(contactId: string): Promise<Contact>
await client.contact.updateContactSettings(contactId: string, settings: ContactSettings): Promise<BasicResponse>
```

## Modular Imports

You can import specific modules individually:

```typescript
// Import specific APIs
import { AuthApiClient } from 'zen-core-chatty-typescript/api';
import { User, Message, Chat } from 'zen-core-chatty-typescript/models';
import SignalRClient from 'zen-core-chatty-typescript/signalr-client';
import { Tools } from 'zen-core-chatty-typescript/tools';

// Use individual clients
const authClient = new AuthApiClient('https://your-server.com');
const signalR = new SignalRClient('https://your-server.com');
```

## Models

The SDK provides comprehensive TypeScript models for all API operations:

```typescript
import {
    // Authentication models
    AuthResponse, LoginRequest, RegisterRequest, UserInfo,
    
    // User models
    UserInfoResponse, UserInfoQueryRequest,
    
    // Chat models
    ChatResponse, CreatePrivateChatRequest, CreateGroupChatRequest,
    
    // Message models
    Message, SendMessageRequest, SendMessageResponse,
    
    // Group models
    GroupSettings, GroupInviteLink, UpdateGroupSettingsRequest,
    GroupManagementRequest, GroupInviteLinkRequest,
    
    // File models
    FileUploadResponse, FileInfo,
    
    // Privacy models
    PrivacySettings, PrivacySettingsResponse,
    
    // Contact models
    Contact, ContactSettings,
    
    // Basic response
    BasicResponse
} from 'zen-core-chatty-typescript/models';
```

## Configuration

### Timeout Configuration

```typescript
// Set custom timeout (default: 10000ms)
const client = new ZenCoreChattyClient('https://server.com', 5637, 30000);
```

### Authentication Token Management

```typescript
// Set authentication token (automatically applies to all API clients)
client.setAuthToken('your-jwt-token');

// Clear authentication token
client.clearAuthToken();
```

## Error Handling

All API methods return promises that can be handled with standard async/await or promise chains:

```typescript
try {
    const response = await client.auth.login(loginRequest);
    console.log('Login successful:', response);
} catch (error) {
    console.error('Login failed:', error);
    // Handle specific error types
    if (error.response?.status === 401) {
        // Handle unauthorized
    }
}
```

## Real-time Events

The SignalR client provides real-time event handling:

```typescript
signalRClient.onMessageReceived((message: Message) => {
    console.log('New message received:', message);
});

signalRClient.onUserJoined((user: UserInfo, chatId: string) => {
    console.log('User joined chat:', user.username);
});

signalRClient.onUserLeft((user: UserInfo, chatId: string) => {
    console.log('User left chat:', user.username);
});

signalRClient.onConnectionStatusChanged((status: string) => {
    console.log('Connection status:', status);
});
```

## Development

### Building from Source

```bash
git clone https://github.com/your-username/zen-core-chatty-typescript.git
cd zen-core-chatty-typescript
npm install
npm run build
```

### Running Tests

```bash
npm test
npm run test:watch  # Watch mode for development
```

### Development Build

```bash
npm run dev  # Watch mode for building
```

## Browser Support

This SDK is compatible with modern browsers that support:
- ES6 modules
- Fetch API (or axios with polyfill)
- WebSocket API

## Node.js Support

The SDK works in Node.js environments with proper polyfills for:
- Fetch API (axios is used internally)
- WebSocket (for SignalR client)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and feature requests, please use the GitHub issue tracker.

## Changelog

### v1.0.0
- Initial release with complete API coverage
- Real-time messaging support with SignalR
- Comprehensive TypeScript definitions
- Modular architecture with tree-shaking support

-----
> Announcement: This content(readme) is fully generated by Trae Builder using model DeepSeek-V3.1. This AI is completely my Prime Minister :)