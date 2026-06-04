"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  useEffect(() => {
    if (id) {
      router.replace(`/toko/detail-produk/${id}`);
    } else {
      router.replace("/toko");
    }
  }, [id, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-zinc-500 animate-pulse uppercase tracking-widest text-xs">Mengalihkan...</p>
      </div>
    </div>
  );
}

export default function RedirectPage() {
  return (
    <Suspense fallback={null}>
      <RedirectContent />
    </Suspense>
  );
}
