import { useState, useEffect } from "react";
import {
    HeartHandshake,
    AlertCircle,
    CheckCircle2,
    House,
    Sparkles,
    CalendarCheck,
    Compass,
    UserRound,
    ArrowRight,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { DashboardView } from "@/components/layout/DashboardSidebar";
import { getAuthHeaders, getStoredUserId, clearStoredAuth } from "@/lib/auth";

const API_URL =
    import.meta.env.API_URL || import.meta.env.VITE_API_URL || "http://localhost:8080";

interface DashboardPageProps {
    onNavigate: (view: DashboardView) => void;
    onLogout?: () => void;
}

export default function DashboardPage({ onNavigate, onLogout }: DashboardPageProps) {
    const [userName, setUserName] = useState<string>("");
    const [hasHome, setHasHome] = useState(false);
    const [preferencesCount, setPreferencesCount] = useState(0);
    const [activitiesCount, setActivitiesCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const userId = getStoredUserId();

        const loadDashboard = async () => {
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
                    const data = await profileRes.json();
                    if (isMounted) {
                        const name = [data.firstName, data.lastName].filter(Boolean).join(" ");
                        setUserName(name || "Traveler");
                        setPreferencesCount(Array.isArray(data.preferences) ? data.preferences.length : 0);
                        setActivitiesCount(Array.isArray(data.activities) ? data.activities.length : 0);
                        if (data.hasHome) {
                            setHasHome(true);
                        }
                    }
                }

                if (homesRes.ok) {
                    const homesData = await homesRes.json();
                    if (isMounted && Array.isArray(homesData) && homesData.length > 0) {
                        setHasHome(true);
                    }
                }
            } catch (err) {
                console.warn("Could not load dashboard data:", err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadDashboard();

        return () => {
            isMounted = false;
        };
    }, [onLogout]);

    const hasEnoughPreferences = preferencesCount >= 3;
    const hasEnoughActivities = activitiesCount >= 1;
    const isReadyForMatching = hasHome && hasEnoughPreferences && hasEnoughActivities;

    const missingList = [
        !hasHome ? "home" : null,
        !hasEnoughPreferences ? "preferences" : null,
        !hasEnoughActivities ? "host activities" : null,
    ].filter(Boolean) as string[];

    return (
        <main className="px-6 py-12 md:p-8 max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Welcome back{userName ? `, ${userName}` : ""}!
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Manage your home, preferences, and discover swap partners in the LifeSwap community.
                </p>
            </div>

            {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span>Loading dashboard...</span>
                </div>
            ) : (
                /* Matching Readiness Widget */
                <Card className={`border-2 transition-all ${
                    isReadyForMatching ? "border-green-500/40 bg-green-500/5" : "border-amber-500/40 bg-amber-500/5"
                }`}>
                    <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                                <HeartHandshake className={`size-6 ${isReadyForMatching ? "text-green-600" : "text-amber-600"}`} />
                                <CardTitle className="text-lg font-semibold">
                                    {isReadyForMatching ? "Matching Ready & Active" : "Life Swap Matching Status"}
                                </CardTitle>
                            </div>
                            <Badge variant={isReadyForMatching ? "default" : "secondary"} className={isReadyForMatching ? "bg-green-600 text-white self-start sm:self-auto" : "bg-amber-500/20 text-amber-800 dark:text-amber-300 self-start sm:self-auto"}>
                                {isReadyForMatching ? "Ready to Swap" : "Requirements Incomplete"}
                            </Badge>
                        </div>
                        <CardDescription>
                            {isReadyForMatching
                                ? "Your home, preferences, and activities are set. You are visible in our Life Swap matching pool!"
                                : "You can't match because you didn't add your " + missingList.join(", ") + "."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!isReadyForMatching && (
                            <Alert variant="destructive" className="border-destructive/30 bg-destructive/10 text-destructive dark:text-red-300 py-3">
                                <AlertCircle className="size-4" />
                                <AlertTitle className="text-sm font-semibold">Matching is currently locked</AlertTitle>
                                <AlertDescription className="text-xs mt-0.5">
                                    You can't match because you didn't add your {missingList.join(", ")}. Please complete these requirements to activate matching.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 ${
                                hasHome ? "bg-background/80 border-green-500/30" : "bg-background border-destructive/30"
                            }`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold flex items-center gap-1.5">
                                        <House className={`size-4 ${hasHome ? "text-green-600" : "text-destructive"}`} />
                                        Home Listing
                                    </span>
                                    {hasHome ? (
                                        <CheckCircle2 className="size-4 text-green-600" />
                                    ) : (
                                        <span className="text-[11px] font-bold text-destructive">Missing</span>
                                    )}
                                </div>
                                <p className="text-[12px] text-muted-foreground">
                                    {hasHome ? "Home added & ready" : "Add your home listing"}
                                </p>
                                {!hasHome && (
                                    <Button size="sm" variant="default" className="w-full h-7 text-xs font-semibold" onClick={() => onNavigate("my-home")}>
                                        Add Home
                                    </Button>
                                )}
                            </div>

                            <div className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 ${
                                hasEnoughPreferences ? "bg-background/80 border-green-500/30" : "bg-background border-amber-500/30"
                            }`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold flex items-center gap-1.5">
                                        <Sparkles className={`size-4 ${hasEnoughPreferences ? "text-green-600" : "text-amber-600"}`} />
                                        Preferences
                                    </span>
                                    {hasEnoughPreferences ? (
                                        <CheckCircle2 className="size-4 text-green-600" />
                                    ) : (
                                        <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">{preferencesCount}/3</span>
                                    )}
                                </div>
                                <p className="text-[12px] text-muted-foreground">
                                    {hasEnoughPreferences ? `${preferencesCount} preferences selected` : "Need at least 3 preferences"}
                                </p>
                                {!hasEnoughPreferences && (
                                    <Button size="sm" variant="outline" className="w-full h-7 text-xs font-semibold" onClick={() => onNavigate("profile")}>
                                        Set Preferences
                                    </Button>
                                )}
                            </div>

                            <div className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 ${
                                hasEnoughActivities ? "bg-background/80 border-green-500/30" : "bg-background border-amber-500/30"
                            }`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold flex items-center gap-1.5">
                                        <CalendarCheck className={`size-4 ${hasEnoughActivities ? "text-green-600" : "text-amber-600"}`} />
                                        Host Activities
                                    </span>
                                    {hasEnoughActivities ? (
                                        <CheckCircle2 className="size-4 text-green-600" />
                                    ) : (
                                        <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">0/1</span>
                                    )}
                                </div>
                                <p className="text-[12px] text-muted-foreground">
                                    {hasEnoughActivities ? `${activitiesCount} activity added` : "Need at least 1 activity"}
                                </p>
                                {!hasEnoughActivities && (
                                    <Button size="sm" variant="outline" className="w-full h-7 text-xs font-semibold" onClick={() => onNavigate("profile")}>
                                        Add Activity
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <Button
                                size="sm"
                                variant={isReadyForMatching ? "default" : "outline"}
                                onClick={() => onNavigate("matches")}
                                className="gap-1.5 font-semibold text-xs"
                            >
                                {isReadyForMatching ? "Go to My Matches" : "Check Matching Checklist"}
                                <ArrowRight className="size-3.5" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Quick Navigation Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => onNavigate("my-home")}>
                    <CardHeader className="pb-2">
                        <House className="size-6 text-primary mb-1" />
                        <CardTitle className="text-base font-semibold">My Home</CardTitle>
                        <CardDescription className="text-xs">
                            Manage your home details, amenities, and photo gallery.
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => onNavigate("matches")}>
                    <CardHeader className="pb-2">
                        <HeartHandshake className="size-6 text-primary mb-1" />
                        <CardTitle className="text-base font-semibold">My Matches</CardTitle>
                        <CardDescription className="text-xs">
                            Check match requirements and prospective life swappers.
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => onNavigate("profile")}>
                    <CardHeader className="pb-2">
                        <UserRound className="size-6 text-primary mb-1" />
                        <CardTitle className="text-base font-semibold">My Profile</CardTitle>
                        <CardDescription className="text-xs">
                            Update bio, preferences, and host experiences.
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => onNavigate("explore")}>
                    <CardHeader className="pb-2">
                        <Compass className="size-6 text-primary mb-1" />
                        <CardTitle className="text-base font-semibold">Explore Homes</CardTitle>
                        <CardDescription className="text-xs">
                            Browse available swap listings in other cities.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </main>
    );
}
