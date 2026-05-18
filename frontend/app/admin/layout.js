"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "../../components/admin/Sidebar";

export default function AdminLayout({ children }) {
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const isLoginPage = pathname === "/admin/login" || pathname === "/admin/login/";

    useEffect(() => {
        const token = localStorage.getItem("admin_token");
        const user = JSON.parse(localStorage.getItem("admin_user") || "{}");

        if (!isLoginPage) {
            if (!token || user.role !== "admin") {
                // Clear potentially invalid session
                if (token || user.role) {
                    localStorage.removeItem("admin_token");
                    localStorage.removeItem("admin_user");
                }
                router.push("/admin/login");
            } else {
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
        }
    }, [router, pathname]);

    if (isLoading && !isLoginPage) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-zinc-400 font-medium animate-pulse">Memuat Panel Admin...</p>
                </div>
            </div>
        );
    }

    if (isLoginPage) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto flex flex-col">
                <div className="flex-1 w-full">
                    {children}
                </div>
                <footer className="mt-20 py-8 border-t border-zinc-800 text-center">
                    <p className="text-zinc-500 text-sm font-bold tracking-widest uppercase">
                        © 2026 DUNIA<span className="text-emerald-500">REPTIL</span> ADMIN PANEL. HAK CIPTA DILINDUNGI.
                    </p>
                </footer>
            </main>

        </div>
    );
}
