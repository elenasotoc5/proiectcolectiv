import { useEffect, useState } from "react";
import { Heart, Loader2, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    getLikedHomes,
    homeImageUrl,
    unlikeHome,
    type LikedHome,
} from "@/features/home/homeLikesApi";

type Props = {
    onViewHome?: (homeId: number) => void;
    onExplore?: () => void;
};

export default function LikedHomesPage({ onViewHome, onExplore }: Props) {
    const [homes, setHomes] = useState<LikedHome[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [removingId, setRemovingId] = useState<number | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError("");
        getLikedHomes(controller.signal)
            .then((data) => { if (!controller.signal.aborted) setHomes(data); })
            .catch((err: unknown) => {
                if (!controller.signal.aborted) {
                    setError(err instanceof Error ? err.message : "Could not load liked homes.");
                }
            })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, []);

    async function removeLike(homeId: number) {
        setRemovingId(homeId);
        setError("");
        try {
            await unlikeHome(homeId);
            setHomes((current) => current.filter((home) => home.id !== homeId));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not remove liked home.");
        } finally {
            setRemovingId(null);
        }
    }

    return (
        <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Liked Homes</h1>
                <p className="mt-1 text-sm text-muted-foreground">Homes you've saved while exploring.</p>
            </div>

            {error && <p role="alert" className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive">{error}</p>}

            {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="size-5 animate-spin" /> Loading liked homes...
                </div>
            ) : homes.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                        <Heart className="size-10 text-muted-foreground" />
                        <p className="font-medium">You haven't liked any homes yet.</p>
                        <p className="text-sm text-muted-foreground">Explore listings and save the ones you love.</p>
                        {onExplore && <Button onClick={onExplore}>Explore Homes</Button>}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {homes.map((home) => {
                        const image = homeImageUrl(home.primaryPhotoUrl);
                        return (
                            <Card key={home.id} className="overflow-hidden pt-0">
                                {image ? (
                                    <img src={image} alt={home.title} className="h-48 w-full object-cover" />
                                ) : (
                                    <div className="flex h-48 items-center justify-center bg-muted text-sm text-muted-foreground">No photo</div>
                                )}
                                <CardContent className="space-y-3">
                                    <h2 className="text-lg font-semibold">{home.title}</h2>
                                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <MapPin className="size-4" /> {home.city}{home.county ? `, ${home.county}` : ""}
                                    </p>
                                    {home.guestCapacity != null && (
                                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Users className="size-4" /> Up to {home.guestCapacity} guests
                                        </p>
                                    )}
                                    <div className="flex gap-2 pt-2">
                                        {onViewHome && (
                                            <Button variant="outline" className="flex-1" onClick={() => onViewHome(home.id)}>
                                                View Details
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            disabled={removingId === home.id}
                                            onClick={() => void removeLike(home.id)}
                                        >
                                            {removingId === home.id ? <Loader2 className="size-4 animate-spin" /> : <Heart className="size-4 fill-current" />}
                                            Unlike
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </main>
    );
}
