"use client"

import { Workflow, ExternalLink, SquareArrowOutUpRight, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BaseLayout } from "@/components/layouts/base-layout"

const LANGFLOW_URL = import.meta.env.VITE_LANGFLOW_URL ?? ""

export default function LangFlowPage() {
  function popOut() {
    window.open(
      LANGFLOW_URL,
      "langflow",
      "width=1500,height=950,menubar=no,toolbar=no,location=no,status=no",
    )
  }

  return (
    <BaseLayout title="LangFlow — Agent Builder" description="Build and manage AI agent flows">
      <div className="px-4 lg:px-6">
        <div className="mx-auto max-w-2xl rounded-2xl border bg-card p-10 text-center shadow-sm">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
            <Workflow className="size-8 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold">LangFlow Agent Builder</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Build, test, and deploy complex AI agent flows visually. Opens in its
            own window so you can keep the admin panel open alongside it. No login
            required — you go straight into the builder.
          </p>

          {LANGFLOW_URL ? (
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="gap-2" onClick={popOut}>
                <SquareArrowOutUpRight className="size-4" />
                Open Builder (window)
              </Button>
              <Button size="lg" variant="outline" className="gap-2" asChild>
                <a href={LANGFLOW_URL} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                  Open in new tab
                </a>
              </Button>
            </div>
          ) : (
            <div className="mt-7 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
              <Bot className="mx-auto mb-2 size-5" />
              LangFlow URL not configured. Set{" "}
              <code className="rounded bg-muted px-1 text-xs">VITE_LANGFLOW_URL</code>.
            </div>
          )}

          <p className="mt-6 text-xs text-muted-foreground">
            Tip: snap the LangFlow window to one side and the admin panel to the
            other to work in both at once.
          </p>
        </div>
      </div>
    </BaseLayout>
  )
}
