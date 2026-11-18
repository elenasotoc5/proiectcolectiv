import { useState, useEffect } from "react";

export interface County {
    id: string; 
    name: string;
}

export const ROMANIAN_COUNTIES: readonly County[] = [
    { id: "AB", name: "Alba" },
    { id: "AR", name: "Arad" },
    { id: "AG", name: "Argeș" },
    { id: "BC", name: "Bacău" },
    { id: "BH", name: "Bihor" },
    { id: "BN", name: "Bistrița-Năsăud" },
    { id: "BT", name: "Botoșani" },
    { id: "BV", name: "Brașov" },
    { id: "BR", name: "Brăila" },
    { id: "B", name: "București" },
    { id: "BZ", name: "Buzău" },
    { id: "CL", name: "Călărași" },
    { id: "CS", name: "Caraș-Severin" },
    { id: "CJ", name: "Cluj" },
    { id: "CT", name: "Constanța" },
    { id: "CV", name: "Covasna" },
    { id: "DB", name: "Dâmbovița" },
    { id: "DJ", name: "Dolj" },
    { id: "GL", name: "Galați" },
    { id: "GR", name: "Giurgiu" },
    { id: "GJ", name: "Gorj" },
    { id: "HR", name: "Harghita" },
    { id: "HD", name: "Hunedoara" },
    { id: "IL", name: "Ialomița" },
    { id: "IS", name: "Iași" },
    { id: "IF", name: "Ilfov" },
    { id: "MM", name: "Maramureș" },
    { id: "MH", name: "Mehedinți" },
    { id: "MS", name: "Mureș" },
    { id: "NT", name: "Neamț" },
    { id: "OT", name: "Olt" },
    { id: "PH", name: "Prahova" },
    { id: "SM", name: "Satu Mare" },
    { id: "SJ", name: "Sălaj" },
    { id: "SB", name: "Sibiu" },
    { id: "SV", name: "Suceava" },
    { id: "TR", name: "Teleorman" },
    { id: "TM", name: "Timiș" },
    { id: "TL", name: "Tulcea" },
    { id: "VS", name: "Vaslui" },
    { id: "VL", name: "Vâlcea" },
    { id: "VN", name: "Vrancea" },
] as const;

export type CountyId = (typeof ROMANIAN_COUNTIES)[number]["id"];

const countyMap: Map<string, County> = new Map(
    ROMANIAN_COUNTIES.map((c) => [c.id.toUpperCase(), c])
);

export const COUNTY_BY_ID: ReadonlyMap<string, County> = countyMap;

function updateCountyMap(counties: County[]) {
    countyMap.clear();
    for (const c of counties) {
        countyMap.set(c.id.toUpperCase(), c);
    }
}

const API_URL = import.meta.env.API_URL || import.meta.env.VITE_API_URL || "http://localhost:8080";
const COUNTIES_STORAGE_KEY = "lifeswap_counties_cache";

let cachedCounties: County[] | null = null;
let countiesPromise: Promise<County[]> | null = null;

// Initialize from sessionStorage if available
try {
    if (typeof window !== "undefined") {
        const stored = sessionStorage.getItem(COUNTIES_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                cachedCounties = parsed;
                updateCountyMap(parsed);
            }
        }
    }
} catch {
    // Ignore storage parse issues
}

export function getCounties(): County[] {
    return cachedCounties ? [...cachedCounties] : [...ROMANIAN_COUNTIES];
}

export async function fetchCounties(): Promise<County[]> {
    if (cachedCounties) {
        return cachedCounties;
    }
    if (countiesPromise) {
        return countiesPromise;
    }

    countiesPromise = (async () => {
        try {
            const response = await fetch(`${API_URL}/api/v1/counties`);
            if (response.ok) {
                const data: County[] = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    cachedCounties = data;
                    updateCountyMap(data);
                    try {
                        if (typeof window !== "undefined") {
                            sessionStorage.setItem(COUNTIES_STORAGE_KEY, JSON.stringify(data));
                        }
                    } catch {
                        // Ignore storage write issues
                    }
                    return data;
                }
            }
        } catch (err) {
            console.warn("Failed to fetch counties from backend, falling back to static list:", err);
        } finally {
            countiesPromise = null;
        }

        if (!cachedCounties) {
            cachedCounties = [...ROMANIAN_COUNTIES];
            updateCountyMap(cachedCounties);
        }
        return cachedCounties;
    })();

    return countiesPromise;
}

export function isValidCountyId(id: string | null | undefined): boolean {
    if (!id) return false;
    return countyMap.has(id.trim().toUpperCase());
}

export function getCountyName(id: string | null | undefined): string {
    if (!id) return "";
    return countyMap.get(id.trim().toUpperCase())?.name || id;
}

export function useCounties(): County[] {
    const [counties, setCounties] = useState<County[]>(() => getCounties());

    useEffect(() => {
        let isMounted = true;
        fetchCounties().then((data) => {
            if (isMounted) {
                setCounties(data);
            }
        });
        return () => {
            isMounted = false;
        };
    }, []);

    return counties;
}
