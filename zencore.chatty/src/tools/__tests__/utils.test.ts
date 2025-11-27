import { Tools, ErrorHandler, DateTimeUtils, StringUtils, ValidationUtils, FileUtils } from '../utils';

describe('ErrorHandler', () => {
  test('should detect network errors', () => {
    expect(ErrorHandler.isNetworkError({ code: 'NETWORK_ERROR' })).toBe(true);
    expect(ErrorHandler.isNetworkError({ message: 'network error' })).toBe(true);
    expect(ErrorHandler.isNetworkError({ name: 'NetworkError' })).toBe(true);
    expect(ErrorHandler.isNetworkError({ message: 'other error' })).toBe(false);
  });

  test('should detect auth errors', () => {
    expect(ErrorHandler.isAuthError({ status: 401 })).toBe(true);
    expect(ErrorHandler.isAuthError({ code: 'UNAUTHORIZED' })).toBe(true);
    expect(ErrorHandler.isAuthError({ message: 'unauthorized' })).toBe(true);
    expect(ErrorHandler.isAuthError({ message: 'token expired' })).toBe(true);
    expect(ErrorHandler.isAuthError({ message: 'other error' })).toBe(false);
  });

  test('should get friendly error messages', () => {
    expect(ErrorHandler.getFriendlyMessage({ code: 'NETWORK_ERROR' })).toBe(
      '网络连接失败，请检查网络设置'
    );
    expect(ErrorHandler.getFriendlyMessage({ status: 401 })).toBe(
      '认证失败，请重新登录'
    );
    expect(ErrorHandler.getFriendlyMessage({ message: 'Custom error' })).toBe(
      'Custom error'
    );
    expect(ErrorHandler.getFriendlyMessage({})).toBe('发生未知错误');
  });

  test('should retry operation', async () => {
    let attempts = 0;
    const operation = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Temporary failure');
      }
      return 'success';
    };

    const result = await ErrorHandler.retry(operation, 3, 10);
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });
});

describe('DateTimeUtils', () => {
  test('should format date time', () => {
    const date = new Date('2023-12-25T10:30:45');
    expect(DateTimeUtils.formatDateTime(date)).toBe('2023-12-25 10:30:45');
    expect(DateTimeUtils.formatDateTime(date, 'YYYY/MM/DD')).toBe('2023/12/25');
  });

  test('should get relative time', () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    expect(DateTimeUtils.getRelativeTime(fiveMinutesAgo)).toBe('5分钟前');
    expect(DateTimeUtils.getRelativeTime(twoHoursAgo)).toBe('2小时前');
    expect(DateTimeUtils.getRelativeTime(threeDaysAgo)).toBe('3天前');
  });

  test('should check if date is today', () => {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    expect(DateTimeUtils.isToday(today)).toBe(true);
    expect(DateTimeUtils.isToday(yesterday)).toBe(false);
  });
});

describe('StringUtils', () => {
  test('should truncate strings', () => {
    expect(StringUtils.truncate('Hello World', 5)).toBe('He...');
    expect(StringUtils.truncate('Hi', 10)).toBe('Hi');
    expect(StringUtils.truncate('Testing', 5, '..')).toBe('Tes..');
  });

  test('should generate random strings', () => {
    const random1 = StringUtils.randomString(10);
    const random2 = StringUtils.randomString(10);

    expect(random1.length).toBe(10);
    expect(random2.length).toBe(10);
    expect(random1).not.toBe(random2);
  });

  test('should check if string is empty', () => {
    expect(StringUtils.isEmpty('')).toBe(true);
    expect(StringUtils.isEmpty('   ')).toBe(true);
    expect(StringUtils.isEmpty(null)).toBe(true);
    expect(StringUtils.isEmpty(undefined)).toBe(true);
    expect(StringUtils.isEmpty('Hello')).toBe(false);
  });

  test('should capitalize strings', () => {
    expect(StringUtils.capitalize('hello')).toBe('Hello');
    expect(StringUtils.capitalize('world')).toBe('World');
  });
});

describe('ValidationUtils', () => {
  test('should validate email format', () => {
    expect(ValidationUtils.isValidEmail('test@example.com')).toBe(true);
    expect(ValidationUtils.isValidEmail('invalid-email')).toBe(false);
    expect(ValidationUtils.isValidEmail('test@')).toBe(false);
  });

});

describe('FileUtils', () => {
  test('should get file extension', () => {
    expect(FileUtils.getFileExtension('image.jpg')).toBe('jpg');
    expect(FileUtils.getFileExtension('document.pdf')).toBe('pdf');
    expect(FileUtils.getFileExtension('file')).toBe('');
  });

  test('should check file types', () => {
    expect(FileUtils.isImageFile('photo.jpg')).toBe(true);
    expect(FileUtils.isImageFile('document.pdf')).toBe(false);
    expect(FileUtils.isDocumentFile('report.pdf')).toBe(true);
    expect(FileUtils.isVideoFile('movie.mp4')).toBe(true);
  });

  test('should format file size', () => {
    expect(FileUtils.formatFileSize(1024)).toBe('1 KB');
    expect(FileUtils.formatFileSize(1048576)).toBe('1 MB');
    expect(FileUtils.formatFileSize(0)).toBe('0 B');
  });
});

describe('Tools', () => {
  test('should format bearer token', () => {
    expect(Tools.bear('token123')).toBe('Bearer token123');
  });

  test('should deep clone objects', () => {
    const original = { a: 1, b: { c: 2 } };
    const cloned = Tools.deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
  });

  test('should debounce function', async () => {
    let callCount = 0;
    const func = () => callCount++;
    const debounced = Tools.debounce(func, 50);

    debounced();
    debounced();
    debounced();

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(callCount).toBe(1);
  });

  test('should throttle function', async () => {
    let callCount = 0;
    const func = () => callCount++;
    const throttled = Tools.throttle(func, 50);

    throttled();
    throttled();
    throttled();

    expect(callCount).toBe(1);
  });
});