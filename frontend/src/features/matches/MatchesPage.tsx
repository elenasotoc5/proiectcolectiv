import { useState, useEffect } from "react";
import {
    HeartHandshake,
    AlertCircle,
    CheckCircle2,
    House,
    Sparkles,
    CalendarCheck,
    ArrowRight,
    Loader2,
    Compass,
    ShieldAlert,
    RefreshCw,
    MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { DashboardView } from "@/components/layout/DashboardSidebar";
import { getAuthHeaders, getStoredUserId, clearStoredAuth } from "@/lib/auth";
import { getCountyName } from "@/features/counties/counties";

const API_URL =
    import.meta.env.API_URL || import.meta.env.VITE_API_URL || "http://localhost:8080";

interface MatchesPageProps {
    onNavigate: (view: DashboardView) => void;
    onLogout?: () => void;
}

interface ActivityItem {
    id?: number;
    title: string;
    description: string;
    category: string;
}

interface UserProfileData {
    userId: number;
    firstName: string;
    lastName: string;
    location: string;
    preferences: string[];
    preferredCounties: string[];
    activities: ActivityItem[];
    hasHome?: boolean;
}

interface HomeItem {
    id: number;
    title: string;
    city: string;
    country: string;
    housingType: string;
}

export default function MatchesPage({ onNavigate, onLogout }: MatchesPageProps) {
    const [profile, setProfile] = useState<UserProfileData | null>(null);
    const [homes, setHomes] = useState<HomeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let isMounted = true;
        const userId = getStoredUserId();

        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                const headers = getAuthHeaders();
                const [profileRes, homesRes] = await Promise.all([
                    userId ? fetch(`${API_URL}/api/v1/users/${userId}/profile`, { headers }) : Promise.resolve(null),
                    fetch(`${API_URL}/api/v1/homes/mine`, { headers }),
                ]);

                if (profileRes?.status === 401 || homesRes.status === 401) {
                    clearStoredAuth();
                    onLogout?.();
                    return;
                }

                if (profileRes && profileRes.ok) {
                    const profileData = await profileRes.json();
                    if (isMounted) {
                        setProfile({
                            userId: profileData.userId,
                            firstName: profileData.firstName || "",
                            lastName: profileData.lastName || "",
                            location: profileData.location || "",
                            preferences: Array.isArray(profileData.preferences) ? profileData.preferences : [],
                            preferredCounties: Array.isArray(profileData.preferredCounties) ? profileData.preferredCounties : [],
                            activities: Array.isArray(profileData.activities) ? profileData.activities : [],
                            hasHome: Boolean(profileData.hasHome),
                        });
                    }
                }

                if (homesRes.ok) {
                    const homesData = await homesRes.json();
                    if (isMounted && Array.isArray(homesData)) {
                        setHomes(homesData);
                    }
                } else if (homesRes.status !== 404) {
                    throw new Error(`Failed to check homes (${homesRes.status}).`);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : "Could not load matching requirements.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, [onLogout, reloadKey]);

    const hasHome = homes.length > 0 || Boolean(profile?.hasHome);
    const hasEnoughPreferences = Boolean(profile && profile.preferences.length >= 3);
    const hasEnoughActivities = Boolean(profile && profile.activities.length >= 1);
    const isReadyForMatching = hasHome && hasEnoughPreferences && hasEnoughActivities;

    const missingList = [
        !hasHome ? "home" : null,
        !hasEnoughPreferences ? "preferences" : null,
        !hasEnoughActivities ? "host activities" : null,
    ].filter(Boolean) as string[];

    const completedCount = [hasHome, hasEnoughPreferences, hasEnoughActivities].filter(Boolean).length;

    if (loading) {
        return (
            <main className="px-6 py-20 md:p-8 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Checking matching eligibility...</p>
            </main>
        );
    }

    return (
        <main className="px-6 py-12 md:p-8 max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2.5">
                        <HeartHandshake className="size-8 text-primary" />
                        My Matches
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Connect and swap homes with like-minded travelers across the globe.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReloadKey((k) => k + 1)}
                    className="gap-2 self-start sm:self-auto"
                >
                    <RefreshCw className="size-3.5" />
                    Refresh Status
                </Button>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertTitle>Notice</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {!isReadyForMatching ? (
                /* Blocked Matching Gate with Clear Informative Messages */
                <div className="space-y-6">
                    <Alert variant="destructive" className="border-destructive/30 bg-destructive/10 text-destructive dark:text-red-300">
                        <ShieldAlert className="size-5 text-destructive" />
                        <AlertTitle className="text-base font-bold">
                            You can't match because you didn't add your {missingList.join(", ")}.
                        </AlertTitle>
                        <AlertDescription className="text-sm mt-1 text-destructive/90 dark:text-red-200">
                            To unlock Life Swap matching, every member needs to provide their home listing, at least 3 preferences, and at least 1 host activity. Please complete the missing requirements below.
                        </AlertDescription>
                    </Alert>

                    {/* Progress Overview Card */}
                    <Card className="border-2 border-border shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold">Matching Requirements Checklist</CardTitle>
                                <Badge variant="secondary" className="font-semibold text-xs">
                                    {completedCount} of 3 Completed
                                </Badge>
                            </div>
                            <CardDescription>
                                Complete these 3 steps to activate your profile in our matching algorithm.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-2">
                            {/* Requirement 1: Home */}
                            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                                hasHome ? "bg-green-500/5 border-green-500/30" : "bg-card border-destructive/40 shadow-sm"
                            }`}>
                                <div className="flex items-start gap-3.5">
                                    <div className={`p-2.5 rounded-xl shrink-0 ${hasHome ? "bg-green-500/20 text-green-700 dark:text-green-300" : "bg-destructive/15 text-destructive"}`}>
                                        <House className="size-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-base">1. Add Your Home</h3>
                                            {hasHome ? (
                                                <Badge className="bg-green-600 text-white text-[11px] gap-1">
                                                    <CheckCircle2 className="size-3" /> Ready
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive" className="text-[11px]">
                                                    Required
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                            {hasHome
                                                ? `Home added: "${homes[0]?.title || "My Home"}" in ${homes[0]?.city || "your city"}, ${homes[0]?.country || ""}`
                                                : "You haven't added your home yet. LifeSwap requires a home listing so swap partners know where they'll stay."}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant={hasHome ? "outline" : "default"}
                                    size="sm"
                                    onClick={() => onNavigate("my-home")}
                                    className="shrink-0 gap-1.5 font-semibold"
                                >
                                    {hasHome ? "Manage Home" : "Add Your Home"}
                                    <ArrowRight className="size-3.5" />
                                </Button>
                            </div>

                            {/* Requirement 2: Preferences */}
                            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                                hasEnoughPreferences ? "bg-green-500/5 border-green-500/30" : "bg-card border-amber-500/40 shadow-sm"
                            }`}>
                                <div className="flex items-start gap-3.5">
                                    <div className={`p-2.5 rounded-xl shrink-0 ${hasEnoughPreferences ? "bg-green-500/20 text-green-700 dark:text-green-300" : "bg-amber-500/20 text-amber-700 dark:text-amber-300"}`}>
                                        <Sparkles className="size-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-base">2. Matching Preferences</h3>
                                            {hasEnoughPreferences ? (
                                                <Badge className="bg-green-600 text-white text-[11px] gap-1">
                                                    <CheckCircle2 className="size-3" /> Ready ({profile?.preferences.length}/3)
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 text-[11px]">
                                                    {profile?.preferences.length || 0}/3 Selected (Need 3)
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                            {hasEnoughPreferences
                                                ? `Selected: ${profile?.preferences.slice(0, 4).join(", ")}${(profile?.preferences.length || 0) > 4 ? "..." : ""}`
                                                : "You haven't selected enough preferences. Choose at least 3 preferences to help our algorithm match you with like-minded swappers."}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant={hasEnoughPreferences ? "outline" : "default"}
                                    size="sm"
                                    onClick={() => onNavigate("profile")}
                                    className="shrink-0 gap-1.5 font-semibold"
                                >
                                    {hasEnoughPreferences ? "Edit Preferences" : "Set Preferences"}
                                    <ArrowRight className="size-3.5" />
                                </Button>
                            </div>

                            {/* Requirement 3: Host Activities */}
                            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                                hasEnoughActivities ? "bg-green-500/5 border-green-500/30" : "bg-card border-amber-500/40 shadow-sm"
                            }`}>
                                <div className="flex items-start gap-3.5">
                                    <div className={`p-2.5 rounded-xl shrink-0 ${hasEnoughActivities ? "bg-green-500/20 text-green-700 dark:text-green-300" : "bg-amber-500/20 text-amber-700 dark:text-amber-300"}`}>
                                        <CalendarCheck className="size-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-base">3. Host Activities</h3>
                                            {hasEnoughActivities ? (
                                                <Badge className="bg-green-600 text-white text-[11px] gap-1">
                                                    <CheckCircle2 className="size-3" /> Ready ({profile?.activities.length} added)
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 text-[11px]">
                                                    0/1 Added (Need 1)
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                            {hasEnoughActivities
                                                ? `Host activity ready: "${profile?.activities[0]?.title}"`
                                                : "You haven't added any host activities. Add at least 1 local insider activity or experience for your swap partner."}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant={hasEnoughActivities ? "outline" : "default"}
                                    size="sm"
                                    onClick={() => onNavigate("profile")}
                                    className="shrink-0 gap-1.5 font-semibold"
                                >
                                    {hasEnoughActivities ? "Edit Activities" : "Add Host Activity"}
                                    <ArrowRight className="size-3.5" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                /* Unlocked Matching View */
                <div className="space-y-6">
                    <Card className="border-2 border-green-500/40 bg-green-500/5 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-2xl bg-green-500/20 text-green-700 dark:text-green-300 shrink-0">
                                        <CheckCircle2 className="size-8" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-xl font-bold">Matching Active & Ready!</h2>
                                            <Badge className="bg-green-600 text-white">Eligible</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Your profile has your home, matching preferences, and host activities configured.
                                        </p>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            <Badge variant="outline" className="bg-background text-xs gap-1">
                                                <House className="size-3 text-green-600" />
                                                {homes[0]?.title || "Home Listed"}
                                            </Badge>
                                            <Badge variant="outline" className="bg-background text-xs gap-1">
                                                <Sparkles className="size-3 text-green-600" />
                                                {profile?.preferences.length} Preferences
                                            </Badge>
                                            {profile?.preferredCounties && profile.preferredCounties.length > 0 && (
                                                <Badge variant="outline" className="bg-background text-xs gap-1">
                                                    <MapPin className="size-3 text-green-600" />
                                                    {profile.preferredCounties.length} Preferred Counties
                                                </Badge>
                                            )}
                                            <Badge variant="outline" className="bg-background text-xs gap-1">
                                                <CalendarCheck className="size-3 text-green-600" />
                                                {profile?.activities.length} Host Activity
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => onNavigate("explore")}
                                    className="gap-2 font-semibold shrink-0"
                                >
                                    <Compass className="size-4" />
                                    Explore Potential Swaps
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Prospective Swap Matches</CardTitle>
                            <CardDescription>
                                Members with compatible locations, vibes, and verified homes ready for mutual exchange.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="py-8 text-center space-y-3">
                            <div className="size-16 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                <HeartHandshake className="size-8" />
                            </div>
                            <h3 className="font-semibold text-lg">Looking for Compatible Swap Partners</h3>
                            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                You are ready for matching! As new members join and list their homes in your preferred destinations
                                {profile?.preferredCounties && profile.preferredCounties.length > 0
                                    ? ` (${profile.preferredCounties.map((c) => getCountyName(c)).join(", ")})`
                                    : ""}
                                , suggested swap partners will appear right here.
                            </p>
                            <div className="pt-2 flex justify-center gap-3">
                                <Button variant="outline" size="sm" onClick={() => onNavigate("explore")}>
                                    Browse All Homes
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => onNavigate("profile")}>
                                    Update Preferences
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </main>
    );
}
