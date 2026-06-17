"use client";

import { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, X, User } from "lucide-react";
import { io } from "socket.io-client";
import { getApiUrl, getSocketUrl } from "@/app/utils/api";

export default function ChatModal({ isOpen, onClose, sellerId, buyerId, sellerName, buyerName, productId, topicId, initialMessage }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [socket, setSocket] = useState(null);
    const [realTopicId, setRealTopicId] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (isOpen && initialMessage) {
            setNewMessage(initialMessage);
        } else if (!isOpen) {
            setNewMessage("");
        }
    }, [isOpen, initialMessage]);

    useEffect(() => {
        // RESET state when props change to avoid showing old data
        setRealTopicId(null);
        setMessages([]);

        if (!isOpen) return;

        // If we already have a topicId (from inbox or notification), use it directly
        if (topicId) {
            setRealTopicId(topicId);
            return;
        }

        if (!sellerId || !buyerId || !productId) return;

        const initChat = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`${getApiUrl()}/chats/start`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        buyer_id: buyerId,
                        seller_id: sellerId,
                        product_id: productId
                    })
                });
                const result = await res.json();
                if (res.ok && result.data) {
                    setRealTopicId(result.data.id);
                }
            } catch (err) {
                console.error("Failed to init chat:", err);
            } finally {
                setIsLoading(false);
            }
        };

        initChat();
    }, [isOpen, sellerId, buyerId, productId, topicId]);

    useEffect(() => {
        if (!isOpen || !realTopicId) return;

        fetchMessages(realTopicId);

        const token = localStorage.getItem("token");
        const newSocket = io(getSocketUrl(), {
            auth: {
                token: token ? `Bearer ${token}` : null
            }
        });
        setSocket(newSocket);
        newSocket.emit("join_topic", realTopicId);

        newSocket.on("receive_message", (msg) => {
            setMessages(prev => [...prev, msg]);
            scrollToBottom();

            // Pro-actively mark incoming message as read in DB if we are the recipient
            const userRaw = localStorage.getItem("user");
            if (userRaw) {
                const u = JSON.parse(userRaw);
                if (msg.sender_id !== u.id) {
                    fetch(`${getApiUrl()}/chats/${realTopicId}/read?user_id=${u.id}`, { method: 'PUT' })
                        .then(() => {
                            window.dispatchEvent(new CustomEvent("sync_notifications"));
                        })
                        .catch(console.error);
                }
            }
        });

        return () => { newSocket.disconnect(); };
    }, [isOpen, realTopicId]);

    const fetchMessages = async (tId) => {
        if (!tId || tId === 'undefined') return;
        setIsLoading(true);
        try {
            const userRaw = localStorage.getItem("user");
            const userId = userRaw ? JSON.parse(userRaw).id : '';
            const res = await fetch(`${getApiUrl()}/chats/${tId}/messages?user_id=${userId}`);
            const data = await res.json();
            if (res.ok) {
                setMessages(data.data || []);
                window.dispatchEvent(new CustomEvent("sync_notifications"));
            }
            scrollToBottom();
        } catch (err) {
            console.error("Error fetching messages:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;

        const userRaw = localStorage.getItem("user");
        if (!userRaw) return;
        const user = JSON.parse(userRaw);

        socket.emit("send_message", {
            chat_id: realTopicId,
            user_id: user.id,
            content: newMessage
        });

        setNewMessage("");
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                try {
                    setCurrentUser(JSON.parse(userStr));
                } catch (e) {
                    console.error("Error parsing user", e);
                }
            }
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[600px]">
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white">Chat dengan {currentUser?.id === sellerId ? buyerName : sellerName}</h3>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Online</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all flex items-center justify-center border border-zinc-700"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-3">
                            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black text-zinc-500 uppercase">Memuat Pesan...</p>
                        </div>
                    ) : messages.length > 0 ? (
                        messages.map((msg, i) => {
                            const isMe = msg.sender_id === currentUser?.id;
                            return (
                                <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                    <div className={`max-w-[80%] p-4 rounded-2xl ${isMe ? 'bg-emerald-500 text-zinc-950 rounded-tr-sm' : 'bg-zinc-800 text-zinc-300 rounded-tl-sm border border-zinc-700'}`}>
                                        <p className="text-sm leading-relaxed">{msg.content}</p>
                                        <p className={`text-[9px] font-bold mt-1 uppercase ${isMe ? 'text-zinc-900/60' : 'text-zinc-500'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700">
                                <MessageSquare size={24} className="text-zinc-600" />
                            </div>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Mulai percakapan baru</p>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-6 bg-zinc-950/30 border-t border-zinc-800">
                    <div className="relative group">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Tulis pesan..."
                            className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500/50 rounded-2xl py-4 px-6 pr-14 text-white text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-zinc-600"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-emerald-500/20 active:scale-90"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
