import { AxiosError } from 'axios';

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.detail as string | undefined;
    const title = error.response?.data?.title as string | undefined;
    return detail ?? title ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}