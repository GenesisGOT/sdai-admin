"use client"

import { Bot, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

const LANGFLOW_URL = import.meta.env.VITE_LANGFLOW_URL ?? ""

export default function LangFlowPage() {
  if (!LANGFLOW_URL) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4 text-center">
        <Bot className="size-12 text-muted-foreground" />
        <p className="font-semibold text-lg">LangFlow not configured</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          Set <code className="bg-muted px-1 rounded text-xs">VITE_LANGFLOW_URL</code> in your environment variables to connect LangFlow.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - var(--header-height, 56px))" }}>
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Bot className="size-4 text-primary" />
          LangFlow — Agent Builder
        </div>
        <Button variant="ghost" size="sm" asChild>
          <a href={LANGFLOW_URL} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-3.5 mr-1.5" />
            Open in new tab
          </a>
        </Button>
      </div>
      <iframe
        src={LANGFLOW_URL}
        className="flex-1 w-full border-0"
        title="LangFlow"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  )
}
