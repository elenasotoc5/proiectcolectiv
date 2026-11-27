import { useEffect, useMemo, useState } from "react";
import { addDays, format, startOfDay } from "date-fns";
import { AlertCircle, ArrowLeftRight, CheckCircle2, Home as HomeIcon, Loader2, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
    SWAP_DAYS,
    coversSwap,
    createSwapRequest,
    getHomeAvailability,
    getMyHomes,
    toIsoDate,
    type AvailabilityPeriod,
    type SwapHome,
    type SwapRequest,
} from "./swapRequestsApi";

interface RequestSwapDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    targetHome: SwapHome;
    onSent?: (request: SwapRequest) => void;
}

function HomeSummary({ label, home }: { label: string; home?: SwapHome }) {
    return (
        <div className="flex-1 min-w-0 rounded-xl border bg-card p-3 text-sm">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
            <p className="font-semibold truncate">{home?.title ?? "Choose a home"}</p>
            {home && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" />
                    {home.city}
                    {home.county ? `, ${home.county}` : ""}
                </p>
            )}
        </div>
    );
}

export default function RequestSwapDialog({ open, onOpenChange, targetHome, onSent }: RequestSwapDialogProps) {
    const [myHomes, setMyHomes] = useState<SwapHome[]>([]);
    const [myHomeId, setMyHomeId] = useState<number | null>(null);
    const [targetAvailability, setTargetAvailability] = useState<AvailabilityPeriod[]>([]);
    const [myAvailability, setMyAvailability] = useState<AvailabilityPeriod[]>([]);
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);

    // Reload the user's homes and the target home's availability every time the dialog opens.
    useEffect(() => {
        if (!open) return;
        const controller = new AbortController();
        setLoading(true);
        setError("");
        setSent(false);
        setStartDate(undefined);

        Promise.all([getMyHomes(controller.signal), getHomeAvailability(targetHome.id, controller.signal)])
            .then(([homes, availability]) => {
                const eligible = homes.filter((h) => h.id !== targetHome.id);
                setMyHomes(eligible);
                setMyHomeId(eligible.length === 1 ? eligible[0].id : null);
                setTargetAvailability(availability);
            })
            .catch((err) => {
                if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Could not load data");
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [open, targetHome.id]);

    useEffect(() => {
        setStartDate(undefined);
        if (myHomeId == null) {
            setMyAvailability([]);
            return;
        }
        const controller = new AbortController();
        getHomeAvailability(myHomeId, controller.signal)
            .then(setMyAvailability)
            .catch((err) => {
                if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Could not load availability");
            });
        return () => controller.abort();
    }, [myHomeId]);

    const today = useMemo(() => startOfDay(new Date()), []);
    const myHome = myHomes.find((h) => h.id === myHomeId);
    const isValidStart = (date: Date) =>
        date >= today && coversSwap(targetAvailability, date) && coversSwap(myAvailability, date);
    // First possible start within a year; the calendar opens on its month.
    const firstValidStart = useMemo(() => {
        for (let d = today; d <= addDays(today, 365); d = addDays(d, 1)) {
            if (coversSwap(targetAvailability, d) && coversSwap(myAvailability, d)) return d;
        }
        return undefined;
    }, [today, targetAvailability, myAvailability]);

    const endDate = startDate ? addDays(startDate, SWAP_DAYS - 1) : undefined;
    const canSubmit = Boolean(myHome && startDate && isValidStart(startDate)) && !submitting;

    const handleSubmit = async () => {
        if (!myHome || !startDate) return;
        setSubmitting(true);
        setError("");
        try {
            const created = await createSwapRequest({
                requesterHomeId: myHome.id,
                targetHomeId: targetHome.id,
                startDate: toIsoDate(startDate),
            });
            setSent(true);
            onSent?.(created);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not send swap request");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Request a swap</DialogTitle>
                    <DialogDescription>
                        Propose a {SWAP_DAYS}-day home exchange with {targetHome.title}.
                    </DialogDescription>
                </DialogHeader>

                {sent ? (
                    <div className="flex flex-col items-center gap-3 py-6 text-center">
                        <CheckCircle2 className="size-10 text-primary" />
                        <p className="font-semibold">Swap request sent</p>
                        <p className="text-sm text-muted-foreground">
                            {myHome?.title} ⇄ {targetHome.title}
                            {startDate && endDate && `, ${format(startDate, "MMM d")} – ${format(endDate, "MMM d, yyyy")}`}.
                            The owner can now accept or reject it.
                        </p>
                        <Button className="mt-2 rounded-full" onClick={() => onOpenChange(false)}>
                            Done
                        </Button>
                    </div>
                ) : loading ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                        Loading your homes and availability...
                    </div>
                ) : myHomes.length === 0 ? (
                    <div className="flex items-center gap-3 rounded-xl border p-4 text-sm text-muted-foreground">
                        <HomeIcon className="size-5 shrink-0" />
                        You need to add a home of your own before you can request a swap.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {myHomes.length > 1 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Which home do you offer?</p>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {myHomes.map((h) => (
                                        <button
                                            key={h.id}
                                            type="button"
                                            onClick={() => setMyHomeId(h.id)}
                                            className={cn(
                                                "rounded-xl border p-3 text-left text-sm transition-colors",
                                                h.id === myHomeId ? "border-primary bg-primary/5" : "hover:bg-muted",
                                            )}
                                        >
                                            <span className="font-semibold block truncate">{h.title}</span>
                                            <span className="text-xs text-muted-foreground">{h.city}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {myHome && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Choose the first day</p>
                                {firstValidStart ? (
                                    <div className="flex justify-center rounded-xl border">
                                        <Calendar
                                            key={firstValidStart.getTime()}
                                            defaultMonth={firstValidStart}
                                            mode="single"
                                            selected={startDate}
                                            onSelect={setStartDate}
                                            disabled={(date) => !isValidStart(date)}
                                            modifiers={startDate && endDate ? { swap: { from: startDate, to: endDate } } : undefined}
                                            modifiersClassNames={{ swap: "bg-primary/10 rounded-md" }}
                                        />
                                    </div>
                                ) : (
                                    <p className="rounded-xl border p-4 text-sm text-muted-foreground">
                                        There is no {SWAP_DAYS}-day period when both homes are available. Add
                                        availability to your home or try another listing.
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex items-stretch gap-2">
                            <HomeSummary label="You offer" home={myHome} />
                            <ArrowLeftRight className="size-4 self-center shrink-0 text-muted-foreground" />
                            <HomeSummary label="You stay at" home={targetHome} />
                        </div>
                        <p className="text-sm text-center">
                            {startDate && endDate
                                ? `${format(startDate, "EEE, MMM d")} – ${format(endDate, "EEE, MMM d, yyyy")}`
                                : "No period selected"}
                        </p>
                    </div>
                )}

                {error && (
                    <div
                        role="alert"
                        className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                    >
                        <AlertCircle className="size-4 shrink-0" />
                        {error}
                    </div>
                )}

                {!sent && !loading && myHomes.length > 0 && (
                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={!canSubmit}>
                            {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                            Send request
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
