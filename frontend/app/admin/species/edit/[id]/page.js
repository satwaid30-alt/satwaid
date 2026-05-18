"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import SpeciesForm from "../../../../../components/admin/SpeciesForm";

import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function EditSpeciesPage() {
    const { id } = useParams();
    const [species, setSpecies] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchSpecies = async () => {
            try {
                // We use slug or id? My controller supports both in theory or slug.
                // Let's check species list first.
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/species/${id}`);
                const data = await response.json();
                if (response.ok) {
                    setSpecies(data.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSpecies();
    }, [id]);

    const handleSubmit = async (formData) => {
        setIsSaving(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/species/${species.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                router.push("/admin/species");
            } else {
                const data = await response.json();
                alert(data.message || "Gagal memperbarui spesies.");
            }
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan sistem.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="text-emerald-500 animate-spin" size={48} />
                <p className="text-zinc-500 font-bold">Memuat data spesies...</p>
            </div>
        );
    }

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
                    <h1 className="text-4xl font-black tracking-tight mb-2">Edit Spesies</h1>
                    <p className="text-zinc-500 font-medium">Memperbarui informasi untuk <span className="text-white">{species?.name}</span>.</p>
                </div>
            </div>

            <SpeciesForm initialData={species} onSubmit={handleSubmit} isLoading={isSaving} />
        </div>
    );
}
