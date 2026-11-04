import { useState } from "react";
import HomePage from "@/features/homepage/HomePage";
import RegisterPage from "@/features/auth/RegisterPage";
import LoginPage from "@/features/auth/LoginPage";
import ProfilePage from "@/features/profile/ProfilePage";
import { isUserAuthenticated, clearStoredAuth } from "@/lib/auth";

function App() {
    const [currentView, setCurrentView] = useState<"home" | "login" | "register" | "profile" | "dashboard">(() => {
        return isUserAuthenticated() ? "profile" : "home";
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
                onNavigateToProfile={() => setCurrentView("profile")}
                onRegisterSuccess={() => setCurrentView("login")}
            />
        );
    }

    if (currentView === "login") {
        return (
            <LoginPage 
                onNavigateBack={() => setCurrentView("home")}
                onNavigateToRegister={() => setCurrentView("register")}
                onLoginSuccess={() => setCurrentView("profile")} 
            />
        );
    }

    if (currentView === "profile") {
        return (
            <ProfilePage
                onNavigateBack={() => setCurrentView("home")}
                onLogout={handleLogout}
            />
        );
    }

    if (currentView === "dashboard") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <h1 className="text-3xl font-bold">Welcome to your LifeSwap Dashboard!</h1>
                <p className="text-muted-foreground">You are successfully logged in.</p>
                <div className="flex gap-4">
                    <button 
                        onClick={() => setCurrentView("profile")}
                        className="text-primary underline font-medium cursor-pointer"
                    >
                        View Profile
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="text-destructive underline font-medium cursor-pointer"
                    >
                        Log out
                    </button>
                </div>
            </div>
        );
    }

    return (
        <HomePage 
            isLoggedIn={isUserAuthenticated()}
            onGetStartedClick={() => setCurrentView("register")} 
            onSignInClick={() => setCurrentView("login")}
            onProfileClick={() => setCurrentView("profile")}
            onLogout={handleLogout}
        />
    );
}

export default App;
