"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
    MessageSquare,
    Heart,
    Clock,
    ArrowLeft,
    Star,
    Share2,
    Bookmark,
    Eye,
    User,
    Calendar,
    Tag,
    ChevronRight
} from "lucide-react";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Comments from "../../../components/Comments";
import { copyToClipboard } from "../../utils/clipboard";
import { getApiUrl } from "@/app/utils/api";

export default function DetailKomunitasPage() {
    const params = useParams();
    const id = params.id;

    const [topic, setTopic] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLiked, setIsLiked] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    useEffect(() => {
        setTimeout(() => { window.scrollTo(0, 0); }, 100);
        const storedUser = localStorage.getItem('user');
        let userObj = null;
        if (storedUser) {
            userObj = JSON.parse(storedUser);
            setCurrentUser(userObj);
        }
        if (id) {
            fetchTopic();
            // Mark as read if user is logged in
            if (userObj?.id) {
                markAsRead(userObj.id);
            }
        }
    }, [id]);

    const markAsRead = async (userId) => {
        try {
            const token = localStorage.getItem("token");
            await fetch(`${getApiUrl()}/notifications/${userId}/read`, { 
                method: 'PUT',
                headers: {
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                }
            });
        } catch (e) {
            console.error("Error marking community as read:", e);
        }
    };

    useEffect(() => {
        if (topic && currentUser) {
            setIsLiked(topic.topic_likes?.some(l => l.user_id === currentUser.id) || false);
        }
    }, [topic, currentUser]);

    const handleLike = async () => {
        if (!currentUser) { alert("Silakan login untuk menyukai topik!"); return; }
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${getApiUrl()}/topics/${topic.id}/like`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ user_id: currentUser.id })
            });
            if (res.ok) {
                const data = await res.json();
                setIsLiked(data.has_liked);
                setTopic(prev => {
                    const newLikes = data.has_liked
                        ? [...(prev.topic_likes || []), { user_id: currentUser.id }]
                        : (prev.topic_likes || []).filter(l => l.user_id !== currentUser.id);
                    return { ...prev, likes: data.likes, topic_likes: newLikes };
                });
            }
        } catch (err) { console.error(err); }
    };

    const fetchTopic = async () => {
        try {
            const res = await fetch(`${getApiUrl()}/topics/${id}`);
            const data = await res.json();
            if (res.ok) {
                setTopic(data.data);
            } else {
                console.error("Topic not found or error:", data.message);
                setTopic(null);
            }
        } catch (err) {
            console.error("Fetch topic error:", err);
            setTopic(null);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        if (status === 'Aktif') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        if (status === 'Ditolak') return 'bg-red-500/10 text-red-400 border-red-500/20';
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    };

    const getStatusLabel = (status) => {
        if (status === 'Pending') return 'Menunggu Verifikasi';
        return status;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-zinc-500 font-bold animate-pulse text-sm">Memuat diskusi...</p>
                </div>
            </div>
        );
    }

    if (!topic) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-center p-6 gap-6">
                <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
                    <MessageSquare size={40} className="text-zinc-700" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white mb-2">Topik Tidak Ditemukan</h1>
                    <p className="text-zinc-500 max-w-md text-sm">Topik diskusi yang Anda cari mungkin telah dihapus atau tidak tersedia.</p>
                </div>
                <Link href="/komunitas" className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl transition-all">
                    Kembali ke Komunitas
                </Link>
            </div>
        );
    }

    const imageUrl = topic.image
        ? (topic.image.startsWith('http') ? topic.image : `${getApiUrl()}${topic.image}`)
        : null;

    const avatarUrl = topic.author?.avatar_url
        ? `${getApiUrl()}${topic.author.avatar_url}`
        : null;

    return (
        <div className="min-h-screen bg-zinc-950 text-white selection:bg-emerald-500/30">
            <Navbar />

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-32 space-y-8">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-600">
                    <Link href="/komunitas" className="hover:text-zinc-400 transition-colors flex items-center gap-1.5">
                        <ArrowLeft size={14} />
                        Komunitas
                    </Link>
                    <ChevronRight size={12} />
                    <span className="text-zinc-400 truncate max-w-[200px]">{topic.title}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Main Content */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Topic Article */}
                        <article className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* Cover Image */}
                            {imageUrl && (
                                <div
                                    className="w-full aspect-video overflow-hidden bg-zinc-950 border-b border-zinc-800 cursor-zoom-in group"
                                    onClick={() => setIsImageModalOpen(true)}
                                >
                                    <img
                                        src={imageUrl}
                                        alt={topic.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                </div>
                            )}

                            <div className="p-8 space-y-6">
                                {/* Category & Status Badges */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-xl uppercase tracking-widest border border-emerald-500/20">
                                        <Tag size={10} /> {topic.category}
                                    </span>
                                    <span className={`px-3 py-1.5 text-[10px] font-black rounded-xl uppercase tracking-widest border ${getStatusStyle(topic.status)}`}>
                                        {getStatusLabel(topic.status)}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-600 ml-auto">
                                        <Calendar size={12} />
                                        {new Date(topic.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>

                                {/* Title */}
                                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
                                    {topic.title}
                                </h1>

                                {/* Author */}
                                <div className="flex items-center gap-4 p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800">
                                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center font-black text-zinc-400 overflow-hidden shrink-0">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-lg">{topic.author?.username?.charAt(0).toUpperCase() || 'U'}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-black text-white">@{topic.author?.username || 'Unknown'}</span>
                                            {(topic.author?.stars > 0) && (
                                                <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                                                    {Array.from({ length: Math.min(topic.author.stars, 5) }).map((_, i) => (
                                                        <Star key={i} size={10} className="fill-amber-400 text-amber-400" />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-zinc-600 font-bold uppercase tracking-wider mt-0.5">Penulis Topik</p>
                                    </div>
                                </div>

                                {/* Rejected reason */}
                                {topic.status === 'Ditolak' && topic.rejection_reason && (
                                    <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-1">
                                        <p className="text-xs font-black text-red-400 uppercase tracking-wider">Alasan Penolakan</p>
                                        <p className="text-sm text-red-200/80 leading-relaxed">{topic.rejection_reason}</p>
                                    </div>
                                )}

                                {/* Body */}
                                <div className="border-t border-zinc-800 pt-6">
                                    <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap text-base font-medium">
                                        {topic.description}
                                    </p>
                                </div>

                                {/* Footer Actions */}
                                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleLike}
                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm transition-all border active:scale-95 ${isLiked
                                                ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                                                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-red-500/30 hover:text-red-400'
                                                }`}
                                        >
                                            <Heart size={16} className={isLiked ? 'fill-current' : ''} />
                                            <span>{topic.likes || 0}</span>
                                        </button>
                                        <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800/50 rounded-2xl text-sm text-zinc-500 border border-zinc-800">
                                            <MessageSquare size={16} />
                                            <span className="font-bold">{topic.replies || 0} Balasan</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            const url = window.location.href;
                                            if (navigator.share) {
                                                try {
                                                    await navigator.share({
                                                        title: topic.title,
                                                        url: url
                                                    });
                                                    return;
                                                } catch (err) {
                                                    if (err.name === 'AbortError') return;
                                                }
                                            }
                                            const success = await copyToClipboard(url);
                                            if (success) {
                                                // Optional: show a small toast or just change icon briefly
                                                alert("Link berhasil disalin!");
                                            }
                                        }}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-2xl text-xs font-black uppercase tracking-wider border border-zinc-700 transition-all"
                                    >
                                        <Share2 size={14} /> Bagikan
                                    </button>
                                </div>
                            </div>
                        </article>

                        {/* Comments Section */}
                        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                            <Comments topicId={topic.id} />
                        </section>
                    </div>

                    {/* Sidebar */}
                    <aside className="lg:col-span-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">

                        {/* Author Card */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 space-y-4">
                            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                                <User size={12} /> Penulis
                            </h3>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center font-black text-zinc-400 overflow-hidden shrink-0">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl">{topic.author?.username?.charAt(0).toUpperCase() || 'U'}</span>
                                    )}
                                </div>
                                <div>
                                    <p className="font-black text-white">@{topic.author?.username || 'Unknown'}</p>
                                    {topic.author?.reputation > 0 && (
                                        <p className="text-[10px] font-bold text-amber-500 mt-0.5">
                                            {topic.author.reputation?.toLocaleString('id-ID')} Pts Reputasi
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Topic Stats */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 space-y-4">
                            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Statistik Topik</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-zinc-500 flex items-center gap-2"><Heart size={13} className="text-red-400" /> Suka</span>
                                    <span className="text-sm font-black text-white">{topic.likes || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-zinc-500 flex items-center gap-2"><MessageSquare size={13} className="text-blue-400" /> Balasan</span>
                                    <span className="text-sm font-black text-white">{topic.replies || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-zinc-500 flex items-center gap-2"><Calendar size={13} className="text-emerald-400" /> Dibuat</span>
                                    <span className="text-xs font-bold text-zinc-400">
                                        {new Date(topic.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Back link */}
                        <Link
                            href="/komunitas"
                            className="flex items-center justify-center gap-2 w-full py-3.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all group"
                        >
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                            Semua Diskusi
                        </Link>
                    </aside>
                </div>
            </main>

            {/* Image Modal Lightbox */}
            {isImageModalOpen && imageUrl && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/95 backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={() => setIsImageModalOpen(false)}
                >
                    <button
                        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
                        onClick={() => setIsImageModalOpen(false)}
                    >
                        <ArrowLeft size={24} className="rotate-90" />
                    </button>
                    <div
                        className="relative max-w-7xl max-h-[90vh] overflow-hidden rounded-2xl animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={imageUrl}
                            alt={topic.title}
                            className="w-auto h-auto max-w-full max-h-[90vh] object-contain"
                        />
                    </div>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-zinc-900/80 border border-zinc-800 rounded-full text-xs font-bold text-zinc-400">
                        Klik dimana saja untuk menutup
                    </div>
                </div>
            )}
        </div>
    );
}
