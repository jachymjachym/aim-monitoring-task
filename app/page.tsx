"use client";

import { useChat } from "@ai-sdk/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MonitoringTaskPreview } from "@/components/monitoring-task-preview";
import { OptionChips } from "@/components/option-chips";
import { MonitoringTask } from "@/lib/types";
import { useState, useEffect, useRef, useCallback } from "react";
import { SendHorizontal, Sparkles } from "lucide-react";

export default function Home() {
  // State
  const [monitoringTask, setMonitoringTask] = useState<MonitoringTask>({
    scope: undefined,
    sources: [],
  });
  const [input, setInput] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);

  // Refs for stable callbacks
  const processedToolCallsRef = useRef<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Stable onToolCall handler using useCallback
  const handleToolCall = useCallback(({ toolCall }: any) => {
    console.log("Tool call received:", toolCall);

    // Prevent duplicate processing
    if (processedToolCallsRef.current.has(toolCall.toolCallId)) {
      return;
    }
    processedToolCallsRef.current.add(toolCall.toolCallId);

    // Handle updateMonitoringTask tool
    if (toolCall.toolName === "updateMonitoringTask") {
      const { scope, sources } = toolCall.input || toolCall.args || {};

      setMonitoringTask((prev) => ({
        scope: scope || prev.scope,
        sources: sources ? [...prev.sources, ...sources] : prev.sources,
      }));
    }
  }, []);

  // Initialize chat
  const { messages, sendMessage, status } = useChat({
    onToolCall: handleToolCall,
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Hydration check
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  const handleOptionSelect = (value: string) => {
    sendMessage({ text: value });
  };

  // Extract options from message parts
  const extractOptions = (message: any) => {
    if (message.parts && Array.isArray(message.parts)) {
      for (const part of message.parts) {
        if (part.type === "tool-presentOptions" && part.input?.options) {
          return part.input.options;
        }
      }
    }
    return null;
  };

  // Extract question from message parts
  const extractQuestion = (message: any) => {
    if (message.parts && Array.isArray(message.parts)) {
      for (const part of message.parts) {
        if (part.type === "tool-presentOptions" && part.input?.question) {
          return part.input.question;
        }
      }
    }
    return null;
  };

  // Extract text content from message
  const extractTextContent = (message: any) => {
    if (message.text) return message.text;

    if (message.parts && Array.isArray(message.parts)) {
      return message.parts
        .filter(
          (part: any) => part.type === "text" || part.type === "reasoning",
        )
        .map((part: any) => part.text)
        .filter(Boolean)
        .join("\n\n");
    }

    if (Array.isArray(message.content)) {
      return message.content
        .filter((part: any) => part.type === "text")
        .map((part: any) => part.text)
        .join("");
    }

    if (typeof message.content === "string") {
      return message.content;
    }

    return "";
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Chat Section */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex-shrink-0 border-b px-6 py-4 bg-background/95 backdrop-blur">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">Aim Monitoring Assistant</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Tell me what you would like to monitor, and I will help you set it
            up
          </p>
        </div>

        {/* Messages - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6" ref={scrollRef}>
          <div className="max-w-3xl mx-auto space-y-6">
            {!isHydrated ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : messages.length === 0 ? (
              <Card className="p-8 text-center bg-muted/30">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-lg font-medium mb-2">
                  Let's create your monitoring task
                </h2>
                <p className="text-sm text-muted-foreground">
                  Start by telling me what you would like to monitor. For
                  example: "I want to monitor AI startups" or "Track news about
                  climate tech"
                </p>
              </Card>
            ) : null}

            {isHydrated &&
              messages.map((message: any, index: number) => {
                const isLastMessage = index === messages.length - 1;
                const textContent = extractTextContent(message);
                const question = extractQuestion(message);
                const options = isLastMessage ? extractOptions(message) : null;

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                    )}

                    <div className="max-w-[70%] space-y-2">
                      {message.role === "user" ? (
                        <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5">
                          <p className="text-sm">{textContent}</p>
                        </div>
                      ) : (
                        <>
                          {textContent && (
                            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {textContent}
                              </p>
                            </div>
                          )}
                          {question && (
                            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5">
                              <p className="text-sm leading-relaxed font-medium">
                                {question}
                              </p>
                            </div>
                          )}
                          {options && (
                            <OptionChips
                              options={options}
                              onSelect={handleOptionSelect}
                            />
                          )}
                        </>
                      )}
                    </div>

                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-primary-foreground text-xs font-medium">
                          You
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 bg-muted rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input - Fixed at bottom */}
        <div className="flex-shrink-0 border-t p-4 bg-background/95 backdrop-blur">
          <form
            onSubmit={handleSubmit}
            className="max-w-3xl mx-auto flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message or select an option above..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Right Panel - Monitoring Task Preview */}
      <div className="w-96 border-l bg-muted/20">
        <MonitoringTaskPreview task={monitoringTask} />
      </div>
    </div>
  );
}
