import { useEffect } from "react";
import { Header } from "@/components/Header";
import ChatPanel from "@/features/chat/ChatPanel";
import ChatSheet from "@/features/chats/ChatSheet";
import { useChatStore } from "@/stores/chat-store";

export default function App() {
  const chats = useChatStore((s) => s.chats);
  const currentChat = useChatStore((s) => s.currentChat);
  const createChat = useChatStore((s) => s.createChat);

  // Ensure at least one chat exists
  useEffect(() => {
    if (!chats.length) createChat();
  }, [chats.length, createChat]);

  return (
    <div className="flex min-h-0 h-[100dvh] flex-col bg-gradient-to-br from-background via-background to-secondary/20">
      <Header title="AI Chat" />
      <main className="relative flex-1 min-h-0 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent" />
        <ChatPanel />
      </main>
      {/* Chat sheet ist eigenständig über Store steuerbar */}
      <ChatSheet />
    </div>
  );
}
