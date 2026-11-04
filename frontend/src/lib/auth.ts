export const TOKEN_KEY = "token";
export const ACCESS_TOKEN_KEY = "token";
export const USER_ID_KEY = "lifeSwapUserId";
export const USER_KEY = "lifeSwapUser";

export function getStoredAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function setStoredAccessToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
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

export function getStoredUserId(): number | null {
    const stored = localStorage.getItem(USER_ID_KEY);
    if (stored) {
        const id = parseInt(stored, 10);
        if (!isNaN(id) && id > 0) {
            return id;
        }
    }

    const token = getStoredAccessToken();
    if (token) {
        try {
            const parts = token.split(".");
            if (parts.length === 3) {
                const payloadStr = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
                const payload = JSON.parse(payloadStr);
                const id = payload.userId ?? payload.id;
                if (id) {
                    return Number(id);
                }
            }
        } catch {}
    }

    return null;
}

export function isUserAuthenticated(): boolean {
    return Boolean(getStoredAccessToken());
}
