import { useEffect, useState, type ChangeEvent } from "react";
import { ImagePlus, Loader2, Star, Trash2, House } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAuthHeaders } from "@/lib/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
const MAX_PHOTOS = 10;
const MAX_SIZE = 5 * 1024 * 1024;

interface HomePhoto {
    id: number;
    homeId: number;
    url: string;
    contentType: string;
    displayOrder: number;
}

export interface DisplayPhoto extends HomePhoto {
    imageUrl: string;
}

export async function uploadHomePhotos(homeId: number, files: File[]): Promise<void> {
    for (const file of files) {
        const body = new FormData();
        body.append("file", file);
        const response = await fetch(`${API_URL}/api/v1/homes/${homeId}/photos`, {
            method: "POST",
            headers: getAuthHeaders(),
            body,
        });
        if (!response.ok) {
            const data = await response.json().catch(() => null);
            throw new Error(data?.message || data?.detail || `Photo upload failed (${response.status}).`);
        }
    }
}

export function useHomePhotos(homeId: number, version = 0) {
    const [photos, setPhotos] = useState<DisplayPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError("");

        const load = async () => {
            try {
                const response = await fetch(`${API_URL}/api/v1/homes/${homeId}/photos`, {
                    headers: getAuthHeaders(),
                    signal: controller.signal,
                });
                if (!response.ok) throw new Error(`Failed to load photos (${response.status}).`);
                const records: HomePhoto[] = await response.json();
                const ordered = [...records]
                    .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id)
                    .map((photo) => ({
                        ...photo,
                        imageUrl: `${API_URL}${photo.url}`,
                    }));
                if (!controller.signal.aborted) {
                    setPhotos(ordered);
                }
            } catch (err) {
                if (!controller.signal.aborted) {
                    setError(err instanceof Error ? err.message : "Could not load photos.");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };
        void load();
        return () => controller.abort();
    }, [homeId, version]);

    return { photos, loading, error };
}

interface PhotoPickerProps {
    files: File[];
    onChange: (files: File[]) => void;
    existingCount?: number;
    disabled?: boolean;
}

function PhotoPreviewItem({
    file,
    index,
    onRemove,
    disabled,
}: {
    file: File;
    index: number;
    onRemove: () => void;
    disabled: boolean;
}) {
    const [preview] = useState<string>(() => URL.createObjectURL(file));

    useEffect(() => {
        return () => {
            URL.revokeObjectURL(preview);
        };
    }, [preview]);

    return (
        <div className="relative overflow-hidden rounded-xl border">
            <img src={preview} alt={`Selected photo ${index + 1}`} className="h-32 w-full object-cover" />
            <button
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={onRemove}
                className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 shadow"
                disabled={disabled}
            >
                <Trash2 className="size-4" />
            </button>
            <p className="truncate px-2 py-1 text-xs">{file.name}</p>
        </div>
    );
}

export function PhotoPicker({ files, onChange, existingCount = 0, disabled = false }: PhotoPickerProps) {
    const [error, setError] = useState("");

    const selectFiles = (event: ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(event.target.files ?? []);
        event.target.value = "";
        setError("");
        if (selected.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type))) {
            setError("Only JPEG, PNG and WebP images are allowed.");
            return;
        }
        if (selected.some((file) => file.size > MAX_SIZE)) {
            setError("Each image must be 5 MB or smaller.");
            return;
        }
        if (files.length + selected.length + existingCount > MAX_PHOTOS) {
            setError(`Maximum ${MAX_PHOTOS} photos per home.`);
            return;
        }
        onChange([...files, ...selected]);
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="home-photo-files" className="text-sm font-medium">Home Photos</label>
                <span className="text-xs text-muted-foreground">{existingCount + files.length}/{MAX_PHOTOS} photos · max 5 MB each</span>
            </div>
            <label className={`flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-sm ${disabled ? "pointer-events-none opacity-50" : "hover:bg-muted/40"}`}>
                <ImagePlus className="size-7 text-muted-foreground" />
                <span>Select multiple photos</span>
                <span className="text-xs text-muted-foreground">JPEG, PNG or WebP</span>
                <input id="home-photo-files" type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={selectFiles} disabled={disabled || existingCount + files.length >= MAX_PHOTOS} />
            </label>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            {files.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {files.map((file, index) => (
                        <PhotoPreviewItem
                            key={`${file.name}-${file.lastModified}-${index}`}
                            file={file}
                            index={index}
                            onRemove={() => onChange(files.filter((_, i) => i !== index))}
                            disabled={disabled}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

interface PhotoManagerProps {
    homeId: number;
    onChanged?: () => void;
}

export function PhotoManager({ homeId, onChanged }: PhotoManagerProps) {
    const [version, setVersion] = useState(0);
    const [files, setFiles] = useState<File[]>([]);
    const [working, setWorking] = useState(false);
    const [error, setError] = useState("");
    const [showAll, setShowAll] = useState(false);
    const { photos, loading, error: loadError } = useHomePhotos(homeId, version);

    const refresh = () => {
        setVersion((value) => value + 1);
        onChanged?.();
    };

    const add = async () => {
        if (!files.length || working) return;
        setWorking(true);
        setError("");
        try {
            await uploadHomePhotos(homeId, files);
            setFiles([]);
            refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not upload photos.");
            setVersion((value) => value + 1);
        } finally {
            setWorking(false);
        }
    };

    const modify = async (photoId: number, action: "DELETE" | "PUT") => {
        if (working) return;
        setWorking(true);
        setError("");
        const suffix = action === "PUT" ? "/primary" : "";
        try {
            const response = await fetch(`${API_URL}/api/v1/homes/${homeId}/photos/${photoId}${suffix}`, {
                method: action,
                headers: getAuthHeaders(),
            });
            if (!response.ok) throw new Error(`Could not update photo (${response.status}).`);
            refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not update photo.");
        } finally {
            setWorking(false);
        }
    };

    return (
        <div className="space-y-4 rounded-xl border p-4">
            <h3 className="font-semibold">Manage Photos</h3>
            {loading && <p className="flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin" /> Loading photos...</p>}
            {(error || loadError) && <p role="alert" className="text-sm text-destructive">{error || loadError}</p>}
            {photos.length > 1 && (
                <Button type="button" variant="outline" onClick={() => setShowAll((value) => !value)}>
                    {showAll ? "Show cover only" : `View all ${photos.length} photos`}
                </Button>
            )}
            {photos.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {(showAll ? photos : photos.slice(0, 1)).map((photo) => {
                        const index = photos.findIndex((item) => item.id === photo.id);
                        return (
                            <div key={photo.id} className="overflow-hidden rounded-xl border">
                                <div className="relative">
                                    <img src={photo.imageUrl} alt={`Home photo ${index + 1}`} className="h-32 w-full object-cover" />
                                    {index === 0 && <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-1 text-xs font-medium">Cover</span>}
                                </div>
                                <div className="flex flex-wrap gap-1 p-2">
                                    <Button type="button" size="sm" variant="outline" disabled={working || index === 0} onClick={() => void modify(photo.id, "PUT")}>
                                        <Star className="mr-1 size-3" /> Set as Cover
                                    </Button>
                                    <Button type="button" size="sm" variant="destructive" disabled={working} onClick={() => void modify(photo.id, "DELETE")}>Remove</Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            <PhotoPicker files={files} onChange={setFiles} existingCount={photos.length} disabled={working || loading} />
            <Button type="button" onClick={() => void add()} disabled={working || files.length === 0 || loading}>
                {working && <Loader2 className="mr-2 size-4 animate-spin" />}
                Upload {files.length || ""} {files.length === 1 ? "Photo" : "Photos"}
            </Button>
        </div>
    );
}

export function HomeCover({ homeId }: { homeId: number }) {
    const { photos } = useHomePhotos(homeId);
    return photos[0]
        ? <img src={photos[0].imageUrl} alt="Home cover" className="absolute inset-0 h-full w-full object-cover" />
        : <House className="size-16 text-muted-foreground/30" />;
}

export function HomePhotoGallery({ homeId }: { homeId: number }) {
    const { photos, loading, error } = useHomePhotos(homeId);
    const [active, setActive] = useState<number | null>(null);

    useEffect(() => {
        if (active === null) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setActive(null);
            } else if (event.key === "ArrowLeft") {
                setActive((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
            } else if (event.key === "ArrowRight") {
                setActive((prev) => (prev !== null && prev < photos.length - 1 ? prev + 1 : prev));
            }
        };

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [active, photos.length]);

    if (loading) return <div className="mb-8 flex h-72 items-center justify-center rounded-2xl bg-muted"><Loader2 className="size-6 animate-spin" /></div>;
    if (error) return <p role="alert" className="mb-8 text-sm text-destructive">{error}</p>;
    if (!photos.length) return <div className="mb-8 flex h-72 flex-col items-center justify-center gap-3 rounded-2xl bg-muted text-muted-foreground"><House className="size-12 opacity-40" /><p>No photos added yet.</p></div>;
    return (
        <div className="mb-8 space-y-3">
            <div className="relative overflow-hidden rounded-2xl bg-muted">
                <button type="button" onClick={() => setActive(0)} className="block w-full">
                    <img src={photos[0].imageUrl} alt="Home cover" className="h-72 w-full object-cover transition hover:scale-[1.02] md:h-96" />
                </button>
                <Button type="button" variant="secondary" className="absolute bottom-4 right-4 shadow" onClick={() => setActive(0)}>
                    View all {photos.length} {photos.length === 1 ? "photo" : "photos"}
                </Button>
            </div>
            {active !== null && (
                <div role="dialog" aria-modal="true" aria-label="Home photo gallery" className="fixed inset-0 z-50 flex flex-col bg-black/95 p-4 text-white">
                    <div className="mb-4 flex items-center justify-between gap-4">
                        <span>{active + 1} / {photos.length}</span>
                        <Button variant="outline" type="button" onClick={() => setActive(null)}>Close</Button>
                    </div>
                    <div className="flex min-h-0 flex-1 items-center justify-center">
                        <img src={photos[active].imageUrl} alt={`Home photo ${active + 1}`} className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="mt-4 flex justify-between gap-3">
                        <Button type="button" variant="outline" disabled={active === 0} onClick={() => setActive((index) => Math.max(0, (index ?? 0) - 1))}>Previous</Button>
                        <Button type="button" variant="outline" disabled={active === photos.length - 1} onClick={() => setActive((index) => Math.min(photos.length - 1, (index ?? 0) + 1))}>Next</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
