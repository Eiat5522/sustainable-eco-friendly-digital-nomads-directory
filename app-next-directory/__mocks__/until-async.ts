// Minimal TypeScript mock for until-async used by msw within Jest
export const until = async <T>(callback: () => Promise<T>): Promise<[Error | null, T | null]> => {
  try {
    const result = await callback();
    return [null, result];
  } catch (error) {
    return [error as Error, null];
  }
};
