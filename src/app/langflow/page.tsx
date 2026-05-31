"use client"

import { useState } from "react"
import { Workflow, ExternalLink, Bot, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

const LANGFLOW_URL = import.meta.env.VITE_LANGFLOW_URL ?? ""

export default function LangFlowPage() {
  const [reloadKey, setReloadKey] = useState(0)

  function popOut() {
    window.open(
      LANGFLOW_URL,
      "langflow",
      "width=1400,height=900,menubar=no,toolbar=no,location=no,status=no",
    )
  }

  if (!LANGFLOW_URL) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-3 text-center">
        <Bot className="size-12 text-muted-foreground" />
        <p className="text-lg font-semibold">LangFlow not configured</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Set <code className="rounded bg-muted px-1 text-xs">VITE_LANGFLOW_URL</code> in the environment variables.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - var(--header-height, 56px))" }}>
      <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Workflow className="size-4 text-primary" />
          LangFlow — Agent Builder
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setReloadKey(k => k + 1)}>
            <RefreshCcw className="mr-1.5 size-3.5" />
            Reload
          </Button>
          <Button variant="ghost" size="sm" onClick={popOut}>
            <ExternalLink className="mr-1.5 size-3.5" />
            Pop out to window
          </Button>
        </div>
      </div>
      <iframe
        key={reloadKey}
        src={LANGFLOW_URL}
        className="w-full flex-1 border-0"
        title="LangFlow"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  )
}
