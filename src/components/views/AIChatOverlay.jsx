import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bookmark, BookmarkCheck, MessageCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { WorkoutPlanWidget, StatsWidget } from './ChatWidgets';

export function AIChatOverlay({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  loading,
  persona,
  theme,
  suggestedPrompts,
  onSaveNote,
  savedMessageIds,
  PersonaIcon,
  onSavePlan,
  onStartPlan
}) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  // Helper to parse message content for widgets
  const renderMessageContent = (content) => {
    // Check if content contains a widget JSON block
    // Format: ...text... ```json {"type": "widget", ...} ``` ...text...
    const widgetRegex = /```json\s*({[\s\S]*?"type":\s*"(?:workout-plan|stats)"[\s\S]*?})\s*```/;
    const match = content.match(widgetRegex);

    if (match) {
      try {
        const widgetData = JSON.parse(match[1]);
        const textBefore = content.substring(0, match.index).trim();
        const textAfter = content.substring(match.index + match[0].length).trim();

        return (
          <div className="space-y-3">
            {textBefore && <p>{textBefore}</p>}
            
            {widgetData.type === 'workout-plan' && (
              <WorkoutPlanWidget 
                data={widgetData.data} 
                onSave={(plan) => {
                  if (onSavePlan) onSavePlan(plan);
                }}
                onStart={(plan) => {
                  if (onStartPlan) onStartPlan(plan);
                }}
              />
            )}
            
            {widgetData.type === 'stats' && (
              <StatsWidget data={widgetData.data} />
            )}
            
            {textAfter && <p>{textAfter}</p>}
          </div>
        );
      } catch (e) {
        console.error("Failed to parse widget", e);
        return content; // Fallback to raw text
      }
    }

    return content;
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950 animate-in slide-in-from-bottom-full duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-950/90 backdrop-blur-md safe-area-top">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${theme.bgLow}`}>
            <PersonaIcon className={`w-6 h-6 ${theme.text}`} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{persona.name}</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-gray-400">Online</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-950/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
            <MessageCircle className={`w-16 h-16 ${theme.text} mb-4`} />
            <p className="text-gray-300 font-medium text-lg">Ask me anything!</p>
            <p className="text-gray-500 text-sm mt-2 max-w-xs">
              I can analyze your workouts, give tips, or just chat about fitness.
            </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isSaved = msg.id && savedMessageIds.has(msg.id);
            const isUser = msg.role === 'user';
            
            return (
              <div
                key={msg.id || i}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 group`}
              >
                <div className={`max-w-[85%] relative ${isUser ? '' : 'pr-8'}`}>
                  <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? `${theme.bg} text-gray-950 rounded-br-sm`
                      : 'bg-gray-800 text-gray-200 rounded-bl-sm border border-gray-700'
                  }`}>
                    {isUser ? msg.content : renderMessageContent(msg.content)}
                  </div>
                  
                  {/* Save Button for AI messages */}
                  {!isUser && onSaveNote && (
                    <button
                      onClick={() => onSaveNote(msg.content, msg.id, 'chat')}
                      disabled={isSaved}
                      className={`absolute -right-8 top-2 p-1.5 rounded-lg transition-all ${
                        isSaved 
                          ? `${theme.text} ${theme.bgLow}` 
                          : `text-gray-500 ${theme.hoverText} hover:bg-gray-700 opacity-0 group-hover:opacity-100`
                      }`}
                      title={isSaved ? 'Saved!' : 'Save as note'}
                    >
                      {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  )}
                  
                  {/* Timestamp (optional, maybe just 'Just now' for recent) */}
                  <div className={`text-[10px] text-gray-600 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
                    {isUser ? 'You' : persona.name}
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 p-4 rounded-2xl rounded-bl-sm border border-gray-700">
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <div 
                    key={i} 
                    className={`w-2 h-2 rounded-full animate-bounce ${theme.bg}`}
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-gray-900 border-t border-gray-800 safe-area-bottom">
        {/* Contextual Chips */}
        <div className="px-4 pt-3 pb-2 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2">
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => onSendMessage(prompt)}
                disabled={loading}
                className={`flex-shrink-0 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full text-xs text-gray-300 transition-colors whitespace-nowrap active:scale-95`}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 flex gap-2 items-end">
          <div className="flex-1 bg-gray-800 rounded-2xl border border-gray-700 focus-within:border-gray-600 transition-colors">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${persona.name}...`}
              className="w-full bg-transparent border-none focus:ring-0 text-gray-100 placeholder-gray-500 px-4 py-3 max-h-32 resize-none text-sm"
              rows={1}
              disabled={loading}
            />
          </div>
          <Button 
            size="icon" 
            onClick={handleSend} 
            disabled={!inputValue.trim() || loading}
            className={`rounded-full w-11 h-11 flex-shrink-0 ${theme.bg} hover:opacity-90 shadow-lg shadow-emerald-900/20`}
          >
            <Send className="w-5 h-5 text-gray-950" />
          </Button>
        </div>
      </div>
    </div>
  );
}
