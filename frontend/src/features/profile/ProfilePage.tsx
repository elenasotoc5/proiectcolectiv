import { useState, useEffect } from "react";
import {
    House,
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Plus,
    Trash2,
    Edit3,
    GraduationCap,
    MapPin,
    Home,
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
    university: string;
    fieldOfStudy: string;
    studyYear: number | null;
    location: string;
    housingType: string;
    avatarUrl: string;
    preferences: string[];
    activities: ActivityItem[];
}

interface ProfilePageProps {
    onNavigateBack: () => void;
    onLogout?: () => void;
}

const CURATED_PREFERENCES = [
    { category: "📚 Study & Routine", tags: ["Quiet Study", "Early Bird", "Night Owl", "Library Regular", "Coffee Shop Studier"] },
    { category: "💻 Hobbies & Passions", tags: ["Tech & Coding", "Gaming", "Photography", "Arts & Museums", "Reading & Literature", "Music & Concerts"] },
    { category: "🏃 Lifestyle & Movement", tags: ["Sports & Gym", "Running", "Hiking & Nature", "Cooking & Foodie", "Board Games", "Cycling"] },
    { category: "🍻 Campus & Social", tags: ["Nightlife & Bars", "Campus Events", "Social & Extrovert", "Cozy & Introvert", "Language Exchange"] },
];

const ACTIVITY_CATEGORIES = [
    "Campus & Academic Life",
    "Sports & Fitness",
    "Food, Coffee & Dining",
    "Nightlife & Social",
    "Local Gems & Culture",
    "Everyday Living",
];

const EMPTY_PROFILE: UserProfile = {
    userId: 0,
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
    university: "",
    fieldOfStudy: "",
    studyYear: 1,
    location: "",
    housingType: "Shared Student Flat (Private Room)",
    avatarUrl: "",
    preferences: [],
    activities: [],
};

const getInitialProfile = (): UserProfile => {
    try {
        const storedUser = localStorage.getItem("lifeSwapUser");
        const storedUserId = localStorage.getItem("lifeSwapUserId");
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            return {
                ...EMPTY_PROFILE,
                userId: parsed.id || (storedUserId ? parseInt(storedUserId, 10) : 0),
                firstName: parsed.firstName || "",
                lastName: parsed.lastName || "",
                email: parsed.email || "",
            };
        }
        if (storedUserId) {
            return {
                ...EMPTY_PROFILE,
                userId: parseInt(storedUserId, 10) || 0,
            };
        }
    } catch {
        // ignore parse error
    }
    return EMPTY_PROFILE;
};

export default function ProfilePage({ onNavigateBack, onLogout }: ProfilePageProps) {
    const [profile, setProfile] = useState<UserProfile>(getInitialProfile);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Edit Profile Modal State
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        firstName: "",
        lastName: "",
        bio: "",
        university: "",
        fieldOfStudy: "",
        studyYear: "1",
        location: "",
        housingType: "Shared Student Flat (Private Room)",
        avatarUrl: "",
    });

    // Activity Modal State
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

    // Custom Tag input
    const [customTagInput, setCustomTagInput] = useState("");

    // Load initial profile data
    useEffect(() => {
        const storedUserId = localStorage.getItem("lifeSwapUserId");
        if (!storedUserId) {
            return;
        }

        const userIdNum = parseInt(storedUserId, 10);
        if (isNaN(userIdNum) || userIdNum <= 0) {
            return;
        }

        const fetchProfile = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${API_URL}/api/v1/users/${userIdNum}/profile`);
                if (response.ok) {
                    const data = await response.json();
                    setProfile((prev) => ({
                        ...prev,
                        userId: data.userId || userIdNum,
                        firstName: data.firstName ?? prev.firstName,
                        lastName: data.lastName ?? prev.lastName,
                        email: data.email ?? prev.email,
                        bio: data.bio ?? "",
                        university: data.university ?? "",
                        fieldOfStudy: data.fieldOfStudy ?? "",
                        studyYear: data.studyYear ?? null,
                        location: data.location ?? "",
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
    }, []);

    // Toggle preference tag
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

    // Add custom preference tag
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

    // Open Edit Profile Modal
    const handleOpenEditModal = () => {
        setEditForm({
            firstName: profile.firstName,
            lastName: profile.lastName,
            bio: profile.bio,
            university: profile.university,
            fieldOfStudy: profile.fieldOfStudy,
            studyYear: (profile.studyYear || 1).toString(),
            location: profile.location,
            housingType: profile.housingType || "Shared Student Flat",
            avatarUrl: profile.avatarUrl || "",
        });
        setIsEditProfileOpen(true);
    };

    // Save Edit Profile Modal
    const handleSaveEditModal = (e: React.FormEvent) => {
        e.preventDefault();
        setProfile((prev) => ({
            ...prev,
            firstName: editForm.firstName.trim() || prev.firstName,
            lastName: editForm.lastName.trim() || prev.lastName,
            bio: editForm.bio.trim(),
            university: editForm.university.trim(),
            fieldOfStudy: editForm.fieldOfStudy.trim(),
            studyYear: parseInt(editForm.studyYear, 10) || null,
            location: editForm.location.trim(),
            housingType: editForm.housingType,
            avatarUrl: editForm.avatarUrl.trim(),
        }));
        setIsEditProfileOpen(false);
    };

    // Open Activity Modal (for Add or Edit)
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

    // Save Activity Modal
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

    // Delete Activity
    const handleDeleteActivity = (index: number) => {
        setProfile((prev) => ({
            ...prev,
            activities: prev.activities.filter((_, i) => i !== index),
        }));
    };

    // Save Entire Profile to Backend API
    const handleSaveAll = async () => {
        setStatusMessage(null);

        if (!profile.userId) {
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

        setIsSaving(true);
        try {
            const response = await fetch(`${API_URL}/api/v1/users/${profile.userId}/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    bio: profile.bio,
                    university: profile.university,
                    fieldOfStudy: profile.fieldOfStudy,
                    studyYear: profile.studyYear,
                    location: profile.location,
                    housingType: profile.housingType,
                    avatarUrl: profile.avatarUrl,
                    preferences: profile.preferences,
                    activities: profile.activities,
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(errData?.message || "Failed to save profile changes.");
            }

            setStatusMessage({
                type: "success",
                text: "Student Profile saved successfully! Your profile is ready for Life Swap matching.",
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
    const isReadyForMatching = hasEnoughPreferences && hasEnoughActivities;

    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col pb-20">
            {/* Top Navigation */}
            <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={onNavigateBack}
                    >
                        <House className="size-6 text-primary" />
                        <span className="text-xl font-bold tracking-tight">LifeSwap</span>
                        <Badge variant="outline" className="ml-2 text-xs font-normal flex items-center gap-1">
                            Student Profile {isLoading && <Loader2 className="size-3 animate-spin" />}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onNavigateBack}
                            className="gap-2"
                        >
                            <ArrowLeft className="size-4" /> Home
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSaveAll}
                            disabled={isSaving}
                            className="gap-2 font-medium"
                        >
                            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                            Save Profile
                        </Button>
                        {onLogout && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onLogout}
                            >
                                Log Out
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            <div className="mx-auto w-full max-w-5xl px-6 pt-8 space-y-8">
                {/* Status Feedback Banner */}
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

                {/* Match Readiness Card */}
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
                                        ? "Your student profile has all required preferences and activities for life swap pairing."
                                        : "Students need at least 3 preferences and 1 host activity so the app knows who to match you with."}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm font-medium self-end sm:self-center">
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

                {/* Student Hero Header Card */}
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
                                        <GraduationCap className="size-10 text-primary-foreground" />
                                    )}
                                </div>
                                <div className="mb-1">
                                    <h2 className="text-2xl font-bold tracking-tight">
                                        {profile.firstName || profile.lastName
                                            ? `${profile.firstName} ${profile.lastName}`.trim()
                                            : "Student Profile"}
                                    </h2>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                        <GraduationCap className="size-4 text-primary" />
                                        <span>{profile.university || "University not set"}</span>
                                        {profile.fieldOfStudy && (
                                            <>
                                                <span>•</span>
                                                <span>{profile.fieldOfStudy}</span>
                                            </>
                                        )}
                                        {profile.studyYear && (
                                            <>
                                                <span>•</span>
                                                <span>Year {profile.studyYear}</span>
                                            </>
                                        )}
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

                        {/* Location & Housing Pills */}
                        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
                            <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-lg text-muted-foreground">
                                <MapPin className="size-3.5 text-primary" />
                                <span>{profile.location || "City not set"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-lg text-muted-foreground">
                                <Home className="size-3.5 text-primary" />
                                <span>{profile.housingType || "Housing not set"}</span>
                            </div>
                        </div>

                        {/* Student Bio */}
                        <p className="text-sm leading-relaxed text-muted-foreground bg-muted/30 p-4 rounded-xl border border-border/50">
                            {profile.bio || "No student bio provided yet. Tell others what your daily life and routine look like!"}
                        </p>
                    </CardContent>
                </Card>

                {/* SECTION 1: Matching Preferences */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Sparkles className="size-5 text-primary" />
                                    Matching Preferences & Interests
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    Choose at least <strong className="text-foreground">3 preferences</strong> to help our algorithm match you with students having complementary or similar vibes.
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
                        {/* Selected Preferences Summary Bar */}
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

                        {/* Curated Categories */}
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

                        {/* Custom Tag Input */}
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

                {/* SECTION 2: Host Activities */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <CalendarCheck className="size-5 text-primary" />
                                    Host Activities ("In My Shoes")
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    What can your swap partner experience in your city and campus while living your routine? (Minimum 1 required)
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
                                    Add at least 1 activity (e.g. your favorite local cafe, gym access, or club seminar) so the other student knows what they'll experience.
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

                {/* Bottom Sticky Action Bar */}
                <div className="sticky bottom-4 z-10 flex items-center justify-between p-4 rounded-2xl bg-card/95 border border-border shadow-xl backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        {isReadyForMatching ? (
                            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
                                <CheckCircle2 className="size-5" />
                                <span>Requirements fulfilled for Life Swap matching</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 font-medium">
                                <AlertCircle className="size-5" />
                                <span>Needs {profile.preferences.length < 3 ? `${3 - profile.preferences.length} more preference(s)` : ""}{profile.preferences.length < 3 && profile.activities.length < 1 ? " and " : ""}{profile.activities.length < 1 ? "1 activity" : ""}</span>
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

            {/* Modal 1: Edit Profile Info */}
            <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Student Information</DialogTitle>
                        <DialogDescription>
                            Update your basic university and housing details visible to prospective swap partners.
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
                                placeholder="Describe your student lifestyle, vibe, and hobbies..."
                                value={editForm.bio}
                                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="university">University</Label>
                                <Input
                                    id="university"
                                    placeholder="e.g. Babeș-Bolyai University"
                                    value={editForm.university}
                                    onChange={(e) => setEditForm({ ...editForm, university: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="fieldOfStudy">Field of Study</Label>
                                <Input
                                    id="fieldOfStudy"
                                    placeholder="e.g. Computer Science / Medicine"
                                    value={editForm.fieldOfStudy}
                                    onChange={(e) => setEditForm({ ...editForm, fieldOfStudy: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="studyYear">Study Year</Label>
                                <NativeSelect
                                    id="studyYear"
                                    value={editForm.studyYear}
                                    onChange={(e) => setEditForm({ ...editForm, studyYear: e.target.value })}
                                >
                                    <NativeSelectOption value="1">1st Year (Bachelor)</NativeSelectOption>
                                    <NativeSelectOption value="2">2nd Year (Bachelor)</NativeSelectOption>
                                    <NativeSelectOption value="3">3rd Year (Bachelor)</NativeSelectOption>
                                    <NativeSelectOption value="4">4th Year (Bachelor)</NativeSelectOption>
                                    <NativeSelectOption value="5">Master's Student</NativeSelectOption>
                                    <NativeSelectOption value="6">PhD Student</NativeSelectOption>
                                </NativeSelect>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="location">City & Country</Label>
                                <Input
                                    id="location"
                                    placeholder="e.g. Cluj-Napoca, Romania"
                                    value={editForm.location}
                                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="housingType">Housing Arrangement</Label>
                            <NativeSelect
                                id="housingType"
                                value={editForm.housingType}
                                onChange={(e) => setEditForm({ ...editForm, housingType: e.target.value })}
                            >
                                <NativeSelectOption value="Shared Student Flat (Private Room)">Shared Student Flat (Private Room)</NativeSelectOption>
                                <NativeSelectOption value="Campus Dormitory Room">Campus Dormitory Room</NativeSelectOption>
                                <NativeSelectOption value="Private Studio / Apartment">Private Studio / Apartment</NativeSelectOption>
                                <NativeSelectOption value="Student Residence">Student Residence</NativeSelectOption>
                            </NativeSelect>
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
                            <Button type="button" variant="outline" onClick={() => setIsEditProfileOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                Update Info
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal 2: Add / Edit Host Activity */}
            <Dialog open={isActivityModalOpen} onOpenChange={setIsActivityModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {activityForm.index !== null ? "Edit Host Activity" : "Add Host Activity"}
                        </DialogTitle>
                        <DialogDescription>
                            Share an experience, routine, or access pass that the other student will enjoy during the life swap.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveActivityModal} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="actTitle">Activity Title</Label>
                            <Input
                                id="actTitle"
                                placeholder="e.g. Attend our weekly robotics club meet"
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
                                placeholder="Where is it, what to expect, and how do they participate? (e.g. My lab pass is on the desk, Thursday at 4 PM)..."
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
