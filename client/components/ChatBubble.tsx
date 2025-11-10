import React, { useState } from "react";
import { MessageSquare } from "lucide-react";
import ChatModal from "@/components/ChatModal";

export default function ChatBubble({
  recipientId,
}: {
  recipientId?: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open chat"
        className="fixed right-6 bottom-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
      <ChatModal
        open={open}
        onClose={() => setOpen(false)}
        recipientId={recipientId}
      />
    </>
  );
}
