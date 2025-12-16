import { NavigatorScreenParams } from '@react-navigation/native';

export type ChatScopeParams = {
    whereFrom?: string;  // if undefined, should back to
    params?: ReachingInfo; // actually used params, defined one by one as interface acceptable inside target component
    goingTo?: "conversation" | "group_info" | "user_info"; // ugh
};

export class ReachingInfo {
    targetQueryId?: string;
    targetName?: string; // Display name of target user/group
    isTargetAGroup: boolean = false; // true: targetQueryId is the Info-To-Be-Queried Group's ID
                                     // false: ~ is  ~ person's ID
    isOpenningConversation: boolean = true; // true: ... is chatUniqueMark, otherwise ignore. Overriding isTargetAGroup
    isTargetConversationInGroup: boolean = false; // IOC must be true, otherwise effects nothing
    // 
    viaGroupId?: string; // if fired through a group (clicked a group member to view person info, then greeting is via-group data required)
    
}

export const ChatScopeParamInitState = {
    whereFrom: "",
    params: undefined
}
// ChatScope navigator parameter types
export type ChatScopeParamList = {
    cs_home: ChatScopeParams;
};

// Root navigator parameter types
export type RootStackParamList = {
    cs_home: ChatScopeParams;
    main: undefined;

    profile: ChatScopeParams;
    settings: ChatScopeParams;
};

// Extended types: for defining new route types
export type RouteWithBaseParams<T = undefined> = T extends undefined ? ChatScopeParams : ChatScopeParams & T;

declare global {
    namespace ReactNavigation {
        interface RootParamList extends RootStackParamList { }
    }
}