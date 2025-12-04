import { NavigatorScreenParams } from '@react-navigation/native';

export type ChatScopeParams = {
    whereFrom?: string;  // if undefined, should back to
    params?: ReachingInfo; // actually used params, defined one by one as interface acceptable inside target component
    goingTo?: "conversation" | "group_info" | "user_info"; // ugh
};

export class ReachingInfo {
    targetQueryId?: string;
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
// ChatScope导航器的参数类型
export type ChatScopeParamList = {
    cs_home: ChatScopeParams;
};

// 根导航器的参数类型
export type RootStackParamList = {
    cs_home: ChatScopeParams;
    main: undefined;

    profile: ChatScopeParams;
    settings: ChatScopeParams;
};

// 扩展类型：用于定义新的路由类型
export type RouteWithBaseParams<T = undefined> = T extends undefined ? ChatScopeParams : ChatScopeParams & T;

declare global {
    namespace ReactNavigation {
        interface RootParamList extends RootStackParamList { }
    }
}