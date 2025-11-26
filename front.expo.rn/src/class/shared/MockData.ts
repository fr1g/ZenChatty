import { User, EGroupMemberType, GroupChatMember, GroupChat, PrivateChat, Contact } from "zen-core-chatty-typescript";


export const MockUsers: Record<string, User> = {
    John: new User('123', 'john@ali.com', 'John Doe', undefined),
    Fern: new User('456', 'fern@Maliburn.org', 'Fernandes Vacuez', undefined),
    Wise: new User('789', 'wise@prot0n.com', 'Wise Elle', undefined),
    Ivan: new User('0ab', 'ivan@kv.com', 'Ivan Masydov', undefined),
    Tagy: new User('cde', 'tagy@lasy.cc', 'Tagy Lasy', undefined),
    Chen: new User('fgh', 'chen@kv.com', 'Chen Dao', undefined),
    Ibin: new User('ijk', 'ibin@orse.co', 'Omar Ibin Yahya', undefined),
};

export function toGroupMember(user: User, type: EGroupMemberType = EGroupMemberType.Member) {
    return new GroupChatMember(user, type)
}

export const MockChats = {
    workingGroup: new GroupChat(MockUsers.John, [
        toGroupMember(MockUsers.John, EGroupMemberType.Owner),
        toGroupMember(MockUsers.Fern, EGroupMemberType.Admin),
        toGroupMember(MockUsers.Wise),
        toGroupMember(MockUsers.Ivan),
    ]),
    friendChen: new PrivateChat(MockUsers.John, MockUsers.Chen),
    friendWise: new PrivateChat(MockUsers.John, MockUsers.Wise),
    friendTagy: new PrivateChat(MockUsers.John, MockUsers.Tagy),
    friendIbin: new PrivateChat(MockUsers.John, MockUsers.Ibin),

    friendFern: new PrivateChat(MockUsers.Fern, MockUsers.John),

    informalChatIvan: new PrivateChat(MockUsers.John, MockUsers.Ivan, true),
}

export const MockContactBook = {
    owner: MockUsers.John, // owner MUST SAME TO contact HOST
    recentlyChats: [
        new Contact("", MockUsers.John, MockChats.friendWise),
        new Contact("", MockUsers.John, MockChats.friendFern),
    ],
    contactBook: {
        privates: [
            new Contact("", MockUsers.John, MockChats.friendWise),
            new Contact("", MockUsers.John, MockChats.friendChen),
        ],
        groups: [
            new Contact("", MockUsers.John, MockChats.workingGroup),
        ],
    }
} // dto to save space, all contact hosts should be null, and frontend automatically set it to owner and cache it.