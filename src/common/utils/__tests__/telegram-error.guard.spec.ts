import {
  isTelegramError,
  isTelegramBotBlocked,
} from '@list-am-bot/common/utils/telegram-error.guard';

describe('isTelegramError', (): void => {
  it('should return true for valid telegram error', (): void => {
    const error = {
      response: {
        error_code: 400,
        description: 'Bad Request',
      },
    };

    const result = isTelegramError(error);

    expect(result).toBe(true);
  });

  it('should return false for null', (): void => {
    const result = isTelegramError(null);

    expect(result).toBe(false);
  });

  it('should return false for undefined', (): void => {
    const result = isTelegramError(undefined);

    expect(result).toBe(false);
  });

  it('should return false for string error', (): void => {
    const result = isTelegramError('Error message');

    expect(result).toBe(false);
  });

  it('should return false for Error object', (): void => {
    const result = isTelegramError(new Error('Error'));

    expect(result).toBe(false);
  });

  it('should return false for object without response', (): void => {
    const error = { message: 'Error' };

    const result = isTelegramError(error);

    expect(result).toBe(false);
  });

  it('should return false for object with null response', (): void => {
    const error = { response: null };

    const result = isTelegramError(error);

    expect(result).toBe(false);
  });

  it('should return false for object with non-object response', (): void => {
    const error = { response: 'string' };

    const result = isTelegramError(error);

    expect(result).toBe(false);
  });

  it('should return false for response without error_code', (): void => {
    const error = { response: { description: 'Error' } };

    const result = isTelegramError(error);

    expect(result).toBe(false);
  });

  it('should return true for error without description', (): void => {
    const error = {
      response: {
        error_code: 500,
      },
    };

    const result = isTelegramError(error);

    expect(result).toBe(true);
  });
});

describe('isTelegramBotBlocked', (): void => {
  it('should return true for 403 error code', (): void => {
    const error = {
      response: {
        error_code: 403,
        description: 'Forbidden',
      },
    };

    const result = isTelegramBotBlocked(error);

    expect(result).toBe(true);
  });

  it('should return false for 400 error code', (): void => {
    const error = {
      response: {
        error_code: 400,
        description: 'Bad Request',
      },
    };

    const result = isTelegramBotBlocked(error);

    expect(result).toBe(false);
  });

  it('should return false for 404 error code', (): void => {
    const error = {
      response: {
        error_code: 404,
        description: 'Not Found',
      },
    };

    const result = isTelegramBotBlocked(error);

    expect(result).toBe(false);
  });

  it('should return false for 429 error code', (): void => {
    const error = {
      response: {
        error_code: 429,
        description: 'Too Many Requests',
      },
    };

    const result = isTelegramBotBlocked(error);

    expect(result).toBe(false);
  });

  it('should return false for 500 error code', (): void => {
    const error = {
      response: {
        error_code: 500,
        description: 'Internal Server Error',
      },
    };

    const result = isTelegramBotBlocked(error);

    expect(result).toBe(false);
  });

  it('should return false for non-telegram error', (): void => {
    const result = isTelegramBotBlocked(new Error('Error'));

    expect(result).toBe(false);
  });

  it('should return false for null', (): void => {
    const result = isTelegramBotBlocked(null);

    expect(result).toBe(false);
  });

  it('should return false for undefined', (): void => {
    const result = isTelegramBotBlocked(undefined);

    expect(result).toBe(false);
  });

  it('should return true for 403 without description', (): void => {
    const error = {
      response: {
        error_code: 403,
      },
    };

    const result = isTelegramBotBlocked(error);

    expect(result).toBe(true);
  });
});
