"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Head from "next/head";
import Image from "next/image";

// Mobile detection hook
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachments?: File[];
  speechText?: string;
  isStory?: boolean;
}

interface ProviderStatus {
  configured: Record<string, boolean>;
  models: Record<string, string>;
  activeProvider: string;
}

interface Tool {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
}

export default function AgentSihuPage() {
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mobile detection
  const isMobile = useIsMobile();

  // Haptic feedback for mobile
  const hapticFeedback = useCallback(() => {
    if (isMobile && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, [isMobile]);

  // Speech synthesis state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const [tools, setTools] = useState<Tool[]>([
    { id: "search", name: "Knowledge Search", icon: "search", enabled: true },
    { id: "stories", name: "Story Mode", icon: "auto_stories", enabled: true },
    { id: "mining", name: "Basin Mining", icon: "water", enabled: false },
    { id: "governance", name: "Governance", icon: "gavel", enabled: false },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadProviderStatus = async () => {
      try {
        const response = await fetch("/api/keys");
        if (!response.ok) return;
        const data = (await response.json()) as ProviderStatus;
        setProviderStatus(data);
      } catch (error) {
        console.error("Failed to load AI provider status:", error);
      }
    };

    loadProviderStatus();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const existing = window.localStorage.getItem("sihu_agent_session_id");
    if (existing) {
      setSessionId(existing);
      return;
    }

    const generated = `sihu-${crypto.randomUUID()}`;
    window.localStorage.setItem("sihu_agent_session_id", generated);
    setSessionId(generated);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mobile keyboard visibility detection
  useEffect(() => {
    if (!isMobile || typeof window === "undefined") return;

    const handleResize = () => {
      // Detect keyboard by comparing window height
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      const keyboardOpen = viewportHeight < windowHeight * 0.8;
      setKeyboardVisible(keyboardOpen);
    };

    window.visualViewport?.addEventListener("resize", handleResize);
    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.removeEventListener("resize", handleResize);
    };
  }, [isMobile]);

  // Speech Recognition Setup
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const startRecording = () => {
    if (recognitionRef.current) {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  // Speech Synthesis Setup and Functions
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    synthesisRef.current = window.speechSynthesis;

    const loadVoices = () => {
      const voices = synthesisRef.current?.getVoices() || [];
      setAvailableVoices(voices);

      // Prefer a good English voice
      const preferredVoice = voices.find(
        (v) =>
          v.name.includes("Google US English") ||
          v.name.includes("Samantha") ||
          v.name.includes("Karen") ||
          (v.lang === "en-US" && v.default)
      );

      if (preferredVoice) {
        setSelectedVoice(preferredVoice);
      } else if (voices.length > 0) {
        setSelectedVoice(voices[0]);
      }
    };

    loadVoices();

    // Voices load asynchronously
    if (synthesisRef.current) {
      synthesisRef.current.onvoiceschanged = loadVoices;
    }

    return () => {
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

  const speakMessage = (text: string, messageId: string) => {
    if (!synthesisRef.current || !text) return;

    // Stop any current speech
    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = 0.9; // Slightly slower for storytelling
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingMessageId(messageId);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    };

    synthesisRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
    }
    setIsSpeaking(false);
    setSpeakingMessageId(null);
  };

  const toggleAutoSpeak = () => {
    setAutoSpeak((prev) => !prev);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if (!inputValue.trim() && attachments.length === 0) return;
    const messageText = inputValue.trim();

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setAttachments([]);
    setIsTyping(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
          sessionId,
          history: messages.slice(-6).map((item) => ({
            role: item.role,
            content: item.content,
          })),
        }),
      });

      const data = (await response.json()) as {
        reply?: string;
        provider?: string;
        model?: string;
        mode?: string;
        error?: string;
        speechText?: string;
        isStory?: boolean;
      };

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          data.reply ||
          data.error ||
          "I could not generate a response right now.",
        timestamp: new Date(),
        speechText: data.speechText,
        isStory: data.isStory,
      };

      setMessages((prev) => [...prev, aiResponse]);

      // Auto-speak if enabled and this is a story
      if (autoSpeak && data.speechText && data.isStory) {
        setTimeout(() => {
          speakMessage(data.speechText!, aiResponse.id);
        }, 500);
      }
    } catch (error) {
      console.error("AI chat failed:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "I could not reach the AI service right now. Please try again in a moment.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleTool = (toolId: string) => {
    setTools((prev) =>
      prev.map((tool) =>
        tool.id === toolId ? { ...tool, enabled: !tool.enabled } : tool
      )
    );
  };

  return (
    <div className="min-h-screen bg-on-background text-surface-container-lowest font-body antialiased">
      <Head>
        <title>Agent SIHU | Environmental AI</title>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
      </Head>

      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-on-background/80 backdrop-blur-xl shadow-[0_4px_30px_rgba(11,28,48,0.05)] px-4 md:px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-full bg-slate-800/70 text-slate-200 hover:bg-slate-700 transition-colors"
            aria-label="Open agent navigation"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <Image
            src="/images/logo-main.png"
            alt="SIHU Logo"
            width={140}
            height={40}
            className="object-contain"
            priority
          />
          <h1 className="text-lg md:text-xl font-extrabold text-sky-300 font-headline tracking-tight">
            Agent SIHU
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-6 mr-6">
            <a
              className="text-slate-400 hover:text-sky-300 transition-colors font-headline text-sm font-bold uppercase tracking-wider"
              href="/"
            >
              Home
            </a>
            <a
              className="text-slate-400 hover:text-sky-300 transition-colors font-headline text-sm font-bold uppercase tracking-wider"
              href="/portal"
            >
              News
            </a>
            <a
              className="text-sky-400 transition-colors font-headline text-sm font-bold uppercase tracking-wider"
              href="/ai"
            >
              Agent SIHU
            </a>
            <a
              className="text-slate-400 hover:text-sky-300 transition-colors font-headline text-sm font-bold uppercase tracking-wider"
              href="/dapp"
            >
              DApp
            </a>
          </div>
          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-slate-400"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </>
              )}
            </svg>
          </button>
          <button className="hidden md:block material-symbols-outlined text-slate-400 hover:bg-sky-900/30 p-2 rounded-full transition-colors active:scale-95">
            settings_ethernet
          </button>
        </div>
      </header>

      {/* Agent SIHU Sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-slate-950/95 border-r border-white/10 z-50 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div>
            <p className="text-slate-300 uppercase tracking-[0.3em] text-xs">
              Agent SIHU
            </p>
            <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="px-6 py-5 space-y-3">
          {[
            { label: "Projects", icon: "folder_open" },
            { label: "Artifacts", icon: "inventory_2" },
            { label: "Chats", icon: "chat" },
            { label: "Customize", icon: "tune" },
            { label: "Imagine", icon: "auto_fix_high" },
            { label: "Voice", icon: "voice_chat" },
          ].map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 text-slate-200 hover:bg-slate-800/90 transition-colors"
              onClick={() => {
                setSidebarOpen(false);
                console.log(`${item.label} clicked`);
              }}
            >
              <span className="material-symbols-outlined text-sky-300">
                {item.icon}
              </span>
              <span className="text-sm font-semibold">{item.label}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Mobile Nav Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-4 top-20 glass-premium p-6 rounded-2xl shadow-2xl animate-fade-in z-50 border border-white/20">
          <div className="flex flex-col gap-6 font-bold text-center text-slate-900 dark:text-white uppercase tracking-widest text-sm">
            <a
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-primary transition-colors"
            >
              Home
            </a>
            <a
              href="/portal"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-primary transition-colors"
            >
              News
            </a>
            <a
              href="/ai"
              onClick={() => setMobileMenuOpen(false)}
              className="text-primary"
            >
              Agent SIHU
            </a>
            <a
              href="/dapp"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-primary transition-colors"
            >
              DApp
            </a>
          </div>
        </div>
      )}

      <main
        className={`pt-20 md:pt-24 px-4 md:px-12 max-w-7xl mx-auto min-h-screen flex flex-col transition-all duration-300 ${
          keyboardVisible ? "pb-4" : "pb-32 md:pb-40"
        }`}
        style={{
          paddingBottom: keyboardVisible ? "env(safe-area-inset-bottom, 0px)" : undefined,
        }}
      >
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-headline font-extrabold text-white mb-2 tracking-tighter">
            Agent SIHU
          </h2>
          <div className="flex items-center gap-2 text-sky-400/80 font-medium">
            <span className="material-symbols-outlined text-sm">verified</span>
            <span className="text-sm md:text-base">
              Environmental Intelligence Protocol Active
            </span>
          </div>
          {providerStatus && (
            <div className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
              <span className="font-semibold uppercase tracking-wider text-sky-300">
                Active AI:
              </span>
              <span>{providerStatus.activeProvider}</span>
              <span className="text-slate-500">/</span>
              <span>{providerStatus.models[providerStatus.activeProvider]}</span>
              {!providerStatus.configured[providerStatus.activeProvider] && (
                <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-300">
                  fallback mode
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tools Panel */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 md:gap-3 items-center">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => toggleTool(tool.id)}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  tool.enabled
                    ? "bg-sky-600/20 border border-sky-400/30 text-sky-300"
                    : "bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10"
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {tool.icon}
                </span>
                {tool.name}
              </button>
            ))}

            {/* Auto-speak toggle */}
            <button
              onClick={toggleAutoSpeak}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-xs font-bold transition-all ml-2 ${
                autoSpeak
                  ? "bg-emerald-600/20 border border-emerald-400/30 text-emerald-300"
                  : "bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10"
              }`}
              title="Auto-speak stories"
            >
              <span className="material-symbols-outlined text-sm">
                {autoSpeak ? "volume_up" : "volume_off"}
              </span>
              Auto-Speak
            </button>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-grow flex flex-col bg-slate-900/30 rounded-2xl border border-white/5 overflow-hidden">
          {/* Messages */}
          <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sky-900/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-sky-400">
                    auto_stories
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Welcome to Agent SIHU
                </h3>
                <p className="text-slate-400 max-w-md mx-auto mb-6">
                  I am your storyteller for the Lake Victoria Basin ecosystem.
                  Ask me about Sango, basin health, or stewardship stories.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() =>
                      setInputValue("Tell me a story about the Sango project")
                    }
                    className="bg-white/5 hover:bg-white/10 border border-white/5 px-4 py-2 rounded-full text-sm text-sky-200 transition-colors"
                  >
                    Tell me a Sango story
                  </button>
                  <button
                    onClick={() =>
                      setInputValue("What is basin health mining?")
                    }
                    className="bg-white/5 hover:bg-white/10 border border-white/5 px-4 py-2 rounded-full text-sm text-sky-200 transition-colors"
                  >
                    What is basin health mining?
                  </button>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 md:gap-4 ${
                  message.role === "user" ? "justify-end" : ""
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-white text-lg md:text-xl">
                      smart_toy
                    </span>
                  </div>
                )}
                <div
                  className={`flex flex-col gap-2 max-w-[80%] ${
                    message.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {message.attachments.map((file, index) => (
                        <div
                          key={index}
                          className="bg-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm">
                            attach_file
                          </span>
                          {file.name}
                        </div>
                      ))}
                    </div>
                  )}
                  <div
                    className={`rounded-2xl p-4 text-sm md:text-base ${
                      message.role === "user"
                        ? "bg-sky-600 text-white"
                        : "bg-slate-800/50 text-slate-100 border border-white/5"
                    }`}
                  >
                    <div
                      dangerouslySetInnerHTML={{
                        __html: message.content.replace(
                          /\*\*(.*?)\*\*/g,
                          "<strong>$1</strong>"
                        ),
                      }}
                    />
                  </div>

                  {/* Speak button for assistant messages */}
                  {message.role === "assistant" && message.speechText && (
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => {
                          if (
                            isSpeaking &&
                            speakingMessageId === message.id
                          ) {
                            stopSpeaking();
                          } else {
                            speakMessage(message.speechText!, message.id);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          isSpeaking && speakingMessageId === message.id
                            ? "bg-sky-500/30 text-sky-300 animate-pulse"
                            : "bg-white/10 text-slate-400 hover:bg-white/20 hover:text-sky-300"
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {isSpeaking && speakingMessageId === message.id
                            ? "volume_off"
                            : "volume_up"}
                        </span>
                        {isSpeaking && speakingMessageId === message.id
                          ? "Stop"
                          : "Listen"}
                      </button>

                      {message.isStory && (
                        <span className="text-[10px] text-sky-400/70 uppercase tracking-wider font-medium">
                          Story Mode
                        </span>
                      )}
                    </div>
                  )}

                  <span className="text-xs text-slate-500">
                    {mounted
                      ? message.timestamp.toLocaleTimeString()
                      : "\u00A0"}
                  </span>
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                    <span className="material-symbols-outlined text-slate-400">
                      person
                    </span>
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start gap-3 md:gap-4">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-white text-lg md:text-xl">
                    smart_toy
                  </span>
                </div>
                <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-sky-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-sky-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-slate-400 text-sm">
                      Agent SIHU is thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="px-4 md:px-6 pb-4 border-t border-white/5">
              <div className="flex flex-wrap gap-2 mt-4">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="bg-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">
                      attach_file
                    </span>
                    {file.name}
                    <button
                      onClick={() => removeAttachment(index)}
                      className="text-slate-500 hover:text-red-400 ml-1"
                    >
                      <span className="material-symbols-outlined text-sm">
                        close
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input Area - Mobile Optimized */}
          <div
            className={`p-3 md:p-6 border-t border-white/5 bg-slate-950/95 backdrop-blur-xl ${
              keyboardVisible ? "fixed bottom-0 left-0 right-0 z-50" : ""
            }`}
            style={{
              paddingBottom: keyboardVisible ? "max(12px, env(safe-area-inset-bottom, 12px))" : undefined,
            }}
          >
            <div className="flex items-end gap-2 md:gap-3 max-w-7xl mx-auto">
              {/* File Upload - Touch optimized */}
              <button
                onClick={() => {
                  hapticFeedback();
                  fileInputRef.current?.click();
                }}
                className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center text-slate-400 hover:text-sky-300 transition-colors rounded-full hover:bg-white/5 active:scale-95"
                title="Upload files"
                aria-label="Upload files"
              >
                <span className="material-symbols-outlined text-xl">attach_file</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
              />

              {/* Text Input - Mobile optimized */}
              <div className="flex-grow relative">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !isMobile) {
                      e.preventDefault();
                      hapticFeedback();
                      sendMessage();
                    }
                  }}
                  onFocus={() => isMobile && setKeyboardVisible(true)}
                  onBlur={() => isMobile && setTimeout(() => setKeyboardVisible(false), 200)}
                  placeholder={isMobile ? "Ask about the Basin..." : "Ask Agent SIHU anything about the ecosystem..."}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none min-h-[44px] max-h-32 text-base"
                  rows={1}
                  style={{ fontSize: "16px" }} // Prevent zoom on iOS
                />
              </div>

              {/* Voice Input - Touch optimized */}
              <button
                onClick={() => {
                  hapticFeedback();
                  isRecording ? stopRecording() : startRecording();
                }}
                className={`min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-95 ${
                  isRecording
                    ? "bg-red-600 text-white animate-pulse"
                    : "text-slate-400 hover:text-sky-300 hover:bg-white/5"
                }`}
                title={isRecording ? "Stop recording" : "Voice input"}
                aria-label={isRecording ? "Stop recording" : "Voice input"}
              >
                <span className="material-symbols-outlined text-xl">
                  {isRecording ? "stop" : "mic"}
                </span>
              </button>

              {/* Send Button - Touch optimized */}
              <button
                onClick={() => {
                  hapticFeedback();
                  sendMessage();
                }}
                disabled={!inputValue.trim() && attachments.length === 0}
                className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center bg-primary hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-all active:scale-90 shadow-lg shadow-primary/20"
                title="Send message"
                aria-label="Send message"
              >
                <span className="material-symbols-outlined text-xl">send</span>
              </button>
            </div>

            {/* Quick Actions - Mobile Optimized */}
            <div className={`flex gap-2 mt-3 overflow-x-auto scrollbar-hide ${keyboardVisible ? "hidden" : "flex"}`}>
              {[
                { label: "Story Time", prompt: "Tell me a story about Sango and the Basin" },
                { label: "Basin Health", prompt: "What is basin health mining?" },
                { label: "Rewards", prompt: "Show me my mining rewards" },
                { label: "News", prompt: "Latest news and updates" },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => {
                    hapticFeedback();
                    setInputValue(action.prompt);
                    textareaRef.current?.focus();
                  }}
                  className="shrink-0 min-h-[32px] bg-white/5 hover:bg-white/10 border border-white/5 px-3 py-1.5 rounded-full text-xs font-bold text-sky-200 transition-colors active:scale-95 whitespace-nowrap"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* BottomNavBar (Mobile) - With safe area support */}
      <nav
        className={`md:hidden fixed left-0 w-full flex justify-around items-center px-4 pb-4 pt-3 bg-on-background/90 backdrop-blur-xl z-40 rounded-t-[2rem] transition-transform duration-300 ${
          keyboardVisible ? "translate-y-full" : "translate-y-0"
        }`}
        style={{
          bottom: 0,
          paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))",
        }}
      >
        <a
          className="flex flex-col items-center justify-center text-slate-500 min-w-[64px] py-2 active:scale-95 transition-transform"
          href="/"
        >
          <span className="material-symbols-outlined text-2xl">home</span>
          <span className="font-['Plus_Jakarta_Sans'] text-[10px] font-semibold uppercase tracking-wider mt-0.5">
            Home
          </span>
        </a>
        <a
          className="flex flex-col items-center justify-center text-slate-500 min-w-[64px] py-2 active:scale-95 transition-transform"
          href="/portal"
        >
          <span className="material-symbols-outlined text-2xl">newspaper</span>
          <span className="font-['Plus_Jakarta_Sans'] text-[10px] font-semibold uppercase tracking-wider mt-0.5">
            News
          </span>
        </a>
        <a
          className="flex flex-col items-center justify-center bg-sky-900/40 text-sky-200 rounded-2xl min-w-[64px] py-2 active:scale-95 transition-transform"
          href="/ai"
        >
          <span className="material-symbols-outlined text-2xl">smart_toy</span>
          <span className="font-['Plus_Jakarta_Sans'] text-[10px] font-semibold uppercase tracking-wider mt-0.5">
            SIHU
          </span>
        </a>
        <a
          className="flex flex-col items-center justify-center text-slate-500 min-w-[64px] py-2 active:scale-95 transition-transform"
          href="/dapp"
        >
          <span className="material-symbols-outlined text-2xl">dashboard_customize</span>
          <span className="font-['Plus_Jakarta_Sans'] text-[10px] font-semibold uppercase tracking-wider mt-0.5">
            DApp
          </span>
        </a>
      </nav>
    </div>
  );
}
