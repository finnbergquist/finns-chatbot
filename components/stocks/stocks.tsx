'use client'

import { useActions, useUIState } from 'ai/rsc'
import RepoCard from 'react-repo-card'

import type { AI } from '@/lib/chat/actions'

interface Stock {
  symbol: string
  frameworks: string
  skills: string
}

export function Stocks({ props: projects }: { props: Stock[] }) {
  const [, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage } = useActions()

  return (
    <div>
      <div className="mb-4 grid gap-2 pb-4 text-sm sm:grid-cols-3">
        {projects.map(project => (
          <button
            key={project.symbol}
            className="flex flex-row gap-2 rounded-lg bg-zinc-800 p-2 text-left"
            onClick={async () => {
              const response = await submitUserMessage(`View ${project.symbol}`)
              setMessages((currentMessages: any) => [...currentMessages, response])
            }}
          >
            <div className="flex flex-col" style={{ width: "100%" }}>
              <RepoCard username='finnbergquist' repository={project.symbol} />
              <div className="p-4 flex flex-col text-center border rounded-lg text-sm text-zinc-500 cursor-pointer hover:bg-zinc-700 mt-2">
                Show More
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="p-4 text-center text-sm text-zinc-500">
        Note: I promise Finn is a nice guy!
      </div>
    </div>
  )
}