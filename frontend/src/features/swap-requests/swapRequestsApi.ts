import { getAuthHeaders } from "@/lib/auth";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "");

export const SWAP_DAYS = 7;

export type SwapRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";

export interface SwapHome {
    id: number;
    ownerId: number;
    title: string;
    city: string;
    county?: string;
    housingType?: string;
    guestCapacity?: number;
    primaryPhotoUrl?: string | null;
}

export interface SwapRequest {
    id: number;
    requesterHomeId: number;
    targetHomeId: number;
    requesterHome?: SwapHome;
    targetHome?: SwapHome;
    startDate: string;
    endDate: string;
    status: SwapRequestStatus;
    createdAt?: string;
}

export interface AvailabilityPeriod {
    id: number;
    startDate: string;
    endDate: string;
}

async function checkResponse(response: Response, fallback: string): Promise<void> {
    if (response.ok) return;
    const body: unknown = await response.json().catch(() => null);
    const message = body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : fallback;
    throw new Error(message);
}

export async function getMyHomes(signal?: AbortSignal): Promise<SwapHome[]> {
    const response = await fetch(`${API_URL}/api/v1/homes/mine`, { headers: getAuthHeaders(), signal });
    await checkResponse(response, "Could not load your homes");
    const data: unknown = await response.json();
    return Array.isArray(data) ? (data as SwapHome[]) : [];
}

export async function getHomeAvailability(homeId: number, signal?: AbortSignal): Promise<AvailabilityPeriod[]> {
    const response = await fetch(`${API_URL}/api/v1/homes/${homeId}/availability`, {
        headers: getAuthHeaders(),
        signal,
    });
    await checkResponse(response, "Could not load availability");
    const data: unknown = await response.json();
    return Array.isArray(data) ? (data as AvailabilityPeriod[]) : [];
}

export async function createSwapRequest(body: {
    requesterHomeId: number;
    targetHomeId: number;
    startDate: string;
}): Promise<SwapRequest> {
    const response = await fetch(`${API_URL}/api/v1/swap-requests`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    await checkResponse(response, "Could not send swap request");
    return (await response.json()) as SwapRequest;
}

/** Local-time YYYY-MM-DD, matching the backend LocalDate format. */
export function toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/** Mirrors the backend rule: all seven days must fall inside one availability period. */
export function coversSwap(periods: AvailabilityPeriod[], start: Date): boolean {
    const from = toIsoDate(start);
    const end = new Date(start);
    end.setDate(end.getDate() + SWAP_DAYS - 1);
    const to = toIsoDate(end);
    return periods.some((p) => p.startDate <= from && p.endDate >= to);
}

export async function getSentSwapRequests(signal?: AbortSignal): Promise<SwapRequest[]> {
    const response = await fetch(`${API_URL}/api/v1/swap-requests/sent`, { headers: getAuthHeaders(), signal });
    await checkResponse(response, "Could not load sent swap requests");
    const data: unknown = await response.json();
    return Array.isArray(data) ? (data as SwapRequest[]) : [];
}

export async function getReceivedSwapRequests(signal?: AbortSignal): Promise<SwapRequest[]> {
    const response = await fetch(`${API_URL}/api/v1/swap-requests/received`, { headers: getAuthHeaders(), signal });
    await checkResponse(response, "Could not load received swap requests");
    const data: unknown = await response.json();
    return Array.isArray(data) ? (data as SwapRequest[]) : [];
}

export async function getSwapRequest(id: number, signal?: AbortSignal): Promise<SwapRequest> {
    const response = await fetch(`${API_URL}/api/v1/swap-requests/${id}`, { headers: getAuthHeaders(), signal });
    await checkResponse(response, "Could not load swap request");
    return (await response.json()) as SwapRequest;
}
