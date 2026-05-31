"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Workflow, ExternalLink, RefreshCcw, Bot, Check, Link2, Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { BaseLayout } from "@/components/layouts/base-layout"

const API_BASE = import.meta.env.VITE_API_URL ?? ""
// Hosted LangFlow builder (Model B): Ulises builds flows here so they live
// where they execute. Falls back to the env URL if set.
const BUILDER_URL = import.meta.env.VITE_LANGFLOW_URL ?? "https://langflow.sandiegoaisolutions.com"
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("sdai_token")}`, "Content-Type": "application/json" })

interface Customer { id: number; company_name: string }
interface Agent { id: number; customer_id: number; name: string; agent_type: string; status: string; langflow_flow_id: string | null }

export default function LangFlowPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [customers, setCustomers] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [drafts, setDrafts] = useState<Record<number, string>>({})
  const [savedId, setSavedId] = useState<number | null>(null)
  const [savingId, setSavingId] = useState<number | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      fetch(`${API_BASE}/api/v1/admin/agents`, { headers: auth() }).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE}/api/v1/admin/customers`, { headers: auth() }).then(r => r.ok ? r.json() : []),
    ])
      .then(([ag, cust]: [Agent[], Customer[]]) => {
        setAgents(ag)
        setCustomers(Object.fromEntries(cust.map(c => [c.id, c.company_name])))
        setDrafts(Object.fromEntries(ag.map(a => [a.id, a.langflow_flow_id ?? ""])))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function saveFlow(agentId: number) {
    setSavingId(agentId)
    await fetch(`${API_BASE}/api/v1/admin/agents/${agentId}/langflow`, {
      method: "PATCH", headers: auth(),
      body: JSON.stringify({ langflow_flow_id: drafts[agentId] || null }),
    })
    setSavingId(null); setSavedId(agentId); setTimeout(() => setSavedId(null), 1500)
    load()
  }

  return (
    <BaseLayout title="Agent Builder (LangFlow)" description="Build flows in LangFlow, then power any agent with one">
      <div className="px-4 lg:px-6 space-y-6">

        {/* Builder launch + workflow explainer */}
        <Card>
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <Workflow className="size-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">Build & manage flows in LangFlow</div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Opens in its own tab (no login). Build a flow, copy its <strong>Flow ID</strong>
                (from the flow's URL or API panel), then paste it onto an agent below to power it.
              </p>
            </div>
            <Button className="gap-2 shrink-0" asChild>
              <a href={BUILDER_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />Open LangFlow
              </a>
            </Button>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bot className="size-4 text-primary" />
            <span>Assign a LangFlow flow to power each agent</span>
          </div>
          <Button variant="outline" size="icon" onClick={load}><RefreshCcw className="size-4" /></Button>
        </div>

        {/* Agent → flow mapping */}
        {loading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border rounded-xl text-center">
            <Bot className="size-10 text-muted-foreground mb-3" />
            <p className="font-medium">No agents yet</p>
            <p className="text-sm text-muted-foreground mt-1">Deploy an agent first, then map a LangFlow flow to it here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {agents.map(a => {
              const dirty = (drafts[a.id] ?? "") !== (a.langflow_flow_id ?? "")
              return (
                <Card key={a.id}>
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm flex items-center gap-2">
                        {a.name}
                        {a.langflow_flow_id && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            <Link2 className="size-2.5" />LangFlow
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{customers[a.customer_id] ?? `Client #${a.customer_id}`} · {a.agent_type}</div>
                    </div>
                    <div className="flex items-center gap-2 sm:w-[420px]">
                      <Input
                        placeholder="LangFlow Flow ID (leave blank = built-in generator)"
                        value={drafts[a.id] ?? ""}
                        onChange={e => setDrafts(d => ({ ...d, [a.id]: e.target.value }))}
                        className="text-xs font-mono"
                      />
                      <Button size="sm" disabled={!dirty || savingId === a.id} onClick={() => saveFlow(a.id)} className="shrink-0">
                        {savedId === a.id ? <Check className="size-4" /> : "Save"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
          <Info className="size-4 shrink-0 mt-0.5 text-primary" />
          <span>
            An agent with a Flow ID runs that LangFlow flow to generate messages. Blank = the
            built-in generator. If a flow errors at runtime, the agent automatically falls back
            to the built-in generator so messaging never stops.
          </span>
        </div>
      </div>
    </BaseLayout>
  )
}
