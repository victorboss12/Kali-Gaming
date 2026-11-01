"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getSocket } from "@/lib/socket";
import {
  MessageSquare,
  Search,
  Smile,
  Shield,
  Sparkles,
  User,
  CheckCheck,
} from "lucide-react";

function MessagesContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialCid = searchParams.get("cid");

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(initialCid);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch conversation list
  const loadConversations = async () => {
    try {
      const res = await fetch("/api/messages/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        if (!activeConvId && data.conversations.length > 0) {
          setActiveConvId(data.conversations[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Fetch active conversation messages
  const loadActiveMessages = async (cid: string) => {
    try {
      const res = await fetch(`/api/messages/${cid}`);
      if (res.ok) {
        const data = await res.json();
        setActiveConv(data.conversation);
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeConvId) {
      loadActiveMessages(activeConvId);
    }
  }, [activeConvId]);

  // Socket.IO real-time hooks
  useEffect(() => {
    if (!user) return;
    const socket = getSocket(user.id);

    if (activeConvId) {
      socket.emit("join_conversation", activeConvId);
    }

    const handleNewMessage = (newMsg: any) => {
      if (newMsg.conversationId === activeConvId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
      loadConversations();
    };

    const handleUserTyping = (data: { conversationId: string; username: string; isTyping: boolean }) => {
      if (data.conversationId === activeConvId && data.username !== user.username) {
        setTypingUsers((prev) => {
          if (data.isTyping) {
            return prev.includes(data.username) ? prev : [...prev, data.username];
          } else {
            return prev.filter((u) => u !== data.username);
          }
        });
      }
    };

    const handleReactionUpdated = (data: { messageId: string; reactions: any[] }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId ? { ...msg, reactions: data.reactions } : msg
        )
      );
    };

    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", handleUserTyping);
    socket.on("reaction_updated", handleReactionUpdated);

    return () => {
      if (activeConvId) {
        socket.emit("leave_conversation", activeConvId);
      }
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleUserTyping);
      socket.off("reaction_updated", handleReactionUpdated);
    };
  }, [activeConvId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!user || !activeConvId) return;

    const socket = getSocket(user.id);
    socket.emit("typing_start", { conversationId: activeConvId, username: user.displayName });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing_stop", { conversationId: activeConvId, username: user.displayName });
    }, 1500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || !activeConvId) return;

    const content = inputText.trim();
    setInputText("");

    const socket = getSocket(user.id);
    socket.emit("typing_stop", { conversationId: activeConvId, username: user.displayName });

    socket.emit("send_message", {
      conversationId: activeConvId,
      senderId: user.id,
      content,
    });
  };

  const handleReaction = (messageId: string, emoji: string) => {
    if (!user || !activeConvId) return;
    const socket = getSocket(user.id);
    socket.emit("toggle_reaction", {
      messageId,
      userId: user.id,
      emoji,
      conversationId: activeConvId,
    });
  };

  const filteredConversations = conversations.filter((c) =>
    (c.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-[calc(100vh-70px)] text-white p-3 sm:p-6 flex flex-col justify-center">
      <div className="max-w-7xl mx-auto w-full h-[82vh] bg-[#0c163b]/90 backdrop-blur-xl border border-[#1b2a7a] rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex overflow-hidden">
        {/* Left Sidebar: 1-on-1 Chats */}
        <div className="w-full sm:w-80 md:w-96 bg-[#070d24]/95 border-r border-[#1b2a7a] flex flex-col">
          {/* Top Bar */}
          <div className="p-4 bg-[#142055]/80 border-b border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#F36E0F]" /> Direct Chats
              </h2>
              <span className="text-[11px] bg-[#1f3078] text-[#FFD700] px-2.5 py-0.5 rounded-full font-bold">
                1-on-1 Only
              </span>
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search direct chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#142055] text-white placeholder:text-slate-400 text-xs rounded-full pl-9 pr-3 py-2 outline-none focus:ring-1 focus:ring-[#F36E0F]"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => {
                const isSelected = conv.id === activeConvId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`p-3.5 flex items-center gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#142055] border-l-4 border-[#F36E0F]"
                        : conv.isAdminChat
                        ? "bg-[#142055]/30 hover:bg-[#142055]/60"
                        : "hover:bg-[#142055]/40"
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={conv.avatar || "/avatars/avatar-1.svg"}
                        alt={conv.title}
                        className={`w-11 h-11 rounded-full object-cover border ${
                          conv.isAdminChat ? "border-[#FFD700] ring-2 ring-[#EA0000]/50" : "border-[#1b2a7a]"
                        }`}
                      />
                      {conv.isAdminChat ? (
                        <span className="absolute -bottom-1 -right-1 bg-[#EA0000] text-[8px] font-black px-1 rounded-full text-white">
                          STAFF
                        </span>
                      ) : (
                        conv.otherUser?.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#070d24] rounded-full" />
                        )
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 truncate">
                          <h4 className="text-sm font-bold text-white truncate">
                            {conv.title}
                          </h4>
                          {conv.isAdminChat && (
                            <Shield className="w-3.5 h-3.5 text-[#FFD700] flex-shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 flex-shrink-0">
                          {conv.lastMessage
                            ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {conv.lastMessage
                          ? `${conv.lastMessage.content}`
                          : "Start conversation"}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No direct chats found.
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Active 1-on-1 Chat */}
        {activeConvId ? (
          <div className="flex-1 flex flex-col bg-[#0c163b]/70">
            {/* Chat Room Header */}
            <div className="px-6 py-3.5 bg-[#142055] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={
                    activeConv?.members?.find((m: any) => m.userId !== user?.id)?.user?.avatar ||
                    "/avatars/avatar-1.svg"
                  }
                  alt="Avatar"
                  className="w-10 h-10 rounded-full border border-[#F36E0F] object-cover"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white leading-tight">
                      {activeConv?.members?.find((m: any) => m.userId !== user?.id)?.user
                        ?.displayName || "Direct Chat"}
                    </h3>
                    {activeConv?.members?.some((m: any) => m.user?.role === "ADMIN") && (
                      <span className="bg-gradient-to-r from-[#EA0000] to-[#F36E0F] text-black text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                        Admin Desk
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Encrypted 1-on-1 Channel
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs bg-[#1f3078] text-[#FFD700] px-3 py-1 rounded-full font-bold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> Direct Staff Chat
                </span>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col gap-3">
              {messages.map((msg) => {
                const isMe = msg.senderId === user?.id;
                const isStaff = msg.sender?.role === "ADMIN" || msg.sender?.email === "admin@kali-gaming.com";

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col group ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
                      {!isMe && (
                        <span className={`font-bold ${isStaff ? "text-[#FFD700] flex items-center gap-1" : "text-white"}`}>
                          {msg.sender.displayName}
                          {isStaff && <Shield className="w-3 h-3 text-[#FFD700]" />}
                        </span>
                      )}
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="relative group flex items-center gap-2">
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed max-w-sm sm:max-w-md md:max-w-lg break-words shadow-lg ${
                          isMe
                            ? "bg-[#1f3078] text-white rounded-tr-none border border-white/10"
                            : isStaff
                            ? "bg-[#142055] text-white rounded-tl-none border border-[#FFD700]/30 shadow-[0_0_15px_rgba(255,215,0,0.1)]"
                            : "bg-[#142055] text-white rounded-tl-none border border-white/5"
                        }`}
                      >
                        {msg.content}

                        {/* Reactions row */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5 pt-1 border-t border-white/10">
                            {msg.reactions.map((r: any) => (
                              <span
                                key={r.id}
                                className="bg-[#070719]/80 text-xs px-1.5 py-0.5 rounded-full"
                              >
                                {r.emoji}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quick reaction popover on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-[#070719] border border-white/10 rounded-full px-2 py-1 shadow-lg">
                        {["❤️", "🔥", "🏆", "👍"].map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(msg.id, emoji)}
                            className="hover:scale-125 transition-transform text-xs"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="text-xs text-[#F36E0F] italic flex items-center gap-1.5 bg-[#142055]/60 px-3 py-1.5 rounded-full w-fit">
                  <span className="w-2 h-2 rounded-full bg-[#F36E0F] animate-bounce"></span>
                  {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="px-4 py-3 bg-[#142055] border-t border-white/10 flex items-center gap-3"
            >
              <button
                type="button"
                className="text-white hover:text-[#F36E0F] transition-colors p-1"
                title="Add Reaction / Emoji"
                onClick={() => setInputText((prev) => prev + " 🔥")}
              >
                <Smile className="w-5 h-5" />
              </button>

              <input
                type="text"
                placeholder="Type your message to Admin / Player..."
                value={inputText}
                onChange={handleInputChange}
                className="flex-1 bg-[#1f3078] text-white placeholder:text-gray-300 text-sm rounded-full px-5 py-2.5 outline-none focus:ring-2 focus:ring-[#F36E0F]"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-10 h-10 rounded-full bg-[#F36E0F] hover:bg-orange-500 disabled:opacity-40 text-black flex items-center justify-center transition-all hover:scale-105 shadow-md flex-shrink-0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 14 14"
                  className="translate-x-0.5"
                >
                  <path
                    fill="none"
                    stroke="#000"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="m5.812 11l2.178 2.168a1.1 1.1 0 0 0 1.05.3a1.12 1.12 0 0 0 .809-.74l3.576-10.72A1.118 1.118 0 0 0 11.987.57L1.267 4.147a1.12 1.12 0 0 0-.74.859a1.1 1.1 0 0 0 .3 1l2.737 2.737l-.09 3.466zM13.106.79L3.564 8.742"
                  />
                </svg>
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <MessageSquare className="w-12 h-12 text-[#F36E0F] opacity-50 mb-3" />
            <h3 className="text-lg font-bold text-white">Select a Direct Conversation</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Select your direct chat channel with Kali Admin or one of your friends from the sidebar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070719] text-white p-12 text-center">Loading Direct Messages...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
