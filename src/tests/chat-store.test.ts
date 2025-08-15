import { describe, it, expect, beforeEach } from "vitest";
import { useChatStore } from "../entities/chat/store";

describe("chat store", () => {
  beforeEach(() => {
    const { getState, setState } = useChatStore;
    const s = getState();

    // WICHTIG: State MERGEN (kein replace=true), damit Actions erhalten bleiben
    setState({
      chats: s.chats.slice(0, 1),
      messages: {},
      currentChatId: s.chats[0]?.id ?? null,
    });

    // jsdom hat localStorage – sauber machen für deterministische Tests
    try {
      localStorage.clear();
    } catch {
      // noop in non-jsdom
    }
  });

  it("creates chat and adds messages with auto-title", () => {
    const id = useChatStore.getState().createChat();
    useChatStore.getState().setCurrentChat(id);

    useChatStore.getState().addMessage(id, {
      role: "user",
      content: "Hallo Welt – erster Prompt",
    });
    useChatStore.getState().addMessage(id, {
      role: "assistant",
      content: "Hi!",
    });

    const msgs = useChatStore.getState().listMessages(id);
    expect(msgs.length).toBe(2);
    expect(msgs[0]!.role).toBe("user");

    const title = useChatStore.getState().chats.find((c) => c.id === id)?.title ?? "";
    expect(title.startsWith("Hallo Welt")).toBe(true);
  });
});
