import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Header } from "@/components/Header";  // FIX: named import
import SettingsDrawer from "@/features/settings/SettingsDrawer";
import ChatPanel from "@/features/chat/ChatPanel";
import ChatSheet from "@/features/chats/ChatSheet";
import { useChatStore } from "@/stores/chat-store";

export default function App() {
  const currentChat = useChatStore((s) => s.currentChat);
  const setCurrentChat = useChatStore((s) => s.setCurrentChat);
  const chats = useChatStore((s) => s.chats);

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <ChatPanel />
      <ChatSheet
        chats={chats}
        currentChatId={currentChat?.id ?? null}
        setCurrentChat={setCurrentChat}
      />
      <SettingsDrawer />
    </div>
  );
}
