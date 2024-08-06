'use client'

import { useAIState } from 'ai/rsc'
import { GitHubReadme } from "react-github-readme-md";


interface Stock {
  symbol: string
  frameworks: string
  skills: string
}

export function Stock({ props: { symbol} }: { props: Stock }) {
  const [aiState, setAIState] = useAIState()


  return (
    <div className="rounded-xl border  p-4 text-green-400">

      <GitHubReadme username="finnbergquist" repo={symbol} />

      
    </div>
  )
}
