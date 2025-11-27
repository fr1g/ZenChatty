import { ZenCoreClient } from "../api";
import { Chat, Contact, GroupChat, PrivateChat, User } from "../models";
import { Tools } from "../tools";

export const ImageActs = {
    getContactChatAvatarAsUrl(contact: Contact) {
        let locator: string | null = '';
        const chat: Chat | PrivateChat | GroupChat = contact.object;
        if (chat instanceof GroupChat)
            locator = chat.settings.avatarFileLocator;
        else
            if (contact.host.localId == contact.object.initBy.localId)
                locator = (chat as PrivateChat).receiver.avatarFileLocator;
            else
                locator = (chat as PrivateChat).initBy.avatarFileLocator;

        if (locator == null || locator == '')
            return DefaultAvatarUrl;

        const fileApi = (new ZenCoreClient()).file;
        return fileApi.imageFileByUrl(locator);
    },
    getUserProfileImagePairAsUrl(user: User): ProfileImageUrlPair {

        const prepare: ProfileImageUrlPair = { avatar: '', background: '' };

        const fileApi = (new ZenCoreClient()).file;

        if (Tools.isNoneOrEmpty(user.avatarFileLocator))
            prepare.avatar = DefaultAvatarUrl;
        else prepare.avatar = fileApi.imageFileByUrl(user.avatarFileLocator);

        if (Tools.isNoneOrEmpty(user.backgroundFileLocator))
            prepare.background = DefaultAvatarUrl;
        else prepare.background = fileApi.imageFileByUrl(user.backgroundFileLocator);

        return prepare;

    }
}
export interface ProfileImageUrlPair { avatar: string, background: string };
export const DefaultAvatarUrl = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCACAAIADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD7QzTXPBFOxnJHOBVWw1G31VZBBJ+9iOJIHUrJH9VPP49DWkY9j85S0uiTJzSHAFKwIPNRk5rshTudCXYXOTk1Ex+Y49ak5PFRSulvDNLIwRI1LFj2A5JrrjCyNkugSNtXJwCOgNQtKXXBAH0qLTlmvYkup3Em8fJtXaAvHbJz6596nmhKZbGFrZRRql0IqazEEcdqeyFQCe9RupPParN4K4jHJzSUUhJFaeze50pdAyCOopucGkOB2pyoWBOcAckmpdI3juMwc0uc02CaO5jLwyLKmcbkOR+dOI2mueUVY64G9uOeKhvdIS/aGdN1vew5EdzHwwB6g+oPcGnSiV7Z1gmFvKc4kKhse+OM/SsfVNOurVLWFtYvLy5u2MSsriCJG2MckIM4GOme9cEYHykIpbM0I72SC5FnqCqlyRmOVP8AVzDGeCf4h/d/LNS1Bp+mLpWlw2Mk82oMnLzXTbnds5J9ueg7VPJIkIy7hMkAZ9TXdGNjSyvoBwgLM21RySewqpc3kskLJZwuztujErrhRwPm5+8Oc8dcGnmRNQnjjRJfJUF5CV2h+2xgRn1P5VZLY4HAHGK09C0rblGGyuI4VWW/lBQgqsSIq4HbGDwc0n2GTdEEv5xGjbmSTD7+ehJGR+FXW6Goz1q0rGik9ymV1BmCvJbIFYY2qWLDv16frTI52M32WcBbgR+ZuQfIw3Y4zzkcZ+orQGQDjvWZdm6t7n7Uql7eCBt0KqS8pJzwB6Bf/HjW8YcurNoO9yVhtOKaRkVHp98NSiJeCS1u04kgfnb06HoR+vsKl71vFJq50pW0YCPK7mICjuewqgksetWqSK0gs2YOu0lTIOeD/sn26iotS086xfpbSovkW5SQkjGQd2QD3BwAR6fWr11PHbo8kjCOJASSeAAB1p777HTBFNITp+qLDBJttpo5JXjbk7wyfMD1/ix+A6VbLdQc59ap2Bkunmu5dyhyFiTdkBBnBxjgnOfyqyy+ZkHpXHUjY7Yo6ACob6OOQxTyNsS1JlJx2CtnP55/Cp2+6fpTVcKru5URqCXZzgAdyfauKEdD5OKsVrTV7PVBG8EqsJMlBnlgMZIHpyOfcU0SRf2+yO6+b9nDRpsG4Dcd5DfinHt71LaaTFbX014gXdIixoFUBUjA4UY4x/8AW9BUNzM9zrVraCPEShpJHjb5gwHAOD8o5HXrnpwa3Stua2V9C8Tk5AxTGx+NPZduBTCQOozV2sSNPSmbR19afn1owK3jBrVlLYbVa5uDaIZgjybV4SMZYn2qwxwelNdBLE6nIyCNynBH0Pat0r6msHYoW1gIb64vpSWu7gYOCQqp2XGcfj7+lPndLeNpXIVV6k+5wP1NJaNsb7GXkllhQEySKBuBJx069MVEpW9vS6ySBLR2jaMcK74HPvjOPr9KrZaHbHUZbQTSajJdT+WgaMIsKZOOScknvzVUq2rTTfaF2QQTELGvKygAY3ccjPOPUYOcVevXkDRqkZlLHD4cKVX19fbj1qKK3jtLeOGFBHEgCqo7VL00O2mtLhMX6qcetRCR8Z3fpTpiRtwTzmoqwqLS53QidMwyc9gKy/Edtc6jDBYwXa29vdSCGZViDSMp5bDHhflBHIPWtR2wceoqKWWG28uWZljw4RXb+8xwB+OcfjXIo6HyMXZpor6dHcQazqUJv57uxthHCnnhAfM27mI2qOAGUfnVDxBZ3Qu2uLUTLavG8lyLYgO7AKgH/fJz/wAA963jEsBkGFViS7L3Pvj8qiWRlI5rRR0sWm73GWdyJ7NQJPNeImGRiMEspwTj3xn6EVNuAHWo445m1CV2kRbd40VI+B84Lbjj6FfypXUhsVvTi7pktCthgTnntTRQFp1dSWt2LYjZPShRx7GnsVj2l3CBmCgt3JIAH5kVhXt8mtGTRj59vM0uHMfyyKgIIb1AIHWhuxvTjzMs6vqa6be2eHBaQMPJGN8xx8oTPU54x7+1SQQtbWtvFI5kkVRvc/xHuaiNraaxJaahcIs0tqx8kghgHVvvZx1461JfzvFazSpF58oUlIx/EfSovZts9CEU9EVbdI57iW/jk8xZVWNPRQpPT6kmnyMD+Bp0MyzW6Ovy5+8mwrtPptPT6dqjblzUeZ6MV0I5x9z8ajqSf+H8ajrnlLmPQhGx0khyfwqpqVl/aVokPGVnimAbodjq2PxAxVl2OenahSd1RHazPjYxsQGLzvEuoXG4hY4Iolx2yWY/+y1N0Oc0yG3ME93LuB89w3A6AKB/MGnYzW8INq7NOVPoU9U0xr+ezmid45IpMEocEKQeR7ghT+FMm8QGG0uLh7by4oJxB5kr4V/3pjyGx14zg469a0UJVsihobeSCVJkQwNl5A4+U9yTW6i90HKrWaMe88RTx6rdW0dk6C1Ri3mxn98MJtKEf7TgemOc9q1bW5W8tYp1wu7IZQQdrAkMMjuCCPwqvFq0ms2TSaUj26A+Ul5KnVe7Ip6j0zx0PNWIIFsrSKBZHkVB9+TlmJOST781Ub33ugdPyM/WbSa7wmyWeIpmONCqqsgOQ5YnqOMY9/akj0Qpue8uEn3IFaKNMKwGOp+8fujr6VomUgHGMVG2ChB4XuaTS3N4RsrIhPzHHRaapIbIJFSMoAYqcooySewxkmqLme6lUqWtoI3yTw3nDHT2Hf1+lRc76cOpXhbz9SkuYUUW8iANKCP3p7dPTkZNWWPbHPrUjEEjHAAwBUTffNcrd9D0acO5BI+8gYxjNNo7n60jdMd6hux3Qjc6OTqPpQh+YU05oU45/StqaTep8fYq2S+X4m1mBRhPJgnI/wBptwz+Sr+VWsflUS2gi1Oe/VyGmiWJ07HaTg/qakMmf4a6oxaWpbV2L1qrqone1ijtg3mNOgZgcBUByxPrwCMd81ZyQcbecZxmqsq/8TiFmLMptn+XIwDuXJ+vI/KtGCiXZZx91MgdqiZ2PBOaGGW4H40juIxwAT6ZqHLojSML7BtOMnpUTy7hxkL6GmsxznJ57ZpjHj+lQdcKaRW1W0W8S1SYobQS/vo3OFcYO3Pr823joassOWGOBwBUF1bpf28kEq5jcDg9iOQfzFLFObm3jlKOhYZIfg575rmlK70O2nC4E4GTTfvNSscg1DKSEBzjmoO6MSJupph45PWnjnNMIweuaxnKx3QhZanTsNyn1qMDDcjFOJIBpobnnrW0HY+LUb6FaLRLWC/m1CN5bd2BaYCUiJuPvMp4yOueKLbU4WhuLplZLSEbxKw/1gHUqO49+9RX2iJqd0JLy4ee1Ugx2RAEWfVh/F64PFM1SX7ffxWCAfZ4gJ7gg4B5+RPxI3fRPeu6/bQ0jC+4ukWkqm4v7rIu7xgxjzkRIOEQfTkn3Y1K7h9YDKEPk27Rs3O4F2U4HbGE5qVp/lHUNn04qhLNLYSeZtheGeYCSRjtZMkBegweTjnHWhtJWRsqfUumdge1RvJlixwM0PwSaYTuGBxUtpas3jAC2T8vNIeuTxigDjims/pnFc0pOW51Rp9RS3PtVS0kAnvIDI8hSTf84+6GGQAe/epye/aq80zrqdupmCxSxOoiI6sCGBz9NwrNux1xiTsew5BqCQliV/hHenyPjI71EWOalyOyELCHJFNIJGSMU8U4Dd16Vx1J20OyEW2dAKRxxnI+lPwVHPFRPy5x0reE1Y+OUQXg1XihW3inIJd5WMjse56foABVioGz5bD2rpVTsaKPREHWodQmNvp80oCExqZPnzt+XnnHPapgv51X1LcyW9unmoZpV3Sx/wACr8xyfQ42/iK0dXTY6IwbLEg2nk9aaDjvSy4ZiajYAeuamU+bTodEYWFc9P6UzoM/pQDimsdx46Vnc6IwvsDNk5qvf4j+yztKI445PnyOoIKge3JB/Cp84pSgkRlJI3KRWUpI7IQshs7dQFyMfeH1qDGKTT5hJpMH73zm2AM/GSw4OccZyDTwK5pVLanTGDYAYpWbFBOOlNJA69a4pzud0IWP/9k=";