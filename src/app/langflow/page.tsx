"use client"

import { Workflow, ExternalLink, Download, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BaseLayout } from "@/components/layouts/base-layout"

// Ulises runs LangFlow locally (LangFlow Desktop or `langflow run`).
// "localhost" resolves to whoever's machine is viewing — i.e. Ulises's own
// local LangFlow. Override the port with VITE_LANGFLOW_LOCAL_URL if needed.
const LOCAL_URL = import.meta.env.VITE_LANGFLOW_LOCAL_URL ?? "http://localhost:7860"

export default function LangFlowPage() {
  function openLocal() {
    window.open(LOCAL_URL, "langflow", "noopener,noreferrer")
  }

  return (
    <BaseLayout title="Agent Builder" description="Build AI agent flows with LangFlow">
      <div className="px-4 lg:px-6">
        <div className="mx-auto max-w-2xl rounded-2xl border bg-card p-10 text-center shadow-sm">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
            <Workflow className="size-8 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold">LangFlow Agent Builder</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Build and test AI agent flows visually using LangFlow running on your
            own computer — free, fast, and private. Click below to open it.
          </p>

          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" className="gap-2" onClick={openLocal}>
              <ExternalLink className="size-4" />
              Open LangFlow ({LOCAL_URL.replace("http://", "")})
            </Button>
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <a href="https://www.langflow.org/desktop" target="_blank" rel="noopener noreferrer">
                <Download className="size-4" />
                Download LangFlow Desktop
              </a>
            </Button>
          </div>

          <div className="mt-8 rounded-lg border bg-muted/30 p-4 text-left text-sm">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <Info className="size-4 text-primary" />
              First time? Set up LangFlow locally (one time)
            </div>
            <ol className="ml-5 list-decimal space-y-1 text-muted-foreground">
              <li>Download & install <strong>LangFlow Desktop</strong> (button above), or run <code className="rounded bg-muted px-1 text-xs">uv pip install langflow &amp;&amp; langflow run</code></li>
              <li>Launch it — it opens on <code className="rounded bg-muted px-1 text-xs">localhost:7860</code></li>
              <li>Come back here and click <strong>Open LangFlow</strong></li>
            </ol>
            <p className="mt-3 text-xs text-muted-foreground">
              If "Open LangFlow" shows a connection error, LangFlow isn't running yet — start it first.
            </p>
          </div>
        </div>
      </div>
    </BaseLayout>
  )
}
