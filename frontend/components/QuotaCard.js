"use client";

import Link from "next/link";
import { LayoutGrid, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

/**
 * QuotaCard — Displays product quota info for a shop.
 * @param {object} quota  - { used, limit, remaining, percentage, active }
 * @param {boolean} loading
 * @param {boolean} compact - If true, renders a smaller card for dashboard stats grid
 */
export default function QuotaCard({ quota, loading = false, compact = false }) {
  // ─── LOADING SKELETON ────────────────────────────────────────────────────
  if (loading) {
    if (compact) {
      return (
        <div className="bg-zinc-900 border border-zinc-800 p-3 md:p-5 rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-4 min-w-0">
          <div className="w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-zinc-800 shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <div className="h-2.5 bg-zinc-800 rounded w-16" />
            <div className="h-4 bg-zinc-800 rounded w-10" />
            <div className="h-1 bg-zinc-800 rounded-full w-full" />
          </div>
        </div>
      );
    }
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-zinc-800 rounded-xl shrink-0" />
            <div className="space-y-2">
              <div className="h-2.5 bg-zinc-800 rounded w-28" />
              <div className="h-2 bg-zinc-800 rounded w-20" />
            </div>
          </div>
          <div className="h-6 bg-zinc-800 rounded-full w-20" />
        </div>
        <div className="flex items-end justify-between mb-3">
          <div className="space-y-1">
            <div className="h-8 bg-zinc-800 rounded w-20" />
            <div className="h-2.5 bg-zinc-800 rounded w-14" />
          </div>
          <div className="space-y-1 items-end flex flex-col">
            <div className="h-2.5 bg-zinc-800 rounded w-12" />
            <div className="h-4 bg-zinc-800 rounded w-16" />
          </div>
        </div>
        <div className="h-2.5 bg-zinc-800 rounded-full w-full" />
      </div>
    );
  }

  if (!quota) return null;

  const { used = 0, limit = 500, remaining = 500, percentage = 0 } = quota;

  // ─── COLOR LOGIC ─────────────────────────────────────────────────────────
  const getColor = () => {
    if (remaining === 0)
      return {
        bar: "bg-red-500",
        text: "text-red-400",
        border: "border-red-500/20",
        bg: "bg-red-500/10",
        badgeBg: "bg-red-500/10 border-red-500/20",
        icon: XCircle,
        label: "Penuh",
      };
    if (remaining <= 50)
      return {
        bar: "bg-amber-500",
        text: "text-amber-400",
        border: "border-amber-500/20",
        bg: "bg-amber-500/10",
        badgeBg: "bg-amber-500/10 border-amber-500/20",
        icon: AlertTriangle,
        label: "Hampir Penuh",
      };
    return {
      bar: "bg-emerald-500",
      text: "text-emerald-400",
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/10",
      badgeBg: "bg-emerald-500/10 border-emerald-500/20",
      icon: CheckCircle2,
      label: "Tersedia",
    };
  };

  const color = getColor();
  const Icon = color.icon;

  // ─── COMPACT MODE (Dashboard stats grid) ─────────────────────────────────
  if (compact) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 p-3 md:p-5 rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-4 min-w-0">
        <div className={`w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl ${color.bg} ${color.text} flex items-center justify-center shrink-0`}>
          <LayoutGrid size={18} className="md:hidden" />
          <LayoutGrid size={24} className="hidden md:block" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest truncate">Kuota Produk</p>
          <p className={`text-sm sm:text-base md:text-xl font-black truncate ${remaining === 0 ? "text-red-400" : "text-white"}`}>{remaining.toLocaleString("id-ID")}</p>
          <div className="mt-1.5 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div className={`h-full ${color.bar} rounded-full`} style={{ width: `${percentage}%` }} />
          </div>
          <p className={`text-[8px] md:text-[10px] ${color.text} font-bold mt-0.5 leading-tight`}>
            {used}/{limit} terpakai ({percentage}%)
          </p>
        </div>
      </div>
    );
  }

  // ─── FULL MODE (jual, lelang, daftar-produk pages) ───────────────────────
  return (
    <div className={`bg-zinc-900 border ${color.border} rounded-2xl sm:rounded-3xl p-4 sm:p-5`}>
      {/* Header Row */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${color.bg} ${color.text} flex items-center justify-center shrink-0`}>
            <LayoutGrid size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-black text-zinc-400 uppercase tracking-widest leading-tight">Kuota Produk Toko</p>
            <p className="text-[9px] text-zinc-600 font-bold mt-0.5">Maks. {limit} listing per toko</p>
          </div>
        </div>
      </div>

      {/* Numbers Row */}
      <div className="flex items-end justify-between gap-2 mb-3">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl sm:text-3xl md:text-4xl font-black tabular-nums leading-none ${remaining === 0 ? "text-red-400" : "text-white"}`}>{remaining.toLocaleString("id-ID")}</span>
            <span className="text-zinc-600 font-bold text-xs sm:text-sm">sisa</span>
          </div>
          <p className="text-[9px] sm:text-[10px] text-zinc-600 font-bold mt-0.5 uppercase tracking-wider">Kuota tersedia</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Terpakai</p>
          <p className={`text-sm sm:text-base font-black ${color.text}`}>
            {used.toLocaleString("id-ID")}
            <span className="text-zinc-700 font-bold">/{limit}</span>
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 sm:h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden mb-2">
        <div className={`h-full ${color.bar} rounded-full`} style={{ width: `${percentage}%` }} />
      </div>

      {/* Footer Row */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] sm:text-[10px] text-zinc-600 font-bold">{percentage}% terpakai</p>
      </div>

      {/* Alert: Full */}
      {remaining === 0 && (
        <div className="mt-3 pt-3 border-t border-red-500/20 flex items-start gap-2">
          <XCircle size={13} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-[10px] sm:text-xs text-red-400 font-bold leading-relaxed">
            Kuota penuh. Hapus iklan lama di{" "}
            <Link href="/user/toko/daftar-produk" className="underline font-black">
              Daftar Produk
            </Link>{" "}
            untuk menambah produk baru.
          </p>
        </div>
      )}

      {/* Alert: Almost full */}
      {remaining > 0 && remaining <= 50 && (
        <div className="mt-3 pt-3 border-t border-amber-500/20 flex items-start gap-2">
          <AlertTriangle size={13} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-[10px] sm:text-xs text-amber-400 font-bold leading-relaxed">
            Sisa kuota tinggal <span className="font-black">{remaining}</span> slot. Segera kelola listing lama.
          </p>
        </div>
      )}
    </div>
  );
}
