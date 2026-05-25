"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Bell,
  Package,
  CreditCard,
  Users,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Store,
  Gavel,
} from "lucide-react";
import { io } from "socket.io-client";
import { getApiUrl, getSocketUrl } from "@/app/utils/api";

export default function Navbar({ theme = "dark", onNotification }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
  const [socket, setSocket] = useState(null);
  const [localReadIds, setLocalReadIds] = useState([]);
  const [shopName, setShopName] = useState("");

  const isLightText = theme === "dark" && !scrolled && !isMenuOpen;

  useEffect(() => {
    if (user) {
      fetch(`${getApiUrl()}/shops/user/${user.id}`)
        .then((res) => res.json())
        .then((res) => {
          if (res.data) setShopName(res.data.name);
        })
        .catch((err) => console.error("Error fetching shop for navbar:", err));
    }
  }, [user]);

  useEffect(() => {
    // Check for logged in user on component mount
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");
      if (token && userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (e) {
          console.error("Error parsing user data", e);
        }
      }
      setIsLoaded(true);
    }
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchCounts();
    }
  }, [user]);

  const fetchCounts = async () => {
    if (!user) return;
    try {
      const res = await fetch(
        `${getApiUrl()}/notifications/${user.id}`,
      );
      const result = await res.json();
      if (res.ok)
        setNotifCount(
          (result.data.incoming_orders || 0) +
            (result.data.my_orders || 0) +
            (result.data.community || 0) +
            (result.data.chats || 0) +
            (result.data.system || 0),
        );
    } catch (e) {
      console.error(
        "Error fetching counts from",
        getApiUrl(),
        e,
      );
    }
  };

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("token");
    const newSocket = io(getSocketUrl(), {
      auth: {
        token: token ? `Bearer ${token}` : null,
      },
    });
    setSocket(newSocket);
    newSocket.emit("join_user", user.id);

    const handleSyncNotifs = () => {
      fetchCounts();
      fetchNotifications();
    };

    newSocket.on("new_notification", (data) => {
      handleSyncNotifs();
      if (onNotification) onNotification(data);
    });

    window.addEventListener("sync_notifications", handleSyncNotifs);

    return () => {
      newSocket.disconnect();
      window.removeEventListener("sync_notifications", handleSyncNotifs);
    };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    setIsLoadingNotifs(true);
    try {
      const res = await fetch(
        `${getApiUrl()}/notifications/list/${user.id}`,
      );
      const result = await res.json();
      if (res.ok) setNotifications(result.data || []);
    } catch (e) {
      console.error(
        "Error fetching notifications from",
        getApiUrl(),
        e,
      );
    } finally {
      setIsLoadingNotifs(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsDropdownOpen(false);
    setIsMenuOpen(false);
    window.location.reload(); // Refresh to ensure clean state
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled || isMenuOpen ? "bg-white/90 backdrop-blur-md py-3 border-zinc-200" : "bg-transparent py-5 border-transparent"}`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center group cursor-pointer">
          <div className="relative w-40 h-11 sm:w-48 sm:h-13 lg:w-56 lg:h-15 group-hover:scale-105 transition-transform duration-300">
            <Image
              src={
                isLightText
                  ? "/images/Logo-Bg-1-2.png"
                  : "/images/Logo-Bg-2-2.png"
              }
              alt="SatwaiD Logo"
              fill
              className="object-contain object-left"
            />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div
          className={`hidden md:flex items-center gap-8 font-semibold ${isLightText ? "text-white/80" : "text-zinc-500"}`}
        >
          {[
            { name: "Komunitas", href: "/komunitas" },
            { name: "Etalase Hewan", href: "/toko" },
            { name: "Lelang Hewan", href: "/lelang" },
          ].map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`transition-all relative py-1 hover:text-emerald-500 ${
                  isActive
                    ? "text-emerald-500 font-bold"
                    : isLightText
                      ? "hover:text-white"
                      : "hover:text-zinc-900"
                }`}
              >
                {item.name}
                {isActive && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-emerald-500 rounded-full animate-in fade-in slide-in-from-left-2 duration-300"></span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4 relative">
          {!isLoaded ? (
            <div className="hidden sm:block h-10 w-24 bg-zinc-800/10 dark:bg-white/10 rounded-full animate-pulse"></div>
          ) : user ? (
            <div className="hidden sm:block relative">
              <button
                onClick={() => {
                  setIsDropdownOpen(!isDropdownOpen);
                  setIsChatOpen(false);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all border shadow-sm ${
                  isLightText
                    ? "bg-white/10 text-white border-white/20 hover:bg-white/20"
                    : "bg-white text-zinc-900 border-zinc-200 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10"
                }`}
              >
                <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-emerald-500/50">
                  {user.avatar_url ? (
                    <img
                      src={`${getApiUrl()}${user.avatar_url}`}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                      {user.username
                        ? user.username.charAt(0).toUpperCase()
                        : "U"}
                    </div>
                  )}
                </div>
                <span>{user.username}</span>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white border border-zinc-100 rounded-2xl shadow-xl py-2 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200 z-50">
                  <div className="px-4 py-3 border-b border-zinc-100 mb-2 bg-zinc-50/50 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-emerald-500/30">
                      {user.avatar_url ? (
                        <img
                          src={`${getApiUrl()}${user.avatar_url}`}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold">
                          {user.username
                            ? user.username.charAt(0).toUpperCase()
                            : "U"}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-zinc-800 truncate">
                        {user.name || user.username}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">
                        {shopName || user.email || "User"}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/user/pengaturan"
                    className="flex items-center px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Pengaturan Akun
                  </Link>
                  <Link
                    href="/user/pesanan"
                    className="flex items-center px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Pesanan saya
                  </Link>
                  <Link
                    href="/user/toko/dashboard"
                    className="flex items-center px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Dashboard Seller
                  </Link>
                  <div className="border-t border-zinc-100 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden sm:block bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-full font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              Masuk
            </Link>
          )}

          {user && (
            <div className="relative">
              <Link
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  setIsChatOpen(!isChatOpen);
                  setIsDropdownOpen(false);
                  if (!isChatOpen) {
                    setNotifCount(0);
                    if (user) {
                      // Mark all as read before fetching to ensure they show up as white
                      fetch(
                        `${getApiUrl()}/notifications/${user.id}/read-all`,
                        { method: "PUT" },
                      )
                        .then(() => fetchNotifications())
                        .catch(console.error);
                    } else {
                      fetchNotifications();
                    }
                  }
                }}
                className={`p-2 rounded-full transition-all relative flex items-center justify-center border shadow-sm ${
                  notifCount > 0
                    ? "bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20"
                    : isLightText
                      ? "bg-white/10 text-white border-white/20 hover:bg-white/20"
                      : "bg-white text-zinc-900 border-zinc-200 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10"
                }`}
                title="Notifikasi"
              >
                <Bell size={20} />
                {notifCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                    {notifCount}
                  </span>
                )}
              </Link>

              {/* Notification Center Dropdown */}
              {isChatOpen && (
                <div className="fixed sm:absolute right-4 sm:right-0 left-4 sm:left-auto mt-3 w-auto sm:w-96 bg-white border border-zinc-100 rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.15)] overflow-hidden animate-in slide-in-from-top-2 fade-in duration-300 z-[60]">
                  <div className="px-5 sm:px-7 py-4 sm:py-6 border-b border-zinc-50 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-black text-zinc-900">
                        Notifikasi
                      </h3>
                      {notifications.length > 0 && (
                        <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                          {notifications.length}
                        </span>
                      )}
                    </div>
                    <button
                      className="text-[11px] font-black text-red-400 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-1.5"
                      onClick={async () => {
                        if (user) {
                          try {
                            await fetch(
                              `${getApiUrl()}/notifications/${user.id}`,
                              { method: "DELETE" },
                            );
                            setNotifications([]);
                            setNotifCount(0);
                            fetchNotifications();
                          } catch (e) {
                            console.error("Error deleting notifications", e);
                          }
                        }
                      }}
                    >
                      <Trash2 size={12} />
                      Hapus Semua Notif
                    </button>
                  </div>

                  <div className="max-h-[480px] overflow-y-auto custom-scrollbar bg-white">
                    {isLoadingNotifs ? (
                      <div className="py-20 flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] animate-pulse">
                          Sinkronisasi...
                        </p>
                      </div>
                    ) : notifications.length > 0 ? (
                      <div className="divide-y divide-zinc-50">
                        {notifications.map((notif) => {
                          let Icon = Bell;
                          let iconColor = "bg-zinc-100 text-zinc-500";

                          if (notif.type === "chat") {
                            Icon = MessageSquare;
                            iconColor = "bg-emerald-100 text-emerald-600";
                          } else if (notif.type === "disbursement") {
                            Icon = CreditCard;
                            iconColor = "bg-emerald-100 text-emerald-600";
                          } else if (notif.type.includes("order")) {
                            Icon = Package;
                            iconColor = "bg-blue-100 text-blue-600";
                          } else if (notif.type === "community") {
                            Icon = Users;
                            iconColor = "bg-purple-100 text-purple-600";
                          } else if (notif.type === "moderation_product") {
                            Icon = Package;
                            iconColor = notif.title.includes("Setuju")
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-red-100 text-red-600";
                          } else if (notif.type === "moderation_shop") {
                            Icon = Store;
                            iconColor = notif.title.includes("Verifikasi")
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-amber-100 text-amber-600";
                          } else if (notif.type.includes("auction")) {
                            Icon = Gavel;
                            iconColor = "bg-amber-100 text-amber-600";
                          }

                          return (
                            <button
                              key={notif.id}
                              onClick={() => {
                                if (notif.link === "chat_modal") {
                                  const event = new CustomEvent("openInbox", {
                                    detail: notif.data,
                                  });
                                  window.dispatchEvent(event);
                                } else {
                                  window.location.href = notif.link;
                                }
                                setLocalReadIds((prev) => [...prev, notif.id]);
                                setIsChatOpen(false);
                              }}
                              className={`w-full px-4 sm:px-7 py-4 sm:py-5 transition-all flex items-start gap-4 group text-left relative ${!notif.is_read && !localReadIds.includes(notif.id) ? "bg-emerald-50 border-l-4 border-emerald-500/50" : "bg-white hover:bg-zinc-50"}`}
                            >
                              <div
                                className={`shrink-0 w-12 h-12 rounded-2xl ${iconColor} flex items-center justify-center transition-transform group-hover:scale-110 duration-300 shadow-sm`}
                              >
                                <Icon size={20} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm font-black text-zinc-900 group-hover:text-emerald-600 transition-colors">
                                    {notif.title}
                                  </p>
                                  <p className="text-[10px] font-bold text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded-md">
                                    {new Date(notif.time).toLocaleTimeString(
                                      "id-ID",
                                      { hour: "2-digit", minute: "2-digit" },
                                    )}
                                  </p>
                                </div>
                                <p className="text-xs font-medium text-zinc-500 leading-relaxed mb-1 line-clamp-2">
                                  {notif.message}
                                </p>
                                <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">
                                  {new Date(notif.time).toLocaleDateString(
                                    "id-ID",
                                    { day: "numeric", month: "short" },
                                  )}
                                </p>
                              </div>
                              <div className="absolute top-1/2 -translate-y-1/2 right-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0 translate-x-2">
                                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg">
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={3}
                                      d="M9 5l7 7-7 7"
                                    />
                                  </svg>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-24 text-center">
                        <div className="w-20 h-20 bg-zinc-50 rounded-[2rem] flex items-center justify-center mx-auto mb-5 text-zinc-200">
                          <Bell size={40} />
                        </div>
                        <p className="text-sm font-black text-zinc-400 uppercase tracking-[0.3em]">
                          Hening Sekali...
                        </p>
                        <p className="text-xs font-bold text-zinc-300 mt-2">
                          Belum ada notifikasi baru untuk Anda
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 sm:p-6 bg-zinc-50/50 border-t border-zinc-50">
                    <Link
                      href="/user/pesanan"
                      onClick={() => setIsChatOpen(false)}
                      className="flex items-center justify-center w-full py-4 bg-zinc-900 hover:bg-emerald-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98]"
                    >
                      Lihat Semua Aktivitas
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`md:hidden transition-all duration-300 ${user && !isMenuOpen ? "p-0.5" : "p-2 rounded-lg"} ${isLightText ? "text-white hover:bg-white/10" : "text-zinc-900 hover:bg-zinc-100"}`}
          >
            {isMenuOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : !isLoaded ? (
              <div className="w-9 h-9 rounded-full bg-zinc-200/50 dark:bg-white/10 animate-pulse"></div>
            ) : user ? (
              <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-emerald-500/50 shadow-md">
                {user.avatar_url ? (
                  <img
                    src={`${getApiUrl()}${user.avatar_url}`}
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-emerald-500 flex items-center justify-center text-white text-xs font-black">
                    {user.username
                      ? user.username.charAt(0).toUpperCase()
                      : "U"}
                  </div>
                )}
              </div>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div
        className={`md:hidden transition-all duration-500 ease-in-out bg-white border-t border-zinc-100 overflow-y-auto custom-scrollbar ${isMenuOpen ? "max-h-[85vh] opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}
      >
        <div className="px-6 py-8 flex flex-col gap-5 font-bold">
          {[
            { name: "Komunitas", href: "/komunitas" },
            { name: "Etalase Hewan", href: "/toko" },
            { name: "Lelang Hewan", href: "/lelang" },
          ].map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center justify-between p-3 rounded-2xl transition-all ${
                  isActive
                    ? "bg-emerald-50 text-emerald-600 px-4"
                    : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {item.name}
                {isActive && (
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                )}
              </Link>
            );
          })}
          {!isLoaded ? (
            <div className="sm:hidden border-t border-zinc-100 pt-6 mt-2 flex flex-col gap-4 animate-pulse">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            </div>
          ) : user ? (
            <div className="sm:hidden border-t border-zinc-100 pt-6 mt-2 flex flex-col gap-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-emerald-500/30">
                  {user.avatar_url ? (
                    <img
                      src={`${getApiUrl()}${user.avatar_url}`}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                      {user.username
                        ? user.username.charAt(0).toUpperCase()
                        : "U"}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-zinc-900">{user.username}</p>
                  <p className="text-xs text-zinc-500">
                    {shopName || user.email}
                  </p>
                </div>
              </div>
              <Link
                href="/user/pengaturan"
                className="text-zinc-600 hover:text-emerald-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Pengaturan Akun
              </Link>
              <Link
                href="/user/pesanan"
                className="text-zinc-600 hover:text-emerald-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Pesanan saya
              </Link>
              <Link
                href="/user/toko/dashboard"
                className="text-zinc-600 hover:text-emerald-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard Seller
              </Link>
              <button
                onClick={handleLogout}
                className="text-left text-red-600 font-bold mt-2"
              >
                Keluar
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="sm:hidden text-center bg-emerald-600 text-white px-6 py-3 rounded-full font-bold"
              onClick={() => setIsMenuOpen(false)}
            >
              Masuk
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
