import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Bot, User, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useChatStore } from '@/store/chat-store';
import { useDiaryStore } from '@/store/diary-store';
import { aiService } from '@/services/ai-service';

export default function ChatPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [streamingResponse, setStreamingResponse] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    messages, 
    isStreaming, 
    isLoading,
    addMessage, 
    updateLastMessage,
    setStreaming, 
    setLoading,
    clearChat 
  } = useChatStore();
  
  const { entries } = useDiaryStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingResponse]);

  const getRecentDiaryContext = () => {
    const recentEntries = entries
      .slice(0, 5)
      .map(entry => `Date: ${entry.date}\nTitle: ${entry.title}\nContent: ${entry.content.slice(0, 200)}...`)
      .join('\n\n');
    
    return recentEntries ? `Recent diary entries:\n${recentEntries}` : undefined;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || isStreaming) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    addMessage({ role: 'user', content: userMessage });
    
    try {
      setLoading(true);
      setStreaming(true);
      
      // Add empty assistant message to update during streaming
      addMessage({ role: 'assistant', content: '' });
      
      const diaryContext = getRecentDiaryContext();
      const chatMessages = [...messages, { role: 'user' as const, content: userMessage, timestamp: new Date() }];
      
      let fullResponse = '';
      setStreamingResponse('');
      
      // Stream the response
      for await (const chunk of aiService.streamChatResponse(chatMessages, diaryContext)) {
        fullResponse += chunk;
        setStreamingResponse(fullResponse);
        updateLastMessage(fullResponse);
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Chat Error',
        description: 'Failed to get response from Luna. Please try again.',
        variant: 'destructive',
      });
      
      // Update last message with error
      updateLastMessage('I apologize, but I\'m having trouble responding right now. Please try again.');
    } finally {
      setLoading(false);
      setStreaming(false);
      setStreamingResponse('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(timestamp);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-orange-50">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-sm border-b border-rose-200/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/entries')}
                className="text-rose-700 hover:text-rose-900 hover:bg-rose-100/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Diary
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-rose-400 to-pink-500 rounded-lg">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-rose-900">Chat with Luna</h1>
                  <p className="text-sm text-rose-600">Your AI companion for emotional insights</p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearChat}
              className="text-rose-700 border-rose-200 hover:bg-rose-50"
            >
              Clear Chat
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-rose-900 mb-2">Welcome to Luna!</h2>
                <p className="text-rose-600 mb-4">
                  I'm here to help you understand your emotions and reflect on your diary entries.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  <Button
                    variant="outline"
                    className="justify-start text-left p-4 h-auto border-rose-200 hover:bg-rose-50"
                    onClick={() => setInput("How am I feeling based on my recent entries?")}
                  >
                    <div>
                      <div className="font-medium text-rose-900">Mood Analysis</div>
                      <div className="text-sm text-rose-600">Analyze my emotional patterns</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start text-left p-4 h-auto border-rose-200 hover:bg-rose-50"
                    onClick={() => setInput("What themes do you notice in my diary?")}
                  >
                    <div>
                      <div className="font-medium text-rose-900">Pattern Recognition</div>
                      <div className="text-sm text-rose-600">Discover recurring themes</div>
                    </div>
                  </Button>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    message.role === 'user'
                      ? 'bg-rose-500 text-white'
                      : 'bg-gradient-to-br from-rose-400 to-pink-500 text-white'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  <Card className={`max-w-[80%] p-4 ${
                    message.role === 'user'
                      ? 'bg-rose-500 text-white border-rose-500'
                      : 'bg-white border-rose-200'
                  }`}>
                    <div className="space-y-2">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                        {index === messages.length - 1 && isStreaming && (
                          <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
                        )}
                      </p>
                      <div className={`text-xs opacity-70 ${
                        message.role === 'user' ? 'text-rose-100' : 'text-rose-500'
                      }`}>
                        {formatTimestamp(message.timestamp)}
                      </div>
                    </div>
                  </Card>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="mt-6">
          <div className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Luna about your emotions, patterns, or anything on your mind..."
              className="flex-1 border-rose-200 focus:border-rose-400 focus:ring-rose-400"
              disabled={isLoading || isStreaming}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading || isStreaming}
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {entries.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-rose-600">
              <Sparkles className="w-3 h-3" />
              Luna can access your recent diary entries for personalized insights
            </div>
          )}
        </div>
      </div>
    </div>
  );
}