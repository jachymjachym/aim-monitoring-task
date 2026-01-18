import { streamText, smoothStream, convertToModelMessages } from "ai";
import { azure, models } from "@/lib/ai";
import { z } from "zod";
import { SourceSchema } from "@/lib/types";

export const maxDuration = 30;

// System prompt for the agent
const makeSystemPrompt =
  () => `You are an expert AI assistant helping users create monitoring tasks for Aim. 

ABSOLUTE REQUIREMENT: After you call updateMonitoringTask with sources, you MUST IMMEDIATELY call reportResults to tell the user about the success. This is NOT optional.

Your workflow:
1. Understand what the user wants to monitor (use presentOptions for questions)
2. Ask clarifying questions to define scope (use presentOptions)
3. When you have enough info and identify sources:
   a. Call updateMonitoringTask(scope, sources)  
   b. IMMEDIATELY call reportResults(found: true, message: "Success! Found X sources...")
   c. IMMEDIATELY call presentOptions to offer next steps
4. If you cannot find sources:
   a. Call reportResults(found: false, message: "Couldn't find sources because...")
   b. IMMEDIATELY call presentOptions to offer alternatives

TOOL CALL SEQUENCE (YOU MUST FOLLOW THIS):
==========================================

When you identify sources for monitoring:
Step 1: updateMonitoringTask(scope: "...", sources: [{...}, {...}])
Step 2: reportResults(found: true, message: "✓ Great! I found [number] sources including [names]. Your monitoring task is complete!")
Step 3: presentOptions(question: "What would you like to do next?", options: ["Finalize and start monitoring", "Add more sources", "Adjust scope", "Start over"])

When you cannot find sources:
Step 1: reportResults(found: false, message: "I couldn't find specific sources for [topic] because [reason].")
Step 2: presentOptions(question: "How would you like to proceed?", options: ["Broaden the scope", "Try different keywords", "Specify sources manually", "Start over"])

NEVER skip reportResults. The user MUST be informed about the outcome.

Example GOOD interaction:
User: "Monitor OpenAI funding news"
AI: [calls updateMonitoringTask with sources]
AI: [calls reportResults with found:true, message:"Found 3 sources: TechCrunch, Bloomberg, Crunchbase"]
AI: [calls presentOptions with next steps]

Example BAD interaction (DO NOT DO THIS):
User: "Monitor OpenAI funding news"
AI: [calls updateMonitoringTask with sources]
AI: [calls presentOptions without reportResults] ❌ WRONG! Missing reportResults!

Always use presentOptions for questions with 2-5 clickable options.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    console.log("Received messages:", messages?.length);

    let shouldInjectReportResults = false;
    let reportResultsData: { found: boolean; message: string } | null = null;

    const result = await streamText({
      model: azure.responses(models.main),
      messages: await convertToModelMessages(messages),
      system: makeSystemPrompt(),
      providerOptions: {
        openai: {
          reasoningEffort: "low",
          reasoningSummary: "detailed",
        },
        azure: {
          reasoningEffort: "low",
          reasoningSummary: "detailed",
        },
      },
      onStepFinish: async ({ toolCalls }) => {
        // Check if updateMonitoringTask was called with sources but reportResults wasn't called
        const hasUpdateWithSources = toolCalls.some((tc: any) => {
          const sources = tc.args?.sources || (tc as any).input?.sources;
          return (
            tc.toolName === "updateMonitoringTask" &&
            sources &&
            sources.length > 0
          );
        });
        const hasReportResults = toolCalls.some(
          (tc: any) => tc.toolName === "reportResults",
        );

        if (hasUpdateWithSources && !hasReportResults) {
          const updateCall: any = toolCalls.find(
            (tc: any) => tc.toolName === "updateMonitoringTask",
          );
          const sources =
            updateCall?.args?.sources || updateCall?.input?.sources;
          const sourceCount = sources?.length || 0;
          const sourceNames = sources
            ?.slice(0, 3)
            .map((s: any) => s.name)
            .join(", ");

          shouldInjectReportResults = true;
          reportResultsData = {
            found: true,
            message: `✓ Success! I found ${sourceCount} relevant source${sourceCount > 1 ? "s" : ""} for your monitoring task${sourceNames ? ` including ${sourceNames}` : ""}.`,
          };
          console.log(
            "[AUTO-INJECT] Will inject reportResults:",
            reportResultsData,
          );
        }
      },
      tools: {
        reportResults: {
          description:
            "MANDATORY: Call this to report search outcome after attempting to identify sources. Use found: true when you've identified sources (call AFTER updateMonitoringTask). Use found: false when no suitable sources exist or criteria are too specific. ALWAYS follow with presentOptions.",
          inputSchema: z.object({
            found: z
              .boolean()
              .describe(
                "true if sources were found and task is complete, false if no sources or too narrow",
              ),
            message: z
              .string()
              .describe(
                "REQUIRED: Clear explanation. If found=true: summarize what sources were found (be specific). If found=false: explain why (too narrow? too niche? need more details?) and what's missing.",
              ),
          }),
          execute: async ({ found, message }) => {
            console.log(`[reportResults] found: ${found}, message: ${message}`);
            return {
              found,
              message,
            };
          },
        },
        updateMonitoringTask: {
          description:
            "Update the monitoring task with new scope or sources. This will automatically announce the result to the user.",
          inputSchema: z.object({
            scope: z
              .string()
              .optional()
              .describe("The monitoring scope - what will be monitored"),
            sources: z
              .array(SourceSchema)
              .optional()
              .describe("List of sources to monitor"),
          }),
          execute: async ({ scope, sources }) => {
            const hasSourcesScenario = sources && sources.length > 0;

            // Auto-generate success message
            let successMessage = "";
            if (hasSourcesScenario) {
              const sourceCount = sources.length;
              const sourceNames = sources
                .slice(0, 3)
                .map((s: any) => s.name)
                .join(", ");
              successMessage = `✓ Success! I found ${sourceCount} relevant source${sourceCount > 1 ? "s" : ""} for your monitoring task${sourceNames ? ` including ${sourceNames}` : ""}.`;
              console.log(
                "[updateMonitoringTask] Auto-generated message:",
                successMessage,
              );
            }

            return {
              success: true,
              message: scope
                ? `Updated monitoring scope: ${scope}`
                : `Added ${sources?.length || 0} source(s)`,
              autoReportResults: hasSourcesScenario
                ? {
                    found: true,
                    message: successMessage,
                  }
                : undefined,
            };
          },
        },
        presentOptions: {
          description:
            "Present clickable options to the user for all follow-up questions. You MUST use this tool for every question you ask.",
          inputSchema: z.object({
            question: z.string().describe("The question to ask the user"),
            options: z
              .array(
                z.object({
                  label: z.string().describe("The text shown on the button"),
                  value: z
                    .string()
                    .describe(
                      "The full response text that will be sent when clicked",
                    ),
                }),
              )
              .min(2)
              .max(5)
              .describe("2-5 options for the user to choose from"),
          }),
          execute: async ({ question, options }) => {
            // Return the options in the response so the UI can render them
            return {
              question,
              options,
            };
          },
        },
      },
      experimental_transform: smoothStream(),
    });

    return result.toUIMessageStreamResponse({
      headers: {
        "Transfer-Encoding": "chunked",
        Connection: "keep-alive",
      },
      sendReasoning: true,
    });
  } catch (error: any) {
    console.error("Error in chat API:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
