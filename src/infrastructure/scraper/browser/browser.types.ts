// Puppeteer-extra plugin options types
export interface AdblockerPluginOptions {
  blockTrackers?: boolean;
  blockTrackersAndAnnoyances?: boolean;
  useCache?: boolean;
}

export interface RecaptchaPluginOptions {
  provider: {
    id: '2captcha' | 'anticaptcha';
    token: string;
  };
  visualFeedback?: boolean;
  throwOnError?: boolean;
}

// CAPTCHA solving result
export interface CaptchaResult {
  captchas: Array<{
    id: string;
    sitekey: string;
    callback?: string;
  }>;
  solutions: Array<{
    id: string;
    text: string;
    responseTime: number;
  }>;
  solved: Array<{
    id: string;
    isSolved: boolean;
    responseTime: number;
  }>;
  error?: Error;
  filtered?: unknown[]; // For compatibility with plugin types
}

// Plugin constructor types (use unknown for flexibility)
export type StealthPluginConstructor = (options?: unknown) => unknown;
export type AdblockerPluginConstructor = (
  options?: AdblockerPluginOptions,
) => unknown;
export type RecaptchaPluginConstructor = (
  options: RecaptchaPluginOptions,
) => unknown;

// Helper type guards for checking if CAPTCHA solving is available
export function hasSolveRecaptchas(
  obj: unknown,
): obj is { solveRecaptchas: () => Promise<CaptchaResult> } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'solveRecaptchas' in obj &&
    typeof (obj as { solveRecaptchas: unknown }).solveRecaptchas === 'function'
  );
}

export const isPageWithCaptcha = hasSolveRecaptchas;
export const isFrameWithCaptcha = hasSolveRecaptchas;
