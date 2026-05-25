"use client";

import { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import ChatInboxModal from "./ChatInboxModal";
import ChatModal from "./ChatModal";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/app/utils/api";

export default function FloatingChatButton() {
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [chatConfig, setChatConfig] = useState({
    isOpen: false,
    sellerId: null,
    buyerId: null,
    sellerName: "",
    buyerName: "",
    productId: null,
    topicId: null,
  });
  const [user, setUser] = useState(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  useEffect(() => {
    const userRaw = localStorage.getItem("user");
    if (userRaw) {
      const userData = JSON.parse(userRaw);
      setUser(userData);

      // Socket for real-time notification dot
      const token = localStorage.getItem("token");
      const socket = io(getSocketUrl(), {
        auth: {
          token: token ? `Bearer ${token}` : null,
        },
      });
      socket.emit("join_user", userData.id);

      socket.on("new_notification", (data) => {
        if (data.type === "chat") {
          setHasNewMessage(true);
        }
      });

      return () => socket.disconnect();
    }
  }, []);

  if (!user) return null;

  return (
    <>
      <div className="fixed bottom-8 right-8 z-[90] animate-in fade-in slide-in-from-bottom-10 duration-700 delay-500">
        <button
          onClick={() => {
            setIsInboxOpen(true);
            setHasNewMessage(false);
          }}
          className="group relative w-16 h-16 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-[1.5rem] shadow-[0_20px_50px_rgba(16,185,129,0.3)] flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95"
        >
          {/* Pulsing Background */}
          <div className="absolute inset-0 rounded-[1.5rem] bg-emerald-500 animate-ping opacity-20 group-hover:opacity-40"></div>

          {/* Main Icon */}
          <MessageSquare
            size={28}
            className="relative z-10 group-hover:rotate-12 transition-transform duration-300"
          />

          {/* Notification Dot */}
          {hasNewMessage && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-zinc-950 border-4 border-emerald-500 rounded-full animate-bounce shadow-lg flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            </div>
          )}

          {/* Tooltip */}
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-zinc-900 text-white text-[10px] font-black px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest border border-zinc-800 whitespace-nowrap shadow-2xl">
            Kotak Masuk Chat
          </div>
        </button>
      </div>

      <ChatInboxModal
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        onSelectChat={(config) => {
          setIsInboxOpen(false);
          setChatConfig({ ...config, isOpen: true });
        }}
      />

      <ChatModal
        isOpen={chatConfig.isOpen}
        onClose={() => setChatConfig((prev) => ({ ...prev, isOpen: false }))}
        sellerId={chatConfig.sellerId}
        buyerId={chatConfig.buyerId}
        sellerName={chatConfig.sellerName}
        buyerName={chatConfig.buyerName}
        productId={chatConfig.productId}
        topicId={chatConfig.topicId}
      />
    </>
  );
}
