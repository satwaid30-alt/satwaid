"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, ShoppingBag, Gavel } from "lucide-react";

const MENU_ITEMS = [
  {
    title: "Beranda",
    href: "/",
    icon: Home,
    color: "text-blue-500",
    activeBg: "bg-blue-500",
    softBg: "bg-blue-50",
  },
  {
    title: "Komunitas",
    href: "/komunitas",
    icon: MessageSquare,
    color: "text-purple-500",
    activeBg: "bg-purple-500",
    softBg: "bg-purple-50",
  },
  {
    title: "Etalase",
    href: "/toko",
    icon: ShoppingBag,
    color: "text-emerald-500",
    activeBg: "bg-emerald-500",
    softBg: "bg-emerald-50",
  },
  {
    title: "Lelang",
    href: "/lelang",
    icon: Gavel,
    color: "text-amber-500",
    activeBg: "bg-amber-500",
    softBg: "bg-amber-50",
  },
];

/**
 * MobileMenuGrid — tampilan navigasi utama untuk mobile/handphone.
 * Hanya muncul di layar kecil (tersembunyi di md ke atas).
 * Menggunakan lucide-react icons dengan efek aktif pada halaman yang sedang dibuka.
 *
 * @param {string} className - kelas tambahan untuk wrapper (opsional)
 */
export default function MobileMenuGrid({ className = "" }) {
  const pathname = usePathname();
  const [clickedHref, setClickedHref] = useState(null);

  // Reset local state when page transition completes (pathname changes)
  useEffect(() => {
    setClickedHref(null);
  }, [pathname]);

  const isActive = (href) => {
    if (clickedHref) return clickedHref === href;
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <div className={`block md:hidden max-w-md mx-auto px-1 relative z-10 ${className}`}>
      <div className="grid grid-cols-4 gap-2">
        {MENU_ITEMS.map((menu) => {
          const Icon = menu.icon;
          const active = isActive(menu.href);
          return (
            <Link
              key={menu.href}
              href={menu.href}
              onClick={() => setClickedHref(menu.href)}
              className="flex flex-col items-center gap-1.5 transition-all duration-300 active:scale-95 touch-manipulation"
            >
              {/* Icon container */}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${
                active
                  ? `${menu.activeBg} shadow-md scale-110`
                  : `${menu.softBg} hover:scale-105`
              }`}>
                <Icon
                  size={22}
                  className={`transition-colors duration-300 ${active ? "text-white" : menu.color}`}
                  strokeWidth={active ? 2.5 : 1.8}
                />
              </div>

              {/* Label */}
              <span className={`text-[9px] font-bold tracking-tight leading-none transition-colors duration-300 ${
                active ? "text-zinc-900" : "text-zinc-400"
              }`}>
                {menu.title}
              </span>

              {/* Indikator titik aktif */}
              <span className={`block h-1 rounded-full transition-all duration-300 ${
                active ? `w-4 ${menu.activeBg}` : "w-0 bg-transparent"
              }`} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
