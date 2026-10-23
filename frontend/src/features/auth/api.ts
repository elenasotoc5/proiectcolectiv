const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export interface UserResponse {
    id: number;
    name: string;
    email: string;
    createdAt: string;
}

export async function registerUser(
    name: string,
    email: string,
    password: string,
): Promise<UserResponse> {
    const res = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
        throw new Error(data?.message ?? "Registration failed");
    }
    return data as UserResponse;
}