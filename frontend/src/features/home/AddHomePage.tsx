
import { useEffect, useState, type FormEvent } from "react";
import {
    HousePlus,
    Loader2,
    AlertCircle,
    Pencil,
    Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import HomeDetailsPage from "@/features/home/HomeDetailsPage";
import { HomeCover, PhotoManager, PhotoPicker, uploadHomePhotos } from "@/features/home/HomePhotos";
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

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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


    const [title, setTitle] = useState("");
    const [city, setCity] = useState("");
    const [address, setAddress] = useState("");
    const [description, setDescription] = useState("");
    const [housingType, setHousingType] = useState("");
    const [guestCapacity, setGuestCapacity] = useState("1");
    const [amenities, setAmenities] = useState<string[]>([]);
    const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);


    const [homes, setHomes] = useState<Home[]>([]);
    const [isLoadingHomes, setIsLoadingHomes] = useState(true);
    const [loadError, setLoadError] = useState("");


    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [editingHomeId, setEditingHomeId] = useState<number | null>(null);
    const [deletingHomeId, setDeletingHomeId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedHomeId, setSelectedHomeId] = useState<number | null>(null);
    const editingHome = homes.find((home) => home.id === editingHomeId);
    const hasChanges = editingHome === undefined ||
        title.trim() !== editingHome.title ||
        city.trim() !== editingHome.city ||
        address.trim() !== editingHome.address ||
        description.trim() !== editingHome.description ||
        housingType !== editingHome.housingType ||
        Number(guestCapacity) !== editingHome.guestCapacity ||
        [...amenities].sort().join("|") !==
        [...(editingHome.amenities ?? [])].sort().join("|");


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


    const toggleAmenity = (amenity: string) => {
        setAmenities((previous) =>
            previous.includes(amenity)
                ? previous.filter((item) => item !== amenity)
                : [...previous, amenity]
        );
    };


    const handleEdit = (home: Home) => {
        setEditingHomeId(home.id);

        setTitle(home.title);
        setCity(home.city);
        setAddress(home.address);
        setDescription(home.description);
        setHousingType(home.housingType);
        setGuestCapacity(String(home.guestCapacity));
        setAmenities([...(home.amenities ?? [])]);
        setPendingPhotos([]);

        setError("");
        setSuccess("");
    };


    const handleCancelEdit = () => {
        setEditingHomeId(null);

        setTitle("");
        setCity("");
        setAddress("");
        setDescription("");
        setHousingType("");
        setGuestCapacity("1");
        setAmenities([]);
        setPendingPhotos([]);

        setError("");
    };





    const handleDelete = async () => {
        if (deletingHomeId === null || isDeleting) return;

        setIsDeleting(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(`${API_URL}/api/v1/homes/${deletingHomeId}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(data?.message || data?.detail ||
                    `Failed to delete home (${response.status}).`);
            }

            setHomes((previous) => previous.filter((home) => home.id !== deletingHomeId));
            setDeletingHomeId(null);
            setSelectedHomeId(null);
            setSuccess("Home deleted successfully!");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not delete home.");
            setDeletingHomeId(null);
        } finally {
            setIsDeleting(false);
        }
    };

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

        const isEditing = editingHomeId !== null;

        try {
            const url = isEditing
                ? `${API_URL}/api/v1/homes/${editingHomeId}`
                : `${API_URL}/api/v1/homes`;

            const response = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
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
            });

            if (!response.ok) {
                const data = await response.json().catch(() => null);

                throw new Error(
                    data?.message ||
                    data?.detail ||
                    `Failed to save home (${response.status}).`
                );
            }

            const savedHome: Home = await response.json();

            let photoError = "";
            if (pendingPhotos.length > 0) {
                try {
                    await uploadHomePhotos(savedHome.id, pendingPhotos);
                } catch (err) {
                    photoError = err instanceof Error ? err.message : "Could not upload all photos.";
                }
            }

            if (isEditing) {
                setHomes((previous) =>
                    previous.map((home) =>
                        home.id === editingHomeId ? savedHome : home
                    )
                );

                setSuccess("Home updated successfully!");
            } else {
                setHomes((previous) => [...previous, savedHome]);
                setSuccess("Your home was added successfully!");
            }

            if (photoError) {
                setError(`Home saved, but some photos could not be uploaded: ${photoError}`);
            }
            setPendingPhotos([]);
            setEditingHomeId(null);
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




    if (selectedHomeId !== null) {
        const selectedHome = homes.find(
            (home) => home.id === selectedHomeId
        );

        return (
            <>
                <HomeDetailsPage
                    homeId={selectedHomeId}
                    isOwner={true}
                    onBack={() => setSelectedHomeId(null)}
                    onEdit={() => {
                        if (selectedHome) {
                            handleEdit(selectedHome);
                            setSelectedHomeId(null);
                        }
                    }}
                    onDelete={() => setDeletingHomeId(selectedHomeId)}
                />

                {error && (
                    <p role="alert" className="px-6 text-destructive">
                        {error}
                    </p>
                )}

                <AlertDialog
                    open={deletingHomeId === selectedHomeId}
                    onOpenChange={(open) => {
                        if (!open && !isDeleting) {
                            setDeletingHomeId(null);
                        }
                    }}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Delete this home?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                You are about to permanently delete
                                "{selectedHome?.title}".
                                This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>
                                Cancel
                            </AlertDialogCancel>

                            <AlertDialogAction
                                disabled={isDeleting}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={(event) => {
                                    event.preventDefault();
                                    void handleDelete();
                                }}
                            >
                                {isDeleting ? "Deleting..." : "Delete Home"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </>
        );
    }



    if (homes.length > 0 && editingHomeId === null) {
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

                {error && (
                    <div role="alert" className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                        {error}
                    </div>
                )}

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
                            <div className="relative flex h-48 items-center justify-center bg-gradient-to-br from-muted via-secondary/50 to-muted">
                                <HomeCover homeId={home.id} />

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


                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            variant="outline"
                                            type="button"
                                            onClick={() => setSelectedHomeId(home.id)}
                                        >
                                            View Details
                                        </Button>

                                        <Button
                                            variant="outline"
                                            type="button"
                                            onClick={() => handleEdit(home)}
                                        >
                                            <Pencil className="mr-2 size-4" />
                                            Edit Home
                                        </Button>

                                        <Button
                                            variant="destructive"
                                            type="button"
                                            onClick={() => setDeletingHomeId(home.id)}
                                        >
                                            <Trash2 className="mr-2 size-4" />
                                            Delete
                                        </Button>
                                    </div>

                                </div>
                            </CardContent>
                            <AlertDialog
                                open={deletingHomeId === home.id}
                                onOpenChange={(open) => {
                                    if (!open && !isDeleting) setDeletingHomeId(null);
                                }}
                            >
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete this home?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            You are about to permanently delete "{home.title}".
                                            This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            disabled={isDeleting}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            onClick={(event) => {
                                                event.preventDefault();
                                                void handleDelete();
                                            }}
                                        >
                                            {isDeleting ? "Deleting..." : "Delete Home"}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </Card>
                    ))}
                </div>
            </main>
        );
    }



    return (
        <main className="mx-auto w-full max-w-4xl px-6 py-8">

            <div className="mb-6">
                <h1 className="flex items-center gap-3 text-3xl font-bold">
                    <HousePlus className="size-7 text-primary" />
                    {editingHomeId !== null ? "Edit Home" : "Add Home"}
                </h1>

                <p className="mt-2 text-muted-foreground">
                    {editingHomeId !== null
                        ? "Update your home details below."
                        : "Add your home to LifeSwap and prepare it for future swaps."}
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

                        {editingHomeId === null && (
                            <PhotoPicker files={pendingPhotos} onChange={setPendingPhotos} disabled={isSaving} />
                        )}

                        {editingHomeId !== null && (
                            <PhotoManager homeId={editingHomeId} />
                        )}

                        <div className="flex justify-end gap-3 border-t pt-5">
                            {editingHomeId !== null && (
                                <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                                    Cancel
                                </Button>
                            )}
                            <Button
                                type="submit"
                                disabled={isSaving || (editingHomeId !== null && !hasChanges && pendingPhotos.length === 0)}
                            >
                                {isSaving ? (
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                ) : (
                                    <HousePlus className="mr-2 size-4" />
                                )}

                                {isSaving ? "Saving..." : editingHomeId !== null ? "Save Changes" : "Add Home"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}
