
import { ArrowRight, Globe2, House, HeartHandshake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
} from "@/components/ui/card";

export default function HomePage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <header className="border-b border-border">
                <div className="mx-auto flex max-w-6xl items-center gap-2 px-6 py-5">
                    <House className="size-6 text-primary" />
                    <span className="text-xl font-bold">LifeSwap</span>
                </div>
            </header>

            <section className="mx-auto flex max-w-4xl flex-col items-center px-6 py-24 text-center">
                <Badge variant="secondary" className="mb-6">
                    Welcome to LifeSwap
                </Badge>

                <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-6xl">
                    Don't just visit.
                    <br />
                    <span className="text-primary">Live somewhere new.</span>
                </h1>

                <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
                    Exchange homes, discover local routines, and experience
                    everyday life in a different city.
                    Live like a local, not like a tourist.
                </p>

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <Button className="pointer-events-none">
                        Get Started <ArrowRight />
                    </Button>
                    <Button variant="outline" className="pointer-events-none">
                        Learn More
                    </Button>
                </div>
            </section>

            <section className="mx-auto grid max-w-5xl gap-5 px-6 pb-20 md:grid-cols-2">
                <Card>
                    <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                        <Globe2 className="size-9 text-primary" />
                        <h2 className="text-xl font-semibold">
                            Explore new cities
                        </h2>
                        <p className="text-muted-foreground">
                            Discover places through the eyes of someone
                            who actually lives there.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                        <HeartHandshake className="size-9 text-primary" />
                        <h2 className="text-xl font-semibold">
                            Exchange experiences
                        </h2>
                        <p className="text-muted-foreground">
                            Swap homes and daily routines to experience
                            a completely different lifestyle.
                        </p>
                    </CardContent>
                </Card>
            </section>
        </main>
    );
}
