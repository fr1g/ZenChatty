import User from "./User";

export default class UserCredential {

    me: User;
    rootToken: string | null;
    accessToken: string | null;

    refreshAccess() {


    }

    constructor(me: User, rootToken: string | null, accessToken: string | null) {
        this.me = me;
        this.rootToken = rootToken;
        this.accessToken = accessToken;
    }

}