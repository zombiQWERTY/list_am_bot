import { delay, jitter } from '@list-am-bot/common/utils/delay.util';

describe('delay', (): void => {
  beforeEach((): void => {
    jest.useFakeTimers();
  });

  afterEach((): void => {
    jest.useRealTimers();
  });

  it('should resolve after specified milliseconds', async (): Promise<void> => {
    const promise = delay(1000);
    jest.advanceTimersByTime(1000);

    await expect(promise).resolves.toBeUndefined();
  });

  it('should not resolve before specified time', async (): Promise<void> => {
    const promise = delay(1000);
    jest.advanceTimersByTime(500);

    await Promise.race([
      promise.then((): string => 'resolved'),
      Promise.resolve('not-resolved'),
    ]).then((result): void => {
      expect(result).toBe('not-resolved');
    });
  });

  it('should resolve with undefined', async (): Promise<void> => {
    const promise = delay(100);
    jest.advanceTimersByTime(100);

    const result = await promise;

    expect(result).toBeUndefined();
  });

  it('should handle zero milliseconds', async (): Promise<void> => {
    const promise = delay(0);
    jest.advanceTimersByTime(0);

    await expect(promise).resolves.toBeUndefined();
  });

  it('should work with small delays', async (): Promise<void> => {
    const promise = delay(1);
    jest.advanceTimersByTime(1);

    await expect(promise).resolves.toBeUndefined();
  });

  it('should work with large delays', async (): Promise<void> => {
    const promise = delay(10000);
    jest.advanceTimersByTime(10000);

    await expect(promise).resolves.toBeUndefined();
  });
});

describe('jitter', (): void => {
  it('should return value greater than or equal to base', (): void => {
    const result = jitter(1000);

    expect(result).toBeGreaterThanOrEqual(1000);
  });

  it('should return value less than base plus max jitter', (): void => {
    const result = jitter(1000, 500);

    expect(result).toBeLessThan(1500);
  });

  it('should use default max jitter of 1000', (): void => {
    const result = jitter(1000);

    expect(result).toBeLessThan(2000);
  });

  it('should return exact base when max jitter is 0', (): void => {
    const result = jitter(1000, 0);

    expect(result).toBe(1000);
  });

  it('should work with small base values', (): void => {
    const result = jitter(10, 5);

    expect(result).toBeGreaterThanOrEqual(10);
  });

  it('should work with large base values', (): void => {
    const result = jitter(10000, 1000);

    expect(result).toBeGreaterThanOrEqual(10000);
  });

  it('should return value less than or equal to base plus max jitter', (): void => {
    const result = jitter(1000, 500);

    expect(result).toBeLessThanOrEqual(1500);
  });

  it('should add jitter to base value', (): void => {
    const base = 1000;
    const maxJitter = 500;

    const result = jitter(base, maxJitter);

    expect(result - base).toBeGreaterThanOrEqual(0);
  });

  it('should add jitter less than max jitter', (): void => {
    const base = 1000;
    const maxJitter = 500;

    const result = jitter(base, maxJitter);

    expect(result - base).toBeLessThanOrEqual(maxJitter);
  });

  it('should work with zero base', (): void => {
    const result = jitter(0, 100);

    expect(result).toBeGreaterThanOrEqual(0);
  });
});
