
import { useEffect, useState } from "react";
import {
    ArrowLeft,
    MapPin,
    Users,
    Loader2,
    AlertCircle,
    Pencil,
    Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAuthHeaders } from "@/lib/auth";
import { HomePhotoGallery } from "@/features/home/HomePhotos";

const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:8080";

interface Home {
    id: number;
    ownerId: number;
    title: string;
    city: string;
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
    const [home, setHome] = useState<Home | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        const loadHome = async () => {
            setLoading(true);
            setError("");
            setHome(null);

            try {
                const response = await fetch(
                    `${API_URL}/api/v1/homes/${homeId}`,
                    {
                        headers: getAuthHeaders(),
                        signal: controller.signal,
                    }
                );

                if (response.status === 404) {
                    throw new Error("Home not found.");
                }

                if (!response.ok) {
                    throw new Error(
                        `Failed to load home (${response.status}).`
                    );
                }

                const data: Home = await response.json();
                setHome(data);
            } catch (err) {
                if (controller.signal.aborted) return;

                setError(
                    err instanceof Error
                        ? err.message
                        : "Could not load home."
                );
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
            <main className="flex items-center gap-3 p-8">
                <Loader2 className="size-5 animate-spin" />
                Loading home details...
            </main>
        );
    }

    if (error || !home) {
        return (
            <main className="mx-auto max-w-5xl p-8">
                <Button variant="outline" onClick={onBack}>
                    <ArrowLeft className="mr-2 size-4" />
                    Back
                </Button>

                <div
                    role="alert"
                    className="mt-6 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-destructive"
                >
                    <AlertCircle className="size-5" />
                    {error || "Home not found."}
                </div>
            </main>
        );
    }

    return (
        <main className="mx-auto w-full max-w-6xl px-6 py-8">
            <Button
                variant="ghost"
                onClick={onBack}
                className="mb-6"
            >
                <ArrowLeft className="mr-2 size-4" />
                Back to Homes
            </Button>

            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {home.title}
                    </h1>

                    <p className="mt-2 flex items-center gap-2 text-muted-foreground">
                        <MapPin className="size-4" />
                        {home.city}
                    </p>
                </div>

                {isOwner && (
                    <div className="flex gap-2">
                        {onEdit && (
                            <Button variant="outline" onClick={onEdit}>
                                <Pencil className="mr-2 size-4" />
                                Edit Home
                            </Button>
                        )}

                        {onDelete && (
                            <Button
                                variant="destructive"
                                onClick={onDelete}
                            >
                                <Trash2 className="mr-2 size-4" />
                                Delete
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <HomePhotoGallery homeId={homeId} />

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>About this home</CardTitle>
                        </CardHeader>

                        <CardContent>
                            <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                                {home.description}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Amenities</CardTitle>
                        </CardHeader>

                        <CardContent>
                            {home.amenities?.length ? (
                                <div className="flex flex-wrap gap-2">
                                    {home.amenities.map((amenity) => (
                                        <Badge
                                            key={amenity}
                                            variant="secondary"
                                            className="px-3 py-2"
                                        >
                                            {amenity}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">
                                    No amenities specified.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Property Details</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-5">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Housing Type
                                </p>
                                <p className="font-medium">
                                    {home.housingType}
                                </p>
                            </div>

                            <div>
                                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Users className="size-4" />
                                    Guest Capacity
                                </p>
                                <p className="font-medium">
                                    {home.guestCapacity} guests
                                </p>
                            </div>

                            {isOwner && (
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Full Address
                                    </p>
                                    <p className="font-medium">
                                        {home.address}
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
