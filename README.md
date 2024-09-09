# AI Portfolio Chatbot

An AI-powered portfolio chatbot built with Next.js, OpenAI, and GitHub integration.

## Overview

This project is a fork of the [Vercel AI Chatbot](https://github.com/vercel-labs/ai-chatbot), enhanced with GitHub integration to showcase projects, display READMEs, and visualize GitHub activity. It combines the power of AI-driven conversations with real-time GitHub data to create an interactive portfolio experience.

## Features

- AI-powered chat interface using OpenAI's GPT model
- Real-time streaming of AI responses
- GitHub integration:
  - Display of repository cards
  - Fetching and rendering of GitHub READMEs
  - Visualization of GitHub contribution activity
- Dynamic project listing with detailed information
- Seamless integration of GitHub data with AI-generated responses

## Tech Stack

- [Next.js](https://nextjs.org/)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [OpenAI API](https://openai.com/api/)
- [Vercel KV](https://vercel.com/storage/kv)
- [TailwindCSS](https://tailwindcss.com/)
- [GitHub API](https://docs.github.com/en/rest)

## GitHub Components

### GitHubRepoCard

Displays repository information using `react-repo-card`:

typescript
import { RepoCard } from 'react-repo-card';
export function GitHubRepoCard({ username, repository }) {
return <RepoCard username={username} repository={repository} />;
}

### GitHubReadme

Fetches and renders README files using `react-github-readme-md`:

typescript
import { GitHubReadme as GHReadme } from 'react-github-readme-md';

export function GitHubReadme({ username, repo }) {
  return <GHReadme username={username} repo={repo} />;
}

### GitHubActivityCalendar

Visualizes GitHub contributions using `react-github-calendar`:

```typescript
import GitHubCalendar from 'react-github-calendar';

export function GitHubActivityCalendar({ username }) {
  return (
    <div style={{ width: '950px', transform: 'scale(0.75)', transformOrigin: 'top left' }}>
      <GitHubCalendar username={username} />
    </div>
  );
}
```

## UI State Management and Streaming

The `actions.ts` file manages the UI state and streams the AI responses. Here's a snippet of how it integrates GitHub data:

```typescript
export const actions = {
  // ... other actions ...

  listProjects: {
    description: 'List six projects that the user has worked on.',
    parameters: z.object({
      projects: z.array(
        z.object({
          symbol: z.string().describe('The Project Name'),
          frameworks: z.string().describe('The frameworks used in the project'),
          skills: z.string().describe('The broader skills learned')
        })
      )
    }),
    generate: async function* ({ projects }) {
      yield (
        <BotCard>
          <StocksSkeleton />
        </BotCard>
      )

      await sleep(1000)

      const toolCallId = nanoid()

      aiState.done({
        ...aiState.get(),
        messages: [
          ...aiState.get().messages,
          {
            id: nanoid(),
            role: 'assistant',
            content: [
              {
                type: 'tool-call',
                toolName: 'listProjects',
                toolCallId,
                args: { projects }
              }
            ]
          },
          {
            id: nanoid(),
            role: 'tool',
            content: [
              {
                type: 'tool-result',
                toolName: 'listProjects',
                toolCallId,
                result: projects
              }
            ]
          }
        ]
      })

      return (
        <BotCard>
          <Stocks props={projects} />
        </BotCard>
      )
    }
  },

  showProjectReadme: {
    description: 'Show a specific project README from the user\'s GitHub.',
    parameters: z.object({
      symbol: z.string().describe('The name or symbol of the project'),
    }),
    generate: async function* ({ symbol }) {
      yield (
        <BotCard>
          <StockSkeleton />
        </BotCard>
      )

      await sleep(1000)

      const toolCallId = nanoid()

      aiState.done({
        ...aiState.get(),
        messages: [
          ...aiState.get().messages,
          {
            id: nanoid(),
            role: 'assistant',
            content: [
              {
                type: 'tool-call',
                toolName: 'showProjectReadme',
                toolCallId,
                args: { symbol }
              }
            ]
          },
          {
            id: nanoid(),
            role: 'tool',
            content: [
              {
                type: 'tool-result',
                toolName: 'showProjectReadme',
                toolCallId,
                result: { symbol }
              }
            ]
          }
        ]
      })

      return (
        <BotCard>
          <GitHubReadme username={process.env.GITHUB_USERNAME} repo={symbol} />
        </BotCard>
      )
    }
  },

  // ... other actions ...
}
```

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/your-username/portfolio-ai-chatbot.git
```

2. Install dependencies:

```bash
npm install

```bash
npm run dev
```

3. Set up environment variables:

Create a `.env.local` file with the following:

```bash     
NEXT_PUBLIC_GITHUB_TOKEN=<your-github-token>
```

4. Start the development server:

```bash
npm run dev
```

## Acknowledgements

- Original [Vercel AI Chatbot](https://github.com/vercel-labs/ai-chatbot) team
- OpenAI for their powerful language models
- Vercel for their excellent development tools and hosting
- GitHub for their API and data
- react-repo-card, react-github-readme-md, and react-github-calendar for their excellent UI components