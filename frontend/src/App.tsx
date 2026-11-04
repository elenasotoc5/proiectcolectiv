
import { useState } from "react";
import HomePage from "@/features/homepage/HomePage";
import RegisterPage from "@/features/auth/RegisterPage";
import LoginPage from "@/features/auth/LoginPage";
import ProfilePage from "@/features/profile/ProfilePage";
import DashboardSidebar, {
    type DashboardView,
} from "@/components/layout/DashboardSidebar";
import { isUserAuthenticated, clearStoredAuth } from "@/lib/auth";

type AppView = "home" | "login" | "register" | DashboardView;

function App() {
    const [currentView, setCurrentView] = useState<AppView>(() => {
        return isUserAuthenticated() ? "dashboard" : "home";
    });

    const handleLogout = () => {
        clearStoredAuth();
        setCurrentView("home");
    };

    const navigateToProtectedPage = (view: DashboardView) => {
        if (!isUserAuthenticated()) {
            setCurrentView("login");
            return;
        }

        setCurrentView(view);
    };

    if (currentView === "register") {
        return (
            <RegisterPage
                onNavigateBack={() => setCurrentView("home")}
                onNavigateToLogin={() => setCurrentView("login")}
                onNavigateToProfile={() => navigateToProtectedPage("profile")}
                onRegisterSuccess={() => setCurrentView("login")}
            />
        );
    }

    if (currentView === "login") {
        return (
            <LoginPage
                onNavigateBack={() => setCurrentView("home")}
                onNavigateToRegister={() => setCurrentView("register")}
                onLoginSuccess={() => navigateToProtectedPage("dashboard")}
            />
        );
    }

    if (currentView === "home") {
        return (
            <HomePage
                isLoggedIn={isUserAuthenticated()}
                onGetStartedClick={() => setCurrentView("register")}
                onSignInClick={() => setCurrentView("login")}
                onProfileClick={() => navigateToProtectedPage("profile")}
                onLogout={handleLogout}
            />
        );
    }

    if (!isUserAuthenticated()) {
        return (
            <LoginPage
                onNavigateBack={() => setCurrentView("home")}
                onNavigateToRegister={() => setCurrentView("register")}
                onLoginSuccess={() => navigateToProtectedPage("dashboard")}
            />
        );
    }

    const pageTitles: Record<Exclude<DashboardView, "profile">, string> = {
        dashboard: "Dashboard",
        explore: "Explore Homes",
        matches: "My Matches",
        "my-home": "My Home",
    };

    return (
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar
                currentView={currentView}
                onNavigate={navigateToProtectedPage}
                onLogout={handleLogout}
            />

            <div className="min-w-0 flex-1">
                {currentView === "profile" ? (
                    <ProfilePage
                        onLogout={handleLogout}
                    />
                ) : (
                    <main className="px-6 py-20 md:p-8">
                        <h1 className="text-3xl font-bold">
                            {pageTitles[currentView]}
                        </h1>

                        {currentView === "dashboard" ? (
                            <p className="mt-3 text-muted-foreground">
                                Welcome to your LifeSwap Dashboard!
                            </p>
                        ) : (
                            <p className="mt-3 text-muted-foreground">
                                This section is coming soon.
                            </p>
                        )}
                    </main>
                )}
            </div>
        </div>
    );
}

export default App;
