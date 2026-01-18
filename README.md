# Aim Monitoring Task Creator

A modern chat-based UI for creating monitoring tasks powered by Azure OpenAI GPT-5.

## Getting Started

## Overview

First, run the development server:

This prototype allows users to create monitoring tasks through a conversational interface. The AI agent interviews the user, asks clarifying questions with clickable options, and gradually builds a structured monitoring definition.

```bash
pnpm run dev
```

- **Conversational Interface**: Natural language interaction with AI agent

- **Interactive Options**: All follow-up questions presented as clickable chips/buttons/inputs

- **Live Preview**: Real-time monitoring task preview panel showing scope and sources

- **Azure OpenAI Integration**: Uses GPT-5 with reasoning capabilities

- **UI**: React 19, Tailwind CSS 4, shadcn/ui

- **AI**: Vercel AI SDK with Azure OpenAI (GPT-5)

- **Language**: TypeScript

- **Validation**: Zod

## Architecture

### Monitoring Task Schema

1. **Monitoring Scope** (`string`, optional)
   - Description of what will be monitored

   - Example: "AI startup funding announcements in Europe"

2. **Sources** (`Source[]`)
   - Each source has:
     - `type`: website, rss_feed, social_platform, github_repo, company, sec_filing, news_outlet, podcast, youtube_channel, newsletter, blog, reddit_community, discord_server, slack_community, linkedin_profile, linkedin_company, twitter_account, crunchbase_profile, product_hunt, app_store, google_play, job_board, patent_database, research_paper, government_data, api, other
     - `name`: Display name
     - `url`: Optional URL
     - `description`: Optional description

### Agent Architecture

The agent uses two tools to guide the conversation:

1. **`presentOptions`** - Presents 2-5 clickable options for every follow-up question
   - Ensures guided conversation flow
   - Better UX than free-form text responses
   - Still allows custom text input

2. **`updateMonitoringTask`** - Updates the monitoring task state
   - Called when agent has concrete information
   - Updates scope or adds sources
   - Triggers UI preview update

### UI Components

- **`app/page.tsx`**: Main chat interface with split-panel layout
- **`components/monitoring-task-preview.tsx`**: Live preview panel (right side)
- **`components/option-chips.tsx`**: Interactive option buttons
- **`app/api/chat/route.ts`**: API route with AI SDK integration
- **`lib/types.ts`**: TypeScript schemas and types
- **`lib/ai.ts`**: Azure AI client configuration

## Design Decisions

### Structured Source Schema

**Problem**: Sources can be many different things (websites, repos, feeds, etc.).

**Solution**: Flexible source type with optional fields.

**Reasoning**:

- Accommodates diverse source types
- Extensible (easy to add new types)
- Optional URL (some sources don't need it)
- Description field for context

### Tool-Based Agent Architecture

**Problem**: Need to update UI state and present options programmatically.

**Solution**: Two specialized tools with clear purposes.

**Benefits**:

- Separation of concerns
- Easier to debug
- Predictable state updates
- Forces structured conversation flow

## Trade-offs

### 1. Client-Side State Management

**Trade-off**: Client state vs server state (database)
**Chosen**: Client-side only (no persistence)
**Why**: Prototype scope, faster iteration, focus on UX flow

### 2. Tool-Driven Conversation

**Trade-off**: Forced tool usage vs free-form LLM responses
**Chosen**: Required presentOptions tool for questions
**Why**: More predictable UX, easier to implement option buttons

## What I'd Build Next (With One More Week)

### 1. Enahnced conversation

- Ability to select more options

### 2. Go back in conversation

- It would be great to revert back to specific checkpoint

### 3. Multiple monitorings

- Having multiple persistent conversations and scopes

### 4. Saving my favourite sources

- Saving my favourites in the current monitoring task

## Risks & Unknowns

### 1. LLM Consistency

- Agent probably doesn't always use presentOptions tool

### 2. Source Quality

- Users add vague or unusable sources
- Test what makes a "good" source, add validation

### 3. Scope Clarity

- Monitoring scope remains too broad or vague

### 4. Conversation Length

- Too many questions → user fatigue
- Measure optimal conversation length

### 5. Edge Cases

- Unclear what happens when:

- User wants to monitor "everything"
- User has 100+ sources
- Source types don't fit our schema

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
pnpm build
pnpm start
```

## Environment Variables

The Azure OpenAI credentials are currently hardcoded in `lib/ai.ts` for the prototype. For production, move to `.env.local`:

```env
AZURE_OPENAI_API_KEY=your_key
AZURE_OPENAI_RESOURCE_NAME=your_resource
```

## Project Structure

```
app/
├── api/chat/route.ts       # AI chat endpoint
├── globals.css             # Global styles
├── layout.tsx              # Root layout
└── page.tsx                # Main chat interface
components/
├── ui/                     # shadcn/ui components
├── monitoring-task-preview.tsx
└── option-chips.tsx
lib/
├── ai.ts                   # Azure AI configuration
├── types.ts                # TypeScript types & schemas
└── utils.ts                # Utilities
```

## License

Private - Hiring Assignment
