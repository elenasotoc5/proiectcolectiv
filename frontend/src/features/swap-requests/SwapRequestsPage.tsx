import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import {
    AlertCircle,
    ArrowLeft,
    ArrowLeftRight,
    CalendarDays,
    Home as HomeIcon,
    Inbox,
    Loader2,
    MapPin,
    Send,
    Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { homeImageUrl } from "@/features/home/homeLikesApi";
import { cn } from "@/lib/utils";
import {
    getReceivedSwapRequests,
    getSentSwapRequests,
    getSwapRequest,
    type SwapHome,
    type SwapRequest,
    type SwapRequestStatus,
} from "./swapRequestsApi";

type Direction = "sent" | "received";

interface SwapRequestsPageProps {
    onExplore?: () => void;
}

const STATUS_STYLES: Record<SwapRequestStatus, { label: string; className: string }> = {
    PENDING: { label: "Pending", className: "bg-amber-100 text-amber-800 border-amber-200" },
    ACCEPTED: { label: "Accepted", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800 border-red-200" },
    CANCELLED: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
};

function StatusBadge({ status }: { status: SwapRequestStatus }) {
    const style = STATUS_STYLES[status] ?? STATUS_STYLES.PENDING;
    return (
        <Badge variant="outline" className={cn("rounded-full", style.className)}>
            {style.label}
        </Badge>
    );
}

function formatPeriod(request: SwapRequest): string {
    return `${format(parseISO(request.startDate), "MMM d")} – ${format(parseISO(request.endDate), "MMM d, yyyy")}`;
}

/** From the viewer's point of view: the home they give, and the home they stay at. */
function homesFor(request: SwapRequest, direction: Direction) {
    return direction === "sent"
        ? { mine: request.requesterHome, theirs: request.targetHome }
        : { mine: request.targetHome, theirs: request.requesterHome };
}

function HomeThumb({ home, className }: { home?: SwapHome; className?: string }) {
    const src = homeImageUrl(home?.primaryPhotoUrl);
    return (
        <div className={cn("shrink-0 overflow-hidden rounded-lg bg-muted", className)}>
            {src ? (
                <img src={src} alt={home?.title ?? "Home"} className="size-full object-cover" />
            ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                    <HomeIcon className="size-5" />
                </div>
            )}
        </div>
    );
}

function RequestCard({
    request,
    direction,
    onOpen,
}: {
    request: SwapRequest;
    direction: Direction;
    onOpen: () => void;
}) {
    const { mine, theirs } = homesFor(request, direction);
    return (
        <button
            type="button"
            onClick={onOpen}
            className="w-full rounded-2xl border bg-card p-4 text-left shadow-2xs transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-primary"
        >
            <div className="flex items-center gap-4">
                <HomeThumb home={theirs} className="size-16" />
                <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-semibold">{theirs?.title ?? "Home"}</p>
                        <StatusBadge status={request.status} />
                    </div>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" />
                        {theirs?.city}
                        {theirs?.county ? `, ${theirs.county}` : ""}
                    </p>
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <CalendarDays className="size-3" />
                            {formatPeriod(request)}
                        </span>
                        <span className="flex items-center gap-1">
                            <ArrowLeftRight className="size-3" />
                            {direction === "sent" ? "You offer" : "For your"} {mine?.title}
                        </span>
                    </p>
                </div>
            </div>
        </button>
    );
}

function RequestList({
    direction,
    requests,
    onOpen,
    onExplore,
}: {
    direction: Direction;
    requests: SwapRequest[];
    onOpen: (id: number) => void;
    onExplore?: () => void;
}) {
    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-10 text-center">
                {direction === "sent" ? (
                    <Send className="size-8 text-muted-foreground" />
                ) : (
                    <Inbox className="size-8 text-muted-foreground" />
                )}
                <p className="font-medium">
                    {direction === "sent" ? "You haven't sent any swap requests yet" : "No swap requests received yet"}
                </p>
                <p className="text-sm text-muted-foreground">
                    {direction === "sent"
                        ? "Find a home you like and propose a 7-day exchange."
                        : "Requests from other users for your home will show up here."}
                </p>
                {direction === "sent" && onExplore && (
                    <Button className="rounded-full" onClick={onExplore}>
                        Explore Homes
                    </Button>
                )}
            </div>
        );
    }
    return (
        <div className="space-y-3">
            {requests.map((r) => (
                <RequestCard key={r.id} request={r} direction={direction} onOpen={() => onOpen(r.id)} />
            ))}
        </div>
    );
}

function HomeDetailCard({ label, home }: { label: string; home?: SwapHome }) {
    return (
        <Card className="flex-1 rounded-2xl">
            <CardContent className="space-y-3 p-4">
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
                <HomeThumb home={home} className="aspect-video w-full" />
                <div className="space-y-1">
                    <p className="font-semibold">{home?.title ?? "Home"}</p>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="size-3.5" />
                        {home?.city}
                        {home?.county ? `, ${home.county}` : ""}
                    </p>
                    {(home?.housingType || home?.guestCapacity) && (
                        <p className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Users className="size-3.5" />
                            {home?.housingType}
                            {home?.guestCapacity ? ` · up to ${home.guestCapacity} guests` : ""}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function RequestDetails({
    requestId,
    direction,
    onBack,
}: {
    requestId: number;
    direction: Direction;
    onBack: () => void;
}) {
    const [request, setRequest] = useState<SwapRequest | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();
        setRequest(null);
        setError("");
        getSwapRequest(requestId, controller.signal)
            .then(setRequest)
            .catch((err) => {
                if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Could not load request");
            });
        return () => controller.abort();
    }, [requestId]);

    const homes = request ? homesFor(request, direction) : null;

    return (
        <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
            <Button variant="outline" onClick={onBack} className="rounded-full">
                <ArrowLeft className="mr-2 size-4" />
                Back to My Swap Requests
            </Button>

            {error ? (
                <div role="alert" className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-destructive">
                    <AlertCircle className="size-5" />
                    {error}
                </div>
            ) : !request || !homes ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Loading request...
                </div>
            ) : (
                <>
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge status={request.status} />
                            <span className="text-xs text-muted-foreground">
                                {direction === "sent" ? "Sent by you" : "Received"}
                                {request.createdAt ? ` on ${format(parseISO(request.createdAt), "MMM d, yyyy")}` : ""}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Swap request</h1>
                        <p className="flex items-center gap-2 text-muted-foreground">
                            <CalendarDays className="size-4" />
                            {format(parseISO(request.startDate), "EEEE, MMM d")} –{" "}
                            {format(parseISO(request.endDate), "EEEE, MMM d, yyyy")} · 7 days
                        </p>
                    </div>

                    <div className="flex flex-col items-stretch gap-4 sm:flex-row">
                        <HomeDetailCard label="Your home" home={homes.mine} />
                        <ArrowLeftRight className="size-5 shrink-0 self-center text-muted-foreground" />
                        <HomeDetailCard label="Their home" home={homes.theirs} />
                    </div>

                    {request.status === "PENDING" && (
                        <p className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                            {direction === "sent"
                                ? "Waiting for the owner to accept or reject this request."
                                : "This request is waiting for your answer."}
                        </p>
                    )}
                </>
            )}
        </main>
    );
}

export default function SwapRequestsPage({ onExplore }: SwapRequestsPageProps) {
    const [sent, setSent] = useState<SwapRequest[]>([]);
    const [received, setReceived] = useState<SwapRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);
    const [tab, setTab] = useState<Direction>("sent");
    const [openRequestId, setOpenRequestId] = useState<number | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError("");
        Promise.all([getSentSwapRequests(controller.signal), getReceivedSwapRequests(controller.signal)])
            .then(([sentData, receivedData]) => {
                setSent(sentData);
                setReceived(receivedData);
            })
            .catch((err) => {
                if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Could not load swap requests");
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [reloadKey]);

    if (openRequestId != null) {
        return <RequestDetails requestId={openRequestId} direction={tab} onBack={() => setOpenRequestId(null)} />;
    }

    return (
        <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Swap Requests</h1>
                <p className="mt-1 text-sm text-muted-foreground">Track the exchanges you proposed and the ones you received.</p>
            </div>

            {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Loading swap requests...
                </div>
            ) : error ? (
                <div className="space-y-3">
                    <div role="alert" className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-destructive">
                        <AlertCircle className="size-5" />
                        {error}
                    </div>
                    <Button variant="outline" onClick={() => setReloadKey((k) => k + 1)}>
                        Try Again
                    </Button>
                </div>
            ) : (
                <Tabs value={tab} onValueChange={(value) => setTab(value as Direction)}>
                    <TabsList>
                        <TabsTrigger value="sent">Sent ({sent.length})</TabsTrigger>
                        <TabsTrigger value="received">Received ({received.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="sent" className="pt-4">
                        <RequestList direction="sent" requests={sent} onOpen={setOpenRequestId} onExplore={onExplore} />
                    </TabsContent>
                    <TabsContent value="received" className="pt-4">
                        <RequestList direction="received" requests={received} onOpen={setOpenRequestId} />
                    </TabsContent>
                </Tabs>
            )}
        </main>
    );
}
