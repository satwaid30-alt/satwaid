"use client";

import { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, ChevronDown } from "lucide-react";
import { io } from "socket.io-client";
import Link from "next/link";
import { getApiUrl, getSocketUrl } from "@/app/utils/api";

const MAX_VISIBLE = 5; // show this many before enabling scroll

export default function Comments({ topicId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const commentsScrollRef = useRef(null);
  const commentsEndRef = useRef(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));

    fetchComments();

    const token = localStorage.getItem("token");
    const newSocket = io(getSocketUrl(), {
      auth: {
        token: token ? `Bearer ${token}` : null,
      },
    });
    setSocket(newSocket);
    newSocket.emit("join_topic", topicId);

    newSocket.on("receive_comment", (comment) => {
      setComments((prev) => [...prev, comment]);
      // Auto-scroll to bottom on new real-time message
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [topicId]);

  // Scroll to bottom when expanded
  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    }
  }, [isExpanded]);

  const fetchComments = async () => {
    try {
      const res = await fetch(
        `${getApiUrl()}/topics/${topicId}/comments`,
      );
      const data = await res.json();
      if (res.ok) setComments(data.data);
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    socket.emit("send_comment", {
      topic_id: topicId,
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
    <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <MessageSquare size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Balasan Diskusi</h3>
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
              {comments.length} Komentar
            </p>
          </div>
        </div>
        {hasMany && (
          <button
            onClick={scrollToBottom}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-zinc-700"
          >
            <ChevronDown size={12} /> Terbaru
          </button>
        )}
      </div>

      {/* Show older comments toggle */}
      {hasMany && !isExpanded && (
        <div className="flex flex-col items-center py-5 border-b border-zinc-800 gap-2 bg-zinc-950/30">
          <p className="text-xs font-bold text-zinc-600">
            {comments.length - MAX_VISIBLE} komentar sebelumnya disembunyikan
          </p>
          <button
            onClick={() => setIsExpanded(true)}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-black rounded-xl border border-zinc-700 transition-all uppercase tracking-widest"
          >
            Tampilkan Semua Komentar
          </button>
        </div>
      )}

      {/* Scrollable Comments List */}
      <div
        ref={commentsScrollRef}
        className={`overflow-y-auto transition-all duration-500 ${isExpanded && hasMany ? "max-h-[520px]" : ""} custom-scrollbar`}
      >
        <div className="p-6 sm:p-8 space-y-6">
          {comments.length > 0 ? (
            visibleComments.map((comment, i) => {
              const isMe =
                user &&
                (comment.user_id === user.id ||
                  comment.author_id === user.id ||
                  comment.author?.id === user.id);
              return (
                <div
                  key={comment.id}
                  className={`flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-300 ${isMe ? "flex-row-reverse" : ""}`}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="w-10 h-10 rounded-2xl overflow-hidden bg-zinc-800 shrink-0 border border-zinc-700">
                    {comment.author?.avatar_url ? (
                      <img
                        src={`${getApiUrl()}${comment.author.avatar_url}`}
                        alt={comment.author.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-full h-full flex items-center justify-center font-black text-sm text-white ${isMe ? "bg-gradient-to-br from-amber-500 to-amber-700" : "bg-gradient-to-br from-emerald-500 to-emerald-700"}`}
                      >
                        {comment.author?.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div
                    className={`flex-1 min-w-0 space-y-1.5 ${isMe ? "text-right" : ""}`}
                  >
                    <div
                      className={`flex items-center gap-2 flex-wrap ${isMe ? "justify-end flex-row-reverse" : ""}`}
                    >
                      <span className="font-black text-sm text-white">
                        {isMe
                          ? "Anda"
                          : comment.author?.name || comment.author?.username}
                      </span>
                      <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">
                        {new Date(comment.created_at).toLocaleDateString(
                          "id-ID",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </span>
                    </div>
                    <div
                      className={`p-4 border rounded-2xl text-left transition-colors ${
                        isMe
                          ? "bg-emerald-500/10 border-emerald-500/20 rounded-tr-sm group-hover:border-emerald-500/30"
                          : "bg-zinc-950/60 border-zinc-800 rounded-tl-sm group-hover:border-zinc-700"
                      }`}
                    >
                      <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto border border-zinc-800">
                <MessageSquare size={28} className="text-zinc-700" />
              </div>
              <p className="text-zinc-500 text-sm font-medium">
                Belum ada komentar. Jadilah yang pertama!
              </p>
            </div>
          )}
          <div ref={commentsEndRef} />
        </div>
      </div>

      {/* Compose Area */}
      <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-2 border-t border-zinc-800 bg-zinc-950/20">
        {user ? (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-zinc-800 shrink-0 border border-zinc-700 mt-1">
                {user.avatar_url ? (
                  <img
                    src={`${getApiUrl()}${user.avatar_url}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-black text-xs">
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
                  placeholder="Tulis balasan Anda... (Ctrl+Enter untuk kirim)"
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500/50 rounded-2xl py-3.5 px-4 pr-14 text-white text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none placeholder:text-zinc-600"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="absolute bottom-3 right-3 w-9 h-9 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-950 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-emerald-500/20 active:scale-90 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-zinc-700 text-right font-bold ml-12">
              Tekan Ctrl+Enter untuk kirim cepat
            </p>
          </form>
        ) : (
          <div className="mt-4 p-5 bg-zinc-950/50 border border-zinc-800 rounded-2xl text-center">
            <p className="text-zinc-500 text-sm font-medium">
              Silakan{" "}
              <Link
                href="/login"
                className="text-emerald-500 font-black hover:underline"
              >
                Login
              </Link>{" "}
              untuk ikut berdiskusi.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
