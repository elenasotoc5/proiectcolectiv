import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerUser, type UserResponse } from "./api";

export default function RegisterPage({ onBack }: { onBack: () => void }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [created, setCreated] = useState<UserResponse | null>(null);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const user = await registerUser(name, email, password);
            setCreated(user);
        } catch (err) {
            setError(
                err instanceof TypeError
                    ? "Cannot reach the server"
                    : (err as Error).message,
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
            <Card className="w-full max-w-md">
                <CardContent className="flex flex-col gap-5 p-8">
                    <h1 className="text-2xl font-bold">Create your account</h1>

                    {created ? (
                        <div className="flex flex-col gap-4">
                            <p className="text-sm">
                                Account created for{" "}
                                <strong>{created.email}</strong>. Welcome,{" "}
                                {created.name}!
                            </p>
                            <Button variant="outline" onClick={onBack}>
                                Back to home
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    minLength={8}
                                    maxLength={72}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-destructive" role="alert">
                                    {error}
                                </p>
                            )}

                            <Button type="submit" disabled={loading}>
                                {loading ? "Creating..." : "Register"}
                            </Button>
                            <Button type="button" variant="ghost" onClick={onBack}>
                                Back
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}