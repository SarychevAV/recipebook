/**
 * Module-level in-memory token storage.
 * Intentionally NOT stored in localStorage to prevent XSS token theft.
 * Token is lost on page refresh — users must re-authenticate.
 */

let accessToken: string | null = null;

export const tokenStore = {
  getToken: (): string | null => accessToken,
  setToken: (token: string | null): void => {
    accessToken = token;
  },
};