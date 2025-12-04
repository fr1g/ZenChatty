import { ContactApiClient } from '../../api/contact';
import { UserInfoQueryRequest } from '../../models/requests';

describe('ContactApiClient', () => {
  let contactApiClient: ContactApiClient;

  beforeEach(() => {
    contactApiClient = new ContactApiClient('https://localhost:5637');
  });

  describe('constructor', () => {
    it('should create an instance of ContactApiClient', () => {
      expect(contactApiClient).toBeInstanceOf(ContactApiClient);
    });

    it('should accept custom timeout', () => {
      const clientWithTimeout = new ContactApiClient('https://localhost:5637', 5000);
      expect(clientWithTimeout).toBeInstanceOf(ContactApiClient);
    });
  });

  describe('queryOthersInfoByPrivacy', () => {
    it('should be defined', () => {
      expect(contactApiClient.queryOthersInfoByPrivacy).toBeDefined();
    });

    it('should accept UserInfoQueryRequest', () => {
      const request: UserInfoQueryRequest = {
        email: 'test@example.com'
      };
      expect(request.email).toBe('test@example.com');
    });
  });

  describe('blockUser', () => {
    it('should be defined', () => {
      expect(contactApiClient.blockUser).toBeDefined();
    });
  });

  describe('unblockAndAddFriend', () => {
    it('should be defined', () => {
      expect(contactApiClient.unblockAndAddFriend).toBeDefined();
    });
  });

  describe('checkUserIsDisabled', () => {
    it('should be defined', () => {
      expect(contactApiClient.checkUserIsDisabled).toBeDefined();
    });
  });

  describe('getContacts', () => {
    it('should be defined', () => {
      expect(contactApiClient.getContacts).toBeDefined();
    });
  });

  describe('checkBlockStatus', () => {
    it('should be defined', () => {
      expect(contactApiClient.checkBlockStatus).toBeDefined();
    });
  });

  describe('addFriend', () => {
    it('should be defined', () => {
      expect(contactApiClient.addFriend).toBeDefined();
    });
  });
});