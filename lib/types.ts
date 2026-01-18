import { z } from "zod";

// Source types
export const SourceTypeEnum = z.enum([
  "website",
  "rss_feed",
  "social_platform",
  "github_repo",
  "company",
  "sec_filing",
  "news_outlet",
  "other",
]);

export const SourceSchema = z.object({
  type: SourceTypeEnum,
  name: z.string(),
  url: z.string().optional(),
  description: z.string().optional(),
});

export type Source = z.infer<typeof SourceSchema>;

// Monitoring Task
export const MonitoringTaskSchema = z.object({
  scope: z.string().optional(),
  sources: z.array(SourceSchema).default([]),
});

export type MonitoringTask = z.infer<typeof MonitoringTaskSchema>;

// Agent interaction types
export interface ChatOption {
  label: string;
  value: string;
}

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
  options?: ChatOption[];
}
