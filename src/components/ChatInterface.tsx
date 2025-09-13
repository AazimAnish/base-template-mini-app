"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/input";
import { Card, CardContent } from "~/components/ui/Card";
import { Send, Users, Clock } from "lucide-react";

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  isImposter?: boolean;
  isYou?: boolean;
}

interface ChatInterfaceProps {
  players: Array<{
    address: string;
    index: number;
    isAlive: boolean;
    role?: "CREW" | "IMPOSTER";
  }>;
  userRole: "CREW" | "IMPOSTER";
  onSendMessage?: (message: string) => void;
}

export function ChatInterface({ players, userRole, onSendMessage }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Demo messages to simulate a real game
  const demoMessages: Message[] = [
    {
      id: "1",
      sender: "0x9999...1111",
      content: "Hey everyone! Ready to find the imposter?",
      timestamp: new Date(Date.now() - 300000),
      isYou: false
    },
    {
      id: "2", 
      sender: "0xabcd...ef01",
      content: "I'm suspicious of the new player...",
      timestamp: new Date(Date.now() - 240000),
      isYou: false
    },
    {
      id: "3",
      sender: "0x1234...5678",
      content: "I'm just here to help! What tasks should we do?",
      timestamp: new Date(Date.now() - 180000),
      isYou: true,
      isImposter: true
    },
    {
      id: "4",
      sender: "0x9999...1111", 
      content: "Let's check the reactor first",
      timestamp: new Date(Date.now() - 120000),
      isYou: false
    },
    {
      id: "5",
      sender: "0xabcd...ef01",
      content: "I saw someone near the vent...",
      timestamp: new Date(Date.now() - 60000),
      isYou: false
    }
  ];

  useEffect(() => {
    // Initialize with demo messages
    setMessages(demoMessages);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        sender: "0x1234...5678",
        content: newMessage.trim(),
        timestamp: new Date(),
        isYou: true,
        isImposter: userRole === "IMPOSTER"
      };
      
      setMessages(prev => [...prev, message]);
      setNewMessage("");
      
      // Simulate other players responding
      setTimeout(() => {
        const responses = [
          "That's interesting...",
          "I don't trust anyone right now",
          "We need to stick together",
          "Something's not right here",
          "I saw that too!",
          "Let's vote someone out"
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const randomPlayer = players.find(p => p.address !== "0x1234...5678 (You)");
        
        if (randomPlayer) {
          const responseMessage: Message = {
            id: (Date.now() + 1).toString(),
            sender: randomPlayer.address,
            content: randomResponse,
            timestamp: new Date(),
            isYou: false
          };
          
          setMessages(prev => [...prev, responseMessage]);
        }
      }, 2000);
      
      if (onSendMessage) {
        onSendMessage(newMessage.trim());
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getPlayerName = (address: string) => {
    if (address === "0x1234...5678 (You)") return "You";
    if (address === "0x9999...1111 (Host)") return "Host";
    if (address === "0xabcd...ef01") return "Player 2";
    return address.slice(0, 6) + "..." + address.slice(-4);
  };

  const alivePlayers = players.filter(p => p.isAlive);

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-medium text-white">Game Chat</span>
          <span className="text-xs text-gray-400">({alivePlayers.length} online)</span>
        </div>
        <div className="flex items-center space-x-1 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          <span>Live</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-96">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isYou ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.isYou
                  ? message.isImposter
                    ? "bg-red-600 text-white"
                    : "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-100"
              }`}
            >
              {!message.isYou && (
                <div className="text-xs font-medium text-gray-300 mb-1">
                  {getPlayerName(message.sender)}
                </div>
              )}
              <div className="text-sm">{message.content}</div>
              <div className="text-xs opacity-70 mt-1">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-gray-100 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-1">
                <span className="text-xs">Someone is typing</span>
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            disabled={false}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Role-specific tips */}
        <div className="mt-2 text-xs text-gray-500">
          {userRole === "IMPOSTER" ? (
            <span className="text-red-400">🎭 Imposter tip: Blend in and don't reveal yourself!</span>
          ) : (
            <span className="text-blue-400">👨‍🚀 Crew tip: Work together to find the imposter!</span>
          )}
        </div>
      </div>
    </div>
  );
}
