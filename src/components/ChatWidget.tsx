import { useState } from "react";
import { MessageCircle, X, Send, Bot, User, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [onlineUsers] = useState(Math.floor(Math.random() * 1000) + 47000);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      content: "🚀 Welcome! I'm your advanced AI assistant with real-time capabilities. I can generate code, automate tasks, analyze data, and help you build anything. What revolutionary project shall we create today?",
      timestamp: new Date()
    }
  ]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      type: "user",
      content: message,
      timestamp: new Date()
    };

    setMessages([...messages, newMessage]);
    setMessage("");

    // Simulate realistic bot response with multiple options
    setTimeout(() => {
      const responses = [
        "🔥 Perfect! I can build that for you right now. Which tech stack would you prefer - React, Python, Node.js, or something else? I have access to real-time APIs and can generate production-ready code.",
        "⚡ Excellent choice! Let me analyze your requirements and create a custom solution. I can automate this entire workflow and save you hours of manual work. Want to see the magic?",
        "🚀 I love ambitious projects! I can help you build that with cutting-edge AI. Should I generate the frontend, backend, database schema, or all three? I work 10x faster than traditional development.",
        "💡 Brilliant idea! I have real-time access to the latest frameworks and can create scalable solutions. Let me show you three different approaches and you can choose your favorite.",
        "🎯 That's exactly what I excel at! I can generate clean, documented code that follows best practices. Plus, I'll include error handling and optimization. Ready to revolutionize your workflow?",
      ];

      const botResponse = {
        id: messages.length + 2,
        type: "bot",
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="btn-glow rounded-full w-16 h-16 shadow-glow"
        >
          <MessageCircle className="h-7 w-7" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full pulse-dot"></div>
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed z-50 transition-all duration-300 ${
      isMinimized
        ? 'bottom-6 right-6 w-80'
        : 'bottom-6 right-6 w-96 h-[600px] sm:w-[450px] sm:h-[700px]'
    }`}>
      <Card className="h-full bg-card/95 backdrop-blur-lg border-border shadow-glow">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Bot className="h-6 w-6 text-primary" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full pulse-dot"></div>
            </div>
            <div>
              <h3 className="font-semibold">AI Assistant <span className="text-success">●</span></h3>
              <p className="text-xs text-muted-foreground counter-glow">{onlineUsers.toLocaleString()} users online • Real-time responses</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 p-0"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar h-[calc(100%-140px)]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-3 ${
                    msg.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    msg.type === 'user' ? 'bg-primary' : 'bg-secondary'
                  }`}>
                    {msg.type === 'user' ? (
                      <User className="h-4 w-4 text-primary-foreground" />
                    ) : (
                      <Bot className="h-4 w-4 text-secondary-foreground" />
                    )}
                  </div>
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    msg.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex space-x-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button onClick={sendMessage} size="sm" className="btn-glow">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default ChatWidget;
