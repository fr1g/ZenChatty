import User from './User';
import { EChatStatus } from './enums/EnumChatRelated';

export default class Chat {
  [x: string]: any; // only

  uniqueMark: string | undefined;
  initBy: User;
  history: any[];
  status: EChatStatus;

  constructor(initBy: User, history: any[] = [], uniqueMark: string | undefined = undefined, status: EChatStatus = EChatStatus.Normal) {
    this.history = history;
    this.uniqueMark = uniqueMark;
    this.initBy = initBy;
    this.status = status;
  }

}