import  Chat from './Chat';
import  User from './User';

export class PrivateChat extends Chat {
    isInformal: boolean;
    receiver: User;

    constructor(initBy: User, receiver: User, isInformal: boolean = true) {
        super(initBy);
        this.receiver = receiver;
        this.isInformal = isInformal;
    }
}