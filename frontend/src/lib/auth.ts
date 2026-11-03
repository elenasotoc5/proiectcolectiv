export const ACCESS_TOKEN_KEY = "accessToken";
export const TOKEN_KEY = "token";
export const USER_ID_KEY = "lifeSwapUserId";
export const USER_KEY = "lifeSwapUser";

export function getStoredAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
}

export function setStoredAccessToken(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredAuth(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_KEY);
}

export function getAuthHeaders(): Record<string, string> {
    const token = getStoredAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export function isUserAuthenticated(): boolean {
    return Boolean(getStoredAccessToken());
}
