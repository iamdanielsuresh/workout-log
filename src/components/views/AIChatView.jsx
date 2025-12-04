import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bookmark, BookmarkCheck, MessageCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { ViewHeader } from '../layout/Navigation';
import { WorkoutPlanWidget, StatsWidget } from './ChatWidgets';

export function AIChatView({
  onBack,
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
  onStartPlan,
  isOnline = true
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
            {textBefore && <p className="whitespace-pre-wrap">{textBefore}</p>}
            
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
            
            {textAfter && <p className="whitespace-pre-wrap">{textAfter}</p>}
          </div>
        );
      } catch (e) {
        console.error("Failed to parse widget", e);
        return <p className="whitespace-pre-wrap">{content}</p>;
      }
    }

    return <p className="whitespace-pre-wrap">{content}</p>;
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = () => {
    if (!inputValue.trim() || (!isOnline && !inputValue.trim())) return;
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
    <div className="flex flex-col h-[100dvh] fixed inset-0 z-[200] bg-gray-950">
      {/* Header */}
      <div className="flex-none">
        <ViewHeader 
          title={persona.name} 
          subtitle={persona.role}
          onBack={onBack}
          rightAction={
            <div className={`p-2 rounded-full ${theme.bgLow}`}>
              <PersonaIcon className={`w-5 h-5 ${theme.text}`} />
            </div>
          }
        />
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Welcome Message */}
        {messages.length === 0 && (
          <div className="text-center space-y-4 mt-8">
            <div className={`w-16 h-16 mx-auto rounded-full ${theme.bgLow} flex items-center justify-center`}>
              <PersonaIcon className={`w-8 h-8 ${theme.text}`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-100">
                Chat with {persona.name}
              </h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto mt-1">
                {persona.role} • {persona.style}
              </p>
            </div>

            {/* Suggested Prompts */}
            {suggestedPrompts && suggestedPrompts.length > 0 && (
              <div className="grid gap-2 max-w-sm mx-auto mt-6">
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => onSendMessage(prompt)}
                    disabled={!isOnline}
                    className="text-left p-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 hover:bg-gray-800 transition-all text-sm text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Message List */}
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const isError = msg.error;
          
          return (
            <div
              key={msg.id || idx}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[85%] rounded-2xl p-4
                  ${isUser 
                    ? 'bg-emerald-600 text-white rounded-tr-none' 
                    : isError
                      ? 'bg-red-500/10 border border-red-500/50 text-red-200 rounded-tl-none'
                      : 'bg-gray-900 border border-gray-800 text-gray-200 rounded-tl-none'
                  }
                `}
              >
                <div className="text-sm leading-relaxed">
                  {renderMessageContent(msg.content)}
                </div>
                
                {/* Message Actions (Save Note) */}
                {!isUser && !isError && onSaveNote && (
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => onSaveNote(msg.content, msg.id)}
                      disabled={savedMessageIds.has(msg.id)}
                      className={`
                        text-[10px] flex items-center gap-1 transition-colors
                        ${savedMessageIds.has(msg.id) 
                          ? 'text-emerald-400' 
                          : 'text-gray-500 hover:text-gray-300'
                        }
                      `}
                    >
                      {savedMessageIds.has(msg.id) ? (
                        <>
                          <BookmarkCheck className="w-3 h-3" /> Saved
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3 h-3" /> Save Note
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className={`bg-gray-900 border border-gray-800 rounded-2xl rounded-tl-none p-4 flex items-center gap-2`}>
              <div className="flex gap-1">
                <div className={`w-2 h-2 rounded-full ${theme.bg} animate-bounce`} style={{ animationDelay: '0ms' }} />
                <div className={`w-2 h-2 rounded-full ${theme.bg} animate-bounce`} style={{ animationDelay: '150ms' }} />
                <div className={`w-2 h-2 rounded-full ${theme.bg} animate-bounce`} style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="flex-none p-4 bg-gray-950 border-t border-gray-800 safe-area-bottom">
        {!isOnline && (
          <div className="mb-2 flex items-center justify-center gap-2 text-xs text-red-400 bg-red-500/10 py-1 px-2 rounded-full w-fit mx-auto">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Offline Mode - Chat Unavailable
          </div>
        )}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isOnline ? "Ask anything..." : "Waiting for connection..."}
              disabled={loading || !isOnline}
              rows={1}
              className="w-full bg-gray-900 text-gray-100 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none min-h-[44px] max-h-32"
              style={{ height: 'auto', minHeight: '44px' }}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || loading || !isOnline}
            className={`w-11 h-11 rounded-xl flex items-center justify-center p-0 shrink-0 ${theme.bg} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Send className="w-5 h-5 text-gray-950" />
          </Button>
        </div>
      </div>
    </div>
  );
}
