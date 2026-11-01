"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Gamepad2 } from "lucide-react";

function SupportContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const gameParam = searchParams.get("game");

  const [messages, setMessages] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickGames = ["Milkyway", "Juwa", "Firekirin", "Orion Stars", "Gamevault"];

  const loadSupportData = async () => {
    try {
      const res = await fetch("/api/support");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        if (data.conversation) {
          setConversationId(data.conversation.id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupportData();
  }, [user]);

  useEffect(() => {
    if (gameParam) {
      setInputText(gameParam);
    }
  }, [gameParam]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = (customText || inputText).trim();
    if (!textToSend || isSending) return;

    // Optimistically show message
    const tempMsg = {
      id: "temp-" + Date.now(),
      senderId: user?.id || "guest",
      content: textToSend,
      createdAt: new Date().toISOString(),
      sender: {
        id: user?.id || "guest",
        displayName: user?.displayName || "Player",
        role: "USER",
      },
    };

    setMessages((prev) => [...prev, tempMsg]);
    setInputText("");
    setIsSending(true);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: textToSend,
          conversationId,
        }),
      });

      if (res.ok) {
        setTimeout(() => {
          loadSupportData();
        }, 600);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D2B] to-[#1A1A40] text-white flex flex-col justify-between">
      <section className="w-full flex flex-col items-center justify-center py-12 sm:py-20 px-4">
        {/* Quick game selector chips */}
        <div className="w-full max-w-xl mb-4 flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold text-[#F36E0F] flex items-center gap-1.5 uppercase tracking-wider">
            <Gamepad2 className="w-4 h-4" /> Quick Inquire:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickGames.map((g) => (
              <button
                key={g}
                onClick={() => handleSend(undefined, g)}
                className="text-xs bg-[#1b2a7a] hover:bg-[#F36E0F] hover:text-black text-slate-200 font-semibold px-2.5 py-1 rounded-full transition-colors"
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* The Exact Support Box Component */}
        <div className="w-full max-w-xl bg-[#0e1b4d] rounded-lg shadow-2xl h-auto border border-[#1b2a7a] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#1b2a7a] rounded-t-lg border-b border-white/10">
            <div className="flex items-center gap-3">
              <img
                src="/logo.svg"
                alt="Kali Gaming avatar"
                className="w-8 h-8 rounded-full border border-[#F36E0F]"
              />
              <div>
                <h2 className="text-white font-semibold text-sm leading-tight">Kali Gaming</h2>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Official Support Staff Online
                </span>
              </div>
            </div>

            <span className="text-[10px] bg-[#2a3c91] text-slate-300 font-bold px-2 py-0.5 rounded">
              24/7 HELPDESK
            </span>
          </div>

          {/* Conversation Bubble Stream matching kali-gaming.com exactly */}
          <div className="px-4 py-6 flex flex-col gap-4 text-white min-h-[340px] max-h-[440px] overflow-y-auto">
            {loading ? (
              <div className="text-center text-xs text-slate-400 py-16">
                Connecting to Kali Support...
              </div>
            ) : messages.length > 0 ? (
              messages.map((msg) => {
                const isSupportAgent =
                  msg.isAgent ||
                  msg.sender?.role === "ADMIN" ||
                  msg.sender?.email === "support@kali-gaming.com" ||
                  msg.senderId === "agent";

                return (
                  <div
                    key={msg.id}
                    className={`px-4 py-2 rounded-full text-sm max-w-[80%] shadow-md leading-relaxed ${
                      isSupportAgent
                        ? "self-start bg-[#2a3c91] text-white border border-white/5"
                        : "self-end bg-[#2a3c91] text-white font-medium"
                    }`}
                  >
                    {msg.content}
                  </div>
                );
              })
            ) : (
              <div className="text-center text-xs text-slate-400 py-16">
                Ask any question below to connect with Kali Gaming support.
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Input Bar matching original kali-gaming.com/support */}
          <form
            onSubmit={(e) => handleSend(e)}
            className="flex items-center gap-3 sm:gap-4 px-4 py-3 bg-[#1b2a7a] rounded-b-lg border-t border-white/10"
          >
            {/* Camera SVG Icon */}
            <button
              type="button"
              className="text-white hover:text-[#F36E0F] transition-colors focus:outline-none flex-shrink-0"
              title="Attach screenshot"
              onClick={() => alert("Screenshot upload is supported. Select your image file.")}
            >
              <svg
                stroke="currentColor"
                fill="currentColor"
                strokeWidth="0"
                viewBox="0 0 512 512"
                className="w-5 h-5 text-white hover:text-[#F36E0F]"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M512 144v288c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V144c0-26.5 21.5-48 48-48h88l12.3-32.9c7-18.7 24.9-31.1 44.9-31.1h125.5c20 0 37.9 12.4 44.9 31.1L376 96h88c26.5 0 48 21.5 48 48zM376 288c0-66.2-53.8-120-120-120s-120 53.8-120 120 53.8 120 120 120 120-53.8 120-120zm-32 0c0 48.5-39.5 88-88 88s-88-39.5-88-88 39.5-88 88-88 88 39.5 88 88z" />
              </svg>
            </button>

            {/* Microphone SVG Icon */}
            <button
              type="button"
              className="text-white hover:text-[#F36E0F] transition-colors focus:outline-none flex-shrink-0"
              title="Voice message"
            >
              <svg
                stroke="currentColor"
                fill="currentColor"
                strokeWidth="0"
                viewBox="0 0 352 512"
                className="w-4 h-4 text-white hover:text-[#F36E0F]"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M176 352c53.02 0 96-42.98 96-96V96c0-53.02-42.98-96-96-96S80 42.98 80 96v160c0 53.02 42.98 96 96 96zm160-160h-16c-8.84 0-16 7.16-16 16v48c0 74.8-64.49 134.82-140.79 127.38C96.71 376.89 48 317.11 48 250.3V208c0-8.84-7.16-16-16-16H16c-8.84 0-16 7.16-16 16v40.16c0 89.64 63.97 169.55 152 181.69V464H96c-8.84 0-16 7.16-16 16v16c0 8.84 7.16 16 16 16h160c8.84 0 16-7.16 16-16v-16c0-8.84-7.16-16-16-16h-56v-33.77C285.71 418.47 352 344.9 352 256v-48c0-8.84-7.16-16-16-16z" />
              </svg>
            </button>

            {/* Input Element */}
            <input
              type="text"
              placeholder="Type here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-[#2a3c91] px-4 py-2 rounded-full outline-none text-white placeholder:text-gray-300 text-sm focus:ring-1 focus:ring-[#F36E0F]"
            />

            {/* Send Button with SVG Paper Airplane */}
            <button
              type="submit"
              disabled={isSending || !inputText.trim()}
              className="cursor-pointer text-white hover:text-[#F36E0F] disabled:opacity-40 transition-colors p-1 flex-shrink-0"
              title="Send message"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 14 14"
              >
                <path
                  fill="none"
                  stroke="#fff"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.2"
                  d="m5.812 11l2.178 2.168a1.1 1.1 0 0 0 1.05.3a1.12 1.12 0 0 0 .809-.74l3.576-10.72A1.118 1.118 0 0 0 11.987.57L1.267 4.147a1.12 1.12 0 0 0-.74.859a1.1 1.1 0 0 0 .3 1l2.737 2.737l-.09 3.466zM13.106.79L3.564 8.742"
                />
              </svg>
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0D0D2B] text-white p-12 text-center">Loading Support Desk...</div>}>
      <SupportContent />
    </Suspense>
  );
}
