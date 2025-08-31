// 时间工具函数

// 格式化时间为本地字符串
export function formatTimeForDisplay(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch (error) {
    return 'Invalid Date';
  }
}

// 格式化时间为datetime-local格式
export function formatTimeForInput(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  } catch (error) {
    return '';
  }
}

// 获取当前时间
export function getCurrentTime(): string {
  return new Date().toISOString().slice(0, 16);
}

// 获取24小时后的时间
export function getTimeIn24Hours(): string {
  const endTime = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
  return endTime.toISOString().slice(0, 16);
}

// 验证时间逻辑
export function validateTimes(startTime: string, endTime: string): { isValid: boolean; message?: string } {
  if (!startTime || !endTime) {
    return { isValid: false, message: 'Please set both start and end times' };
  }

  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const now = Date.now();

  if (end <= start) {
    return { isValid: false, message: 'End time must be after start time' };
  }

  // 允许开始时间在过去（立即开始）
  // if (start <= now) {
  //   return { isValid: false, message: 'Start time must be in the future' };
  // }

  return { isValid: true };
}

// 计算时间差
export function getTimeDifference(startTime: string, endTime: string): string {
  try {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const diff = end - start;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  } catch (error) {
    return 'Invalid time';
  }
}

// 检查是否已过期
export function isExpired(endTime: string): boolean {
  try {
    const end = new Date(endTime).getTime();
    return Date.now() > end;
  } catch (error) {
    return false;
  }
}

// 检查是否已开始
export function hasStarted(startTime: string): boolean {
  try {
    const start = new Date(startTime).getTime();
    return Date.now() >= start;
  } catch (error) {
    return false;
  }
}

// 获取状态
export function getStatus(startTime: string, endTime: string): 'upcoming' | 'active' | 'expired' {
  try {
    const now = Date.now();
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    
    if (now < start) {
      return 'upcoming';
    } else if (now >= start && now <= end) {
      return 'active';
    } else {
      return 'expired';
    }
  } catch (error) {
    return 'upcoming';
  }
}
