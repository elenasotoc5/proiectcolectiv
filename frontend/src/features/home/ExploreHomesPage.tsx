import { useState, useEffect } from "react";
import {
    Compass,
    Loader2,
    AlertCircle,
    MapPin,
    Search,
    ChevronLeft,
    ChevronRight,
    Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { useCounties, getCountyName } from "@/features/counties/counties";
import { getAuthHeaders } from "@/lib/auth";
import HomeDetailsPage from "./HomeDetailsPage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const FALLBACK_IMAGE =
    "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='15' fill='%2394a3b8'%3ENo Image Available%3C/text%3E%3C/svg%3E";

interface HomePhoto {
    id: number;
    url: string;
    isPrimary?: boolean;
}

interface HomeResponse {
    id: number;
    ownerId: number;
    title: string;
    city: string;
    county: string;
    address?: string;
    description: string;
    housingType: string;
    guestCapacity: number;
    amenities: string[];
    primaryPhotoUrl?: string;
    photos?: HomePhoto[];
}

function HomeCard({ home, onSelect }: { home: HomeResponse; onSelect: (id: number) => void }) {
    const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
    const [photoList, setPhotoList] = useState<string[]>(() => {
        if (home.photos && home.photos.length > 0) {
            return home.photos.map((p) => `${API_URL}${p.url}`);
        }
        return home.primaryPhotoUrl ? [`${API_URL}${home.primaryPhotoUrl}`] : [FALLBACK_IMAGE];
    });
    const [fetchedAllPhotos, setFetchedAllPhotos] = useState(false);

    const handleMouseEnter = async () => {
        if (fetchedAllPhotos || (home.photos && home.photos.length > 1)) return;
        setFetchedAllPhotos(true);
        try {
            const res = await fetch(`${API_URL}/api/v1/homes/${home.id}/photos`, {
                headers: getAuthHeaders(),
            });
            if (res.ok) {
                const data: HomePhoto[] = await res.json();
                if (data && data.length > 0) {
                    setPhotoList(data.map((p) => `${API_URL}${p.url}`));
                }
            }
        } catch {
            // păstrăm imaginea existentă dacă endpoint-ul nu returnează alte poze
        }
    };

    const handlePrevPhoto = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentPhotoIdx((prev) => (prev === 0 ? photoList.length - 1 : prev - 1));
    };

    const handleNextPhoto = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentPhotoIdx((prev) => (prev === photoList.length - 1 ? 0 : prev + 1));
    };

    const activeImage = photoList[currentPhotoIdx] || FALLBACK_IMAGE;

    return (
        <div
            onClick={() => onSelect(home.id)}
            onMouseEnter={handleMouseEnter}
            className="group block cursor-pointer"
        >
            <Card className="overflow-hidden border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl h-full flex flex-col rounded-2xl">
                <div className="relative h-56 w-full bg-muted overflow-hidden">
                    <img
                        src={activeImage}
                        alt={home.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== FALLBACK_IMAGE) {
                                target.src = FALLBACK_IMAGE;
                            }
                        }}
                    />

                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

                    {photoList.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={handlePrevPhoto}
                                aria-label="Previous photo"
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 flex size-8 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-md opacity-0 group-hover:opacity-100 hover:bg-white hover:scale-105 transition-all"
                            >
                                <ChevronLeft className="size-4" />
                            </button>

                            <button
                                type="button"
                                onClick={handleNextPhoto}
                                aria-label="Next photo"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 flex size-8 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-md opacity-0 group-hover:opacity-100 hover:bg-white hover:scale-105 transition-all"
                            >
                                <ChevronRight className="size-4" />
                            </button>

                            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5">
                                {photoList.slice(0, 5).map((_, idx) => (
                                    <span
                                        key={idx}
                                        className={`h-1.5 rounded-full transition-all ${
                                            idx === currentPhotoIdx
                                                ? "w-3.5 bg-white"
                                                : "w-1.5 bg-white/60"
                                        }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    <span className="absolute top-3 left-3 rounded-full bg-background/90 backdrop-blur-sm px-3 py-1 text-xs font-semibold shadow-sm">
                        {home.housingType}
                    </span>
                </div>

                <CardHeader className="space-y-1 p-5 pb-2">
                    <CardTitle className="text-lg font-bold tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                        {home.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1.5 text-xs font-medium">
                        <MapPin className="size-3.5 shrink-0 text-primary" />
                        {home.city}
                        {home.county ? `, ${getCountyName(home.county)}` : ""}
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-5 pt-1 mt-auto flex flex-col gap-3">
                    <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                        {home.description}
                    </p>
                    <div className="flex items-center justify-between border-t pt-3 text-xs">
                        <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                            <Users className="size-3.5" />
                            {home.guestCapacity} {home.guestCapacity === 1 ? "guest" : "guests"}
                        </span>
                        <span className="font-semibold text-primary group-hover:underline">
                            View Details &rarr;
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ExploreHomesPage() {
    const counties = useCounties();
    const [homes, setHomes] = useState<HomeResponse[]>([]);
    const [selectedCounty, setSelectedCounty] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedHomeId, setSelectedHomeId] = useState<number | null>(null);

    const fetchHomes = async (countyFilter: string = "") => {
        try {
            setLoading(true);
            setError(null);

            const endpoint = countyFilter
                ? `${API_URL}/api/v1/homes?county=${encodeURIComponent(countyFilter)}`
                : `${API_URL}/api/v1/homes`;

            const response = await fetch(endpoint, {
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`Failed to load homes (${response.status}).`);
            }

            const data: HomeResponse[] = await response.json();
            const filtered = countyFilter
                ? data.filter((h) => h.county?.toUpperCase() === countyFilter.toUpperCase())
                : data;

            setHomes(filtered);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHomes();
    }, []);

    const handleCountyChange = (countyId: string) => {
        setSelectedCounty(countyId);
        fetchHomes(countyId);
    };

    const handleClearFilters = () => {
        setSelectedCounty("");
        fetchHomes("");
    };

    if (selectedHomeId !== null) {
        return (
            <HomeDetailsPage
                homeId={selectedHomeId}
                isOwner={false}
                onBack={() => {
                    setSelectedHomeId(null);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                }}
            />
        );
    }

    if (loading && homes.length === 0) {
        return (
            <main className="flex items-center justify-center min-h-[50vh] gap-3">
                <Loader2 className="size-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading homes...</p>
            </main>
        );
    }

    if (error) {
        return (
            <main className="mx-auto max-w-4xl px-6 py-12">
                <div
                    role="alert"
                    className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-destructive"
                >
                    <AlertCircle className="size-5 shrink-0" />
                    <div>
                        <h2 className="font-semibold">Error loading homes</h2>
                        <p className="text-sm mt-0.5">{error}</p>
                    </div>
                </div>
                <Button className="mt-4" variant="outline" onClick={() => fetchHomes(selectedCounty)}>
                    Try Again
                </Button>
            </main>
        );
    }

    return (
        <main className="mx-auto w-full max-w-6xl px-6 py-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2.5">
                        <Compass className="size-8 text-primary" />
                        Explore Homes
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Browse all available homes across Romania and inspect their full photo galleries.
                    </p>
                </div>
            </div>

            <Card className="border shadow-sm rounded-2xl">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                        <span className="text-sm font-medium flex items-center gap-2">
                            <Search className="size-4 text-muted-foreground" />
                            Filter by County:
                        </span>
                        <NativeSelect
                            value={selectedCounty}
                            onChange={(e) => handleCountyChange(e.target.value)}
                            className="w-full sm:w-64"
                        >
                            <NativeSelectOption value="">All Counties (Default)</NativeSelectOption>
                            {counties.map((c) => (
                                <NativeSelectOption key={c.id} value={c.id}>
                                    {c.name} ({c.id})
                                </NativeSelectOption>
                            ))}
                        </NativeSelect>
                    </div>

                    {selectedCounty && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearFilters}
                            className="self-start sm:self-auto"
                        >
                            Clear Filters
                        </Button>
                    )}
                </CardContent>
            </Card>

            {homes.length === 0 ? (
                <Card className="border shadow-sm rounded-2xl">
                    <CardContent className="py-16 text-center space-y-4">
                        <div className="size-16 mx-auto rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            <Compass className="size-8 opacity-50" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-semibold text-lg">No homes found</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                {selectedCounty
                                    ? `No published homes are currently available in ${getCountyName(selectedCounty)}. Try clearing your filter to view all homes.`
                                    : "There are no published homes on the platform at the moment."}
                            </p>
                        </div>
                        {selectedCounty && (
                            <Button size="sm" onClick={handleClearFilters}>
                                Clear Filters
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {homes.map((home) => (
                        <HomeCard
                            key={home.id}
                            home={home}
                            onSelect={(id) => setSelectedHomeId(id)}
                        />
                    ))}
                </div>
            )}
        </main>
    );
}