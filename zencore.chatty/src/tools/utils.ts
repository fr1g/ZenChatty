/**
 * 通用工具函数
 */

/**
 * 错误处理工具
 */
export class ErrorHandler {
  /**
   * 检查是否为网络错误
   */
  static isNetworkError(error: any): boolean {
    return error?.code === 'NETWORK_ERROR' || 
           error?.message?.includes('network') ||
           error?.name === 'NetworkError';
  }

  /**
   * 检查是否为认证错误
   */
  static isAuthError(error: any): boolean {
    return error?.status === 401 || 
           error?.code === 'UNAUTHORIZED' ||
           error?.message?.includes('unauthorized') ||
           error?.message?.includes('token');
  }

  /**
   * 获取友好的错误消息
   */
  static getFriendlyMessage(error: any): string {
    if (this.isNetworkError(error)) {
      return '网络连接失败，请检查网络设置';
    }
    
    if (this.isAuthError(error)) {
      return '认证失败，请重新登录';
    }

    if (error?.message) {
      return error.message;
    }

    return '发生未知错误';
  }

  /**
   * 重试机制
   */
  static async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          console.warn(`操作失败，第${attempt}次重试...`, error);
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    }
    
    throw lastError;
  }
}

/**
 * 日期时间工具
 */
export class DateTimeUtils {
  /**
   * 格式化日期时间
   */
  static formatDateTime(date: Date, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year.toString())
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  /**
   * 获取相对时间（如：刚刚、5分钟前）
   */
  static getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return '刚刚';
    } else if (diffMins < 60) {
      return `${diffMins}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return this.formatDateTime(date, 'YYYY-MM-DD');
    }
  }

  /**
   * 检查是否为今天
   */
  static isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }
}

/**
 * 字符串工具
 */
export class StringUtils {
  /**
   * 截断字符串并添加省略号
   */
  static truncate(str: string, maxLength: number, ellipsis: string = '...'): string {
    if (str.length <= maxLength) {
      return str;
    }
    return str.substring(0, maxLength - ellipsis.length) + ellipsis;
  }

  /**
   * 生成随机字符串
   */
  static randomString(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 检查字符串是否为空或空白
   */
  static isEmpty(str: string | null | undefined): boolean {
    return !str || str.trim().length === 0;
  }

  /**
   * 首字母大写
   */
  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

/**
 * 验证工具
 */
export class ValidationUtils {
  /**
   * 验证邮箱格式
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证手机号格式（中国）
   */
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * 验证密码强度
   */
  static validatePassword(password: string): {
    isValid: boolean;
    strength: 'weak' | 'medium' | 'strong';
    message: string;
  } {
    if (password.length < 6) {
      return { isValid: false, strength: 'weak', message: '密码长度至少6位' };
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const criteriaMet = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar]
      .filter(Boolean).length;

    if (criteriaMet >= 3) {
      return { isValid: true, strength: 'strong', message: '密码强度强' };
    } else if (criteriaMet >= 2) {
      return { isValid: true, strength: 'medium', message: '密码强度中等' };
    } else {
      return { isValid: true, strength: 'weak', message: '密码强度弱' };
    }
  }
}

/**
 * 文件工具
 */
export class FileUtils {
  /**
   * 获取文件扩展名
   */
  static getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
  }

  /**
   * 检查文件类型
   */
  static isImageFile(filename: string): boolean {
    const ext = this.getFileExtension(filename);
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
  }

  static isDocumentFile(filename: string): boolean {
    const ext = this.getFileExtension(filename);
    return ['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext);
  }

  static isVideoFile(filename: string): boolean {
    const ext = this.getFileExtension(filename);
    return ['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(ext);
  }

  /**
   * 格式化文件大小
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

/**
 * 工具类集合
 */
export const Tools = {
  ErrorHandler,
  DateTimeUtils,
  StringUtils,
  ValidationUtils,
  FileUtils,
  
  /**
   * Bearer token 格式化
   */
  bear(token: string): string {
    return `Bearer ${token}`;
  },
  
  /**
   * 深度克隆对象
   */
  deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  },
  
  /**
   * 防抖函数
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  },
  
  /**
   * 节流函数
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};