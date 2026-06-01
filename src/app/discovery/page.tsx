"use client"

import { useEffect, useState, useCallback } from "react"
import {
  ClipboardList, RefreshCcw, Search, Mail, Phone, Building2,
  Clock, CheckCircle2, XCircle, AlertCircle, ChevronDown,
  ExternalLink, Sparkles, Rocket, Bot, RotateCcw, Loader2,
} from "lucide-react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

const API_BASE = import.meta.env.VITE_API_URL ?? ""
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("sdai_token")}`, "Content-Type": "application/json" })

interface AgentRec {
  name: string
  agent_type: string
  description: string
  priority: number
  channel: string
  langflow_flow_id: string | null
}

interface AISetup {
  recommended_agents: AgentRec[]
  suggested_plan: string
  setup_notes: string
  ready_to_deploy: boolean
}

interface Discovery {
  id: number
  full_name: string
  email: string
  phone: string | null
  company_name: string | null
  website: string | null
  industry: string | null
  business_size: string | null
  monthly_revenue: string | null
  goals: string | null
  current_pain: string | null
  agent_types: string | null
  timeline: string | null
  budget: string | null
  referral_source: string | null
  notes: string | null
  ai_setup: string | null
  ai_setup_status: string
  status: string
  created_at: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  new:       { label: "New",       color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",    icon: AlertCircle },
  contacted: { label: "Contacted", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300", icon: Clock },
  qualified: { label: "Qualified", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300", icon: CheckCircle2 },
  converted: { label: "Converted", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",  icon: CheckCircle2 },
  not_a_fit: { label: "Not a Fit", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",        icon: XCircle },
}

const PLAN_COLOR: Record<string, string> = {
  starter: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  growth:  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  pro:     "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
}

const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })

export default function DiscoveryPage() {
  const [leads, setLeads] = useState<Discovery[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selected, setSelected] = useState<Discovery | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [deploying, setDeploying] = useState(false)
  const [deployResult, setDeployResult] = useState<Record<string, unknown> | null>(null)
  const [reanalyzing, setReanalyzing] = useState<number | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const qs = statusFilter !== "all" ? `?status=${statusFilter}` : ""
    fetch(`${API_BASE}/api/v1/discovery/${qs}`, { headers: auth() })
      .then(r => r.ok ? r.json() : [])
      .then(setLeads).catch(() => {})
      .finally(() => setLoading(false))
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  // Auto-refresh while any lead is analyzing
  useEffect(() => {
    const hasAnalyzing = leads.some(l => l.ai_setup_status === "analyzing")
    if (!hasAnalyzing) return
    const t = setTimeout(load, 4000)
    return () => clearTimeout(t)
  }, [leads, load])

  const filtered = leads.filter(l =>
    !search ||
    l.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (l.company_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    l.email.toLowerCase().includes(search.toLowerCase())
  )

  async function updateStatus(id: number, status: string) {
    setUpdatingId(id)
    await fetch(`${API_BASE}/api/v1/discovery/${id}/status`, {
      method: "PATCH", headers: auth(), body: JSON.stringify({ status }),
    })
    load()
    setUpdatingId(null)
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null)
  }

  async function reanalyze(id: number) {
    setReanalyzing(id)
    await fetch(`${API_BASE}/api/v1/discovery/${id}/reanalyze`, { method: "POST", headers: auth() })
    setReanalyzing(null)
    load()
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, ai_setup_status: "analyzing" } : null)
  }

  async function deploy(id: number, sendInvite: boolean) {
    setDeploying(true)
    setDeployResult(null)
    try {
      const r = await fetch(`${API_BASE}/api/v1/discovery/${id}/deploy`, {
        method: "POST", headers: auth(),
        body: JSON.stringify({ send_invite: sendInvite }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.detail || "Deploy failed")
      setDeployResult(data)
      load()
      setSelected(prev => prev ? { ...prev, ai_setup_status: "deployed", status: "converted" } : null)
    } catch (e: unknown) {
      setDeployResult({ error: e instanceof Error ? e.message : String(e) })
    } finally {
      setDeploying(false)
    }
  }

  const parseSetup = (s: Discovery): AISetup | null => {
    if (!s.ai_setup) return null
    try { return JSON.parse(s.ai_setup) } catch { return null }
  }

  const newCount = leads.filter(l => l.status === "new").length
  const readyCount = leads.filter(l => l.ai_setup_status === "ready").length
  const convertedCount = leads.filter(l => l.status === "converted").length

  return (
    <BaseLayout title="Discovery / Onboarding" description="Intake form submissions with AI-powered setup recommendations">
      <div className="px-4 lg:px-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total",      value: leads.length,   color: "text-foreground" },
            { label: "New",        value: newCount,       color: "text-blue-600" },
            { label: "AI Ready",   value: readyCount,     color: "text-green-600" },
            { label: "Converted",  value: convertedCount, color: "text-purple-600" },
          ].map(({ label, value, color }) => (
            <Card key={label} className="text-center py-3">
              <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </Card>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={load}><RefreshCcw className="size-4" /></Button>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border rounded-xl text-center">
            <ClipboardList className="size-12 text-muted-foreground mb-3" />
            <p className="font-medium">No submissions yet</p>
            <p className="text-sm text-muted-foreground mt-1">Onboarding form submissions will appear here with AI setup recommendations.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(lead => {
              const sc = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.new
              const StatusIcon = sc.icon
              const setup = parseSetup(lead)
              return (
                <Card key={lead.id} className="hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => { setSelected(lead); setDeployResult(null) }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{lead.full_name}</span>
                          {lead.company_name && <span className="text-xs text-muted-foreground">· {lead.company_name}</span>}
                          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${sc.color}`}>
                            <StatusIcon className="size-2.5" />{sc.label}
                          </span>
                          {/* AI status badge */}
                          {lead.ai_setup_status === "ready" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                              <Sparkles className="size-2.5" />AI Ready · {setup?.recommended_agents?.length ?? 0} agents
                            </span>
                          )}
                          {lead.ai_setup_status === "analyzing" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                              <Loader2 className="size-2.5 animate-spin" />Analyzing…
                            </span>
                          )}
                          {lead.ai_setup_status === "deployed" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                              <Rocket className="size-2.5" />Deployed
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Mail className="size-3" />{lead.email}</span>
                          {lead.phone && <span className="flex items-center gap-1"><Phone className="size-3" />{lead.phone}</span>}
                          {lead.industry && <span className="flex items-center gap-1"><Building2 className="size-3" />{lead.industry}</span>}
                          {setup?.suggested_plan && (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${PLAN_COLOR[setup.suggested_plan] ?? ""}`}>
                              {setup.suggested_plan}
                            </span>
                          )}
                        </div>
                        {lead.goals && <p className="text-xs text-foreground/70 line-clamp-1">{lead.goals}</p>}
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0 text-right space-y-1">
                        <div className="flex items-center gap-1 justify-end"><Clock className="size-3" />{fmt(lead.created_at)}</div>
                        <Select value={lead.status} onValueChange={v => { updateStatus(lead.id, v) }}>
                          <SelectTrigger className="h-7 text-xs w-32" onClick={e => e.stopPropagation()}>
                            <SelectValue /><ChevronDown className="size-3 ml-1" />
                          </SelectTrigger>
                          <SelectContent onClick={e => e.stopPropagation()}>
                            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail + Deploy Dialog */}
      <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="size-5 text-primary" />
              {selected?.full_name}
              {selected?.company_name && <span className="text-muted-foreground font-normal text-sm">· {selected.company_name}</span>}
            </DialogTitle>
          </DialogHeader>

          {selected && (() => {
            const setup = parseSetup(selected)
            return (
              <div className="space-y-5 text-sm">
                {/* Contact grid */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/30">
                  <div><p className="text-xs text-muted-foreground mb-0.5">Email</p><a href={`mailto:${selected.email}`} className="text-primary hover:underline flex items-center gap-1">{selected.email}<ExternalLink className="size-3" /></a></div>
                  <div><p className="text-xs text-muted-foreground mb-0.5">Phone</p><p>{selected.phone || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground mb-0.5">Company</p><p>{selected.company_name || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground mb-0.5">Website</p>{selected.website ? <a href={selected.website} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">{selected.website}<ExternalLink className="size-3" /></a> : <p>—</p>}</div>
                  <div><p className="text-xs text-muted-foreground mb-0.5">Industry</p><p>{selected.industry || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground mb-0.5">Team Size</p><p>{selected.business_size || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground mb-0.5">Budget</p><p>{selected.budget || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground mb-0.5">Timeline</p><p>{selected.timeline || "—"}</p></div>
                </div>

                {selected.goals && <div><p className="text-xs font-medium text-muted-foreground mb-1">Goals</p><p className="text-foreground/80 whitespace-pre-wrap">{selected.goals}</p></div>}
                {selected.current_pain && <div><p className="text-xs font-medium text-muted-foreground mb-1">Pain Points</p><p className="text-foreground/80 whitespace-pre-wrap">{selected.current_pain}</p></div>}
                {selected.agent_types && <div><p className="text-xs font-medium text-muted-foreground mb-1">Interested In</p><p className="text-foreground/80">{selected.agent_types}</p></div>}
                {selected.notes && <div><p className="text-xs font-medium text-muted-foreground mb-1">Notes</p><p className="text-foreground/80 whitespace-pre-wrap text-xs">{selected.notes}</p></div>}

                {/* ── AI Setup Section ── */}
                <div className="border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      <Sparkles className="size-4 text-primary" />
                      AI Setup Recommendation
                    </div>
                    <div className="flex items-center gap-2">
                      {selected.ai_setup_status === "analyzing" && (
                        <span className="text-xs text-yellow-500 flex items-center gap-1"><Loader2 className="size-3 animate-spin" />Analyzing…</span>
                      )}
                      {selected.ai_setup_status !== "deployed" && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" disabled={reanalyzing === selected.id || selected.ai_setup_status === "analyzing"} onClick={() => reanalyze(selected.id)}>
                          <RotateCcw className={`size-3 ${reanalyzing === selected.id ? "animate-spin" : ""}`} />Re-analyze
                        </Button>
                      )}
                    </div>
                  </div>

                  {!setup ? (
                    <div className="p-4 text-sm text-muted-foreground text-center py-8">
                      {selected.ai_setup_status === "analyzing"
                        ? "Claude is analyzing this submission… refresh in a moment."
                        : "No AI analysis yet — click Re-analyze to generate recommendations."}
                    </div>
                  ) : (
                    <div className="p-4 space-y-4">
                      {/* Ulises briefing */}
                      {setup.setup_notes && (
                        <div className="bg-primary/5 border border-primary/15 rounded-lg p-3">
                          <p className="text-xs font-semibold text-primary mb-1">For Ulises</p>
                          <p className="text-sm text-foreground/80">{setup.setup_notes}</p>
                        </div>
                      )}

                      {/* Suggested plan */}
                      {setup.suggested_plan && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Suggested plan:</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${PLAN_COLOR[setup.suggested_plan] ?? ""}`}>{setup.suggested_plan}</span>
                        </div>
                      )}

                      {/* Recommended agents */}
                      {setup.recommended_agents?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Recommended Agents ({setup.recommended_agents.length})</p>
                          <div className="space-y-2">
                            {setup.recommended_agents.sort((a, b) => a.priority - b.priority).map((ag, i) => (
                              <div key={i} className="flex items-start gap-3 p-3 border rounded-lg bg-muted/20">
                                <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0 text-xs font-bold">{ag.priority}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-sm">{ag.name}</span>
                                    <Badge variant="outline" className="text-[10px] py-0">{ag.channel.toUpperCase()}</Badge>
                                    <Badge variant="outline" className="text-[10px] py-0 font-mono">{ag.agent_type}</Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5">{ag.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Deploy result */}
                      {deployResult && (
                        <div className={`rounded-lg p-3 text-sm ${(deployResult as Record<string, unknown>).error ? "bg-red-500/10 border border-red-500/20 text-red-400" : "bg-green-500/10 border border-green-500/20 text-green-400"}`}>
                          {(deployResult as Record<string, unknown>).error
                            ? String((deployResult as Record<string, unknown>).error)
                            : `✓ Deployed! Customer #${(deployResult as Record<string, unknown>).customer_id} created, ${(deployResult as Record<string, unknown>).agents_created} agents staged${(deployResult as Record<string, unknown>).invite_sent ? ", invite sent." : "."}`
                          }
                        </div>
                      )}

                      {/* Deploy buttons */}
                      {selected.ai_setup_status !== "deployed" && (
                        <div className="flex gap-2 pt-1">
                          <Button className="flex-1 gap-2" disabled={deploying} onClick={() => deploy(selected.id, true)}>
                            {deploying ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
                            Deploy + Send Invite
                          </Button>
                          <Button variant="outline" className="gap-2" disabled={deploying} onClick={() => deploy(selected.id, false)}>
                            <Bot className="size-4" />
                            Deploy Only
                          </Button>
                        </div>
                      )}
                      {selected.ai_setup_status === "deployed" && (
                        <div className="flex items-center gap-2 text-sm text-blue-500">
                          <Rocket className="size-4" />Already deployed — view client in Clients tab.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Status + actions */}
                <div className="flex items-center gap-3 pt-1 border-t">
                  <p className="text-xs text-muted-foreground flex-1">Status:</p>
                  <Select value={selected.status} onValueChange={v => updateStatus(selected.id, v)} disabled={updatingId === selected.id}>
                    <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" asChild>
                    <a href={`mailto:${selected.email}`}><Mail className="size-3.5 mr-1.5" />Email</a>
                  </Button>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </BaseLayout>
  )
}
