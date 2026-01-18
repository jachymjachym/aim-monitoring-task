# Aim Monitoring Task CreatorThis is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

A modern chat-based UI for creating monitoring tasks powered by Azure OpenAI GPT-5.## Getting Started

## OverviewFirst, run the development server:

This prototype allows users to create monitoring tasks through a conversational interface. The AI agent interviews the user, asks clarifying questions with clickable options, and gradually builds a structured monitoring definition.```bash

npm run dev

## Features# or

yarn dev

- **Conversational Interface**: Natural language interaction with AI agent# or

- **Interactive Options**: All follow-up questions presented as clickable chips/buttonspnpm dev

- **Live Preview**: Real-time monitoring task preview panel showing scope and sources# or

- **Modern UI**: Built with Next.js 16, React 19, Tailwind CSS 4, and shadcn/uibun dev

- **Azure OpenAI Integration**: Uses GPT-5 with reasoning capabilities```

## Tech StackOpen [http://localhost:3000](http://localhost:3000) with your browser to see the result.

- **Framework**: Next.js 16 (App Router)You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

- **UI**: React 19, Tailwind CSS 4, shadcn/ui

- **AI**: Vercel AI SDK with Azure OpenAI (GPT-5)This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

- **Language**: TypeScript

- **Validation**: Zod## Learn More

## ArchitectureTo learn more about Next.js, take a look at the following resources:

### Monitoring Task Schema- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

A monitoring task consists of:

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

1. **Monitoring Scope** (`string`, optional)
   - Description of what will be monitored## Deploy on Vercel

   - Example: "AI startup funding announcements in Europe"

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

2. **Sources** (`Source[]`)
   - Structured list of where to monitorCheck out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

   - Each source has:
     - `type`: website, rss_feed, social_platform, github_repo, company, sec_filing, news_outlet, other
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

### 1. Why Clickable Options for Everything?

**Problem**: Users don't know what options are available or how to phrase responses.

**Solution**: Present all follow-up questions as clickable options (2-5 choices).

**Benefits**:

- Faster interaction (click vs type)
- Guides conversation flow
- Reduces ambiguity
- Better mobile experience
- Users can still type custom responses

### 2. Live Preview Panel

**Problem**: Users need to see what they're building in real-time.

**Solution**: Persistent right-side panel showing monitoring task state.

**Benefits**:

- Immediate feedback
- Clear progress visualization
- Easy to catch mistakes
- Builds confidence

### 3. Structured Source Schema

**Problem**: Sources can be many different things (websites, repos, feeds, etc.).

**Solution**: Flexible source type with optional fields.

**Reasoning**:

- Accommodates diverse source types
- Extensible (easy to add new types)
- Optional URL (some sources don't need it)
- Description field for context

### 4. Tool-Based Agent Architecture

**Problem**: Need to update UI state and present options programmatically.

**Solution**: Two specialized tools with clear purposes.

**Benefits**:

- Separation of concerns
- Easier to debug
- Predictable state updates
- Forces structured conversation flow

### 5. Azure OpenAI with Reasoning

**Why**:

- GPT-5 provides better reasoning for complex monitoring definitions
- `reasoningEffort: "low"` balances speed vs quality
- `smoothStream()` provides better UX during streaming

## Trade-offs

### 1. Simplified Source Structure

**Trade-off**: Generic source type vs specific types (TwitterSource, GitHubSource, etc.)
**Chosen**: Generic with `type` field
**Why**: Simpler to implement, more flexible, easier to extend

### 2. Client-Side State Management

**Trade-off**: Client state vs server state (database)
**Chosen**: Client-side only (no persistence)
**Why**: Prototype scope, faster iteration, focus on UX flow

### 3. Tool-Driven Conversation

**Trade-off**: Forced tool usage vs free-form LLM responses
**Chosen**: Required presentOptions tool for questions
**Why**: More predictable UX, easier to implement option buttons

### 4. No Edit/Undo Functionality

**Trade-off**: Edit capability vs simple linear flow
**Chosen**: Linear conversation only
**Why**: Simpler implementation, clear for prototype validation

## What I'd Build Next (With One More Week)

### 1. Edit & Refinement

- Click to edit scope or sources
- Remove individual sources
- Undo/redo conversation steps

### 2. Smart Suggestions

- Auto-suggest sources based on monitoring scope
- Validate URLs in real-time
- Suggest similar monitoring tasks

### 3. Export & Integration

- Export as JSON
- Save/load monitoring tasks
- API integration with actual monitoring system

### 4. Enhanced Conversation

- Multi-turn refinement ("Can you narrow that down?")
- Disambiguation for ambiguous inputs
- Conversation branching (alternative paths)

### 5. Better Source Discovery

- URL preview/validation
- Auto-fetch metadata (title, description)
- Deduplicate similar sources

### 6. Richer UI

- Drag-and-drop source reordering
- Source categories/grouping
- Visual source type indicators
- Progress indicator (scope → sources → refinement)

## Biggest Risks & Unknowns

### 1. LLM Consistency

**Risk**: Agent doesn't always use presentOptions tool
**Validation Needed**: Test with diverse inputs, add tool enforcement

### 2. Source Quality

**Risk**: Users add vague or unusable sources
**Validation Needed**: Test what makes a "good" source, add validation

### 3. Scope Clarity

**Risk**: Monitoring scope remains too broad or vague
**Validation Needed**: Test with real users, iterate on agent prompts

### 4. Conversation Length

**Risk**: Too many questions → user fatigue
**Validation Needed**: Measure optimal conversation length

### 5. Option Quality

**Risk**: Presented options don't match user intent
**Validation Needed**: A/B test option phrasing and variety

### 6. Edge Cases

**Risk**: Unclear what happens when:

- User wants to monitor "everything"
- User has 100+ sources
- Source types don't fit our schema
  **Validation Needed**: User research and edge case testing

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

## Deployment

Deploy to Vercel:

```bash
vercel
```

Or use the Vercel GitHub integration for automatic deployments.

## License

Private - Hiring Assignment
