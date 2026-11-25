import { useEffect, useState } from "react";
import countyGeoJsonUrl from "./data/romania-counties.geojson?url";
import { ROMANIAN_COUNTIES } from "./counties";

type Coordinates = [number, number];
type Geometry =
    | { type: "Polygon"; coordinates: Coordinates[][] }
    | { type: "MultiPolygon"; coordinates: Coordinates[][][] };
type CountyFeature = {
    type: "Feature";
    properties: Record<string, unknown> | null;
    geometry: Geometry | null;
};
type FeatureCollection = {
    type: "FeatureCollection";
    features: CountyFeature[];
};

type MapCounty = {
    id: string;
    name: string;
    geometry: Geometry;
};

interface RomaniaCountyMapProps {
    selectedCounties: string[];
    onToggle: (countyId: string) => void;
    disabled?: boolean;
    className?: string;
}

const WIDTH = 900;
const HEIGHT = 590;
const PADDING = 30;

const normalize = (value: string) =>
    value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");

const countyById = new Map(ROMANIAN_COUNTIES.map((county) => [county.id, county]));
const countyByName = new Map(
    ROMANIAN_COUNTIES.map((county) => [normalize(county.name), county])
);

function getCounty(feature: CountyFeature): MapCounty | null {
    if (!feature.geometry) return null;
    if (feature.geometry.type !== "Polygon" && feature.geometry.type !== "MultiPolygon") {
        return null;
    }

    const properties = feature.properties ?? {};
    const strings = Object.values(properties).filter(
        (value): value is string => typeof value === "string"
    );

    for (const candidate of strings) {
        const normalized = normalize(candidate);
        const byCode = countyById.get(candidate.trim().toUpperCase());
        const byName = countyByName.get(normalized);
        const specialBucharest =
            normalized === "MUNICIPIULBUCURESTI" || normalized === "BUCHAREST"
                ? countyById.get("B")
                : undefined;
        const county = byCode ?? byName ?? specialBucharest;
        if (county) {
            return { id: county.id, name: county.name, geometry: feature.geometry };
        }
    }

    return null;
}

function geometryRings(geometry: Geometry): Coordinates[][] {
    return geometry.type === "Polygon"
        ? geometry.coordinates
        : geometry.coordinates.flat();
}

type ProjectedCounty = MapCounty & { path: string };

function projectCounties(counties: MapCounty[]): ProjectedCounty[] {
    const allPoints = counties.flatMap((county) => geometryRings(county.geometry).flat());
    if (allPoints.length === 0) return [];

    const meanLatitude =
        allPoints.reduce((sum, point) => sum + point[1], 0) / allPoints.length;
    const longitudeFactor = Math.cos((meanLatitude * Math.PI) / 180);
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const [longitude, latitude] of allPoints) {
        const x = longitude * longitudeFactor;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (latitude < minY) minY = latitude;
        if (latitude > maxY) maxY = latitude;
    }
    const scale = Math.min(
        (WIDTH - PADDING * 2) / Math.max(maxX - minX, 0.000001),
        (HEIGHT - PADDING * 2) / Math.max(maxY - minY, 0.000001)
    );
    const offsetX = (WIDTH - (maxX - minX) * scale) / 2;
    const offsetY = (HEIGHT - (maxY - minY) * scale) / 2;

    const toXY = ([longitude, latitude]: Coordinates) => [
        offsetX + (longitude * longitudeFactor - minX) * scale,
        HEIGHT - offsetY - (latitude - minY) * scale,
    ];

    return counties.map((county) => {
        const path = geometryRings(county.geometry)
            .map(
                (ring) =>
                    ring
                        .map((point, index) => {
                            const [x, y] = toXY(point);
                            return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
                        })
                        .join(" ") + " Z"
            )
            .join(" ");
        return { ...county, path };
    });
}

let projectedCountiesPromise: Promise<ProjectedCounty[]> | null = null;

function loadProjectedCounties(): Promise<ProjectedCounty[]> {
    if (!projectedCountiesPromise) {
        projectedCountiesPromise = (async () => {
            const response = await fetch(countyGeoJsonUrl);
            if (!response.ok) throw new Error("Could not load the Romania county map.");
            const data: FeatureCollection = await response.json();
            if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
                throw new Error("Invalid county map data.");
            }

            const mapped = data.features
                .map(getCounty)
                .filter((county): county is MapCounty => county !== null);

            if (new Set(mapped.map((county) => county.id)).size !== 42) {
                throw new Error("County map data does not match all 42 Romanian locations.");
            }
            return projectCounties(mapped);
        })().catch((err) => {
            projectedCountiesPromise = null;
            throw err;
        });
    }
    return projectedCountiesPromise;
}

export default function RomaniaCountyMap({
                                             selectedCounties,
                                             onToggle,
                                             disabled = false,
                                             className = "",
                                         }: RomaniaCountyMapProps) {
    const [projected, setProjected] = useState<ProjectedCounty[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        loadProjectedCounties()
            .then((counties) => {
                if (isMounted) setProjected(counties);
            })
            .catch((err: unknown) => {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : "Could not load the map.");
                }
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });
        return () => {
            isMounted = false;
        };
    }, []);

    const selected = new Set(selectedCounties.map((county) => county.trim().toUpperCase()));

    const toggle = (id: string) => {
        if (disabled) return;
        onToggle(id);
    };

    return (
        <div className={`space-y-3 ${className}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">Select your preferred Romanian counties</p>
                <span className="rounded-full border px-3 py-1 text-xs font-medium">
          {selected.size} selected
        </span>
            </div>

            {loading && <p className="text-sm text-muted-foreground">Loading map...</p>}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

            {!loading && !error && (
                <div className="overflow-hidden rounded-xl border bg-muted/20 p-2 sm:p-4">
                    <svg
                        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                        role="group"
                        aria-label="Interactive map of Romanian counties"
                        className="h-auto w-full"
                    >
                        {projected.map((county) => {
                            const isSelected = selected.has(county.id);
                            const isHovered = hoveredId === county.id;
                            return (
                                <path
                                    key={county.id}
                                    d={county.path}
                                    fill={isSelected ? "#0d9488" : isHovered ? "#99f6e4" : "#cbd5e1"}
                                    fillRule="evenodd"
                                    stroke="#ffffff"
                                    strokeWidth={isSelected ? 2 : 1.2}
                                    strokeLinejoin="round"
                                    className="cursor-pointer transition-colors focus:outline-none focus:stroke-slate-900"
                                    role="button"
                                    tabIndex={disabled ? -1 : 0}
                                    aria-label={`${county.name}, ${isSelected ? "selected" : "not selected"}`}
                                    aria-pressed={isSelected}
                                    aria-disabled={disabled}
                                    onClick={() => toggle(county.id)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            toggle(county.id);
                                        }
                                    }}
                                    onMouseEnter={() => setHoveredId(county.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                    onFocus={() => setHoveredId(county.id)}
                                    onBlur={() => setHoveredId(null)}
                                >
                                    <title>{county.name}</title>
                                </path>
                            );
                        })}
                    </svg>
                </div>
            )}

            <p className="text-xs text-muted-foreground">
                Click a county to select or remove it. Changes are not saved automatically.
            </p>
            <p className="text-xs text-muted-foreground">
                Administrative boundaries: geo-spatial.org (ANCPI / INS), CC BY-SA 4.0.
                Mirror: National Youth Foundation.
            </p>
        </div>
    );
}
