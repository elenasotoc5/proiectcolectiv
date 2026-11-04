import { useState, useEffect } from "react";
import {
    CheckCircle2,
    AlertCircle,
    Loader2,
    Plus,
    Trash2,
    Edit3,
    Briefcase,
    User,
    MapPin,
    Home,
    Building2,
    Sparkles,
    Check,
    X,
    CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { getAuthHeaders, clearStoredAuth, getStoredUserId } from "@/lib/auth";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

const API_URL = import.meta.env.API_URL || import.meta.env.VITE_API_URL || "http://localhost:8080";

export interface ActivityItem {
    id?: number;
    title: string;
    description: string;
    category: string;
}

export interface UserProfile {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    bio: string;
    occupation: string;
    university?: string;
    fieldOfStudy?: string;
    studyYear?: number | null;
    location: string;
    address: string;
    housingType: string;
    avatarUrl: string;
    preferences: string[];
    activities: ActivityItem[];
}

interface ProfilePageProps {
    onLogout?: () => void;
}

const CURATED_PREFERENCES = [
    { category: "⏰ Daily Routine", tags: ["Early Bird", "Night Owl", "Remote Worker", "Office Commuter", "Active & On-the-Go", "Peace & Quiet"] },
    { category: "💻 Hobbies & Passions", tags: ["Tech & Coding", "Gaming", "Photography", "Arts & Museums", "Reading & Literature", "Music & Concerts", "Film & Cinema"] },
    { category: "🏃 Lifestyle & Movement", tags: ["Sports & Gym", "Running", "Hiking & Outdoors", "Cooking & Foodie", "Coffee Culture", "Cycling", "Yoga & Wellness"] },
    { category: "🍻 Social & Community", tags: ["Social & Extrovert", "Cozy & Introvert", "Food & Dining Out", "Live Events", "Language Exchange", "Pet Lover"] },
];

const ACTIVITY_CATEGORIES = [
    "Food, Coffee & Dining",
    "Sports & Fitness",
    "Work & Productivity",
    "Culture & Arts",
    "Outdoors & Nature",
    "Nightlife & Social",
    "Local Gems & Neighborhood",
];

const EMPTY_PROFILE: UserProfile = {
    userId: 0,
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
    occupation: "",
    location: "",
    address: "",
    housingType: "Entire Apartment",
    avatarUrl: "",
    preferences: [],
    activities: [],
};

const getInitialProfile = (): UserProfile => {
    try {
        const storedUser = localStorage.getItem("lifeSwapUser");
        const storedUserId = getStoredUserId();
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            return {
                ...EMPTY_PROFILE,
                userId: parsed.id || storedUserId || 0,
                firstName: parsed.firstName || "",
                lastName: parsed.lastName || "",
                email: parsed.email || "",
            };
        }
        if (storedUserId) {
            return {
                ...EMPTY_PROFILE,
                userId: storedUserId,
            };
        }
    } catch {
    }
    return EMPTY_PROFILE;
};

export default function ProfilePage({ onLogout }: ProfilePageProps) {
    const [profile, setProfile] = useState<UserProfile>(getInitialProfile);
    const [, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        firstName: "",
        lastName: "",
        bio: "",
        occupation: "",
        location: "",
        address: "",
        housingType: "Entire Apartment",
        avatarUrl: "",
    });

    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [activityForm, setActivityForm] = useState<{
        index: number | null;
        title: string;
        description: string;
        category: string;
    }>({
        index: null,
        title: "",
        description: "",
        category: ACTIVITY_CATEGORIES[0],
    });

    const [customTagInput, setCustomTagInput] = useState("");

    useEffect(() => {
        const userIdNum = profile.userId || getStoredUserId();
        if (!userIdNum || userIdNum <= 0) {
            return;
        }

        const fetchProfile = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${API_URL}/api/v1/users/${userIdNum}/profile`, {
                    headers: {
                        ...getAuthHeaders(),
                    },
                });
                if (response.status === 401) {
                    clearStoredAuth();
                    onLogout?.();
                    return;
                }
                if (response.ok) {
                    const data = await response.json();
                    setProfile((prev) => ({
                        ...prev,
                        userId: data.userId || userIdNum,
                        firstName: data.firstName ?? prev.firstName,
                        lastName: data.lastName ?? prev.lastName,
                        email: data.email ?? prev.email,
                        bio: data.bio ?? "",
                        occupation: data.occupation ?? prev.occupation ?? "",
                        location: data.location ?? "",
                        address: data.address ?? prev.address ?? "",
                        housingType: data.housingType ?? prev.housingType,
                        avatarUrl: data.avatarUrl ?? "",
                        preferences: Array.isArray(data.preferences) ? data.preferences : [],
                        activities: Array.isArray(data.activities) ? data.activities : [],
                    }));
                }
            } catch (err) {
                console.warn("Could not fetch profile from backend:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [onLogout]);

    const handleTogglePreference = (tag: string) => {
        setProfile((prev) => {
            const exists = prev.preferences.includes(tag);
            const newPrefs = exists
                ? prev.preferences.filter((p) => p !== tag)
                : [...prev.preferences, tag];
            return { ...prev, preferences: newPrefs };
        });
        setStatusMessage(null);
    };

    const handleAddCustomTag = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = customTagInput.trim();
        if (!trimmed) return;
        if (!profile.preferences.includes(trimmed)) {
            setProfile((prev) => ({
                ...prev,
                preferences: [...prev.preferences, trimmed],
            }));
        }
        setCustomTagInput("");
    };

    const handleOpenEditModal = () => {
        setEditForm({
            firstName: profile.firstName,
            lastName: profile.lastName,
            bio: profile.bio,
            occupation: profile.occupation || "",
            location: profile.location,
            address: profile.address || "",
            housingType: profile.housingType || "Entire Apartment",
            avatarUrl: profile.avatarUrl || "",
        });
        setIsEditProfileOpen(true);
    };

    const handleSaveEditModal = async (e: React.FormEvent) => {
        e.preventDefault();

        const userId = profile.userId || getStoredUserId();
        if (!userId) {
            setStatusMessage({
                type: "error",
                text: "Please register or log in before saving your profile.",
            });
            return;
        }

        const newFirstName = editForm.firstName.trim() || profile.firstName;
        const newLastName = editForm.lastName.trim() || profile.lastName;
        const newBio = editForm.bio.trim();
        const newOccupation = editForm.occupation.trim();
        const newLocation = editForm.location.trim();
        const newAddress = editForm.address.trim();
        const newHousingType = editForm.housingType;
        const newAvatarUrl = editForm.avatarUrl.trim();

        setIsUpdatingInfo(true);
        setStatusMessage(null);

        try {
            const response = await fetch(`${API_URL}/api/v1/users/${userId}/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                },
                body: JSON.stringify({
                    firstName: newFirstName,
                    lastName: newLastName,
                    bio: newBio,
                    occupation: newOccupation,
                    location: newLocation,
                    address: newAddress,
                    housingType: newHousingType,
                    avatarUrl: newAvatarUrl,
                    preferences: profile.preferences,
                    activities: profile.activities,
                }),
            });

            if (response.status === 401) {
                clearStoredAuth();
                onLogout?.();
                return;
            }

            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(errData?.message || "Failed to update profile info.");
            }

            const data = await response.json().catch(() => null);

            try {
                const storedUser = localStorage.getItem("lifeSwapUser");
                if (storedUser) {
                    const parsed = JSON.parse(storedUser);
                    localStorage.setItem("lifeSwapUser", JSON.stringify({
                        ...parsed,
                        firstName: newFirstName,
                        lastName: newLastName,
                    }));
                }
            } catch {}

            setProfile((prev) => ({
                ...prev,
                userId: data?.userId || userId,
                firstName: data?.firstName ?? newFirstName,
                lastName: data?.lastName ?? newLastName,
                bio: data?.bio ?? newBio,
                occupation: data?.occupation ?? newOccupation,
                location: data?.location ?? newLocation,
                address: data?.address ?? newAddress,
                housingType: data?.housingType ?? newHousingType,
                avatarUrl: data?.avatarUrl ?? newAvatarUrl,
                preferences: Array.isArray(data?.preferences) ? data.preferences : prev.preferences,
                activities: Array.isArray(data?.activities) ? data.activities : prev.activities,
            }));

            setStatusMessage({
                type: "success",
                text: "Profile info updated successfully!",
            });
            setIsEditProfileOpen(false);
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : "Could not connect to backend server.";
            setStatusMessage({
                type: "error",
                text: errorMsg,
            });
        } finally {
            setIsUpdatingInfo(false);
        }
    };

    const handleOpenActivityModal = (index: number | null = null) => {
        if (index !== null && profile.activities[index]) {
            const act = profile.activities[index];
            setActivityForm({
                index,
                title: act.title,
                description: act.description,
                category: act.category || ACTIVITY_CATEGORIES[0],
            });
        } else {
            setActivityForm({
                index: null,
                title: "",
                description: "",
                category: ACTIVITY_CATEGORIES[0],
            });
        }
        setIsActivityModalOpen(true);
    };

    const handleSaveActivityModal = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activityForm.title.trim()) return;

        setProfile((prev) => {
            const newActivities = [...prev.activities];
            const newItem: ActivityItem = {
                title: activityForm.title.trim(),
                description: activityForm.description.trim(),
                category: activityForm.category,
            };

            if (activityForm.index !== null) {
                newActivities[activityForm.index] = newItem;
            } else {
                newActivities.push(newItem);
            }

            return { ...prev, activities: newActivities };
        });

        setIsActivityModalOpen(false);
        setStatusMessage(null);
    };

    const handleDeleteActivity = (index: number) => {
        setProfile((prev) => ({
            ...prev,
            activities: prev.activities.filter((_, i) => i !== index),
        }));
    };

    const handleSaveAll = async () => {
        setStatusMessage(null);

        const userId = profile.userId || getStoredUserId();
        if (!userId) {
            setStatusMessage({
                type: "error",
                text: "Please register or log in before saving your profile.",
            });
            return;
        }

        if (profile.preferences.length < 3) {
            setStatusMessage({
                type: "error",
                text: "Please select at least 3 matching preferences before saving.",
            });
            return;
        }

        if (profile.activities.length < 1) {
            setStatusMessage({
                type: "error",
                text: "Please add at least 1 host activity that your swap partner can experience.",
            });
            return;
        }

        if (!profile.location?.trim() || !profile.housingType?.trim() || !profile.address?.trim()) {
            setStatusMessage({
                type: "error",
                text: "Please provide your city, home address, and housing details before matching.",
            });
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch(`${API_URL}/api/v1/users/${userId}/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                },
                body: JSON.stringify({
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    bio: profile.bio,
                    occupation: profile.occupation,
                    location: profile.location,
                    address: profile.address,
                    housingType: profile.housingType,
                    avatarUrl: profile.avatarUrl,
                    preferences: profile.preferences,
                    activities: profile.activities,
                }),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    clearStoredAuth();
                    setStatusMessage({
                        type: "error",
                        text: "Session expired or unauthorized. Please log in again.",
                    });
                    return;
                }
                const errData = await response.json().catch(() => null);
                throw new Error(errData?.message || "Failed to save profile changes.");
            }

            setStatusMessage({
                type: "success",
                text: "Profile saved successfully! Your profile is ready for Life Swap matching.",
            });
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : "Could not connect to backend server.";
            setStatusMessage({
                type: "error",
                text: `${errorMsg} (Saved in local preview)`,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const hasEnoughPreferences = profile.preferences.length >= 3;
    const hasEnoughActivities = profile.activities.length >= 1;
    const hasHomeDetails = Boolean(
        profile.location?.trim() &&
        profile.housingType?.trim() &&
        profile.address?.trim()
    );
    const isReadyForMatching = hasEnoughPreferences && hasEnoughActivities && hasHomeDetails;


    return (
        <main className="min-h-screen bg-background text-foreground pb-20">
            <header className="border-b border-border bg-background">
                <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-5">
                    <h1 className="text-2xl font-bold tracking-tight">
                        My Profile
                    </h1>

                    <Button
                        onClick={handleSaveAll}
                        disabled={isSaving}
                        className="gap-2"
                    >
                        {isSaving ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <CheckCircle2 className="size-4" />
                        )}
                        Save Profile
                    </Button>
                </div>
            </header>

            <div className="mx-auto w-full max-w-5xl px-6 pt-8 space-y-8">

            {statusMessage && (
                    <Alert
                        variant={statusMessage.type === "error" ? "destructive" : "default"}
                        className={statusMessage.type === "success" ? "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300" : ""}
                    >
                        {statusMessage.type === "success" ? (
                            <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
                        ) : (
                            <AlertCircle className="size-4" />
                        )}
                        <AlertTitle>{statusMessage.type === "success" ? "Success" : "Notice"}</AlertTitle>
                        <AlertDescription>{statusMessage.text}</AlertDescription>
                    </Alert>
                )}

                <Card className={`border-2 transition-all ${isReadyForMatching ? "border-green-500/40 bg-green-500/5" : "border-amber-500/40 bg-amber-500/5"}`}>
                    <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-2xl ${isReadyForMatching ? "bg-green-500/20 text-green-600" : "bg-amber-500/20 text-amber-600"}`}>
                                <Sparkles className="size-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    {isReadyForMatching ? "Profile Ready for Matching!" : "Complete Profile to Enable Matching"}
                                    {isReadyForMatching && (
                                        <Badge variant="default" className="bg-green-600 text-white">Active</Badge>
                                    )}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {isReadyForMatching
                                        ? "Your profile has all required home details, preferences, and activities for life swap pairing."
                                        : "Profiles need home details (city, address, housing), at least 3 preferences, and 1 host activity to enable matching."}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-sm font-medium self-end sm:self-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs flex items-center gap-1 ${hasHomeDetails ? "bg-green-500/20 text-green-700 dark:text-green-300" : "bg-destructive/15 text-destructive border border-destructive/30 font-medium"}`}>
                                {hasHomeDetails ? <Check className="size-3" /> : <AlertCircle className="size-3 text-destructive" />}
                                {hasHomeDetails ? "Home Details Set" : "Home Details Missing (Required)"}
                            </span>
                            <span className={`px-2.5 py-1 rounded-full text-xs flex items-center gap-1 ${hasEnoughPreferences ? "bg-green-500/20 text-green-700 dark:text-green-300" : "bg-amber-500/20 text-amber-700 dark:text-amber-300"}`}>
                                {hasEnoughPreferences ? <Check className="size-3" /> : <AlertCircle className="size-3" />}
                                {profile.preferences.length}/3 Preferences
                            </span>
                            <span className={`px-2.5 py-1 rounded-full text-xs flex items-center gap-1 ${hasEnoughActivities ? "bg-green-500/20 text-green-700 dark:text-green-300" : "bg-amber-500/20 text-amber-700 dark:text-amber-300"}`}>
                                {hasEnoughActivities ? <Check className="size-3" /> : <AlertCircle className="size-3" />}
                                {profile.activities.length}/1 Activity
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden">
                    <div className="h-28 bg-gradient-to-r from-primary/30 via-primary/10 to-accent" />
                    <CardContent className="relative px-6 pb-6 pt-0">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-12 sm:-mt-14 mb-4 gap-4">
                            <div className="flex items-end gap-4">
                                <div className="size-24 sm:size-28 rounded-2xl bg-primary text-primary-foreground font-bold text-3xl flex items-center justify-center border-4 border-background shadow-md overflow-hidden">
                                    {profile.avatarUrl ? (
                                        <img src={profile.avatarUrl} alt="Avatar" className="size-full object-cover" />
                                    ) : profile.firstName || profile.lastName ? (
                                        `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`
                                    ) : (
                                        <User className="size-10 text-primary-foreground" />
                                    )}
                                </div>
                                <div className="mb-1">
                                    <h2 className="text-2xl font-bold tracking-tight">
                                        {profile.firstName || profile.lastName
                                            ? `${profile.firstName} ${profile.lastName}`.trim()
                                            : "Your Profile"}
                                    </h2>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                        <Briefcase className="size-4 text-primary" />
                                        <span>{profile.occupation || "Profession / Occupation not set"}</span>
                                    </p>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleOpenEditModal}
                                className="gap-2"
                            >
                                <Edit3 className="size-4" /> Edit Info
                            </Button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${!profile.location?.trim() ? "bg-destructive/10 text-destructive border border-destructive/30 font-medium" : "bg-muted text-muted-foreground"}`}>
                                <MapPin className={`size-3.5 ${!profile.location?.trim() ? "text-destructive" : "text-primary"}`} />
                                <span>{profile.location || "City not set"}</span>
                                {!profile.location?.trim() && (
                                    <span className="text-destructive font-semibold text-[11px]">(Required)</span>
                                )}
                            </div>
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${!profile.address?.trim() ? "bg-destructive/10 text-destructive border border-destructive/30 font-medium" : "bg-muted text-muted-foreground"}`}>
                                <Building2 className={`size-3.5 ${!profile.address?.trim() ? "text-destructive" : "text-primary"}`} />
                                <span>{profile.address || "Address not set"}</span>
                                {!profile.address?.trim() && (
                                    <span className="text-destructive font-semibold text-[11px]">(Required)</span>
                                )}
                            </div>
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${!profile.housingType?.trim() ? "bg-destructive/10 text-destructive border border-destructive/30 font-medium" : "bg-muted text-muted-foreground"}`}>
                                <Home className={`size-3.5 ${!profile.housingType?.trim() ? "text-destructive" : "text-primary"}`} />
                                <span>{profile.housingType || "Housing not set"}</span>
                                {!profile.housingType?.trim() && (
                                    <span className="text-destructive font-semibold text-[11px]">(Required)</span>
                                )}
                            </div>
                        </div>

                        {!hasHomeDetails && (
                            <div className="flex items-center gap-2 text-xs text-destructive font-medium bg-destructive/10 border border-destructive/20 px-3.5 py-2 rounded-xl mb-4">
                                <AlertCircle className="size-4 shrink-0 text-destructive" />
                                <span>
                                    <strong>Required fields missing:</strong> {[
                                        !profile.location?.trim() ? "City & Country" : null,
                                        !profile.address?.trim() ? "Home Address" : null,
                                        !profile.housingType?.trim() ? "Housing Arrangement" : null,
                                    ].filter(Boolean).join(", ")}. Please edit info to complete these details before matching.
                                </span>
                            </div>
                        )}

                        <p className="text-sm leading-relaxed text-muted-foreground bg-muted/30 p-4 rounded-xl border border-border/50">
                            {profile.bio || "No bio provided yet. Tell others what your daily life and routine look like!"}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Sparkles className="size-5 text-primary" />
                                    Matching Preferences & Interests
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    Choose at least <strong className="text-foreground">3 preferences</strong> to help our algorithm match you with members having complementary or similar vibes.
                                </CardDescription>
                            </div>
                            <Badge
                                variant={hasEnoughPreferences ? "default" : "destructive"}
                                className="w-fit"
                            >
                                {profile.preferences.length} / 3 selected {hasEnoughPreferences && "✓"}
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6 pt-2">
                        <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                                Your Active Matching Tags ({profile.preferences.length})
                            </p>
                            {profile.preferences.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">
                                    No preferences selected yet. Click any tag below to select.
                                </p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {profile.preferences.map((tag) => (
                                        <Badge
                                            key={tag}
                                            variant="secondary"
                                            className="px-3 py-1.5 text-sm font-medium gap-1.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 cursor-pointer"
                                            onClick={() => handleTogglePreference(tag)}
                                        >
                                            {tag}
                                            <X className="size-3.5 hover:text-destructive" />
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            {CURATED_PREFERENCES.map((cat) => (
                                <div key={cat.category} className="space-y-2">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        {cat.category}
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {cat.tags.map((tag) => {
                                            const isSelected = profile.preferences.includes(tag);
                                            return (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => handleTogglePreference(tag)}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 border ${
                                                        isSelected
                                                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                                            : "bg-background hover:bg-muted text-foreground border-border"
                                                    }`}
                                                >
                                                    {isSelected && <Check className="size-3.5" />}
                                                    {tag}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleAddCustomTag} className="flex items-center gap-2 pt-2 border-t border-border">
                            <Input
                                placeholder="Add a custom interest (e.g. Specialty Coffee, Film Photography)..."
                                value={customTagInput}
                                onChange={(e) => setCustomTagInput(e.target.value)}
                                className="max-w-md"
                            />
                            <Button type="submit" variant="secondary" size="sm" className="gap-1.5">
                                <Plus className="size-4" /> Add Tag
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <CalendarCheck className="size-5 text-primary" />
                                    Host Activities ("In My Shoes")
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    What can your swap partner experience in your city and neighborhood while living your routine? (Minimum 1 required)
                                </CardDescription>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => handleOpenActivityModal(null)}
                                className="gap-2 shrink-0 font-medium"
                            >
                                <Plus className="size-4" /> Add Activity
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-2">
                        {profile.activities.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border rounded-xl bg-muted/20">
                                <CalendarCheck className="size-10 text-muted-foreground/60 mb-3" />
                                <h4 className="font-semibold text-base mb-1">No host activities added yet</h4>
                                <p className="text-sm text-muted-foreground max-w-sm mb-4">
                                    Add at least 1 activity (e.g. your favorite local cafe, gym access, co-working desk, or neighborhood spot) so your swap partner knows what they'll experience.
                                </p>
                                <Button size="sm" onClick={() => handleOpenActivityModal(null)} className="gap-2">
                                    <Plus className="size-4" /> Add Your First Activity
                                </Button>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {profile.activities.map((act, index) => (
                                    <Card key={index} className="flex flex-col justify-between border border-border/80 hover:border-primary/40 transition-colors">
                                        <CardContent className="p-4 space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <Badge variant="outline" className="text-xs bg-muted/60">
                                                    {act.category || "General"}
                                                </Badge>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={() => handleOpenActivityModal(index)}
                                                        className="text-muted-foreground hover:text-foreground"
                                                        title="Edit Activity"
                                                    >
                                                        <Edit3 className="size-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={() => handleDeleteActivity(index)}
                                                        className="text-muted-foreground hover:text-destructive"
                                                        title="Delete Activity"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <h4 className="font-semibold text-base leading-snug">
                                                {act.title}
                                            </h4>
                                            {act.description && (
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    {act.description}
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="sticky bottom-4 z-10 flex items-center justify-between p-4 rounded-2xl bg-card/95 border border-border shadow-xl backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        {isReadyForMatching ? (
                            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
                                <CheckCircle2 className="size-5" />
                                <span>Requirements fulfilled for Life Swap matching</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-destructive font-medium">
                                <AlertCircle className="size-5 shrink-0" />
                                <span>
                                    Needs: {[
                                        !hasHomeDetails ? "home details (city, address, housing)" : null,
                                        profile.preferences.length < 3 ? `${3 - profile.preferences.length} more preference(s)` : null,
                                        profile.activities.length < 1 ? "1 activity" : null,
                                    ].filter(Boolean).join(", ")}
                                </span>
                            </div>
                        )}
                    </div>

                    <Button
                        size="default"
                        onClick={handleSaveAll}
                        disabled={isSaving}
                        className="gap-2 font-semibold px-6 shadow-md"
                    >
                        {isSaving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Profile Information</DialogTitle>
                        <DialogDescription>
                            Update your personal details, occupation, and housing info visible to prospective swap partners.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveEditModal} className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    value={editForm.firstName}
                                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    value={editForm.lastName}
                                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="bio">About Me & Daily Routine</Label>
                            <Textarea
                                id="bio"
                                rows={3}
                                placeholder="Describe your lifestyle, routine, hobbies, and what you love about your daily life..."
                                value={editForm.bio}
                                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="occupation">Occupation / Profession</Label>
                                <Input
                                    id="occupation"
                                    placeholder="e.g. Software Engineer, Designer, Teacher"
                                    value={editForm.occupation}
                                    onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="location">City & Country <span className="text-destructive">*</span></Label>
                                <Input
                                    id="location"
                                    placeholder="e.g. Cluj-Napoca, Romania"
                                    value={editForm.location}
                                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                    required
                                    className={!editForm.location.trim() ? "border-destructive focus-visible:ring-destructive" : ""}
                                />
                                {!editForm.location.trim() && (
                                    <p className="text-xs text-destructive font-medium">City & Country is required</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="address">Home Address / Street <span className="text-destructive">*</span></Label>
                                <Input
                                    id="address"
                                    placeholder="e.g. Strada Memorandumului 21"
                                    value={editForm.address}
                                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                    required
                                    className={!editForm.address.trim() ? "border-destructive focus-visible:ring-destructive" : ""}
                                />
                                {!editForm.address.trim() && (
                                    <p className="text-xs text-destructive font-medium">Home address is required</p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="housingType">Housing Arrangement <span className="text-destructive">*</span></Label>
                                <NativeSelect
                                    id="housingType"
                                    value={editForm.housingType}
                                    onChange={(e) => setEditForm({ ...editForm, housingType: e.target.value })}
                                    className={!editForm.housingType?.trim() ? "border-destructive focus-visible:ring-destructive" : ""}
                                >
                                    <NativeSelectOption value="Entire Apartment">Entire Apartment</NativeSelectOption>
                                    <NativeSelectOption value="Private Room in Shared Apartment">Private Room in Shared Apartment</NativeSelectOption>
                                    <NativeSelectOption value="Studio Apartment">Studio Apartment</NativeSelectOption>
                                    <NativeSelectOption value="House / Villa">House / Villa</NativeSelectOption>
                                    <NativeSelectOption value="Townhouse / Loft">Townhouse / Loft</NativeSelectOption>
                                    <NativeSelectOption value="Suburban Home with Garden">Suburban Home with Garden</NativeSelectOption>
                                </NativeSelect>
                                {!editForm.housingType?.trim() && (
                                    <p className="text-xs text-destructive font-medium">Housing arrangement is required</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="avatarUrl">Avatar Image URL (Optional)</Label>
                            <Input
                                id="avatarUrl"
                                placeholder="https://example.com/photo.jpg"
                                value={editForm.avatarUrl}
                                onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })}
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsEditProfileOpen(false)} disabled={isUpdatingInfo}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isUpdatingInfo} className="gap-2">
                                {isUpdatingInfo && <Loader2 className="size-4 animate-spin" />}
                                Update Info
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isActivityModalOpen} onOpenChange={setIsActivityModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {activityForm.index !== null ? "Edit Host Activity" : "Add Host Activity"}
                        </DialogTitle>
                        <DialogDescription>
                            Share an experience, routine, or access pass that your swap partner will enjoy during the life swap.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveActivityModal} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="actTitle">Activity Title</Label>
                            <Input
                                id="actTitle"
                                placeholder="e.g. Access to local bouldering gym & community meetups"
                                value={activityForm.title}
                                onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="actCategory">Category</Label>
                            <NativeSelect
                                id="actCategory"
                                value={activityForm.category}
                                onChange={(e) => setActivityForm({ ...activityForm, category: e.target.value })}
                            >
                                {ACTIVITY_CATEGORIES.map((cat) => (
                                    <NativeSelectOption key={cat} value={cat}>
                                        {cat}
                                    </NativeSelectOption>
                                ))}
                            </NativeSelect>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="actDesc">Details for Swap Partner</Label>
                            <Textarea
                                id="actDesc"
                                rows={3}
                                placeholder="Where is it, what to expect, and how do they participate? (e.g. The guest pass card is on the kitchen counter, open 7 AM - 10 PM daily)..."
                                value={activityForm.description}
                                onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsActivityModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {activityForm.index !== null ? "Update Activity" : "Add Activity"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </main>
    );
}
