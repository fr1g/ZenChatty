import User from './User';
import { EChatStatus } from './enums/EnumChatRelated';

export default class Chat {
  [x: string]: any; // only

  uniqueMark: string | undefined;
  initBy: User;
  status: EChatStatus;

  constructor(initBy: User, uniqueMark: string | undefined = undefined, status: EChatStatus = EChatStatus.Normal) {
    this.uniqueMark = uniqueMark;
    this.initBy = initBy;
    this.status = status;
  }

}