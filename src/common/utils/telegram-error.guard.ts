export interface TelegramError {
  response: {
    error_code: number;
    description?: string;
  };
}

export function isTelegramError(error: unknown): error is TelegramError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'response' in error &&
    error.response !== null &&
    typeof error.response === 'object' &&
    'error_code' in error.response
  );
}

export function isTelegramBotBlocked(error: unknown): boolean {
  return isTelegramError(error) && error.response.error_code === 403;
}
