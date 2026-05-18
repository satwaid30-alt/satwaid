"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SpeciesForm from "../../../../components/admin/SpeciesForm";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function NewSpeciesPage() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (formData) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/species`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // Authorization: `Bearer ${localStorage.getItem("token")}` // Add this when auth middleware is ready
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                router.push("/admin/species");
            } else {
                const data = await response.json();
                alert(data.message || "Gagal menambah spesies.");
            }
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan sistem.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-10">
            <div className="flex items-center gap-6">
                <Link
                    href="/admin/species"
                    className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-700 transition-all"
                >
                    <ChevronLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">Tambah Spesies</h1>
                    <p className="text-zinc-500 font-medium">Buat profil spesies reptil baru untuk database publik.</p>
                </div>
            </div>

            <SpeciesForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
    );
}

