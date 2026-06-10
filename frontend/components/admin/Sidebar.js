"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LayoutDashboard, PawPrint, BookOpen, Settings, LogOut, UserCircle, Users, ChevronLeft, ChevronRight, MessageSquare, Megaphone, Store, ChevronDown, ChevronUp, Package, Receipt, Sliders, Wallet, ShieldAlert } from "lucide-react";

const MENU_ITEMS = [
  { name: "Dashboard", href: "/panel-admin", icon: LayoutDashboard },
  { name: "Kelola Iklan", href: "/panel-admin/iklan", icon: Megaphone },
  { name: "Kelola Transaksi", href: "/panel-admin/transaksi", icon: Receipt },
  {
    name: "Kelola Toko",
    href: "/panel-admin/toko",
    icon: Store,
    subMenu: [
      { name: "Daftar Toko", href: "/panel-admin/toko", icon: Store },
      { name: "Detail Produk", href: "/panel-admin/toko/detail-produk", icon: Package },
      { name: "Upgrade Toko", href: "/panel-admin/upgrade-toko", icon: Sliders },
    ],
  },
  { name: "Verifikasi Komunitas", href: "/panel-admin/komunitas", icon: MessageSquare },
  { name: "Keuangan Toko", href: "/panel-admin/keuangan", icon: BookOpen },
  { name: "Pengembalian Dana", href: "/panel-admin/pengembalian-dana", icon: Wallet },
  { name: "Daftar Pengguna", href: "/panel-admin/users", icon: Users },
  { name: "Kontrol Menu", href: "/panel-admin/control-menu", icon: Sliders },
  { name: "Reset Profil", href: "/panel-admin/reset-profil", icon: UserCircle },
  { name: "Reset Toko", href: "/panel-admin/reset-toko", icon: Store },
  { name: "Pengaduan", href: "/panel-admin/pengaduan", icon: ShieldAlert },
  { name: "Pengaturan", href: "/panel-admin/settings", icon: Settings },
];


export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSubMenu, setOpenSubMenu] = useState("");

  useEffect(() => {
    // Auto open submenu if current path is in subMenu
    MENU_ITEMS.forEach((item) => {
      if (item.subMenu && item.subMenu.some((sub) => pathname.startsWith(sub.href))) {
        setOpenSubMenu(item.name);
      }
    });
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    router.push("/admin/login");
  };

  const toggleSubMenu = (name) => {
    if (isCollapsed) setIsCollapsed(false);
    setOpenSubMenu(openSubMenu === name ? "" : name);
  };

  return (
    <aside className={`${isCollapsed ? "w-24" : "w-72"} bg-zinc-900 border-r border-zinc-800 flex flex-col h-screen sticky top-0 transition-all duration-300 relative z-40`}>
      {/* Toggle Collapse Button */}
      <button
        onClick={() => {
          setIsCollapsed(!isCollapsed);
          if (!isCollapsed) setOpenSubMenu(""); // Close submenus when collapsing
        }}
        className="absolute -right-3.5 top-12 bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white rounded-full p-1 z-50 hover:bg-zinc-700 shadow-md transition-all hidden md:flex"
      >
        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      {/* Logo */}
      <div className={`p-8 ${isCollapsed ? "px-4 flex justify-center" : ""}`}>
        <Link href="/" className="flex items-center gap-3 group" title={isCollapsed ? "SatwaiD" : ""}>
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-zinc-950 font-bold text-xl shrink-0 group-hover:scale-110 transition-transform">SD</div>
          {!isCollapsed && (
            <span className="text-xl font-black tracking-tight text-white truncate">
              DUNIA<span className="text-emerald-500">REPTIL</span>
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${isCollapsed ? "px-2" : "px-4"} space-y-2 mt-4 overflow-y-auto overflow-x-hidden custom-scrollbar`}>
        {!isCollapsed ? <p className="px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 truncate">Main Menu</p> : <div className="h-4"></div>}

        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const hasSubMenu = item.subMenu && item.subMenu.length > 0;
          const isOpen = openSubMenu === item.name;
          const isActive = item.href === "/panel-admin" ? pathname === "/panel-admin" : pathname.startsWith(item.href) && !hasSubMenu;
          const isSubActive = hasSubMenu && item.subMenu.some((sub) => pathname === sub.href);

          if (hasSubMenu) {
            return (
              <div key={item.name} className="space-y-1">
                <button onClick={() => toggleSubMenu(item.name)} className={`w-full flex items-center gap-4 ${isCollapsed ? "px-0 justify-center" : "px-4"} py-3 rounded-xl font-semibold transition-all group ${isSubActive ? "bg-emerald-500/10 text-emerald-500" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}>
                  <Icon size={20} className="shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{item.name}</span>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </>
                  )}
                </button>

                {isOpen && !isCollapsed && (
                  <div className="ml-4 pl-4 border-l border-zinc-800 space-y-1 animate-in slide-in-from-top-2 duration-200">
                    {item.subMenu.map((sub) => (
                      <Link key={sub.name} href={sub.href} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${pathname === sub.href ? "text-emerald-500 bg-emerald-500/5" : "text-zinc-500 hover:text-white hover:bg-zinc-800"}`}>
                        <sub.icon size={16} />
                        <span className="truncate">{sub.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link key={item.name} href={item.href} title={isCollapsed ? item.name : ""} className={`flex items-center gap-4 ${isCollapsed ? "px-0 justify-center" : "px-4"} py-3 rounded-xl font-semibold transition-all group ${isActive ? "bg-emerald-500 text-zinc-950" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}>
              <Icon size={20} className={`shrink-0 ${isActive ? "" : "group-hover:scale-110 transition-transform"}`} />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className={`p-6 mt-auto border-t border-zinc-800 ${isCollapsed ? "px-2" : ""}`}>
        <div className={`flex items-center gap-4 mb-6 ${isCollapsed ? "justify-center" : "px-2"}`}>
          <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 shrink-0">
            <UserCircle size={24} />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">Admin SatwaiD</p>
              <p className="text-xs text-zinc-500 truncate">admin@satwaid.id</p>
            </div>
          )}
        </div>
        <button onClick={handleLogout} title={isCollapsed ? "Keluar Sesi" : ""} className={`w-full flex items-center justify-center gap-3 ${isCollapsed ? "px-0" : "px-4"} py-3 rounded-xl font-bold text-zinc-400 hover:bg-red-500/10 hover:text-red-500 transition-all group`}>
          <LogOut size={20} className="shrink-0 group-hover:-translate-x-1 transition-transform" />
          {!isCollapsed && <span className="truncate">Keluar Sesi</span>}
        </button>
      </div>
    </aside>
  );
}
