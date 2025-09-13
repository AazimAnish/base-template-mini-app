"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGameStore } from "@/lib/stores/gameStore";
import { Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatComponentProps {
  disabled?: boolean;
}

export function ChatComponent({ disabled = false }: ChatComponentProps) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { messages, sendMessage, clearUnread } = useGameStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    clearUnread();
  }, [messages, clearUnread]);

  const handleSend = () => {
    if (!message.trim() || disabled) return;
    
    sendMessage(message.trim());
    setMessage("");
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.type === "system" 
                  ? "items-center" 
                  : msg.playerId === useGameStore.getState().myPlayerId
                  ? "items-end"
                  : "items-start"
              }`}
            >
              {msg.type === "system" ? (
                <div className="bg-gray-600 text-gray-200 px-3 py-1 rounded-full text-sm max-w-xs text-center">
                  {msg.content}
                </div>
              ) : msg.type === "elimination" ? (
                <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm max-w-xs text-center">
                  ⚰️ {msg.content}
                </div>
              ) : msg.type === "victory" ? (
                <div className="bg-yellow-600 text-white px-3 py-1 rounded-full text-sm max-w-xs text-center">
                  🏆 {msg.content}
                </div>
              ) : (
                <div className={`max-w-xs ${
                  msg.playerId === useGameStore.getState().myPlayerId 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-700 text-gray-100"
                } rounded-lg p-3`}>
                  <div className="text-xs text-gray-300 mb-1">
                    {msg.playerName}
                  </div>
                  <div className="text-sm break-words">
                    {msg.content}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        {disabled ? (
          <div className="bg-gray-700 p-3 rounded-lg text-center">
            <p className="text-gray-400 text-sm">
              You cannot participate in chat while eliminated
            </p>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 bg-gray-700 border-gray-600 text-white"
              maxLength={200}
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim()}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}