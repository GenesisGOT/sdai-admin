"use client"

import { useState } from "react"
import { Workflow, ExternalLink, RefreshCcw, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BaseLayout } from "@/components/layouts/base-layout"

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

  return (
    <BaseLayout title="LangFlow — Agent Builder" description="Build and manage AI agent flows">
      <div className="px-4 lg:px-6">
        {!LANGFLOW_URL ? (
          <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center">
            <Bot className="size-12 text-muted-foreground" />
            <p className="text-lg font-semibold">LangFlow not configured</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Set <code className="rounded bg-muted px-1 text-xs">VITE_LANGFLOW_URL</code> in the environment variables.
            </p>
          </div>
        ) : (
          <div className="flex flex-col overflow-hidden rounded-xl border bg-card">
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Workflow className="size-4 text-primary" />
                Agent Builder
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => setReloadKey(k => k + 1)}>
                  <RefreshCcw className="mr-1.5 size-3.5" />Reload
                </Button>
                <Button variant="ghost" size="sm" onClick={popOut}>
                  <ExternalLink className="mr-1.5 size-3.5" />Pop out
                </Button>
              </div>
            </div>
            {/* Embedded LangFlow — fills the content area, sidebar stays visible */}
            <iframe
              key={reloadKey}
              src={LANGFLOW_URL}
              title="LangFlow"
              className="w-full border-0"
              style={{ height: "calc(100vh - var(--header-height, 56px) - 9rem)", minHeight: 520 }}
              allow="clipboard-read; clipboard-write"
            />
          </div>
        )}
      </div>
    </BaseLayout>
  )
}
