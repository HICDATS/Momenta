export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const MAX_NOTE_LENGTH = 100;
const CHECKIN_TIME_WINDOW_HOURS = 24;
const MILLIS_PER_HOUR = 60 * 60 * 1000;

export function isFutureTime(timestamp: number): boolean {
  return timestamp > Date.now();
}

export function validateNote(note: string): ValidationResult {
  if (note.length > MAX_NOTE_LENGTH) {
    return { valid: false, error: `备注不能超过${MAX_NOTE_LENGTH}字` };
  }
  return { valid: true };
}

export function validateSportType(sportType: string): ValidationResult {
  if (!sportType) {
    return { valid: false, error: '请选择运动类型' };
  }
  return { valid: true };
}

export function validateCheckInTime(timestamp: number): ValidationResult {
  if (isFutureTime(timestamp)) {
    return { valid: false, error: '打卡时间不能是未来时间' };
  }

  const now = Date.now();
  const maxAgeMs = CHECKIN_TIME_WINDOW_HOURS * MILLIS_PER_HOUR;
  if (now - timestamp > maxAgeMs) {
    return { valid: false, error: '打卡时间不能超过24小时' };
  }

  return { valid: true };
}
