import React from "react";
import { Message } from "../types";

interface Props {
  msg: Message;
}

export default function MessageBubble({ msg }: Props) {
  const isUser = msg.role === "user";
  return (
    <div className={`bubble-row ${isUser ? "right" : "left"}`}>
      {!isUser && <div className="avatar" aria-hidden><span>🤖</span></div>}
      <div className={`bubble ${isUser ? "user" : "assistant"}`}>
        <div className="bubble-content">{msg.content}</div>
        <div className="bubble-meta">
          {new Date(msg.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}
