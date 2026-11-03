
// import HomePage from "@/features/homepage/HomePage";

// function App() {
//     return <HomePage />;
// }

// export default App;
import { useState } from "react";
import HomePage from "@/features/homepage/HomePage";
import RegisterPage from "@/features/auth/RegisterPage";
import ProfilePage from "@/features/profile/ProfilePage";

function App() {
    const [currentView, setCurrentView] = useState<"home" | "register" | "profile">("home");
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
        return Boolean(localStorage.getItem("lifeSwapUserId"));
    });

    const handleLogout = () => {
        localStorage.removeItem("lifeSwapUserId");
        localStorage.removeItem("lifeSwapUser");
        setIsLoggedIn(false);
        setCurrentView("home");
    };

    if (currentView === "register") {
        return (
            <RegisterPage
                onNavigateBack={() => setCurrentView("home")}
                onNavigateToProfile={() => setCurrentView("profile")}
                onRegisterSuccess={() => setIsLoggedIn(true)}
            />
        );
    }

    if (currentView === "profile") {
        return (
            <ProfilePage
                onNavigateBack={() => setCurrentView("home")}
                onLogout={isLoggedIn ? handleLogout : undefined}
            />
        );
    }

    return (
        <HomePage
            isLoggedIn={isLoggedIn}
            onGetStartedClick={() => setCurrentView("register")}
            onProfileClick={() => setCurrentView("profile")}
            onLogout={handleLogout}
        />
    );
}

export default App;