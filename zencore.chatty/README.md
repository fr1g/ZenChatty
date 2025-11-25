# ZenCore Chatty TypeScript SDK

Frontend core TypeScript SDK for ZenCore Chatty application, providing complete API encapsulation and type support.

## Features

- **Complete API Encapsulation** - Covers all functions including authentication, users, chats, messages, contacts, etc.
- **Complete TypeScript Type Support** - Provides full type definitions and intelligent hints
- **Type Safety** - All API calls have complete type checking
- **Detailed TSDoc Comments** - Each method has detailed documentation
- **Modular Design** - Can import specific modules as needed
- **Test Friendly** - Built-in Jest testing framework support

## Installation

```bash
npm install zen-core-chatty-typescript
```

## Quick Start

### Basic Usage

```typescript
import ZenCoreChattyClient from 'zen-core-chatty-typescript';

// Create client instance
const client = new ZenCoreChattyClient('https://your-api-server.com');

// Set authentication token
client.setAuthToken('your-jwt-token');

// Use APIs
const userInfo = await client.user.getCurrentUserInfo();
const chats = await client.chat.getChats();
```

### Real-time Communication with SignalR

```typescript
import { SignalRClient } from 'zen-core-chatty-typescript';

// Create SignalR client instance
const signalRClient = new SignalRClient('https://your-api-server.com');

// Set authentication token
signalRClient.setAccessToken('your-jwt-token');

// Register event handlers
signalRClient.onMessageReceived = (message) => {
    console.log('New message received:', message);
};

signalRClient.onUnreadCountUpdated = (contactId, unreadCount) => {
    console.log(`Unread count updated for ${contactId}: ${unreadCount}`);
};

signalRClient.onContactUpdated = (contact) => {
    console.log('Contact updated:', contact);
};

// Connect to SignalR hub
await signalRClient.connect();

// Send a message
await signalRClient.sendMessage('chat-id', 'Hello World!');

// Join a chat group
await signalRClient.joinChat('chat-id');

// Mark messages as read
await signalRClient.markMessagesAsRead('chat-id', ['message-id-1', 'message-id-2']);
```

### Import on Demand

```typescript
import { AuthApiClient, SignalRClient } from 'zen-core-chatty-typescript';
import { User, Message, EMessageType } from 'zen-core-chatty-typescript/models';

// Use specific API client
const authClient = new AuthApiClient('https://localhost:5637');
const result = await authClient.login('username', 'password');

// Use SignalR client for real-time features
const signalR = new SignalRClient('https://localhost:5637');
signalR.setAccessToken(result.accessToken);
await signalR.connect();
```

## API Modules

### Authentication Module (Auth)

- `login()` - User login
- `register()` - User registration
- `refreshToken()` - Refresh access token
- `logout()` - User logout

### User Module (User)

- `getCurrentUserInfo()` - Get current user information
- `updateUserProfile()` - Update user profile
- `updateAvatar()` - Update user avatar
- `searchUsers()` - Search users
- `getPrivacySettings()` - Get privacy settings
- `updatePrivacySettings()` - Update privacy settings

### Chat Module (Chat)

- `getChats()` - Get chat list
- `getChat()` - Get chat details
- `createPrivateChat()` - Create private chat
- `createGroupChat()` - Create group chat
- `deleteChat()` - Delete chat
- `pinChat()` / `unpinChat()` - Pin/Unpin chat
- `blockChat()` / `unblockChat()` - Block/Unblock chat

### Message Module (Message)

- `getMessages()` - Get chat messages
- `sendTextMessage()` - Send text message
- `sendImageMessage()` - Send image message
- `sendFileMessage()` - Send file message
- `deleteMessage()` - Delete message
- `editMessage()` - Edit message
- `recallMessage()` - Recall message
- `forwardMessage()` - Forward message

### Contact Module (Contact)

- `getContacts()` - Get contact list
- `addContact()` - Add contact
- `deleteContact()` - Delete contact
- `updateContactRemark()` - Update contact remark
- `searchContacts()` - Search contacts
- `getContactRequests()` - Get contact requests
- `sendContactRequest()` - Send contact request

### SignalR Real-time Module

- `connect()` - Establish SignalR connection
- `disconnect()` - Disconnect SignalR connection
- `sendMessage()` - Send real-time message
- `joinChat()` - Join a chat group
- `leaveChat()` - Leave a chat group
- `markMessagesAsRead()` - Mark messages as read
- `getConnectionState()` - Get current connection state

#### Event Handlers

- `onMessageReceived` - Triggered when receiving new messages
- `onUnreadCountUpdated` - Triggered when unread count updates
- `onContactUpdated` - Triggered when contact information updates
- `onReconnecting` - Triggered when connection is reconnecting
- `onReconnected` - Triggered when connection is reestablished
- `onConnectionClosed` - Triggered when connection is closed

## Development

### Build Project

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Run Tests

```bash
npm test
```

### Test Watch Mode

```bash
npm run test:watch
```

## Type Definitions

All model types can be imported from the `models` module:

```typescript
import { User, Chat, Message, Contact } from 'zen-core-chatty-typescript/models';
```

## License

MIT License

## Contribution

Welcome to submit Issues and Pull Requests!

## Support

If you have any questions, please contact us through:

- Create [Issue](https://github.com/your-username/zen-core-chatty-typescript/issues)
- Send email to: support@zencore.chatty