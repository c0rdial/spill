import { createRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { protectedLayout } from "./_protected";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { useUser } from "../hooks/useUser";
import { useMatches } from "../hooks/useMatches";
import { useMessages } from "../hooks/useMessages";
import { ChatMessage } from "../components/ChatMessage";
import { ChatInput } from "../components/ChatInput";

export const chatRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/matches/$matchId",
  component: ChatPage,
});

function ChatPage() {
  const { matchId } = useParams({ from: "/protected/matches/$matchId" });
  const { session } = useAuth();
  const { data: user } = useUser(session?.user?.id);
  const { data: matches } = useMatches(user?.id);
  const { data: messages, isLoading } = useMessages(matchId);
  const bottomRef = useRef<HTMLDivElement>(null);

  const currentMatch = matches?.find((m) => m.id === matchId);
  const otherUser = currentMatch?.other_user;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!user) return;
    await supabase.from("messages").insert({
      match_id: matchId,
      sender_id: user.id,
      text,
    });
  }

  return (
    <div className="min-h-screen bg-spill-bg flex flex-col">
      <div className="px-6 pt-12 pb-4 border-b border-spill-border flex items-center gap-4">
        <Link to="/matches" className="text-spill-muted text-sm">
          &larr; Back
        </Link>
        {otherUser && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-spill-border overflow-hidden flex items-center justify-center flex-shrink-0">
              {otherUser.photo_url ? (
                <img
                  src={otherUser.photo_url}
                  alt={otherUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-spill-text font-semibold text-sm">
                  {otherUser.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <h1 className="text-lg font-bold text-spill-text">
              {otherUser.name}
            </h1>
          </div>
        )}
        {!otherUser && (
          <h1 className="text-lg font-bold text-spill-text">Chat</h1>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 pb-20">
        {isLoading ? (
          <p className="text-spill-muted text-center">Loading...</p>
        ) : messages && messages.length > 0 ? (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isOwn={msg.sender_id === user?.id}
            />
          ))
        ) : (
          <p className="text-spill-muted text-center py-10">
            Say something real.
          </p>
        )}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={sendMessage} disabled={!user} />
    </div>
  );
}
