"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import MorphGroupForm from "../../../../../components/admin/MorphGroupForm";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function EditMorphGroupPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [initialData, setInitialData] = useState(null);
    const router = useRouter();
    const { id } = useParams();

    useEffect(() => {
        const fetchGroup = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/morph-groups/${id}`);
                const data = await response.json();
                if (response.ok) {
                    setInitialData(data.data);
                }
            } catch (err) {
                console.error("Fetch error:", err);
            }
        };
        fetchGroup();
    }, [id]);

    const handleSubmit = async (formData) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/morph-groups/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                router.push("/admin/morph-groups");
            } else {
                const data = await response.json();
                alert("Gagal memperbarui: " + data.message);
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
                    <h1 className="text-4xl font-black text-white tracking-tight">Edit <span className="text-emerald-500">Grup Morfologi</span></h1>
                    <p className="text-zinc-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Perbarui data variasi genetik di bawah</p>
                </div>
            </div>

            {initialData && <MorphGroupForm initialData={initialData} onSubmit={handleSubmit} isLoading={isLoading} />}
        </div>
    );
}
