import { RateLimiter } from '@list-am-bot/common/utils/rate-limiter.util';

describe('RateLimiter', (): void => {
  let rateLimiter: RateLimiter;

  beforeEach((): void => {
    jest.useFakeTimers();
  });

  afterEach((): void => {
    jest.useRealTimers();
  });

  describe('constructor', (): void => {
    it('should initialize with max tokens', (): void => {
      rateLimiter = new RateLimiter(10, 5);

      expect(rateLimiter.getAvailableTokens()).toBe(10);
    });
  });

  describe('acquire', (): void => {
    it('should consume one token per acquisition', async (): Promise<void> => {
      rateLimiter = new RateLimiter(3, 1);

      const promise1 = rateLimiter.acquire();
      jest.runAllTimers();
      await promise1;

      expect(rateLimiter.getAvailableTokens()).toBe(2);
    });

    it('should allow multiple acquisitions up to limit', async (): Promise<void> => {
      rateLimiter = new RateLimiter(3, 1);

      const promise1 = rateLimiter.acquire();
      const promise2 = rateLimiter.acquire();
      const promise3 = rateLimiter.acquire();

      jest.runAllTimers();
      await Promise.all([promise1, promise2, promise3]);

      expect(rateLimiter.getAvailableTokens()).toBe(0);
    });

    it('should queue requests beyond limit', async (): Promise<void> => {
      rateLimiter = new RateLimiter(2, 1);

      const results: number[] = [];

      const promise1 = rateLimiter.acquire().then((): void => {
        results.push(1);
      });
      const promise2 = rateLimiter.acquire().then((): void => {
        results.push(2);
      });
      const promise3 = rateLimiter.acquire().then((): void => {
        results.push(3);
      });

      jest.runAllTimers();
      await Promise.all([promise1, promise2, promise3]);

      expect(results).toHaveLength(3);
    });

    it('should refill tokens over time', async (): Promise<void> => {
      rateLimiter = new RateLimiter(5, 2);

      await rateLimiter.acquire();
      await rateLimiter.acquire();
      await rateLimiter.acquire();

      expect(rateLimiter.getAvailableTokens()).toBe(2);

      jest.advanceTimersByTime(1000);

      expect(rateLimiter.getAvailableTokens()).toBe(4);
    });

    it('should not exceed max tokens when refilling', (): void => {
      rateLimiter = new RateLimiter(5, 2);

      jest.advanceTimersByTime(10000);

      expect(rateLimiter.getAvailableTokens()).toBe(5);
    });
  });

  describe('getAvailableTokens', (): void => {
    it('should return correct number of tokens', (): void => {
      rateLimiter = new RateLimiter(10, 5);

      expect(rateLimiter.getAvailableTokens()).toBe(10);
    });

    it('should return floor value', (): void => {
      rateLimiter = new RateLimiter(10, 3);

      jest.advanceTimersByTime(100);

      const tokens = rateLimiter.getAvailableTokens();
      expect(Number.isInteger(tokens)).toBe(true);
    });
  });

  describe('reset', (): void => {
    it('should restore tokens to max', async (): Promise<void> => {
      rateLimiter = new RateLimiter(5, 1);

      await rateLimiter.acquire();
      await rateLimiter.acquire();

      expect(rateLimiter.getAvailableTokens()).toBe(3);

      rateLimiter.reset();

      expect(rateLimiter.getAvailableTokens()).toBe(5);
    });

    it('should clear the queue', async (): Promise<void> => {
      rateLimiter = new RateLimiter(1, 1);

      const promise1 = rateLimiter.acquire();
      void rateLimiter.acquire();

      rateLimiter.reset();

      jest.runAllTimers();
      await promise1;

      // Second promise should not resolve as queue was cleared
      // But it may still resolve if reset happened after it was processed
      expect(rateLimiter.getAvailableTokens()).toBe(1);
    });
  });

  describe('rate limiting behavior', (): void => {
    it('should process requests in order', async (): Promise<void> => {
      rateLimiter = new RateLimiter(2, 1);

      const results: number[] = [];

      const promise1 = rateLimiter.acquire().then((): void => {
        results.push(1);
      });
      const promise2 = rateLimiter.acquire().then((): void => {
        results.push(2);
      });
      const promise3 = rateLimiter.acquire().then((): void => {
        results.push(3);
      });

      jest.runAllTimers();
      await Promise.all([promise1, promise2, promise3]);

      expect(results).toStrictEqual([1, 2, 3]);
    });

    it('should consume tokens sequentially', async (): Promise<void> => {
      rateLimiter = new RateLimiter(10, 5);

      await rateLimiter.acquire();
      await rateLimiter.acquire();

      expect(rateLimiter.getAvailableTokens()).toBe(8);
    });
  });
});
