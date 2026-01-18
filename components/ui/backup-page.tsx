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
  const [monitoringTask, setMonitoringTask] = useState<MonitoringTask>({
    scope: undefined,
    sources: [],
  });

  const [input, setInput] = useState("");
  const [toolCalls, setToolCalls] = useState<Record<string, any>>({});
  const [currentAssistantMessageId, setCurrentAssistantMessageId] = useState<
    string | null
  >(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Use ref to store the current message ID to avoid recreating the callback
  const currentAssistantMessageIdRef = useRef<string | null>(null);
  const processedToolCallsRef = useRef<Set<string>>(new Set());

  // Keep ref in sync with state
  useEffect(() => {
    currentAssistantMessageIdRef.current = currentAssistantMessageId;
  }, [currentAssistantMessageId]);

  // Memoize the onToolCall handler so it's stable
  const handleToolCall = useCallback(({ toolCall }: any) => {
    console.log("Tool call received:", toolCall);

    // Prevent duplicate processing
    if (processedToolCallsRef.current.has(toolCall.toolCallId)) {
      console.log("Tool call already processed:", toolCall.toolCallId);
      return;
    }
    processedToolCallsRef.current.add(toolCall.toolCallId);

    // Store tool call for display - associate with current message
    setToolCalls((prev) => {
      const updated = {
        ...prev,
        [toolCall.toolCallId]: {
          ...toolCall,
          messageId: currentAssistantMessageIdRef.current,
        },
      };
      localStorage.setItem("aim-tool-calls", JSON.stringify(updated));
      return updated;
    });

    if (toolCall.toolName === "updateMonitoringTask") {
      const { scope, sources } = toolCall.input || toolCall.args || {};
      setMonitoringTask((prev) => {
        const updated = {
          scope: scope || prev.scope,
          sources: sources ? [...prev.sources, ...sources] : prev.sources,
        };
        localStorage.setItem("aim-monitoring-task", JSON.stringify(updated));
        return updated;
      });

      // Check if we should auto-inject a reportResults
      if (sources && sources.length > 0) {
        const sourceCount = sources.length;
        const sourceNames = sources
          .slice(0, 3)
          .map((s: any) => s.name)
          .join(", ");
        const successMessage = `✓ Success! I found ${sourceCount} relevant source${sourceCount > 1 ? "s" : ""} for your monitoring task${sourceNames ? ` including ${sourceNames}` : ""}.`;

        const syntheticReportResultsId = `synthetic-report-${toolCall.toolCallId}`;

        // Only add if not already processed
        if (!processedToolCallsRef.current.has(syntheticReportResultsId)) {
          processedToolCallsRef.current.add(syntheticReportResultsId);
          setToolCalls((prev) => ({
            ...prev,
            [syntheticReportResultsId]: {
              toolCallId: syntheticReportResultsId,
              toolName: "reportResults",
              messageId: currentAssistantMessageIdRef.current,
              input: {
                found: true,
                message: successMessage,
              },
            },
          }));
        }
      }
    }
  }, []); // Empty deps - function never changes

  const chat = useChat({
    onToolCall: handleToolCall,
  });

  const { messages, sendMessage, status, setMessages } = chat;

  const isLoading = status === "streaming" || status === "submitted";

  console.log("Chat status:", status, "Messages:", messages.length);

  // Load persisted data from localStorage on mount
  useEffect(() => {
    const savedToolCalls = localStorage.getItem("aim-tool-calls");
    const savedTask = localStorage.getItem("aim-monitoring-task");
    const savedMessages = localStorage.getItem("aim-messages");

    if (savedToolCalls) {
      try {
        setToolCalls(JSON.parse(savedToolCalls));
      } catch (e) {
        console.error("Failed to parse saved tool calls:", e);
      }
    }

    if (savedTask) {
      try {
        setMonitoringTask(JSON.parse(savedTask));
      } catch (e) {
        console.error("Failed to parse saved monitoring task:", e);
      }
    }

    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch (e) {
        console.error("Failed to parse saved messages:", e);
      }
    }

    setIsHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (isHydrated && messages.length > 0) {
      localStorage.setItem("aim-messages", JSON.stringify(messages));
    }
  }, [messages, isHydrated]);

  // Track the current assistant message ID
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === "assistant") {
      setCurrentAssistantMessageId(lastMessage.id);
    }
  }, [messages]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleOptionSelect = (value: string) => {
    sendMessage({ text: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    sendMessage({ text: input });
    setInput("");
  };

  const extractOptions = (message: any) => {
    // Check message.parts for tool-presentOptions
    if (message.parts && Array.isArray(message.parts)) {
      for (const part of message.parts) {
        if (part.type === "tool-presentOptions" && part.input?.options) {
          return part.input.options;
        }
      }
    }

    // First check if message has toolCalls array (shouldn't happen but check anyway)
    if (message.toolCalls && Array.isArray(message.toolCalls)) {
      for (const toolCall of message.toolCalls) {
        if (toolCall.toolName === "presentOptions") {
          if (toolCall.input?.options) return toolCall.input.options;
          if (toolCall.output?.options) return toolCall.output.options;
          if (toolCall.result?.options) return toolCall.result.options;
          if (toolCall.args?.options) return toolCall.args.options;
        }
      }
    }

    // Check our stored tool calls for this specific message
    for (const toolCallId in toolCalls) {
      const toolCall = toolCalls[toolCallId];
      if (
        toolCall.toolName === "presentOptions" &&
        toolCall.messageId === message.id
      ) {
        if (toolCall.input?.options) return toolCall.input.options;
        if (toolCall.output?.options) return toolCall.output.options;
        if (toolCall.result?.options) return toolCall.result.options;
        if (toolCall.args?.options) return toolCall.args.options;
      }
    }

    return null;
  };

  const extractQuestion = (message: any) => {
    // Check message.parts for tool-presentOptions
    if (message.parts && Array.isArray(message.parts)) {
      for (const part of message.parts) {
        if (part.type === "tool-presentOptions" && part.input?.question) {
          return part.input.question;
        }
      }
    }

    // Get the question for this specific message
    for (const toolCallId in toolCalls) {
      const toolCall = toolCalls[toolCallId];
      if (
        toolCall.toolName === "presentOptions" &&
        toolCall.messageId === message.id
      ) {
        return (
          toolCall.input?.question ||
          toolCall.output?.question ||
          toolCall.result?.question ||
          toolCall.args?.question
        );
      }
    }
    return null;
  };

  const extractReportResults = (message: any) => {
    // Get reportResults data for this specific message
    // console.log("Looking for reportResults for message:", message.id);
    // console.log("All toolCalls:", toolCalls);

    for (const toolCallId in toolCalls) {
      const toolCall = toolCalls[toolCallId];
      console.log(`Checking toolCall ${toolCallId}:`, {
        name: toolCall.toolName,
        messageId: toolCall.messageId,
        matches: toolCall.messageId === message.id,
      });

      if (
        toolCall.toolName === "reportResults" &&
        (toolCall.messageId === message.id || !toolCall.messageId)
      ) {
        const result = {
          found:
            toolCall.input?.found ??
            toolCall.args?.found ??
            toolCall.output?.found,
          message:
            toolCall.input?.message ||
            toolCall.args?.message ||
            toolCall.output?.message ||
            toolCall.result?.message,
        };
        // console.log(
        //   "Extracted reportResults:",
        //   result,
        //   "from toolCall:",
        //   toolCall,
        // );
        return result;
      }
    }
    return null;
  };

  const clearConversation = () => {
    if (
      confirm("Are you sure you want to clear the conversation and start over?")
    ) {
      localStorage.removeItem("aim-tool-calls");
      localStorage.removeItem("aim-monitoring-task");
      localStorage.removeItem("aim-messages");
      setToolCalls({});
      setMonitoringTask({ scope: undefined, sources: [] });
      setMessages([]);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Chat Section */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex-shrink-0 border-b px-6 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold">
                Aim Monitoring Assistant
              </h1>
            </div>
            {messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearConversation}
                className="text-xs"
              >
                Clear History
              </Button>
            )}
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
                  Let us create your monitoring task
                </h2>
                <p className="text-sm text-muted-foreground">
                  Start by telling me what you would like to monitor. For
                  example: I want to monitor AI startups or Track news about
                  climate tech
                </p>
              </Card>
            ) : null}

            {isHydrated &&
              messages.map((message: any, index: number) => {
                const isLastMessage = index === messages.length - 1;
                const options = isLastMessage ? extractOptions(message) : null;
                const question = extractQuestion(message);
                const reportResults = extractReportResults(message);

                console.log(
                  "Message:",
                  message.id,
                  "Role:",
                  message.role,
                  "IsLast:",
                  isLastMessage,
                  "Options:",
                  options,
                  "Question:",
                  question,
                  "ReportResults:",
                  reportResults,
                );
                console.log("Full message object:", message);

                // Get text content - handle multiple formats
                let textContent = "";
                if (message.text) {
                  textContent = message.text;
                } else if (Array.isArray(message.content)) {
                  textContent = message.content
                    .filter((part: any) => part.type === "text")
                    .map((part: any) => part.text)
                    .join("");
                } else if (typeof message.content === "string") {
                  textContent = message.content;
                } else if (message.parts) {
                  // Extract text from parts array
                  textContent = message.parts
                    .filter(
                      (part: any) =>
                        part.type === "text" || part.type === "reasoning",
                    )
                    .map((part: any) => part.text)
                    .join("\n\n");
                }

                console.log("Extracted textContent:", textContent);

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
                    <div className={`max-w-[70%] space-y-2`}>
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
                          {reportResults && (
                            <div
                              className={`rounded-2xl rounded-tl-sm px-4 py-2.5 ${
                                reportResults.found
                                  ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900"
                                  : "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900"
                              }`}
                            >
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {reportResults.message ||
                                  (reportResults.found
                                    ? "✓ Successfully found relevant sources for your monitoring task!"
                                    : "⚠ No results found. Let's try a different approach.")}
                              </p>
                            </div>
                          )}
                          {question && (
                            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
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
                <Card className="p-4 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Input - Fixed at bottom */}
        <div className="flex-shrink-0 border-t p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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

      <div className="w-96 border-l bg-muted/20 p-6">
        <MonitoringTaskPreview task={monitoringTask} />
      </div>
    </div>
  );
}
