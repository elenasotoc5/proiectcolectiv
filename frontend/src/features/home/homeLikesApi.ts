import { getAuthHeaders } from "@/lib/auth";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "");

export interface LikedHome {
    id: number;
    ownerId: number;
    title: string;
    city: string;
    county?: string;
    description?: string;
    housingType?: string;
    guestCapacity?: number;
    amenities?: string[];
    primaryPhotoUrl?: string | null;
}

async function checkResponse(response: Response, fallback: string): Promise<void> {
    if (response.ok) return;
    const body: unknown = await response.json().catch(() => null);
    const message = body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : fallback;
    throw new Error(`${message} (${response.status})`);
}

export async function getLikedHomes(signal?: AbortSignal): Promise<LikedHome[]> {
    const response = await fetch(`${API_URL}/api/v1/homes/liked`, {
        headers: getAuthHeaders(),
        signal,
    });
    await checkResponse(response, "Could not load liked homes");
    const data: unknown = await response.json();
    if (!Array.isArray(data)) throw new Error("Invalid liked homes response");
    return data as LikedHome[];
}

export async function likeHome(homeId: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/v1/homes/${homeId}/like`, {
        method: "POST",
        headers: getAuthHeaders(),
    });
    await checkResponse(response, "Could not like home");
}

export async function unlikeHome(homeId: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/v1/homes/${homeId}/like`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });
    await checkResponse(response, "Could not remove liked home");
}

export function homeImageUrl(path?: string | null): string | undefined {
    if (!path) return undefined;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}
