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

export const COUNTY_BY_ID: ReadonlyMap<string, County> = new Map(
    ROMANIAN_COUNTIES.map((c) => [c.id.toUpperCase(), c])
);

export function isValidCountyId(id: string | null | undefined): boolean {
    if (!id) return false;
    return COUNTY_BY_ID.has(id.trim().toUpperCase());
}

export function getCountyName(id: string | null | undefined): string {
    if (!id) return "";
    return COUNTY_BY_ID.get(id.trim().toUpperCase())?.name || id;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
let cachedFetchedCounties: County[] | null = null;

export async function fetchCounties(): Promise<County[]> {
    if (cachedFetchedCounties) {
        return cachedFetchedCounties;
    }
    try {
        const response = await fetch(`${API_URL}/api/v1/counties`);
        if (response.ok) {
            const data: County[] = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                cachedFetchedCounties = data;
                return data;
            }
        }
    } catch {}
    
    cachedFetchedCounties = [...ROMANIAN_COUNTIES];
    return cachedFetchedCounties;
}
