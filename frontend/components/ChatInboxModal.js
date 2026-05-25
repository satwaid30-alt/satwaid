"use client";

import { useState, useEffect } from "react";
import { MessageSquare, X, ChevronRight, User, ShoppingBag } from "lucide-react";
import { getApiUrl } from "@/app/utils/api";

export default function ChatInboxModal({ isOpen, onClose, onSelectChat }) {
    const [chats, setChats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchChats();
        }
    }, [isOpen]);

    const fetchChats = async () => {
        setIsLoading(true);
        try {
            const userRaw = localStorage.getItem("user");
            if (!userRaw) return;
            const userData = JSON.parse(userRaw);

            // Fetch chats as seller
            const res = await fetch(`${getApiUrl()}/chats/seller/${userData.id}`);
            const result = await res.json();

            if (res.ok) {
                const sortedChats = (result.data || []).sort((a, b) =>
                    new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
                );
                setChats(sortedChats);
            }
        } catch (err) {
            console.error("Failed to fetch inbox:", err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[600px]">
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white">Kotak Masuk Chat</h3>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Pesan dari Pembeli</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all flex items-center justify-center border border-zinc-700"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-3">
                            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black text-zinc-500 uppercase">Memuat Pesan...</p>
                        </div>
                    ) : chats.length > 0 ? (
                        chats.map((chat) => (
                            <button
                                key={chat.id}
                                onClick={() => onSelectChat({
                                    topicId: chat.id,
                                    sellerId: chat.seller_id,
                                    buyerId: chat.buyer_id,
                                    buyerName: chat.buyer?.name || chat.buyer?.username || 'Buyer',
                                    sellerName: 'Saya',
                                    productId: chat.listing_id
                                })}
                                className="w-full p-4 bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-800/50 hover:border-emerald-500/30 rounded-[1.5rem] flex items-center justify-between transition-all duration-300 group active:scale-[0.98] relative overflow-hidden"
                            >
                                {/* Active Indicator Glow */}
                                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-emerald-500 font-black text-xl shadow-inner group-hover:border-emerald-500/30 transition-colors">
                                            {chat.buyer?.name?.charAt(0).toUpperCase() || <User size={24} />}
                                        </div>
                                        {/* Status dot */}
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-zinc-900 rounded-full" />
                                    </div>

                                    <div className="text-left flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-[13px] font-black text-white truncate">{chat.buyer?.name || chat.buyer?.username}</p>
                                            <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-black uppercase tracking-widest">Buyer</span>
                                        </div>

                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-5 h-5 rounded-lg bg-zinc-950 flex items-center justify-center shrink-0 border border-zinc-800">
                                                <ShoppingBag size={10} className="text-emerald-500" />
                                            </div>
                                            <p className="text-[10px] font-bold text-zinc-300 truncate leading-none">
                                                {chat.product?.name || 'Produk dihapus'}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                                                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                                {new Date(chat.updated_at || chat.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                            </p>
                                            <p className="text-[9px] font-bold text-zinc-600 flex items-center gap-1">
                                                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                                {new Date(chat.updated_at || chat.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 shrink-0 pl-4">
                                    {chat.product?.images?.[0] && (
                                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950 shadow-lg group-hover:border-emerald-500/50 transition-all group-hover:scale-110">
                                            <img src={chat.product.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                        </div>
                                    )}
                                    <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-zinc-950 transition-all">
                                        <ChevronRight size={16} />
                                    </div>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700">
                                <MessageSquare size={24} className="text-zinc-600" />
                            </div>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Belum ada chat masuk</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

