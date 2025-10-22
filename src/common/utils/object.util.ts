/**
 * Assigns only defined properties from source to target
 * Skips properties that are undefined in the source
 */
export function assignDefinedProps<
  Target extends object,
  Source extends Partial<Target>,
>(target: Target, source: Source, keys: (keyof Target)[]): void {
  for (const key of keys) {
    if (source[key] !== undefined) {
      target[key] = source[key] as unknown as Target[typeof key];
    }
  }
}
