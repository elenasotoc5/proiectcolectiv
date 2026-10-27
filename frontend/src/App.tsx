
// import HomePage from "@/features/homepage/HomePage";

// function App() {
//     return <HomePage />;
// }

// export default App;
import { useState } from "react";
import HomePage from "@/features/homepage/HomePage";
import RegisterPage from "@/features/auth/RegisterPage";

function App() {
    const [currentView, setCurrentView] = useState<"home" | "register">("home");

    if (currentView === "register") {
        return <RegisterPage onNavigateBack={() => setCurrentView("home")} />;
    }

    return <HomePage onGetStartedClick={() => setCurrentView("register")} />;
}

export default App;