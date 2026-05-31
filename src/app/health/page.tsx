"use client"

import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  HeartPulse, RefreshCcw, Bot, AlertTriangle, CheckCircle2, ChevronRight, Search,
} from "lucide-react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

const API_BASE = import.meta.env.VITE_API_URL ?? ""
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("sdai_token")}` })

interface Customer { id: number; company_name: string; email: string; is_active: boolean }
interface Agent { id: number; customer_id: number; status: string }
interface AgentPerf { agent_id: number; total_runs: number; success: number; failed: number; success_rate: number }

interface ClientHealth {
  customer: Customer
  totalAgents: number
  activeAgents: number
  runs: number
  successRate: number | null
  level: "red" | "yellow" | "green"
  reason: string
}

function computeHealth(c: Customer, agents: Agent[], perfByAgent: Record<number, AgentPerf>): ClientHealth {
  const mine = agents.filter(a => a.customer_id === c.id)
  const active = mine.filter(a => a.status === "active").length
  const perfs = mine.map(a => perfByAgent[a.id]).filter(Boolean)
  const runs = perfs.reduce((s, p) => s + p.total_runs, 0)
  const success = perfs.reduce((s, p) => s + p.success, 0)
  const successRate = runs > 0 ? Math.round((success / runs) * 100) : null

  let level: ClientHealth["level"] = "green"
  let reason = "All systems healthy"
  if (mine.length === 0) { level = "red"; reason = "No agents deployed yet" }
  else if (active === 0) { level = "red"; reason = "No active agents" }
  else if (successRate !== null && successRate < 70) { level = "red"; reason = `Low success rate (${successRate}%)` }
  else if (successRate !== null && successRate < 90) { level = "yellow"; reason = `Success rate ${successRate}%` }
  else if (active < mine.length) { level = "yellow"; reason = `${mine.length - active} agent(s) not active` }
  else if (runs === 0) { level = "yellow"; reason = "Active but no runs yet" }

  return { customer: c, totalAgents: mine.length, activeAgents: active, runs, successRate, level, reason }
}

const LEVEL = {
  red:    { label: "Needs attention", dot: "bg-red-500",    text: "text-red-600",    icon: AlertTriangle },
  yellow: { label: "Watch",           dot: "bg-yellow-500", text: "text-yellow-600", icon: AlertTriangle },
  green:  { label: "Healthy",         dot: "bg-green-500",  text: "text-green-600",  icon: CheckCircle2 },
} as const

export default function HealthPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<ClientHealth[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      fetch(`${API_BASE}/api/v1/admin/customers`, { headers: auth() }).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE}/api/v1/admin/agents`, { headers: auth() }).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE}/api/v1/admin/analytics?days=30`, { headers: auth() }).then(r => r.ok ? r.json() : null),
    ])
      .then(([custs, agents, analytics]: [Customer[], Agent[], { agent_performance?: AgentPerf[] } | null]) => {
        const perfByAgent: Record<number, AgentPerf> = {}
        for (const p of analytics?.agent_performance ?? []) perfByAgent[p.agent_id] = p
        const health = custs.map(c => computeHealth(c, agents, perfByAgent))
        const order = { red: 0, yellow: 1, green: 2 }
        health.sort((a, b) => order[a.level] - order[b.level])
        setRows(health)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = rows.filter(r => r.customer.company_name.toLowerCase().includes(search.toLowerCase()))
  const counts = (l: ClientHealth["level"]) => rows.filter(r => r.level === l).length

  return (
    <BaseLayout title="Client Health" description="At-a-glance view of which clients need attention">
      <div className="px-4 lg:px-6 space-y-6">

        <div className="grid grid-cols-3 gap-3">
          {(["red", "yellow", "green"] as const).map(l => (
            <Card key={l} className="py-3">
              <div className="flex items-center justify-center gap-2">
                <span className={`size-2.5 rounded-full ${LEVEL[l].dot}`} />
                <span className="text-2xl font-bold tabular-nums">{counts(l)}</span>
              </div>
              <div className="text-xs text-muted-foreground text-center mt-0.5">{LEVEL[l].label}</div>
            </Card>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search clients…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" size="icon" onClick={load}><RefreshCcw className="size-4" /></Button>
        </div>

        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border rounded-xl text-center">
            <HeartPulse className="size-10 text-muted-foreground mb-3" />
            <p className="font-medium">No clients yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(r => {
              const lv = LEVEL[r.level]
              return (
                <Card key={r.customer.id} className="hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate(`/admin/clients/${r.customer.id}`)}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <span className={`size-3 rounded-full shrink-0 ${lv.dot}`} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm">{r.customer.company_name}</div>
                      <div className={`text-xs ${lv.text}`}>{r.reason}</div>
                    </div>
                    <div className="hidden sm:flex items-center gap-5 text-xs text-muted-foreground shrink-0">
                      <span className="flex items-center gap-1"><Bot className="size-3" />{r.activeAgents}/{r.totalAgents} active</span>
                      <span>{r.runs} runs</span>
                      <span>{r.successRate === null ? "—" : `${r.successRate}% success`}</span>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </BaseLayout>
  )
}
