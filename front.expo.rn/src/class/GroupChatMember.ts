import  User from './User';
import  { EGroupMemberType } from './enums/EnumUserRelated';

export class GroupChatMember {
    theGuy: User;
    type: EGroupMemberType;
    givenTitle: string | null;
    nickname: string;
    isSilent: boolean;
    joinedAt: Date;
    silentUntil: Date | null;

    constructor(
        member: User,
        type: EGroupMemberType = EGroupMemberType.Member,
        givenTitle: string | null = null,
        nickname: string = "",
        isSilent: boolean = false,
        joinedAt: Date = new Date(),
        silentUntil: Date | null = null
    ) {
        this.theGuy = member;
        this.type = type;
        this.givenTitle = givenTitle;
        this.nickname = nickname;
        this.isSilent = isSilent;
        this.joinedAt = joinedAt;
        this.silentUntil = silentUntil;
    }
}