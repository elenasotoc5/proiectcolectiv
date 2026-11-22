import { useEffect, useState } from "react";
import { AlertCircle, Loader2, Trash2 } from "lucide-react";
import { format, isWithinInterval, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthHeaders } from "@/lib/auth";

const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:8080";

interface Availability {
    id: number;
    startDate: string;
    endDate: string;
}

interface HomeAvailabilityCalendarProps {
    homeId: number;
}

function formatDate(date: string): string {
    return format(parseISO(date), "MMM d, yyyy");
}

function toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function readErrorMessage(data: unknown, fallback: string): string {
    if (data && typeof data === "object") {
        const record = data as Record<string, unknown>;
        if (typeof record.message === "string") return record.message;
        if (typeof record.detail === "string") return record.detail;
        if (typeof record.error === "string") return record.error;
    }
    return fallback;
}

export default function HomeAvailabilityCalendar({
    homeId,
}: HomeAvailabilityCalendarProps) {
    const baseUrl = `${API_URL}/api/v1/homes/${homeId}/availabilities`;
    const [availability, setAvailability] = useState<Availability[]>([]);
    const [range, setRange] = useState<DateRange>();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [selectionError, setSelectionError] = useState("");
    const [actionError, setActionError] = useState("");
    const [today] = useState(() => new Date());

    useEffect(() => {
        const controller = new AbortController();

        const loadAvailability = async () => {
            setLoading(true);
            setActionError("");

            try {
                const response = await fetch(baseUrl, {
                    headers: getAuthHeaders(),
                    signal: controller.signal,
                });

                if (response.status === 404 || response.status === 405) {
                    setActionError(
                        "The home availability API is not available yet. Please try again when it is ready."
                    );
                    return;
                }
                if (response.status === 401) {
                    setActionError("Your session has expired. Please sign in again.");
                    return;
                }
                if (!response.ok) {
                    const data = await response.json().catch(() => null);
                    throw new Error(
                        readErrorMessage(
                            data,
                            `Could not load availability (${response.status}).`
                        )
                    );
                }

                const data = await response.json();
                const periods = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.availabilities)
                      ? data.availabilities
                      : [];

                if (!controller.signal.aborted) {
                    setAvailability(periods);
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    setActionError(
                        error instanceof Error
                            ? error.message
                            : "Could not load availability."
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        void loadAvailability();
        return () => controller.abort();
    }, [baseUrl]);

    const addAvailability = async () => {
        setSelectionError("");
        setActionError("");

        if (!range?.from || !range.to) {
            setSelectionError("Select both a start date and an end date.");
            return;
        }
        if (range.to <= range.from) {
            setSelectionError("End date must be strictly after start date.");
            return;
        }

        setSaving(true);
        try {
            const response = await fetch(baseUrl, {
                method: "POST",
                headers: {
                    ...getAuthHeaders(),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    startDate: toIsoDate(range.from),
                    endDate: toIsoDate(range.to),
                }),
            });

            if (response.status === 404 || response.status === 405) {
                setActionError(
                    "The home availability API is not available yet. Please try again when it is ready."
                );
                return;
            }
            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(
                    readErrorMessage(
                        data,
                        `Could not add availability (${response.status}).`
                    )
                );
            }

            const created = await response.json().catch(() => null) as Availability | null;
            if (created?.id) {
                setAvailability((current) =>
                    [...current, created].sort((a, b) =>
                        a.startDate.localeCompare(b.startDate)
                    )
                );
            } else {
                const refreshResponse = await fetch(baseUrl, {
                    headers: getAuthHeaders(),
                });
                if (refreshResponse.ok) {
                    const data = await refreshResponse.json();
                    setAvailability(Array.isArray(data) ? data : []);
                }
            }
            setRange(undefined);
        } catch (error) {
            setActionError(
                error instanceof Error
                    ? error.message
                    : "Could not add availability."
            );
        } finally {
            setSaving(false);
        }
    };

    const deleteAvailability = async (availabilityId: number) => {
        setActionError("");
        setDeletingId(availabilityId);

        try {
            const response = await fetch(
                `${baseUrl}/${availabilityId}`,
                {
                    method: "DELETE",
                    headers: getAuthHeaders(),
                }
            );

            if (response.status === 404 || response.status === 405) {
                setActionError(
                    "The home availability API is not available yet. Please try again when it is ready."
                );
                return;
            }
            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(
                    readErrorMessage(
                        data,
                        `Could not remove availability (${response.status}).`
                    )
                );
            }

            setAvailability((current) =>
                current.filter((period) => period.id !== availabilityId)
            );
        } catch (error) {
            setActionError(
                error instanceof Error
                    ? error.message
                    : "Could not remove availability."
            );
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
                {actionError && (
                    <div
                        role="alert"
                        className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                    >
                        <AlertCircle className="mt-0.5 size-4 shrink-0" />
                        <span>{actionError}</span>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                        Loading availability...
                    </div>
                ) : (
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.65fr)]">
                        <div className="overflow-x-auto">
                            <Calendar
                                mode="range"
                                selected={range}
                                onSelect={(nextRange) => {
                                    setRange(nextRange);
                                    setSelectionError("");
                                }}
                                numberOfMonths={1}
                                disabled={{ before: today }}
                                modifiers={{
                                    available: (date) =>
                                        availability.some((period) => {
                                            const start = parseISO(period.startDate);
                                            const end = parseISO(period.endDate);
                                            return isWithinInterval(date, {
                                                start,
                                                end,
                                            });
                                        }),
                                }}
                                modifiersClassNames={{
                                    available:
                                        "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
                                }}
                                className="rounded-md border"
                            />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium">Selected dates</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {range?.from
                                        ? range.to
                                            ? `${format(range.from, "MMM d, yyyy")} - ${format(range.to, "MMM d, yyyy")}`
                                            : `${format(range.from, "MMM d, yyyy")} - Select end date`
                                        : "Select a start and end date"}
                                </p>
                            </div>

                            {selectionError && (
                                <p role="alert" className="text-sm text-destructive">
                                    {selectionError}
                                </p>
                            )}

                            <Button
                                type="button"
                                onClick={() => void addAvailability()}
                                disabled={saving}
                                className="w-full"
                            >
                                {saving && (
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                )}
                                Add Availability
                            </Button>

                            <div className="border-t pt-4">
                                <p className="mb-2 text-sm font-medium">
                                    Saved ranges
                                </p>
                                {availability.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No availability periods added.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {[...availability]
                                            .sort((a, b) =>
                                                a.startDate.localeCompare(b.startDate)
                                            )
                                            .map((period) => (
                                                <div
                                                    key={period.id}
                                                    className="flex items-center justify-between gap-3 rounded-md border p-2.5"
                                                >
                                                    <span className="text-sm">
                                                        {formatDate(period.startDate)}
                                                        {" - "}
                                                        {formatDate(period.endDate)}
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label={`Remove availability from ${formatDate(period.startDate)} to ${formatDate(period.endDate)}`}
                                                        onClick={() =>
                                                            void deleteAvailability(period.id)
                                                        }
                                                        disabled={
                                                            deletingId === period.id ||
                                                            saving
                                                        }
                                                    >
                                                        {deletingId === period.id ? (
                                                            <Loader2 className="size-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="size-4 text-destructive" />
                                                        )}
                                                    </Button>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
