"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UserSidebar from "../../../components/user/UserSidebar";
import UserNavbar from "../../../components/user/UserNavbar";

export default function PengaduanLayout({ children }) {
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");
        let timer;
        if (!token) {
            router.push("/login");
        } else {
            timer = setTimeout(() => {
                setIsLoading(false);
            }, 0);
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-zinc-400 font-medium animate-pulse">Memuat Halaman Pengaduan...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
            <UserSidebar />

            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                <UserNavbar />

                <main className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar flex flex-col">
                    <div className="max-w-7xl mx-auto flex-1 w-full">
                        {children}
                    </div>

                    <footer className="mt-20 py-8 border-t border-zinc-800 text-center text-zinc-500 text-sm font-medium">
                        <p>
                            © 2026 SatwaiD. All rights reserved.
                        </p>
                    </footer>
                </main>
            </div>
        </div>
    );
}
