import { useState } from "react";
import { House, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface RegisterPageProps {
    onNavigateBack: () => void;
}

export default function RegisterPage({ onNavigateBack }: RegisterPageProps) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
        setErrorMessage("");
        setSuccessMessage("");
    };

    const validateForm = (): boolean => {
        // FE validation: non-empty required fields
        if (
            !formData.name.trim() ||
            !formData.email.trim() ||
            !formData.password ||
            !formData.confirmPassword
        ) {
            setErrorMessage("All fields are required.");
            return false;
        }

        // FE validation: valid email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.trim())) {
            setErrorMessage("Please enter a valid email address.");
            return false;
        }

        // FE validation: password confirmation check
        if (formData.password !== formData.confirmPassword) {
            setErrorMessage("Passwords do not match.");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            // Connect to registration API
            const response = await fetch("http://localhost:8080/api/v1/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    email: formData.email.trim(),
                    password: formData.password,
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                const apiError =
                    data?.message ||
                    data?.error ||
                    "Registration failed. Please check your details.";
                setErrorMessage(apiError);
                return;
            }

            setSuccessMessage("Account created successfully! You can now log in.");
            setFormData({
                name: "",
                email: "",
                password: "",
                confirmPassword: "",
            });
        } catch {
            setErrorMessage(
                "Unable to connect to the server. Please make sure the backend is running."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col">
            <header className="border-b border-border">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
                    <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={onNavigateBack}
                    >
                        <House className="size-6 text-primary" />
                        <span className="text-xl font-bold">LifeSwap</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onNavigateBack}
                        className="gap-2"
                    >
                        <ArrowLeft className="size-4" /> Back
                    </Button>
                </div>
            </header>

            <div className="flex flex-1 items-center justify-center p-6">
                <Card className="w-full max-w-md shadow-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold">
                            Create an account
                        </CardTitle>
                        <CardDescription>
                            Join the LifeSwap community and start exchanging homes
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            {errorMessage && (
                                <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm font-medium text-destructive">
                                    <AlertCircle className="size-4 shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            {successMessage && (
                                <div className="flex items-center gap-2 rounded-md bg-emerald-500/15 p-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="size-4 shrink-0" />
                                    <span>{successMessage}</span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder="e.g. Jane Doe"
                                    value={formData.name}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-3 mt-2">
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    "Sign Up"
                                )}
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">
                                Already have an account?{" "}
                                <button
                                    type="button"
                                    onClick={onNavigateBack}
                                    className="text-primary hover:underline font-semibold"
                                >
                                    Sign in
                                </button>
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </main>
    );
}