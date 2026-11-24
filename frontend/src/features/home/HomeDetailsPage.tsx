import { useEffect, useState } from "react";
import {
    ArrowLeft,
    MapPin,
    Users,
    Loader2,
    AlertCircle,
    Pencil,
    Trash2,
    Home as HomeIcon,
    CheckCircle2,
    Sparkles,
    ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAuthHeaders } from "@/lib/auth";
import { HomePhotoGallery } from "@/features/home/HomePhotos";
import HomeAvailabilityCalendar from "@/features/home/HomeAvailabilityCalendar";
import { useCounties, getCountyName } from "@/features/counties/counties";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

interface Home {
    id: number;
    ownerId: number;
    title: string;
    city: string;
    county?: string;
    address?: string | null;
    description: string;
    housingType: string;
    guestCapacity: number;
    amenities: string[];
}

interface HomeDetailsPageProps {
    homeId: number;
    isOwner: boolean;
    onBack: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}

export default function HomeDetailsPage({
    homeId,
    isOwner,
    onBack,
    onEdit,
    onDelete,
}: HomeDetailsPageProps) {
    useCounties();
    const [home, setHome] = useState<Home | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [requestSent, setRequestSent] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        const loadHome = async () => {
            setLoading(true);
            setError("");
            setHome(null);

            try {
                const response = await fetch(`${API_URL}/api/v1/homes/${homeId}`, {
                    headers: getAuthHeaders(),
                    signal: controller.signal,
                });

                if (response.status === 404) {
                    throw new Error("Home not found.");
                }

                if (!response.ok) {
                    throw new Error(`Failed to load home (${response.status}).`);
                }

                const data: Home = await response.json();
                setHome(data);
            } catch (err) {
                if (controller.signal.aborted) return;
                setError(err instanceof Error ? err.message : "Could not load home.");
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        void loadHome();

        return () => controller.abort();
    }, [homeId]);

    if (loading) {
        return (
            <main className="flex items-center justify-center min-h-[50vh] gap-3 p-8">
                <Loader2 className="size-6 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Loading home details...</span>
            </main>
        );
    }

    if (error || !home) {
        return (
            <main className="mx-auto max-w-5xl p-8">
                <Button variant="outline" onClick={onBack} className="rounded-full">
                    <ArrowLeft className="mr-2 size-4" />
                    Back to Explore
                </Button>

                <div
                    role="alert"
                    className="mt-6 flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-destructive"
                >
                    <AlertCircle className="size-5" />
                    {error || "Home not found."}
                </div>
            </main>
        );
    }

    return (
        <main className="mx-auto w-full max-w-6xl px-6 py-8 space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="outline" onClick={onBack} className="rounded-full shadow-xs">
                    <ArrowLeft className="mr-2 size-4" />
                    Back to Explore
                </Button>

                {isOwner && (
                    <div className="flex gap-2">
                        {onEdit && (
                            <Button variant="outline" onClick={onEdit} className="rounded-full">
                                <Pencil className="mr-2 size-4" />
                                Edit Home
                            </Button>
                        )}
                        {onDelete && (
                            <Button variant="destructive" onClick={onDelete} className="rounded-full">
                                <Trash2 className="mr-2 size-4" />
                                Delete
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-semibold">
                        {home.housingType}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <ShieldCheck className="size-3.5 text-primary" /> Verified Listing
                    </span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                    {home.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <MapPin className="size-4 text-primary" />
                        {home.city}
                        {home.county ? `, ${getCountyName(home.county)} (${home.county})` : ""}
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1.5">
                        <Users className="size-4" />
                        Up to {home.guestCapacity} {home.guestCapacity === 1 ? "guest" : "guests"}
                    </span>
                </div>
            </div>

            <div className="rounded-2xl overflow-hidden">
                <HomePhotoGallery homeId={homeId} />
            </div>

            {isOwner && (
                <HomeAvailabilityCalendar homeId={homeId} />
            )}

            <div className="grid gap-8 lg:grid-cols-3 pt-4">
                <div className="space-y-8 lg:col-span-2">
                    <div className="grid sm:grid-cols-2 gap-4 pb-6 border-b">
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                <HomeIcon className="size-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">{home.housingType}</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Entire space tailored for a comfortable stay.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                <Sparkles className="size-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">
                                    Capacity for {home.guestCapacity} guests
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Spacious layout ideal for solo travelers or groups.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 pb-6 border-b">
                        <h2 className="text-xl font-bold tracking-tight">About this place</h2>
                        <p className="whitespace-pre-line leading-relaxed text-muted-foreground text-sm sm:text-base">
                            {home.description}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold tracking-tight">What this place offers</h2>
                        {home.amenities?.length ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {home.amenities.map((amenity) => (
                                    <div
                                        key={amenity}
                                        className="flex items-center gap-3 rounded-xl border bg-card p-3.5 text-sm font-medium shadow-2xs"
                                    >
                                        <CheckCircle2 className="size-4 text-primary shrink-0" />
                                        <span>{amenity}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No specific amenities listed for this home.
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <Card className="sticky top-6 rounded-2xl border shadow-lg">
                        <CardHeader className="pb-4 border-b">
                            <CardTitle className="text-lg font-bold">Property Summary</CardTitle>
                        </CardHeader>

                        <CardContent className="p-6 space-y-5">
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between py-1.5 border-b border-dashed">
                                    <span className="text-muted-foreground">Property Type</span>
                                    <span className="font-semibold">{home.housingType}</span>
                                </div>

                                <div className="flex items-center justify-between py-1.5 border-b border-dashed">
                                    <span className="text-muted-foreground">Max Guests</span>
                                    <span className="font-semibold">{home.guestCapacity} guests</span>
                                </div>

                                <div className="flex items-center justify-between py-1.5 border-b border-dashed">
                                    <span className="text-muted-foreground">Location</span>
                                    <span className="font-semibold text-right">
                                        {home.city}
                                        {home.county ? `, ${home.county}` : ""}
                                    </span>
                                </div>

                                {isOwner && home.address && (
                                    <div className="pt-1">
                                        <span className="text-xs text-muted-foreground block">
                                            Full Address (Owner only)
                                        </span>
                                        <span className="font-medium text-sm">{home.address}</span>
                                    </div>
                                )}
                            </div>

                            {!isOwner && (
                                <div className="pt-2 space-y-2">
                                    <Button
                                        className="w-full rounded-xl h-11 font-semibold text-sm"
                                        onClick={() => setRequestSent(true)}
                                        disabled={requestSent}
                                    >
                                        {requestSent ? "Interest Sent ✓" : "Request Stay / Connect"}
                                    </Button>
                                    <p className="text-[11px] text-center text-muted-foreground">
                                        You won&apos;t be charged yet
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
}