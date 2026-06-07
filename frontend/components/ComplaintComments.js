"use client";

import { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, ChevronDown } from "lucide-react";
import { io } from "socket.io-client";
import { getApiUrl, getSocketUrl } from "@/app/utils/api";

const MAX_VISIBLE = 8; // show this many before enabling scroll

export default function ComplaintComments({ complaintId, isAdminPage = false }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const socketRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const commentsScrollRef = useRef(null);
  const commentsEndRef = useRef(null);

  // Authenticate user and retrieve details
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== "undefined") {
        if (isAdminPage) {
          const adminToken = localStorage.getItem("admin_token");
          const adminUser = localStorage.getItem("admin_user");
          if (adminToken && adminUser) {
            setToken(adminToken);
            setUser(JSON.parse(adminUser));
            setIsAdmin(true);
          }
        } else {
          const userToken = localStorage.getItem("token");
          const normalUser = localStorage.getItem("user");
          if (userToken && normalUser) {
            setToken(userToken);
            setUser(JSON.parse(normalUser));
            setIsAdmin(false);
          }
        }
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [isAdminPage]);


  useEffect(() => {
    if (!complaintId || !token) return;

    const fetchComments = async () => {
      try {
        const res = await fetch(
          `${getApiUrl()}/complaints/${complaintId}/comments`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        if (res.ok) setComments(data.data);
      } catch (err) {
        console.error("Error fetching complaint comments:", err);
      }
    };
    fetchComments();

    console.log("[Socket] Connecting to:", getSocketUrl(), "with token:", token ? `Bearer ${token.substring(0, 15)}...` : "null");

    const newSocket = io(getSocketUrl(), {
      auth: {
        token: `Bearer ${token}`,
      },
    });
    socketRef.current = newSocket;

    newSocket.on("connect", () => {
      console.log("[Socket] Connected successfully with ID:", newSocket.id);
      newSocket.emit("join_complaint", complaintId);
    });

    newSocket.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err.message);
    });

    newSocket.on("receive_complaint_comment", (comment) => {
      console.log("[Socket] Received comment:", comment);
      setComments((prev) => [...prev, comment]);
      // Auto-scroll to bottom on new real-time message
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => {
      console.log("[Socket] Disconnecting socket...");
      newSocket.disconnect();
    };
  }, [complaintId, token]);

  // Scroll to bottom when expanded
  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    }
  }, [isExpanded]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !socketRef.current) return;
    
    socketRef.current.emit("send_complaint_comment", {
      complaint_id: complaintId,
      user_id: user.id,
      content: newComment,
    });
    setNewComment("");
    // Expand comments and scroll when user sends a message
    setIsExpanded(true);
  };

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const hasMany = comments.length > MAX_VISIBLE;
  const visibleComments =
    hasMany && !isExpanded ? comments.slice(-MAX_VISIBLE) : comments;

  return (
    <div className="bg-transparent sm:bg-zinc-900 border-0 sm:border border-zinc-800 rounded-none sm:rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-2 sm:px-6 py-4 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <MessageSquare size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black text-white">Diskusi & Resolusi</h3>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
              {comments.length} Balasan
            </p>
          </div>
        </div>
        {hasMany && (
          <button
            onClick={scrollToBottom}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest border border-zinc-700"
          >
            <ChevronDown size={10} /> Terbaru
          </button>
        )}
      </div>

      {/* Show older comments toggle */}
      {hasMany && !isExpanded && (
        <div className="flex flex-col items-center py-4 border-b border-zinc-800 gap-2 bg-zinc-950/30">
          <p className="text-[11px] font-bold text-zinc-500">
            {comments.length - MAX_VISIBLE} balasan sebelumnya disembunyikan
          </p>
          <button
            onClick={() => setIsExpanded(true)}
            type="button"
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[10px] font-black rounded-lg border border-zinc-700 uppercase tracking-widest"
          >
            Tampilkan Semua
          </button>
        </div>
      )}

      {/* Scrollable Comments List */}
      <div
        ref={commentsScrollRef}
        className={`overflow-y-auto ${isExpanded && hasMany ? "max-h-[380px]" : "max-h-[300px]"} custom-scrollbar`}
      >
        <div className="px-2 py-4 sm:p-5 space-y-4">
          {comments.length > 0 ? (
            visibleComments.map((comment, i) => {
              const isMe = user && String(comment.user_id).toLowerCase() === String(user.id).toLowerCase();
              const isSenderAdmin = comment.author?.role === "admin";
              
              return (
                <div
                  key={comment.id}
                  className={`flex gap-3 group ${isMe ? "flex-row-reverse" : ""}`}
                >
                  <div className="w-8 h-8 rounded-xl overflow-hidden bg-zinc-850 shrink-0 border border-zinc-700">
                    {comment.author?.avatar_url ? (
                      <img
                        src={`${getApiUrl()}${comment.author.avatar_url}`}
                        alt={comment.author.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-full h-full flex items-center justify-center font-black text-xs text-white ${
                          isSenderAdmin 
                            ? "bg-gradient-to-br from-indigo-500 to-indigo-700" 
                            : isMe
                              ? "bg-gradient-to-br from-emerald-500 to-emerald-700" 
                              : "bg-gradient-to-br from-zinc-650 to-zinc-800"
                        }`}
                      >
                        {comment.author?.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div
                    className={`flex-1 min-w-0 space-y-1 ${isMe ? "text-right" : ""}`}
                  >
                    <div
                      className={`flex items-center gap-1.5 flex-wrap ${isMe ? "justify-end flex-row-reverse" : ""}`}
                    >
                      <span className="font-black text-xs text-white">
                        {isMe
                          ? "Anda"
                          : comment.author?.name || comment.author?.username}
                      </span>
                      {isSenderAdmin && (
                        <span className="px-1.5 py-0.2 bg-indigo-500/10 border border-indigo-500/20 text-[8px] font-black text-indigo-400 rounded uppercase tracking-wider">
                          Admin
                        </span>
                      )}
                      <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-wider">
                        {new Date(comment.created_at).toLocaleDateString(
                          "id-ID",
                          { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }
                        )}
                      </span>
                    </div>
                    <div
                      className={`p-3 border rounded-xl text-left ${
                        isMe
                          ? "bg-emerald-500/10 border-emerald-500/20 rounded-tr-sm"
                          : isSenderAdmin
                            ? "bg-indigo-500/10 border-indigo-500/20 rounded-tl-sm"
                            : "bg-zinc-950/60 border-zinc-800 rounded-tl-sm"
                      }`}
                    >
                      <p className="text-zinc-300 text-xs leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center space-y-2">
              <div className="w-12 h-12 bg-zinc-900/80 rounded-full flex items-center justify-center mx-auto border border-zinc-800">
                <MessageSquare size={20} className="text-zinc-600" />
              </div>
              <p className="text-zinc-500 text-xs font-semibold">
                Belum ada balasan diskusi.
              </p>
            </div>
          )}
          <div ref={commentsEndRef} />
        </div>
      </div>

      {/* Compose Area */}
      <div className="px-2 sm:px-5 pb-5 pt-2 border-t border-zinc-800 bg-zinc-950/20">
        {user ? (
          <form onSubmit={handleSubmit} className="mt-2 space-y-2">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-zinc-850 shrink-0 border border-zinc-700 mt-1">
                {user.avatar_url ? (
                  <img
                    src={`${getApiUrl()}${user.avatar_url}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-white font-black text-xs ${
                    isAdmin 
                      ? "bg-gradient-to-br from-indigo-500 to-indigo-700" 
                      : "bg-gradient-to-br from-emerald-500 to-emerald-700"
                  }`}>
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 relative group">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey))
                      handleSubmit(e);
                  }}
                  placeholder="Ketik balasan... (Ctrl+Enter untuk kirim)"
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded-xl py-2 px-3 pr-11 text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-none placeholder:text-zinc-600 custom-scrollbar"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="absolute bottom-2 right-2 w-7 h-7 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-650 text-zinc-950 rounded-lg flex items-center justify-center disabled:cursor-not-allowed"
                >
                  <Send size={12} />
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="mt-2 py-3 bg-zinc-950/50 border border-zinc-800 rounded-xl text-center">
            <p className="text-zinc-500 text-xs font-semibold">
              Sesi Anda telah berakhir. Silakan login kembali.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
