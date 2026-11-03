export const TOKEN_KEY = "token";
export const ACCESS_TOKEN_KEY = "token";
export const USER_ID_KEY = "lifeSwapUserId";
export const USER_KEY = "lifeSwapUser";

export function getStoredAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function setStoredAccessToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    // Ensure any legacy accessToken key is cleaned up so only 'token' remains
    localStorage.removeItem("accessToken");
}

export function clearStoredAuth(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("accessToken");
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
