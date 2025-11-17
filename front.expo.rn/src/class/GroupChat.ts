import  User from './User';
import  Chat from './Chat';
import { GroupChatMember } from './GroupChatMember';
import { EChatStatus } from './enums/EnumChatRelated';
import GroupSettings from './GroupSettings';

export class GroupChat extends Chat {
    members: GroupChatMember[];
    settings: GroupSettings; 
    groupAnnounce: any[]; // 暂时使用 any 类型，后续可替换为具体的 Message 类型

    constructor(
        initBy: User,
        members: GroupChatMember[],
        settings: GroupSettings = new GroupSettings(),
        groupAnnounce: any[] = []   
    ) {
        super(initBy);
        this.members = members;
        this.settings = settings;
        this.groupAnnounce = groupAnnounce;
    }
}

// 从 Chat.ts 导入所需的函数和枚举
