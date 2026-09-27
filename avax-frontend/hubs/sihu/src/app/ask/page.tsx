"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import SihuNav from '@/components/layout/SihuNav';
import { AssistantMessage } from '@/types/contentHub';
import { askSihuService } from '@/services/askSihuService';
import {
  Sparkles,
  Send,
  ThumbsUp,
  ThumbsDown,
  BookCheck,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  Bot,
  User as UserIcon,
} from 'lucide-react';

const SUGGESTED_PROMPTS = [
  'What is the legal riparian buffer zone distance?',
  'How do bio-digesters turn water hyacinth into cooking fuel?',
  'When is the Lake Victoria Basin Youth Climate Action Summit?',
  'What species are recommended for shoreline agroforestry?',
];

export default function AskSihuPage() {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const history = askSihuService.getHistory();
    if (history.length > 0) {
      setMessages(history);
    } else {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Welcome to **Ask SIHU** — your source-grounded intelligence assistant for the Sango Information Hub.\n\nI answer questions exclusively from verified articles, technical handbooks, event notices, and environmental baseline surveys published across the Lake Victoria Basin.\n\nEvery answer includes verifiable citations. If information has not yet been documented in our approved archives, I will state so clearly. How can I help you today?`,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (questionText?: string) => {
    const text = (questionText || input).trim();
    if (!text || loading) return;

    setInput('');
    const userMsg: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    askSihuService.saveMessageToHistory(userMsg);
    setLoading(true);

    try {
      const response = await askSihuService.askQuestion(text);
      setMessages((prev) => [...prev, response]);
    } catch {
      const errorMsg: AssistantMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'An error occurred while retrieving source documentation. Please try again.',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = (msgId: string, rating: 1 | -1) => {
    askSihuService.recordFeedback(msgId, rating);
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, feedbackRating: rating } : m))
    );
  };

  const handleClear = () => {
    askSihuService.clearHistory();
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Session cleared. Ask me any question about riparian conservation, events, or MSME initiatives.',
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans">
      <SihuNav />

      {/* Header */}
      <section className="py-8 px-4 lg:px-8 border-b border-slate-800/80 bg-slate-900/40">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Source-Grounded AI Assistant</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-heading font-black text-white tracking-tight">
              Ask SIHU
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Answers generated strictly from approved knowledge chunks with visible citations.
            </p>
          </div>

          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-white transition-colors"
            title="Reset conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        </div>
      </section>

      {/* Chat Messages */}
      <main className="container mx-auto max-w-4xl px-4 lg:px-8 py-6 flex-1 flex flex-col justify-between">
        <div className="space-y-6 mb-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-sky-400 flex items-center justify-center text-slate-950 font-bold shrink-0 mt-1 shadow-md">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-5 shadow-lg ${
                  msg.role === 'user'
                    ? 'bg-primary text-slate-950 font-medium'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-200'
                }`}
              >
                <div className="prose prose-invert max-w-none text-xs md:text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </div>

                {/* Citations Box for Assistant Responses */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      <BookCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Cited SIHU Knowledge Sources</span>
                    </div>

                    <div className="space-y-1.5">
                      {msg.citations.map((c) => {
                        const targetUrl =
                          c.contentType === 'event'
                            ? `/events/${c.slug}`
                            : c.contentType === 'guide'
                            ? `/guides/${c.slug}`
                            : `/portal/article/${c.slug}`;

                        return (
                          <Link
                            key={c.id}
                            href={targetUrl}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-xs text-sky-400 hover:text-sky-300 transition-colors group"
                          >
                            <span className="font-semibold line-clamp-1">{c.title}</span>
                            <ExternalLink className="w-3 h-3 shrink-0 ml-2 text-slate-500 group-hover:text-sky-400" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Assistant Feedback (Section 11 PRD) */}
                {msg.role === 'assistant' && msg.id !== 'welcome' && (
                  <div className="flex items-center justify-between mt-3 pt-2 text-[10px] text-slate-500 border-t border-slate-800/40">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Factual grounding verified</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">Was this helpful?</span>
                      <button
                        onClick={() => handleFeedback(msg.id, 1)}
                        className={`p-1 rounded hover:text-emerald-400 transition-colors ${
                          msg.feedbackRating === 1 ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                        title="Helpful"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleFeedback(msg.id, -1)}
                        className={`p-1 rounded hover:text-rose-400 transition-colors ${
                          msg.feedbackRating === -1 ? 'text-rose-400' : 'text-slate-500'
                        }`}
                        title="Not helpful"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 font-bold shrink-0 mt-1">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                <span>Searching approved SIHU knowledge chunks & validating citations...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Suggested Prompts */}
        {messages.length <= 2 && (
          <div className="mb-4">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Suggested Questions
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="p-3 text-left rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-all text-ellipsis"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about Lake Victoria conservation, events, or MSMEs..."
            disabled={loading}
            className="w-full bg-slate-900 border border-slate-700/80 focus:border-primary rounded-2xl pl-5 pr-14 py-3.5 text-sm text-slate-100 placeholder:text-slate-500 shadow-inner focus:outline-none transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2.5 w-10 h-10 rounded-xl bg-primary hover:bg-primary-dark text-slate-950 flex items-center justify-center font-bold shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </main>
    </div>
  );
}
