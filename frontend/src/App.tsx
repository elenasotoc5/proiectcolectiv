import { useState } from "react";
import HomePage from "@/features/homepage/HomePage";
import RegisterPage from "@/features/auth/RegisterPage";

function App() {
    const [page, setPage] = useState<"home" | "register">("home");

    return page === "register" ? (
        <RegisterPage onBack={() => setPage("home")} />
    ) : (
        <HomePage onGetStarted={() => setPage("register")} />
    );
}

export default App;