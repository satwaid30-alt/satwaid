"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
    const router = useRouter();

    useEffect(() => {
        router.push("/admin/login");
    }, [router]);

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-zinc-400 font-medium animate-pulse">Mengalihkan...</p>
            </div>
        </div>
    );
}
