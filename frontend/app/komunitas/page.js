"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, MessageSquare, Flame, Clock, ChevronRight, ChevronLeft, Search, Heart, TrendingUp, Star, Hash, Megaphone, ArrowRight, ShoppingBag, Gavel, Home } from "lucide-react";
import Navbar from "../../components/Navbar";
import MobileMenuGrid from "../../components/MobileMenuGrid";
import { getApiUrl } from "@/app/utils/api";

export default function KomunitasPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("terbaru");
  const [topicsData, setTopicsData] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [ads, setAds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [chatConfig, setChatConfig] = useState({ isOpen: false, sellerId: null, buyerId: null, sellerName: "", buyerName: "", productId: null });
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [recentChats, setRecentChats] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  useEffect(() => {
    const handleOpenInbox = (e) => {
      if (e.detail) {
        setChatConfig({
          isOpen: true,
          ...e.detail,
        });
      } else {
        setIsInboxOpen(true);
      }
    };
    window.addEventListener("openInbox", handleOpenInbox);

    const fetchStats = async () => {
      try {
        const userRaw = localStorage.getItem("user");
        if (userRaw) {
          const userData = JSON.parse(userRaw);
          setCurrentUser(userData);

          const chatRes = await fetch(`${getApiUrl()}/chats/user/${userData.id}`);
          const chatData = await chatRes.json();
          if (chatRes.ok) setRecentChats((chatData.data || []).slice(0, 3));
        }

        const [topicsRes, usersRes, adsRes] = await Promise.all([fetch(`${getApiUrl()}/topics?status=Aktif`), fetch(`${getApiUrl()}/users/count`), fetch(`${getApiUrl()}/advertisements`)]);

        const topicsData = await topicsRes.json();
        const usersData = await usersRes.json();
        const adsData = await adsRes.json();

        if (topicsRes.ok) setTopicsData(topicsData.data);
        if (usersRes.ok) setUserCount(usersData.data);
        if (adsRes.ok) {
          const adsArray = Array.isArray(adsData.data) ? adsData.data : [];
          setAds(adsArray.filter((ad) => ad.status === "Aktif" && ad.placement === "Komunitas"));
        }
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();

    return () => {
      window.removeEventListener("openInbox", handleOpenInbox);
    };
  }, []);

  // Kategori Dinamis berdasarkan topicsData
  const categoriesMap = {};
  (topicsData || []).forEach((topic) => {
    const cat = topic.category || "Diskusi Umum";
    categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
  });

  const dynamicCategories = Object.keys(categoriesMap)
    .map((key, index) => ({
      id: index + 1,
      name: key,
      count: categoriesMap[key],
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const handleLike = async (e, topicId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      alert("Silakan login untuk menyukai topik!");
      return;
    }

    try {
      const res = await fetch(`${getApiUrl()}/topics/${topicId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUser.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setTopicsData((prev) =>
          prev.map((t) => {
            if (t.id === topicId) {
              const newLikes = data.likes;
              const newTopicLikes = data.has_liked ? [...(t.topic_likes || []), { user_id: currentUser.id }] : (t.topic_likes || []).filter((like) => like.user_id !== currentUser.id);
              return { ...t, likes: newLikes, topic_likes: newTopicLikes };
            }
            return t;
          }),
        );
      }
    } catch (err) {
      console.error("Error liking topic:", err);
    }
  };

  const sortedTopics = [...topicsData].sort((a, b) => {
    if (activeTab === "terbaru") {
      return new Date(b.created_at) - new Date(a.created_at);
    } else if (activeTab === "populer") {
      return (b.replies || 0) - (a.replies || 0);
    } else if (activeTab === "trending") {
      const scoreA = (a.replies || 0) + (a.likes || 0);
      const scoreB = (b.replies || 0) + (b.likes || 0);
      return scoreB - scoreA;
    }
    return 0;
  });

  const filteredTopics = (sortedTopics || []).filter((topic) => {
    return (topic.title || "").toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalPages = Math.ceil(filteredTopics.length / itemsPerPage);
  const currentTopics = filteredTopics.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans selection:bg-emerald-200 text-zinc-900">
      <Navbar theme="dark" />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-zinc-900 border-b border-zinc-800 hidden md:block">
        <div className="absolute inset-0 z-0">
          <img src="/images/Background.jpg" alt="Hero Background" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/60 via-zinc-900/80 to-zinc-900" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-700/10 blur-[120px] rounded-full" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Komunitas Satwa Indonesia
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
            Forum Diskusi <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Dunia Satwa</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10">Bergabung dengan ribuan pecinta satwa. Diskusikan perawatan, pamerkan koleksi, dan temukan teman se-hobi dalam satu platform.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/user/komunitas" className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-black rounded-2xl transition-all flex items-center justify-center gap-2 hover:scale-105">
              <MessageSquare size={20} />
              Buat Diskusi Baru
            </Link>
            <a href="#discussions" className="px-8 py-4 bg-white/10 border border-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 backdrop-blur-md">
              Jelajahi Diskusi <ArrowRight size={20} />
            </a>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16 md:py-16">
        {/* Ad Card for Mobile (Visible on mobile only, at the top) */}
        {isLoading ? (
          <div className="block md:hidden mb-6 px-1">
            <div className="w-full aspect-[2.1/1] min-h-[140px] bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-2xl border border-zinc-200/50" />
          </div>
        ) : ads.length > 0 ? (
          <div className="block md:hidden mb-6 px-1">
            <a href={ads[0].link_url || "#"} target="_blank" rel="noopener noreferrer" className="block relative aspect-[2.1/1] min-h-[140px] rounded-2xl overflow-hidden border border-zinc-200/70 shadow-md group">
              <img src={`${getApiUrl()}${ads[0].image_url}`} alt={ads[0].placement} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
              <div className="absolute inset-0 p-4 flex flex-col justify-end">
                <div className="mb-auto flex">
                  <span className="px-2.5 py-0.5 bg-emerald-500 text-zinc-950 text-[8px] font-black uppercase tracking-wider rounded-lg">Promosi</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-200 truncate max-w-[70%]">Kunjungi link sponsor kami</span>
                  <div className="py-1 px-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold rounded-lg text-[9px] transition-all flex items-center gap-1 shrink-0">
                    Kunjungi <ArrowRight size={10} />
                  </div>
                </div>
              </div>
            </a>
          </div>
        ) : (
          <div className="block md:hidden mb-6 px-1">
            <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800/80 p-4 flex items-center justify-between min-h-[90px] relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent"></div>
              <div className="min-w-0 pr-4">
                <span className="text-[7px] font-black uppercase tracking-wider text-emerald-400">Iklan Tersedia</span>
                <h4 className="font-black text-white text-xs mt-0.5 truncate">Pasang Iklan Anda</h4>
                <p className="text-[9px] text-zinc-500 leading-normal truncate">Jangkau ribuan pencinta reptil aktif.</p>
              </div>
              <button className="py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-xl text-[9px] transition-all shrink-0">Hubungi Admin</button>
            </div>
          </div>
        )}

        {/* Mobile Menu Grid (Visible on mobile/handphones only, white cards) */}
        <MobileMenuGrid className="mb-6 px-1" />

        {/* Stats Bar */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            { label: "Anggota Aktif", value: userCount, icon: Users, bg: "bg-blue-50", text: "text-blue-600" },
            { label: "Total Topik", value: topicsData.length, icon: Flame, bg: "bg-rose-50", text: "text-rose-500" },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 sm:p-5 border border-zinc-200/70 flex items-center gap-3 sm:gap-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 ${stat.bg} ${stat.text} rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0`}>
                <stat.icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-black text-zinc-900 leading-none">{stat.value}</p>
                <p className="text-[10px] sm:text-xs text-zinc-500 font-semibold mt-0.5 truncate">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="discussions">
          {/* Left Sidebar */}
          <div className="space-y-5">
            {/* Categories */}
            <div className="bg-white border border-zinc-200/70 rounded-2xl p-5">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Kategori Populer</h3>
              <div className="space-y-1">
                {dynamicCategories.length > 0 ? (
                  dynamicCategories.map((category) => (
                    <button key={category.id} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-emerald-50 group transition-all text-left">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all shrink-0">
                          <Hash size={13} />
                        </div>
                        <span className="font-semibold text-sm text-zinc-600 group-hover:text-emerald-700 transition-colors truncate">{category.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-all shrink-0 ml-2">{category.count}</span>
                    </button>
                  ))
                ) : (
                  <div className="text-zinc-400 text-sm text-center py-6">Belum ada kategori</div>
                )}
              </div>
            </div>

            {/* Recent Chats Widget */}
            {currentUser && (
              <div className="bg-white border border-zinc-200/70 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Pesan Terakhir</h3>
                  <button onClick={() => setIsInboxOpen(true)} className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest">
                    Semua
                  </button>
                </div>
                <div className="space-y-3">
                  {recentChats.length > 0 ? (
                    recentChats.map((chat) => {
                      const isSeller = chat.seller_id === currentUser.id;
                      const otherUser = isSeller ? chat.buyer : chat.seller;
                      return (
                        <button
                          key={chat.id}
                          onClick={() =>
                            setChatConfig({
                              isOpen: true,
                              topicId: chat.id,
                              sellerId: chat.seller_id,
                              buyerId: chat.buyer_id,
                              sellerName: chat.seller?.name || "Seller",
                              buyerName: chat.buyer?.name || "Buyer",
                              productId: chat.listing_id,
                            })
                          }
                          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-50 transition-all text-left group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-zinc-100 overflow-hidden shrink-0 border border-zinc-100 group-hover:border-emerald-200">
                            {otherUser?.avatar_url ? <img src={`${getApiUrl()}${otherUser.avatar_url}`} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-zinc-200 text-zinc-500 font-bold text-xs">{otherUser?.name?.charAt(0)}</div>}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-black text-zinc-900 truncate">{otherUser?.name || otherUser?.username}</p>
                            <p className="text-[9px] font-bold text-zinc-400 truncate mt-0.5">{chat.product?.name || "Diskusi Produk"}</p>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="py-4 text-center">
                      <p className="text-[10px] font-bold text-zinc-400">Tidak ada chat aktif</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ad Card - Full Portrait Style */}
            {isLoading ? (
              <div className="hidden md:block w-full aspect-[3/4] bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-2xl border border-zinc-200/50" />
            ) : ads.length > 0 ? (
              <a href={ads[0].link_url || "#"} target="_blank" rel="noopener noreferrer" className="hidden md:block relative aspect-[3/4] rounded-2xl overflow-hidden border border-zinc-200/70 group transition-all hover:scale-[1.02] active:scale-[0.98]">
                {/* Full Image Background */}
                <img src={`${getApiUrl()}${ads[0].image_url}`} alt={ads[0].placement} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity"></div>

                {/* Content Overlay */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <div className="mb-auto flex">
                    <span className="px-3 py-1 bg-emerald-500 text-zinc-950 text-[10px] font-black uppercase tracking-widest rounded-full">Promosi</span>
                  </div>

                  <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="w-full py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 group/btn">
                      Kunjungi Link
                      <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </a>
            ) : (
              <div className="hidden md:block bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800/80 group">
                <div className="h-60 bg-gradient-to-br from-zinc-800 to-zinc-950 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent"></div>
                  <div className="absolute -right-4 -top-4 opacity-10">
                    <Megaphone size={80} className="text-emerald-500" />
                  </div>
                  <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-3 relative z-10 group-hover:scale-110 transition-transform duration-500">
                    <Megaphone size={26} className="text-emerald-400 group-hover:-rotate-12 transition-transform duration-500" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400/60 relative z-10">Iklan Tersedia</span>
                </div>
                <div className="p-5">
                  <h4 className="font-black text-white text-base mb-1.5">Pasang Iklan Anda</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed mb-4">Jangkau ribuan pencinta reptil aktif. Promosikan produk, jasa, atau toko Anda di sini.</p>
                  <button className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-2">Hubungi Admin</button>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Filter Bar */}
            <div className="bg-white border border-zinc-200/70 rounded-2xl p-2 sm:p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1 bg-zinc-100 rounded-xl p-1">
                {[
                  { id: "terbaru", label: "Terbaru", icon: Clock },
                  { id: "populer", label: "Populer", icon: Flame },
                  { id: "trending", label: "Trending", icon: TrendingUp },
                ].map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${activeTab === tab.id ? "bg-white text-emerald-600" : "text-zinc-500 hover:text-zinc-700"}`}>
                    <tab.icon size={14} /> {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={15} />
                <input
                  type="text"
                  placeholder="Cari topik diskusi..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all text-zinc-900 placeholder:text-zinc-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Topic Cards */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="space-y-4">
                  {/* Inline loading indicator */}
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    {/* Spinner */}
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <MessageSquare size={24} className="text-white" />
                      </div>
                      <div className="absolute -inset-1.5 rounded-[18px] border-2 border-emerald-400/40 animate-spin border-t-emerald-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black text-zinc-700">Memuat Diskusi</p>
                      <p className="text-xs text-zinc-400 mt-0.5">Menunggu diskusi terbaru dari server…</p>
                    </div>
                    {/* Dot bounce */}
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"
                          style={{ animationDelay: `${i * 120}ms` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Skeleton list cards below the spinner */}
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="bg-white rounded-2xl p-5 sm:p-6 border border-zinc-200/70 animate-pulse space-y-4" style={{ animationDelay: `${(i - 1) * 80}ms` }}>
                        {/* Author Row Skeleton */}
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-zinc-100" />
                          <div className="space-y-1.5 flex-1">
                            <div className="h-3.5 bg-zinc-100 w-24 rounded-full" />
                            <div className="h-3 bg-zinc-50 w-16 rounded-full" />
                          </div>
                        </div>
                        {/* Title and Body Skeleton */}
                        <div className="space-y-2">
                          <div className="h-5 bg-zinc-100 w-3/4 rounded-full" />
                          <div className="h-3.5 bg-zinc-100 w-full rounded-full" />
                          <div className="h-3.5 bg-zinc-100 w-5/6 rounded-full" />
                        </div>
                        {/* Bottom Row Skeleton */}
                        <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                          <div className="h-6 bg-zinc-100 w-20 rounded-full" />
                          <div className="flex gap-4">
                            <div className="h-4 bg-zinc-100 w-10 rounded-full" />
                            <div className="h-4 bg-zinc-100 w-10 rounded-full" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : currentTopics.length > 0 ? (
                currentTopics.map((topic) => (
                  <Link href={`/komunitas/${topic.id}`} key={topic.id} className="block bg-white border border-zinc-200/70 hover:border-emerald-400/50 rounded-2xl p-5 sm:p-6 transition-all duration-200 group hover:-translate-y-0.5">
                    {/* Author Row */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200/50 overflow-hidden flex items-center justify-center text-emerald-700 font-black text-sm shrink-0">
                        {topic.author?.avatar_url ? <img src={`${getApiUrl()}${topic.author.avatar_url}`} alt={topic.author.username} className="w-full h-full object-cover" /> : topic.author?.username ? topic.author.username.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                        <span className="text-sm font-bold text-zinc-700">@{topic.author?.username || "Unknown"}</span>

                        {(topic.author?.stars > 0 || topic.author?.reputation > 0) && (
                          <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded-full" title={`${topic.author?.reputation?.toLocaleString("id-ID") || 0} Poin Reputasi`}>
                            {topic.author?.stars > 0 ? (
                              <div className="flex text-amber-500 gap-0.5">
                                {Array.from({ length: topic.author.stars }).map((_, i) => (
                                  <Star key={i} size={10} className="fill-current" />
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] font-black text-amber-600">{topic.author?.reputation?.toLocaleString("id-ID")} pts</span>
                            )}
                          </div>
                        )}

                        <span className="text-xs text-zinc-400 font-medium ml-auto shrink-0">{new Date(topic.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-lg sm:text-xl font-black text-zinc-900 group-hover:text-emerald-600 transition-colors leading-tight mb-2">{topic.title}</h3>
                    <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed">{topic.description}</p>

                    {/* Image */}
                    {topic.image && (
                      <div className="w-full h-48 sm:h-60 rounded-xl overflow-hidden border border-zinc-100 mt-4 bg-zinc-50">
                        <img src={topic.image.startsWith("http") ? topic.image : `${getApiUrl()}${topic.image}`} alt={topic.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      </div>
                    )}

                    {/* Bottom Row */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100">
                      <span className="px-3 py-1.5 bg-zinc-50 text-zinc-500 text-[9px] font-black rounded-full uppercase tracking-[0.1em] border border-zinc-100 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-100 transition-all">{topic.category || "Diskusi Umum"}</span>

                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-1.5 text-zinc-400 text-sm font-semibold">
                          <MessageSquare size={14} className="text-blue-400" />
                          <span>{topic.replies || 0}</span>
                        </div>
                        <button onClick={(e) => handleLike(e, topic.id)} className={`flex items-center gap-1.5 text-sm font-semibold transition-all hover:scale-110 active:scale-95 ${currentUser && topic.topic_likes?.some((like) => like.user_id === currentUser.id) ? "text-rose-500" : "text-zinc-400 hover:text-rose-500"}`}>
                          <Heart size={14} className={currentUser && topic.topic_likes?.some((like) => like.user_id === currentUser.id) ? "fill-current" : ""} />
                          <span>{topic.likes || 0}</span>
                        </button>
                        <div className="w-7 h-7 rounded-full bg-zinc-50 text-zinc-400 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center transition-all duration-300">
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-20 bg-white border border-dashed border-zinc-200 rounded-2xl">
                  <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-100">
                    <MessageSquare className="text-zinc-300" size={28} />
                  </div>
                  <h3 className="text-base font-black text-zinc-400 mb-1">Belum Ada Diskusi</h3>
                  <p className="text-zinc-400 text-sm mb-6">Jadilah yang pertama memulai topik diskusi!</p>
                  <Link href="/user/komunitas" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all text-sm">
                    <MessageSquare size={15} /> Mulai Diskusi Baru
                  </Link>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pt-4 flex justify-center items-center gap-1.5">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-500 rounded-xl transition-all">
                  <ChevronLeft size={17} />
                </button>

                {Array.from({ length: totalPages }).map((_, i) => (
                  <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 rounded-xl font-black text-sm transition-all ${currentPage === i + 1 ? "bg-emerald-500 text-white" : "bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-500"}`}>
                    {i + 1}
                  </button>
                ))}

                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-500 rounded-xl transition-all">
                  <ChevronRight size={17} />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
