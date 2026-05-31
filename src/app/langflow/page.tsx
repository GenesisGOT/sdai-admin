"use client"

import { Workflow, ExternalLink, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BaseLayout } from "@/components/layouts/base-layout"

const LANGFLOW_URL = import.meta.env.VITE_LANGFLOW_URL ?? ""

export default function LangFlowPage() {
  return (
    <BaseLayout title="LangFlow — Agent Builder" description="Visually build and manage AI agent flows">
      <div className="px-4 lg:px-6">
        <div className="mx-auto max-w-xl rounded-2xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
            <Workflow className="size-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">LangFlow Agent Builder</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Build, test, and deploy complex AI agent flows visually. LangFlow opens
            in its own tab — it runs as a full application and can't be embedded
            here due to browser security on logged-in sessions.
          </p>

          {LANGFLOW_URL ? (
            <Button size="lg" className="mt-6 gap-2" asChild>
              <a href={LANGFLOW_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
                Open LangFlow Builder
              </a>
            </Button>
          ) : (
            <div className="mt-6 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
              <Bot className="mx-auto mb-2 size-5" />
              LangFlow URL not configured. Set{" "}
              <code className="rounded bg-muted px-1 text-xs">VITE_LANGFLOW_URL</code>{" "}
              in the environment variables.
            </div>
          )}

          <p className="mt-5 text-xs text-muted-foreground">
            Tip: bookmark the LangFlow tab for quick access while building.
          </p>
        </div>
      </div>
    </BaseLayout>
  )
}
