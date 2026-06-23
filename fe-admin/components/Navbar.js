"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Bell, 
  UserCircle, 
  LogOut, 
  Settings, 
  User, 
  Menu, 
  X, 
  ShieldAlert, 
  Store, 
  Receipt, 
  Package,
  Wallet,
  Sparkles,
  Check,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/app/utils/api";

const ROUTE_TITLES = {
  "/panel-admin": "Dashboard Admin",
  "/panel-admin/iklan": "Kelola Iklan Banner",
  "/panel-admin/transaksi": "Kelola Transaksi",
  "/panel-admin/toko": "Daftar Toko Mitra",
  "/panel-admin/toko/detail-produk": "Kelola Produk Toko",
  "/panel-admin/upgrade-toko": "Upgrade Status Toko",
  "/panel-admin/komunitas": "Verifikasi Komunitas",
  "/panel-admin/keuangan": "Keuangan & Penarikan Toko",
  "/panel-admin/pengembalian-dana": "Pengembalian Dana (Refund)",
  "/panel-admin/biaya-admin": "Kelola Biaya Admin",
  "/panel-admin/users": "Kelola Pengguna",
  "/panel-admin/control-menu": "Kontrol Menu & Akses",
  "/panel-admin/reset-profil": "Reset Profil Pengguna",
  "/panel-admin/reset-toko": "Reset Data Toko",
  "/panel-admin/settings": "Pengaturan Sistem",
};

const NOTIF_CATEGORIES = [
  {
    id: "transaction",
    name: "Transaksi",
    description: "Pesanan & Pembayaran",
    icon: Receipt,
    color: "emerald", // Green
    bgClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20",
    badgeClass: "bg-emerald-500 text-zinc-950",
  },
  {
    id: "upgrade",
    name: "Upgrade Toko",
    description: "Pengajuan Toko Mitra",
    icon: Store,
    color: "amber", // Orange/Amber
    bgClass: "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20",
    badgeClass: "bg-amber-500 text-zinc-950",
  },
  {
    id: "product",
    name: "Pengajuan Produk",
    description: "Verifikasi Listing Produk",
    icon: Package,
    color: "violet", // Purple
    bgClass: "bg-violet-500/10 text-violet-500 border-violet-500/20 hover:bg-violet-500/20",
    badgeClass: "bg-violet-500 text-white",
  },
  {
    id: "refund",
    name: "Pengembalian Dana",
    description: "Komplain & Refund",
    icon: ShieldAlert,
    color: "red", // Red
    bgClass: "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20",
    badgeClass: "bg-red-500 text-white",
  },
  {
    id: "withdrawal",
    name: "Pencairan Dana",
    description: "Tarik Saldo Keuangan",
    icon: Wallet,
    color: "sky", // Light Blue
    bgClass: "bg-sky-500/10 text-sky-500 border-sky-500/20 hover:bg-sky-500/20",
    badgeClass: "bg-sky-500 text-zinc-950",
  },
];

export default function Navbar({ onToggleSidebar }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminUser, setAdminUser] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); // "transaction" | "upgrade" | "product" | "refund" | "withdrawal" | null
  const [notifications, setNotifications] = useState([]);
  
  const profileDropdownRef = useRef(null);
  const dropdownRefs = useRef({});

  // Get active section title based on pathname
  const getSectionTitle = () => {
    const matchingKey = Object.keys(ROUTE_TITLES).find(key => pathname === key || pathname.startsWith(key + "/"));
    return matchingKey ? ROUTE_TITLES[matchingKey] : "Panel Kontrol Admin";
  };

  // Load admin data and in-memory notifications
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== "undefined") {
        const storedUser = localStorage.getItem("admin_user");
        if (storedUser) {
          try {
            setAdminUser(JSON.parse(storedUser));
          } catch (e) {
            console.error("Failed to parse admin_user metadata", e);
          }
        }

        const savedNotifs = sessionStorage.getItem("admin_notifications");
        if (savedNotifs) {
          try {
            setNotifications(JSON.parse(savedNotifs));
          } catch (e) {
            console.error("Failed to parse admin_notifications", e);
          }
        }
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Fetch pending listings on mount (both regular & auction) so admin sees them even if socket event was missed
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    if (!token) return;

    const fetchPendingListings = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const res = await fetch(`${apiUrl}/listings?all=true`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const result = await res.json();
        const allListings = result.data || [];

        // Only show pending listings
        const pendingListings = allListings.filter((l) => l.status === "pending");
        if (pendingListings.length === 0) return;

        // Track which listing IDs we've already notified about (per session)
        const notifiedKey = "admin_notified_listing_ids";
        let notifiedIds = [];
        try {
          notifiedIds = JSON.parse(sessionStorage.getItem(notifiedKey) || "[]");
        } catch (_) {}

        const newNotifications = [];
        const newNotifiedIds = [...notifiedIds];

        for (const listing of pendingListings) {
          if (notifiedIds.includes(listing.id)) continue;
          const isAuction = listing.type === "auction";
          newNotifications.push({
            id: `listing_${listing.id}`,
            title: isAuction ? "Pengajuan Lelang Baru" : "Produk Baru Diajukan",
            message: isAuction
              ? `Produk lelang "${listing.name || 'Hewan'}" (OB: Rp ${listing.start_bid ? new Intl.NumberFormat("id-ID").format(listing.start_bid) : "-"}) menunggu verifikasi tayang.`
              : `Produk "${listing.name || 'Hewan'}" diajukan untuk verifikasi tayang di etalase.`,
            category: "product",
            link: "/panel-admin/toko/detail-produk",
            time: new Date(listing.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
            read: false,
          });
          newNotifiedIds.push(listing.id);
        }

        if (newNotifications.length > 0) {
          sessionStorage.setItem(notifiedKey, JSON.stringify(newNotifiedIds));
          setNotifications((prev) => {
            // Merge, avoid duplicates by id
            const existingIds = new Set(prev.map((n) => n.id));
            const unique = newNotifications.filter((n) => !existingIds.has(n.id));
            const updated = [...unique, ...prev].slice(0, 100);
            sessionStorage.setItem("admin_notifications", JSON.stringify(updated));
            return updated;
          });
        }
      } catch (err) {
        console.error("[Navbar] Failed to fetch pending listings:", err);
      }
    };

    fetchPendingListings();
  }, []);

  // Connect to Socket.IO and listen for events
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    if (!token) return;

    let socket;
    try {
      socket = io(getSocketUrl() || "http://localhost:4000", {
        auth: {
          token: `Bearer ${token}`,
        },
      });

      socket.on("connect", () => {
        console.log("[Socket] AdminNavbar connected successfully");
        socket.emit("join_admin");
      });

      const addNotification = (title, message, category, link = "") => {
        const newNotif = {
          id: Date.now() + Math.random().toString(36).substring(2, 9),
          title,
          message,
          category, // "transaction" | "upgrade" | "product" | "refund" | "withdrawal"
          link,
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          read: false,
        };

        setNotifications(prev => {
          const updated = [newNotif, ...prev].slice(0, 100); // limit to 100
          sessionStorage.setItem("admin_notifications", JSON.stringify(updated));
          return updated;
        });
      };

      // 1. Upgrade Toko Events
      socket.on("new_upgrade_request", (data) => {
        addNotification(
          "Upgrade Toko Baru",
          `Toko "${data.shop_name || 'Mitra'}" mengajukan permohonan upgrade plan.`,
          "upgrade",
          "/panel-admin/upgrade-toko"
        );
      });

      socket.on("upgrade_request_cancelled", (data) => {
        addNotification(
          "Upgrade Dibatalkan",
          `Pengajuan upgrade Toko ID ${data.shop_id || ''} dibatalkan oleh penjual.`,
          "upgrade",
          "/panel-admin/upgrade-toko"
        );
      });


      socket.on("admin_notification", (data) => {
        if (data.type === "disbursement_request") {
          addNotification(
            data.title || "Pengajuan Pencairan Baru",
            data.message || "Seller mengajukan pencairan dana.",
            "withdrawal",
            "/panel-admin/keuangan"
          );
        } else if (data.type === "payment_received") {
          // Pembayaran masuk — gunakan link langsung ke detail transaksi dengan UUID
          const link = data.id
            ? `/admin/transaksi-user/detail/${data.id}`
            : "/admin/transaksi-user";
          addNotification(
            "Bukti Pembayaran Masuk",
            `Pesanan #${data.order_id || 'ID'} mengirimkan bukti pembayaran. Segera verifikasi.`,
            "transaction",
            link
          );
        } else if (data.type === "refund_requested") {
          addNotification(
            data.title || "Pengajuan Refund Baru",
            data.message || "Pembeli mengajukan refund.",
            "refund",
            "/panel-admin/pengembalian-dana"
          );
        }
      });

      // 3. Pengajuan Produk Events
      socket.on("new_listing_admin", (data) => {
        const isAuction = data?.type === "auction";
        const link = data?.id ? `/panel-admin/toko/detail-produk` : "/panel-admin/toko/detail-produk";
        if (isAuction) {
          addNotification(
            "Pengajuan Lelang Baru",
            `Produk lelang "${data.name || 'Hewan'}" (OB: Rp ${data.start_bid ? new Intl.NumberFormat("id-ID").format(data.start_bid) : "-"}) diajukan untuk verifikasi tayang.`,
            "product",
            link
          );
        } else {
          addNotification(
            "Produk Baru Diajukan",
            `Produk "${data.name || 'Hewan'}" diajukan untuk verifikasi tayang di etalase.`,
            "product",
            link
          );
        }
      });


      // 4. Pengembalian Dana / Komplain Events
      socket.on("new_complaint", (data) => {
        addNotification(
          "Komplain Baru Masuk",
          `Pembeli mengajukan komplain pesanan #${data.order_id || 'ID'}.`,
          "refund",
          "/panel-admin/pengembalian-dana"
        );
      });

      socket.on("complaint_status_changed", (data) => {
        addNotification(
          "Status Komplain Berubah",
          `Komplain pesanan #${data.order_id || 'ID'} diperbarui menjadi ${data.status || 'baru'}.`,
          "refund",
          "/panel-admin/pengembalian-dana"
        );
      });

      socket.on("admin_fee_updated", (data) => {
        console.log("[Socket AdminNavbar] Admin fee updated received:", data);
        if (data && typeof data.adminFee === "number") {
          const event = new CustomEvent("admin_fee_updated", { detail: data.adminFee });
          window.dispatchEvent(event);
        }
      });

    } catch (e) {
      console.error("[Socket] AdminNavbar socket connection error", e);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      
      let clickedInsideNotif = false;
      Object.values(dropdownRefs.current).forEach(ref => {
        if (ref && ref.contains(event.target)) {
          clickedInsideNotif = true;
        }
      });
      
      if (!clickedInsideNotif) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    router.push("/admin/login");
  };

  const markCategoryAsRead = (category) => {
    const updated = notifications.map(n => n.category === category ? { ...n, read: true } : n);
    setNotifications(updated);
    sessionStorage.setItem("admin_notifications", JSON.stringify(updated));
  };

  const clearCategoryNotifications = (category) => {
    const updated = notifications.filter(n => n.category !== category);
    setNotifications(updated);
    sessionStorage.setItem("admin_notifications", JSON.stringify(updated));
    // If clearing product notifications, also reset the notified listing IDs tracker
    // so pending listings will re-appear on next session
    if (category === "product") {
      sessionStorage.removeItem("admin_notified_listing_ids");
    }
  };

  const markAsRead = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    sessionStorage.setItem("admin_notifications", JSON.stringify(updated));
  };
  const getNotifLink = (notif) => {
    if (notif.link) return notif.link;
    
    // Fallback based on category
    switch (notif.category) {
      case "upgrade":
        return "/admin/upgrade-toko";
      case "product":
        return "/admin/toko-user/detail-produk";
      case "refund":
        return "/admin/pengembalian-dana";
      case "withdrawal":
        return "/admin/keuangan";
      case "transaction":
        return "/admin/transaksi-user";
      default:
        return "/panel-admin";
    }
  };
  return (
    <header className="h-20 bg-zinc-950/70 border-b border-zinc-800/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-8 transition-all">
      {/* Left side: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-4">
        {onToggleSidebar && (
          <button 
            onClick={onToggleSidebar}
            className="md:hidden p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <Menu size={22} />
          </button>
        )}
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-500 tracking-wider">
            <span>SatwaiD Admin Portal</span>
            <span>/</span>
            <span className="text-emerald-500 font-extrabold">Control Panel</span>
          </div>
          <h1 className="text-lg font-black text-white tracking-tight mt-0.5">{getSectionTitle()}</h1>
        </div>
      </div>

      {/* Right side: 5 Notification Bells & User Avatar */}
      <div className="flex items-center gap-6">
        
        {/* 5 Notification Bells Container */}
        <div className="flex items-center gap-2.5">
          {NOTIF_CATEGORIES.map((cat) => {
            const CatIcon = cat.icon;
            const catNotifications = notifications.filter(n => n.category === cat.id);
            const unreadCatCount = catNotifications.filter(n => !n.read).length;
            const isOpen = activeDropdown === cat.id;

            return (
              <div 
                key={cat.id} 
                className="relative" 
                ref={el => dropdownRefs.current[cat.id] = el}
              >
                <button 
                  onClick={() => {
                    setActiveDropdown(isOpen ? null : cat.id);
                    setIsProfileOpen(false);
                  }}
                  className={`p-2.5 rounded-xl border transition-all relative flex items-center justify-center ${
                    unreadCatCount > 0 
                      ? cat.bgClass + " animate-pulse font-extrabold shadow-lg shadow-zinc-950" 
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                  }`}
                  title={`${cat.name} - ${cat.description}`}
                >
                  <CatIcon size={18} />
                  {unreadCatCount > 0 && (
                    <span className={`absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 text-[9px] font-black rounded-full flex items-center justify-center border-2 border-zinc-950 ${cat.badgeClass}`}>
                      {unreadCatCount}
                    </span>
                  )}
                </button>

                {/* Dropdown per category */}
                {isOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-black uppercase tracking-wider text-white">{cat.name}</span>
                        <span className="text-[9px] text-zinc-500 font-medium">{cat.description}</span>
                      </div>
                      {catNotifications.length > 0 && (
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => markCategoryAsRead(cat.id)}
                            className="text-[10px] font-bold text-zinc-400 hover:text-emerald-500 transition-colors"
                          >
                            Dibaca
                          </button>
                          <button 
                            onClick={() => clearCategoryNotifications(cat.id)}
                            className="text-[10px] font-bold text-zinc-500 hover:text-red-500 transition-colors"
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="max-h-[280px] overflow-y-auto divide-y divide-zinc-800 custom-scrollbar">
                      {catNotifications.length === 0 ? (
                        <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                            <CatIcon size={14} />
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-zinc-400">Tidak ada notifikasi</p>
                            <p className="text-[9px] text-zinc-600 mt-0.5">Sistem belum menerima pembaruan di kategori ini.</p>
                          </div>
                        </div>
                      ) : (
                        catNotifications.map((notif) => (
                          <Link 
                            key={notif.id}
                            href={getNotifLink(notif)}
                            onClick={() => {
                              markAsRead(notif.id);
                              setActiveDropdown(null);
                            }}
                            className={`p-3.5 hover:bg-zinc-800/40 transition-colors cursor-pointer flex gap-3 block ${!notif.read ? "bg-zinc-850/20" : ""}`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className={`text-xs truncate ${!notif.read ? "font-bold text-white" : "text-zinc-400"}`}>{notif.title}</p>
                                <span className="text-[8px] text-zinc-600 shrink-0 font-medium">{notif.time}</span>
                              </div>
                              <p className="text-[10px] text-zinc-500 mt-1 leading-normal line-clamp-2">{notif.message}</p>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Vertical Separator */}
        <div className="h-6 w-px bg-zinc-800"></div>

        {/* Admin User Profile Dropdown */}
        <div className="relative" ref={profileDropdownRef}>
          <button 
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setActiveDropdown(null);
            }}
            className="flex items-center gap-3 group text-left cursor-pointer focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-md shadow-emerald-500/10 group-hover:scale-105 transition-all">
              {adminUser?.name ? adminUser.name.substring(0, 2).toUpperCase() : "AD"}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors">{adminUser?.name || "Admin SatwaiD"}</p>
              <p className="text-[9px] text-zinc-500 font-semibold">{adminUser?.email || "admin@satwaid.id"}</p>
            </div>
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 bg-zinc-800/20 border-b border-zinc-800">
                <p className="text-xs font-black text-white truncate">{adminUser?.name || "Admin SatwaiD"}</p>
                <div className="flex items-center gap-1.5 mt-1 text-[9px] font-black uppercase text-emerald-500 tracking-wider">
                  <Sparkles size={10} className="animate-spin" />
                  <span>Sistem Administrator</span>
                </div>
              </div>

              <div className="p-2 space-y-1">
                <Link 
                  href="/panel-admin/reset-profil"
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all group"
                >
                  <User size={16} className="text-zinc-500 group-hover:text-emerald-500 transition-colors" />
                  <span>Reset Profil</span>
                </Link>
                <Link 
                  href="/panel-admin/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all group"
                >
                  <Settings size={16} className="text-zinc-500 group-hover:text-emerald-500 transition-colors" />
                  <span>Pengaturan</span>
                </Link>
              </div>

              <div className="p-2 border-t border-zinc-800">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-all group"
                >
                  <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                  <span>Keluar Sesi</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
