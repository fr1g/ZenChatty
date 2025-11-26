import { Chat, Contact, GroupChat, PrivateChat } from "../models";

export const ImageActs = {
    getContactChatAvatarAsUrl(contact: Contact){
        let locator: string | null = '';
        const chat: Chat | PrivateChat | GroupChat = contact.object;
        if(chat instanceof GroupChat)
            locator = chat.settings.avatarFileLocator;
        else{
            if(contact.host.localId == contact.object.initBy.localId)
                locator = (chat as PrivateChat).receiver.avatarFileLocator;
            else
                locator = (chat as PrivateChat).initBy.avatarFileLocator;
        }
    }
}