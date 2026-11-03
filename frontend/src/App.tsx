import { useState } from "react";
import HomePage from "@/features/homepage/HomePage";
import RegisterPage from "@/features/auth/RegisterPage";
import LoginPage from "@/features/auth/LoginPage";
import { isUserAuthenticated, clearStoredAuth } from "@/lib/auth";

function App() {
    const [currentView, setCurrentView] = useState<"home" | "login" | "register" | "dashboard">(() => {
        return isUserAuthenticated() ? "dashboard" : "home";
    });

    const handleLogout = () => {
        clearStoredAuth();
        setCurrentView("home");
    };

    if (currentView === "register") {
        return (
            <RegisterPage 
                onNavigateBack={() => setCurrentView("home")} 
                onNavigateToLogin={() => setCurrentView("login")}
            />
        );
    }

    if (currentView === "login") {
        return (
            <LoginPage 
                onNavigateBack={() => setCurrentView("home")}
                onNavigateToRegister={() => setCurrentView("register")}
                onLoginSuccess={() => setCurrentView("dashboard")} 
            />
        );
    }

    if (currentView === "dashboard") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <h1 className="text-3xl font-bold">Welcome to your LifeSwap Dashboard! </h1>
                <p className="text-muted-foreground">You are successfully logged in.</p>
                <button 
                    onClick={handleLogout}
                    className="text-primary underline font-medium cursor-pointer"
                >
                    Log out
                </button>
            </div>
        );
    }

    return (
        <HomePage 
            onGetStartedClick={() => setCurrentView("register")} 
            onSignInClick={() => setCurrentView("login")}
        />
    );
}

export default App;