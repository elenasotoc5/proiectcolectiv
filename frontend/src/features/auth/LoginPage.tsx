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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

interface LoginPageProps {
    onNavigateBack: () => void;
    onNavigateToRegister: () => void;
    onLoginSuccess: () => void;
}

export default function LoginPage({
    onNavigateBack,
    onNavigateToRegister,
    onLoginSuccess,
}: LoginPageProps) {
    // State to manage input form data (email and password)
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    // States for handling UI messages and loading status
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Handle input field changes and clear previous feedback messages
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
        setErrorMessage("");
        setSuccessMessage("");
    };

    // Form validation logic matching acceptance criteria
    const validateForm = (): boolean => {
        // FE validation: Required fields cannot be empty
        if (!formData.email.trim() || !formData.password) {
            setErrorMessage("All fields are required.");
            return false;
        }

        // FE validation: Valid email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.trim())) {
            setErrorMessage("Please enter a valid email address.");
            return false;
        }

        return true;
    };

    // Handle form submission and API call
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");

        // Stop execution if form validation fails
        if (!validateForm()) {
            return;
        }

        // Set loading state to prevent repeated submissions
        setIsLoading(true);

        try {
            // Connect to the authentication API endpoint
            const response = await fetch(`${API_URL}/api/v1/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: formData.email.trim(),
                    password: formData.password,
                }),
            });

            const data = await response.json().catch(() => null);

            // Handle server-side authentication errors
            if (!response.ok) {
                const apiError =
                    data?.message ||
                    data?.error ||
                    "Invalid email or password. Please try again.";
                setErrorMessage(apiError);
                return;
            }

            // Handle successful authentication
            setSuccessMessage("Login successful! Redirecting...");
            
            setTimeout(() => {
                onLoginSuccess();
            }, 1000);
            
        } catch (err) {
            // Log technical error for debugging 
            console.error("Login request error:", err);
            setErrorMessage("Something went wrong. Please try again later.");
        } finally {
            // Reset loading state once the request is complete
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
                            Welcome back
                        </CardTitle>
                        <CardDescription>
                            Sign in to your LifeSwap account to continue
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            {/* Display authentication errors dynamically */}
                            {errorMessage && (
                                <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm font-medium text-destructive">
                                    <AlertCircle className="size-4 shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            {/* Display success feedback message */}
                            {successMessage && (
                                <div className="flex items-center gap-2 rounded-md bg-emerald-500/15 p-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="size-4 shrink-0" />
                                    <span>{successMessage}</span>
                                </div>
                            )}

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
                        </CardContent>

                        <CardFooter className="flex flex-col gap-3 mt-2">
                            {/* Submit button with loading spinner state to prevent multiple clicks */}
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    "Sign In"
                                )}
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">
                                Don't have an account?{" "}
                                <button
                                    type="button"
                                    onClick={onNavigateToRegister}
                                    className="text-primary hover:underline font-semibold"
                                >
                                    Sign up
                                </button>
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </main>
    );
}