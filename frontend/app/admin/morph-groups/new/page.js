"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MorphGroupForm from "../../../../components/admin/MorphGroupForm";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function NewMorphGroupPage() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (formData) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/morph-groups`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                router.push("/admin/morph-groups");
            } else {
                const data = await response.json();
                alert("Gagal menyimpan: " + data.message);
            }
        } catch (err) {
            console.error("Submit error:", err);
            alert("Terjadi kesalahan koneksi ke server.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Link 
                    href="/admin/morph-groups" 
                    className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-white transition-all shadow-lg"
                >
                    <ChevronLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Tambah <span className="text-emerald-500">Grup Morfologi</span></h1>
                    <p className="text-zinc-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Lengkapi data variasi genetik di bawah</p>
                </div>
            </div>

            <MorphGroupForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
    );
}

