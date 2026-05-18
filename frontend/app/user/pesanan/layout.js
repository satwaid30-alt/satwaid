"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UserSidebar from "../../../components/user/UserSidebar";
import UserNavbar from "../../../components/user/UserNavbar";

export default function PesananLayout({ children }) {
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
        } else {
            setIsLoading(false);
        }
    }, [router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-zinc-400 font-medium animate-pulse">Memuat Pesanan...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col md:flex-row">
            {/* Sidebar */}
            <UserSidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {/* Navbar */}
                <UserNavbar />

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-12 pt-6 md:pt-12 custom-scrollbar">
                    <div className="max-w-6xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
