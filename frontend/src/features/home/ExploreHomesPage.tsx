import { useState, useEffect, useRef } from "react";
import {
    Compass,
    Loader2,
    AlertCircle,
    MapPin,
    Search,
    ChevronLeft,
    ChevronRight,
    Users,
    Heart,
    X,
    RotateCcw,
    Sparkles,
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

const SWIPE_THRESHOLD = 110;

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

interface TinderSwipeCardProps {
    home: HomeResponse;
    onSelect: (id: number) => void;
    onSwipe: (direction: "left" | "right", home: HomeResponse) => void;
}

function TinderSwipeCard({ home, onSelect, onSwipe }: TinderSwipeCardProps) {
    const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
    const [photoList, setPhotoList] = useState<string[]>(() => {
        if (home.photos && home.photos.length > 0) {
            return home.photos.map((p) => `${API_URL}${p.url}`);
        }
        return home.primaryPhotoUrl ? [`${API_URL}${home.primaryPhotoUrl}`] : [FALLBACK_IMAGE];
    });
    const [fetchedAllPhotos, setFetchedAllPhotos] = useState(false);

    // Stare pentru drag / swipe în stil Tinder
    const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);

    const startPosRef = useRef<{ x: number; y: number } | null>(null);
    const hasMovedRef = useRef(false);

    useEffect(() => {
        setCurrentPhotoIdx(0);
        setDragOffset({ x: 0, y: 0 });
        setExitDirection(null);
        setPhotoList(
            home.photos && home.photos.length > 0
                ? home.photos.map((p) => `${API_URL}${p.url}`)
                : home.primaryPhotoUrl
                    ? [`${API_URL}${home.primaryPhotoUrl}`]
                    : [FALLBACK_IMAGE]
        );
        setFetchedAllPhotos(false);
    }, [home]);

    useEffect(() => {
        if (fetchedAllPhotos || (home.photos && home.photos.length > 1)) return;
        let active = true;
        setFetchedAllPhotos(true);

        fetch(`${API_URL}/api/v1/homes/${home.id}/photos`, {
            headers: getAuthHeaders(),
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((data: HomePhoto[] | null) => {
                if (active && data && data.length > 0) {
                    setPhotoList(data.map((p) => `${API_URL}${p.url}`));
                }
            })
            .catch(() => {
                // păstrăm poza principală dacă nu există alte poze
            });

        return () => {
            active = false;
        };
    }, [home.id, home.photos, fetchedAllPhotos]);

    const triggerSwipe = (direction: "left" | "right") => {
        if (exitDirection) return;
        setExitDirection(direction);
        setDragOffset({ x: direction === "right" ? 520 : -520, y: 25 });
        window.setTimeout(() => {
            onSwipe(direction, home);
        }, 220);
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (exitDirection) return;
        if ((e.target as HTMLElement).closest("[data-no-drag='true']")) return;

        e.currentTarget.setPointerCapture(e.pointerId);
        startPosRef.current = { x: e.clientX, y: e.clientY };
        hasMovedRef.current = false;
        setIsDragging(true);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging || !startPosRef.current || exitDirection) return;
        const dx = e.clientX - startPosRef.current.x;
        const dy = e.clientY - startPosRef.current.y;

        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
            hasMovedRef.current = true;
        }

        setDragOffset({ x: dx, y: dy * 0.35 });
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
        setIsDragging(false);
        startPosRef.current = null;

        if (dragOffset.x > SWIPE_THRESHOLD) {
            triggerSwipe("right");
        } else if (dragOffset.x < -SWIPE_THRESHOLD) {
            triggerSwipe("left");
        } else {
            setDragOffset({ x: 0, y: 0 });
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

    const handleOpenDetails = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!hasMovedRef.current) {
            onSelect(home.id);
        }
    };

    const activeImage = photoList[currentPhotoIdx] || FALLBACK_IMAGE;
    const rotation = dragOffset.x * 0.06;
    const likeOpacity = Math.min(1, Math.max(0, (dragOffset.x - 25) / 85));
    const nopeOpacity = Math.min(1, Math.max(0, (-dragOffset.x - 25) / 85));

    return (
        <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
                transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotation}deg)`,
                transition: isDragging
                    ? "none"
                    : "transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
            className="relative w-full select-none touch-none cursor-grab active:cursor-grabbing"
        >
            <Card className="overflow-hidden border-2 bg-card shadow-2xl rounded-3xl flex flex-col">
                {/* Zona foto cu săgeți de derulare și indicatoare LIKE / NOPE */}
                <div className="relative h-72 sm:h-80 w-full bg-muted overflow-hidden">
                    <img
                        src={activeImage}
                        alt={home.title}
                        draggable={false}
                        className="h-full w-full object-cover pointer-events-none"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== FALLBACK_IMAGE) {
                                target.src = FALLBACK_IMAGE;
                            }
                        }}
                    />

                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent pointer-events-none" />

                    {/* Badge LIKE (dreapta) */}
                    {likeOpacity > 0 && (
                        <div
                            style={{ opacity: likeOpacity }}
                            className="pointer-events-none absolute top-5 left-5 z-20 rounded-xl border-4 border-emerald-500 bg-emerald-500/15 px-3.5 py-1 text-xl font-black tracking-wider text-emerald-400 -rotate-12 backdrop-blur-[2px]"
                        >
                            LIKE
                        </div>
                    )}

                    {/* Badge NOPE (stânga) */}
                    {nopeOpacity > 0 && (
                        <div
                            style={{ opacity: nopeOpacity }}
                            className="pointer-events-none absolute top-5 right-5 z-20 rounded-xl border-4 border-rose-500 bg-rose-500/15 px-3.5 py-1 text-xl font-black tracking-wider text-rose-400 rotate-12 backdrop-blur-[2px]"
                        >
                            NOPE
                        </div>
                    )}

                    {photoList.length > 1 && (
                        <>
                            <button
                                type="button"
                                data-no-drag="true"
                                onClick={handlePrevPhoto}
                                aria-label="Previous photo"
                                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex size-9 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-md hover:bg-white hover:scale-105 transition-all"
                            >
                                <ChevronLeft className="size-4" />
                            </button>

                            <button
                                type="button"
                                data-no-drag="true"
                                onClick={handleNextPhoto}
                                aria-label="Next photo"
                                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex size-9 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-md hover:bg-white hover:scale-105 transition-all"
                            >
                                <ChevronRight className="size-4" />
                            </button>

                            <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
                                {photoList.slice(0, 6).map((_, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        data-no-drag="true"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentPhotoIdx(idx);
                                        }}
                                        aria-label={`Photo ${idx + 1}`}
                                        className={`h-1.5 rounded-full transition-all ${
                                            idx === currentPhotoIdx
                                                ? "w-4 bg-white"
                                                : "w-1.5 bg-white/60"
                                        }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    <span className="absolute top-3.5 left-3.5 rounded-full bg-background/90 backdrop-blur-sm px-3 py-1 text-xs font-semibold shadow-sm">
                        {home.housingType}
                    </span>

                    {photoList.length > 1 && (
                        <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-0.5 text-[11px] font-medium text-white">
                            {currentPhotoIdx + 1}/{photoList.length}
                        </span>
                    )}
                </div>

                {/* Detalii pe card */}
                <CardHeader className="space-y-1.5 p-5 pb-2">
                    <div className="flex items-start justify-between gap-3">
                        <CardTitle
                            data-no-drag="true"
                            onClick={handleOpenDetails}
                            className="text-xl font-bold tracking-tight line-clamp-1 hover:text-primary transition-colors cursor-pointer"
                        >
                            {home.title}
                        </CardTitle>
                    </div>
                    <CardDescription className="flex items-center gap-1.5 text-xs font-medium">
                        <MapPin className="size-3.5 shrink-0 text-primary" />
                        {home.city}
                        {home.county ? `, ${getCountyName(home.county)}` : ""}
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-5 pt-1 flex flex-col gap-4">
                    <p className="line-clamp-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {home.description}
                    </p>

                    <div className="flex items-center justify-between border-t pt-3 text-xs">
                        <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                            <Users className="size-3.5" />
                            {home.guestCapacity} {home.guestCapacity === 1 ? "guest" : "guests"}
                        </span>

                        <button
                            type="button"
                            data-no-drag="true"
                            onClick={handleOpenDetails}
                            className="font-semibold text-primary hover:underline cursor-pointer"
                        >
                            View Details &rarr;
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ExploreHomesPage() {
    const counties = useCounties();
    const [homes, setHomes] = useState<HomeResponse[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [likedIds, setLikedIds] = useState<number[]>([]);
    const [passedIds, setPassedIds] = useState<number[]>([]);
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
            setCurrentIndex(0);
            setLikedIds([]);
            setPassedIds([]);
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

    const handleSwipe = (direction: "left" | "right", home: HomeResponse) => {
        if (direction === "right") {
            setLikedIds((prev) => (prev.includes(home.id) ? prev : [...prev, home.id]));
        } else {
            setPassedIds((prev) => (prev.includes(home.id) ? prev : [...prev, home.id]));
        }
        setCurrentIndex((prev) => prev + 1);
    };

    const handleRestartDeck = () => {
        setCurrentIndex(0);
        setLikedIds([]);
        setPassedIds([]);
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

    const activeHome = homes[currentIndex] || null;
    const nextHome = homes[currentIndex + 1] || null;

    return (
        <main className="mx-auto w-full max-w-4xl px-6 py-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2.5">
                        <Compass className="size-8 text-primary" />
                        Explore Homes
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Swipe right if you like a home or left to pass — inspect photos and details anytime.
                    </p>
                </div>

                {homes.length > 0 && (
                    <div className="flex items-center gap-3 text-xs font-medium">
                        <span className="rounded-full bg-rose-500/10 text-rose-600 px-3 py-1">
                            Passed: {passedIds.length}
                        </span>
                        <span className="rounded-full bg-emerald-500/10 text-emerald-600 px-3 py-1">
                            Liked: {likedIds.length}
                        </span>
                    </div>
                )}
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
            ) : !activeHome ? (
                <Card className="border shadow-md rounded-3xl">
                    <CardContent className="py-14 px-6 text-center space-y-5">
                        <div className="size-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Sparkles className="size-8" />
                        </div>
                        <div className="space-y-1.5">
                            <h3 className="text-xl font-bold">You&apos;ve seen all homes in this list!</h3>
                            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                You liked <span className="font-semibold text-emerald-600">{likedIds.length}</span>{" "}
                                {likedIds.length === 1 ? "home" : "homes"} and passed on{" "}
                                <span className="font-semibold text-rose-600">{passedIds.length}</span>.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                            <Button onClick={handleRestartDeck} className="gap-2 rounded-xl">
                                <RotateCcw className="size-4" />
                                Swipe Again
                            </Button>
                            {selectedCounty && (
                                <Button variant="outline" onClick={handleClearFilters} className="rounded-xl">
                                    View All Counties
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="flex flex-col items-center space-y-6 py-2">
                    <div className="text-xs font-medium text-muted-foreground">
                        Home {currentIndex + 1} of {homes.length}
                    </div>

                    {/* Deck de carduri suprapuse */}
                    <div className="relative w-full max-w-md">
                        {nextHome && (
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-0 translate-y-3 scale-[0.96] opacity-60"
                            >
                                <Card className="h-full overflow-hidden border rounded-3xl bg-card">
                                    <div className="h-72 sm:h-80 w-full bg-muted overflow-hidden">
                                        <img
                                            src={
                                                nextHome.photos?.[0]?.url
                                                    ? `${API_URL}${nextHome.photos[0].url}`
                                                    : nextHome.primaryPhotoUrl
                                                        ? `${API_URL}${nextHome.primaryPhotoUrl}`
                                                        : FALLBACK_IMAGE
                                            }
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                </Card>
                            </div>
                        )}

                        <TinderSwipeCard
                            key={activeHome.id}
                            home={activeHome}
                            onSelect={(id) => setSelectedHomeId(id)}
                            onSwipe={handleSwipe}
                        />
                    </div>

                    {/* Butoane Stânga (Nope) / Dreapta (Like) */}
                    <div className="flex items-center justify-center gap-6 pt-1">
                        <button
                            type="button"
                            onClick={() => handleSwipe("left", activeHome)}
                            aria-label="Pass home"
                            title="Pass (Swipe Left)"
                            className="flex size-14 items-center justify-center rounded-full border-2 border-rose-500/40 bg-background text-rose-500 shadow-lg hover:bg-rose-500 hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        >
                            <X className="size-7" />
                        </button>

                        <button
                            type="button"
                            onClick={() => handleSwipe("right", activeHome)}
                            aria-label="Like home"
                            title="Like (Swipe Right)"
                            className="flex size-14 items-center justify-center rounded-full border-2 border-emerald-500/40 bg-background text-emerald-500 shadow-lg hover:bg-emerald-500 hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        >
                            <Heart className="size-7" />
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}