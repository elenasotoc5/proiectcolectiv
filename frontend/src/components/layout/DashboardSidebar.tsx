
import { useState } from "react";
import {
    LayoutDashboard,
    Compass,
    HeartHandshake,
    House,
    UserRound,
    Menu,
    X,
    LogOut,
    PanelLeftClose,
    PanelLeftOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type DashboardView =
    | "dashboard"
    | "explore"
    | "matches"
    | "my-home"
    | "profile";

interface DashboardSidebarProps {
    currentView: DashboardView;
    onNavigate: (view: DashboardView) => void;
    onLogout: () => void;
}

const menuItems = [
    { label: "Dashboard", view: "dashboard", icon: LayoutDashboard },
    { label: "Explore Homes", view: "explore", icon: Compass },
    { label: "My Matches", view: "matches", icon: HeartHandshake },
    { label: "My Home", view: "my-home", icon: House },
    { label: "My Profile", view: "profile", icon: UserRound },
] as const;

export default function DashboardSidebar({
                                             currentView,
                                             onNavigate,
                                             onLogout,
                                         }: DashboardSidebarProps) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const navigate = (view: DashboardView) => {
        onNavigate(view);
        setIsMobileOpen(false);
    };

    const renderSidebarContent = (collapsed: boolean) => (
        <>
            <div
                className={`flex h-20 items-center border-b ${
                    collapsed
                        ? "justify-center px-2"
                        : "justify-between px-5"
                }`}
            >
                {!collapsed && (
                    <h2 className="text-xl font-bold tracking-tight">
                        LifeSwap
                    </h2>
                )}

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    aria-label={
                        collapsed ? "Expand sidebar" : "Collapse sidebar"
                    }
                    title={
                        collapsed ? "Expand sidebar" : "Collapse sidebar"
                    }
                    className="shrink-0"
                >
                    {collapsed ? (
                        <PanelLeftOpen className="size-5" />
                    ) : (
                        <PanelLeftClose className="size-5" />
                    )}
                </Button>
            </div>

            <nav
                aria-label="Dashboard navigation"
                className={`flex-1 space-y-1 ${
                    collapsed ? "p-2" : "p-4"
                }`}
            >
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.view;

                    return (
                        <Button
                            key={item.view}
                            variant={isActive ? "secondary" : "ghost"}
                            onClick={() => navigate(item.view)}
                            aria-current={
                                isActive ? "page" : undefined
                            }
                            aria-label={item.label}
                            title={collapsed ? item.label : undefined}
                            className={`w-full gap-3 ${
                                collapsed
                                    ? "justify-center px-0"
                                    : "justify-start"
                            } ${
                                isActive
                                    ? "font-semibold text-primary"
                                    : ""
                            }`}
                        >
                            <Icon className="size-4 shrink-0" />
                            {!collapsed && item.label}
                        </Button>
                    );
                })}
            </nav>

            <div className={`border-t ${collapsed ? "p-2" : "p-4"}`}>
                <Button
                    variant="ghost"
                    onClick={onLogout}
                    aria-label="Log Out"
                    title={collapsed ? "Log Out" : undefined}
                    className={`w-full gap-3 ${
                        collapsed
                            ? "justify-center px-0"
                            : "justify-start"
                    }`}
                >
                    <LogOut className="size-4 shrink-0" />
                    {!collapsed && "Log Out"}
                </Button>
            </div>
        </>
    );

    return (
        <>
            {/* Desktop sidebar */}
            <aside
                className={`hidden md:flex shrink-0 flex-col border-r bg-card sticky top-0 h-screen transition-[width] duration-300 ease-in-out ${
                    isCollapsed ? "w-16" : "w-64"
                }`}
            >
            {renderSidebarContent(isCollapsed)}
            </aside>

            {/* Mobile menu button */}
            <Button
                variant="outline"
                size="icon"
                className="fixed left-4 top-4 z-40 md:hidden"
                onClick={() => setIsMobileOpen(true)}
                aria-label="Open navigation menu"
            >
                <Menu className="size-5" />
            </Button>

            {/* Mobile sidebar */}
            {isMobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <button
                        type="button"
                        aria-label="Close navigation menu"
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setIsMobileOpen(false)}
                    />

                    <aside className="relative flex h-full w-64 max-w-[85vw] flex-col bg-card shadow-xl">
                        <div className="flex h-20 items-center justify-between border-b px-5">
                            <h2 className="text-xl font-bold tracking-tight">
                                LifeSwap
                            </h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsMobileOpen(false)}
                                aria-label="Close navigation menu"
                            >
                                <X className="size-5" />
                            </Button>
                        </div>

                        <nav
                            aria-label="Mobile dashboard navigation"
                            className="flex-1 space-y-1 p-4"
                        >
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = currentView === item.view;

                                return (
                                    <Button
                                        key={item.view}
                                        variant={
                                            isActive ? "secondary" : "ghost"
                                        }
                                        onClick={() => navigate(item.view)}
                                        aria-current={
                                            isActive ? "page" : undefined
                                        }
                                        className="w-full justify-start gap-3"
                                    >
                                        <Icon className="size-4" />
                                        {item.label}
                                    </Button>
                                );
                            })}
                        </nav>

                        <div className="border-t p-4">
                            <Button
                                variant="ghost"
                                onClick={onLogout}
                                className="w-full justify-start gap-3"
                            >
                                <LogOut className="size-4" />
                                Log Out
                            </Button>
                        </div>
                    </aside>
                </div>
            )}
        </>
    );
}
