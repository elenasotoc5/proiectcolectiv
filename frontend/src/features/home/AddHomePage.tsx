
import { useEffect, useState, type FormEvent } from "react";
import {
    HousePlus,
    Loader2,
    AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import {
    NativeSelect,
    NativeSelectOption,
} from "@/components/ui/native-select";

import { getAuthHeaders } from "@/lib/auth";

const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:8080";

interface Home {
    id: number;
    ownerId: number;
    title: string;
    city: string;
    address: string;
    description: string;
    housingType: string;
    guestCapacity: number;
    amenities: string[];
    createdAt?: string;
}

const AMENITIES = [
    "Wi-Fi",
    "Kitchen",
    "Washing Machine",
    "Air Conditioning",
    "Heating",
    "Parking",
    "Balcony",
    "Workspace",
    "TV",
    "Pet Friendly",
];

const HOUSING_TYPES = [
    "Entire Apartment",
    "Private Room in Shared Apartment",
    "Studio Apartment",
    "House / Villa",
    "Townhouse / Loft",
    "Suburban Home with Garden",
];

export default function AddHomePage() {

    // Form fields
    const [title, setTitle] = useState("");
    const [city, setCity] = useState("");
    const [address, setAddress] = useState("");
    const [description, setDescription] = useState("");
    const [housingType, setHousingType] = useState("");
    const [guestCapacity, setGuestCapacity] = useState("1");
    const [amenities, setAmenities] = useState<string[]>([]);

    // Existing homes
    const [homes, setHomes] = useState<Home[]>([]);
    const [isLoadingHomes, setIsLoadingHomes] = useState(true);
    const [loadError, setLoadError] = useState("");

    // Form status
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Load saved homes when opening My Home
    useEffect(() => {
        let active = true;

        const loadHomes = async () => {
            try {
                const response = await fetch(
                    `${API_URL}/api/v1/homes/mine`,
                    {
                        headers: getAuthHeaders(),
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        `Failed to load homes (${response.status}).`
                    );
                }

                const data: Home[] = await response.json();

                if (active) {
                    setHomes(data);
                }
            } catch (err) {
                if (active) {
                    setLoadError(
                        err instanceof Error
                            ? err.message
                            : "Could not load your homes."
                    );
                }
            } finally {
                if (active) {
                    setIsLoadingHomes(false);
                }
            }
        };

        void loadHomes();

        return () => {
            active = false;
        };
    }, []);

    // Select / unselect an amenity
    const toggleAmenity = (amenity: string) => {
        setAmenities((previous) =>
            previous.includes(amenity)
                ? previous.filter((item) => item !== amenity)
                : [...previous, amenity]
        );
    };

    // Create a new home
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (
            !title.trim() ||
            !city.trim() ||
            !address.trim() ||
            !description.trim() ||
            !housingType ||
            !Number.isInteger(Number(guestCapacity)) ||
            Number(guestCapacity) < 1
        ) {
            setError("Please complete all required fields.");
            return;
        }

        setIsSaving(true);

        try {
            const response = await fetch(
                `${API_URL}/api/v1/homes`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...getAuthHeaders(),
                    },
                    body: JSON.stringify({
                        title: title.trim(),
                        city: city.trim(),
                        address: address.trim(),
                        description: description.trim(),
                        housingType,
                        guestCapacity: Number(guestCapacity),
                        amenities,
                    }),
                }
            );

            if (!response.ok) {
                const data = await response.json().catch(() => null);

                throw new Error(
                    data?.message ||
                    data?.detail ||
                    `Failed to create home (${response.status}).`
                );
            }

            const savedHome: Home = await response.json();

            setHomes((previousHomes) => [
                ...previousHomes,
                savedHome,
            ]);

            setSuccess("Your home was added successfully!");

            // Reset form
            setTitle("");
            setCity("");
            setAddress("");
            setDescription("");
            setHousingType("");
            setGuestCapacity("1");
            setAmenities([]);

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not connect to the server."
            );
        } finally {
            setIsSaving(false);
        }
    };

    // Loading state
    if (isLoadingHomes) {
        return (
            <main className="mx-auto w-full max-w-4xl px-6 py-8">
                <div className="flex items-center gap-3">
                    <Loader2 className="size-5 animate-spin" />
                    <p>Loading your homes...</p>
                </div>
            </main>
        );
    }

    // Error while loading homes
    if (loadError) {
        return (
            <main className="mx-auto w-full max-w-4xl px-6 py-8">
                <h1 className="mb-6 text-3xl font-bold">
                    My Home
                </h1>

                <div
                    role="alert"
                    className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive"
                >
                    <AlertCircle className="size-5 shrink-0" />
                    <p>{loadError}</p>
                </div>

                <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => window.location.reload()}
                >
                    Try Again
                </Button>
            </main>
        );
    }

    // Show existing homes

    if (homes.length > 0) {
        return (
            <main className="mx-auto w-full max-w-6xl px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">
                        My Home
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Your spaces, ready for new experiences.
                    </p>
                </div>

                {success && (
                    <div
                        role="status"
                        className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-700"
                    >
                        {success}
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-2">
                    {homes.map((home) => (
                        <Card
                            key={home.id}
                            className="group gap-0 overflow-hidden rounded-2xl border bg-card py-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                        >
                            {/* Home preview */}
                            <div className="relative flex h-48 items-center justify-center bg-gradient-to-br from-muted via-secondary/50 to-muted">
                                <HousePlus className="size-16 text-muted-foreground/30" />

                                <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1.5 text-xs font-semibold shadow-sm">
                                My Listing
                            </span>

                                <span className="absolute bottom-4 right-4 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium shadow-sm">
                                {home.housingType}
                            </span>
                            </div>

                            <CardHeader className="space-y-2 px-6 pt-5 pb-3">
                                <CardTitle className="text-xl font-semibold tracking-tight">
                                    {home.title}
                                </CardTitle>

                                <CardDescription className="flex items-center gap-1.5 text-sm">
                                    <span>📍</span>
                                    {home.city}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-5 px-6 pb-6">
                                <p className="line-clamp-2 min-h-10 text-sm leading-relaxed text-muted-foreground">
                                    {home.description}
                                </p>

                                <div className="flex flex-wrap gap-2">
                                <span className="rounded-full border bg-muted/50 px-3 py-1.5 text-xs font-medium">
                                    👥 {home.guestCapacity} guests
                                </span>

                                    {home.amenities?.slice(0, 3).map((amenity) => (
                                        <span
                                            key={amenity}
                                            className="rounded-full border bg-muted/50 px-3 py-1.5 text-xs font-medium"
                                        >
                                        {amenity}
                                    </span>
                                    ))}

                                    {home.amenities?.length > 3 && (
                                        <span className="rounded-full border bg-muted/50 px-3 py-1.5 text-xs font-medium">
                                        +{home.amenities.length - 3} more
                                    </span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between border-t pt-4">
                                    <div className="flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground">
                                        Location
                                    </span>
                                        <span className="text-sm font-medium">
                                        {home.city}
                                    </span>
                                    </div>

                                    <Button
                                        variant="outline"
                                        type="button"
                                        disabled
                                        title="Home details coming soon"
                                    >
                                        View Details
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </main>
        );
    }


    // Show Add Home form if user has no homes
    return (
        <main className="mx-auto w-full max-w-4xl px-6 py-8">

            <div className="mb-6">
                <h1 className="flex items-center gap-3 text-3xl font-bold">
                    <HousePlus className="size-7 text-primary" />
                    Add Home
                </h1>

                <p className="mt-2 text-muted-foreground">
                    Add your home to LifeSwap and prepare it
                    for future swaps.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Home Details</CardTitle>
                    <CardDescription>
                        Tell other members about your home.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >
                        {error && (
                            <div
                                role="alert"
                                className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                            >
                                <AlertCircle className="size-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="title">
                                Home Title *
                            </Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) =>
                                    setTitle(e.target.value)
                                }
                                placeholder="Cozy Apartment in Cluj-Napoca"
                                maxLength={255}
                                required
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="city">
                                    City *
                                </Label>
                                <Input
                                    id="city"
                                    value={city}
                                    onChange={(e) =>
                                        setCity(e.target.value)
                                    }
                                    placeholder="Cluj-Napoca"
                                    maxLength={255}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">
                                    Address *
                                </Label>
                                <Input
                                    id="address"
                                    value={address}
                                    onChange={(e) =>
                                        setAddress(e.target.value)
                                    }
                                    placeholder="Strada Memorandumului 10"
                                    maxLength={255}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">
                                Description *
                            </Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) =>
                                    setDescription(e.target.value)
                                }
                                placeholder="Describe your home..."
                                rows={4}
                                required
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="housingType">
                                    Housing Type *
                                </Label>

                                <NativeSelect
                                    id="housingType"
                                    value={housingType}
                                    onChange={(e) =>
                                        setHousingType(e.target.value)
                                    }
                                    required
                                >
                                    <NativeSelectOption value="">
                                        Select housing type
                                    </NativeSelectOption>

                                    {HOUSING_TYPES.map((type) => (
                                        <NativeSelectOption
                                            key={type}
                                            value={type}
                                        >
                                            {type}
                                        </NativeSelectOption>
                                    ))}
                                </NativeSelect>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="guestCapacity">
                                    Guest Capacity *
                                </Label>
                                <Input
                                    id="guestCapacity"
                                    type="number"
                                    min={1}
                                    step={1}
                                    value={guestCapacity}
                                    onChange={(e) =>
                                        setGuestCapacity(e.target.value)
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label>Amenities (Optional)</Label>

                            <div className="grid gap-3 sm:grid-cols-2">
                                {AMENITIES.map((amenity) => (
                                    <div
                                        key={amenity}
                                        className="flex items-center gap-3"
                                    >
                                        <Checkbox
                                            id={`amenity-${amenity}`}
                                            checked={amenities.includes(amenity)}
                                            onCheckedChange={() =>
                                                toggleAmenity(amenity)
                                            }
                                        />

                                        <Label htmlFor={`amenity-${amenity}`}>
                                            {amenity}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end border-t pt-5">
                            <Button
                                type="submit"
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                ) : (
                                    <HousePlus className="mr-2 size-4" />
                                )}

                                {isSaving ? "Saving..." : "Add Home"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}
