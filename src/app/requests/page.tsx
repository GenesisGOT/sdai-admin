"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Clock, CheckCircle2, Loader2, XCircle, RefreshCcw, MessageSquarePlus, Building2,
} from "lucide-react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const API_BASE = import.meta.env.VITE_API_URL ?? ""
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("sdai_token")}`, "Content-Type": "application/json" })

interface ChangeRequest {
  id: number
  customer_id: number
  agent_id: number | null
  category: string
  subject: string
  details: string
  status: string
  created_at: string
}
interface Customer { id: number; company_name: string; email: string }

const CATEGORY_LABELS: Record<string, string> = {
  new_agent: "New agent", edit_agent: "Edit agent", messaging: "Messaging",
  scheduling: "Scheduling", pause: "Pause", other: "Other",
}
const STATUS = {
  open:        { label: "Open",        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",         icon: Loader2 },
  done:        { label: "Done",        color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",      icon: CheckCircle2 },
  declined:    { label: "Declined",    color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",            icon: XCircle },
} as const

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<ChangeRequest[]>([])
  const [customers, setCustomers] = useState<Record<number, Customer>>({})
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const qs = statusFilter !== "all" ? `?status=${statusFilter}` : ""
    Promise.all([
      fetch(`${API_BASE}/api/v1/change-requests/${qs}`, { headers: auth() }).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE}/api/v1/admin/customers`, { headers: auth() }).then(r => r.ok ? r.json() : []),
    ])
      .then(([reqs, custs]: [ChangeRequest[], Customer[]]) => {
        setRequests(reqs)
        setCustomers(Object.fromEntries(custs.map(c => [c.id, c])))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  async function setStatus(id: number, status: string) {
    setBusyId(id)
    await fetch(`${API_BASE}/api/v1/change-requests/${id}/status`, {
      method: "PATCH", headers: auth(), body: JSON.stringify({ status }),
    })
    load(); setBusyId(null)
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
  const counts = (s: string) => requests.filter(r => r.status === s).length

  return (
    <BaseLayout title="Change Requests" description="Client requests to set up or change agents — triage and action them">
      <div className="px-4 lg:px-6 space-y-6">

        {/* Stat chips */}
        <div className="grid grid-cols-4 gap-3">
          {(["open", "in_progress", "done", "declined"] as const).map(s => (
            <Card key={s} className="text-center py-3">
              <div className={`text-2xl font-bold tabular-nums ${STATUS[s].color.split(" ")[1]}`}>{counts(s)}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{STATUS[s].label}</div>
            </Card>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={load}><RefreshCcw className="size-4" /></Button>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border rounded-xl text-center">
            <MessageSquarePlus className="size-10 text-muted-foreground mb-3" />
            <p className="font-medium">No change requests</p>
            <p className="text-sm text-muted-foreground mt-1">Requests from clients will show up here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(r => {
              const sc = STATUS[r.status as keyof typeof STATUS] ?? STATUS.open
              const Icon = sc.icon
              const cust = customers[r.customer_id]
              const busy = busyId === r.id
              return (
                <Card key={r.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="size-3" />{cust?.company_name ?? `Client #${r.customer_id}`}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {CATEGORY_LABELS[r.category] ?? r.category}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${sc.color}`}>
                            <Icon className="size-2.5" />{sc.label}
                          </span>
                        </div>
                        <div className="font-medium text-sm">{r.subject}</div>
                        <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">{r.details}</p>
                        <div className="text-[11px] text-muted-foreground mt-1.5">{fmt(r.created_at)}{cust ? ` · ${cust.email}` : ""}</div>
                      </div>
                      {/* Triage */}
                      <div className="flex sm:flex-col gap-1.5 shrink-0">
                        {r.status !== "in_progress" && r.status !== "done" && (
                          <Button size="sm" variant="outline" className="h-8 text-xs" disabled={busy} onClick={() => setStatus(r.id, "in_progress")}>Start</Button>
                        )}
                        {r.status !== "done" && (
                          <Button size="sm" variant="outline" className="h-8 text-xs text-green-700 border-green-300 hover:bg-green-50" disabled={busy} onClick={() => setStatus(r.id, "done")}>Done</Button>
                        )}
                        {r.status !== "declined" && r.status !== "done" && (
                          <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground" disabled={busy} onClick={() => setStatus(r.id, "declined")}>Decline</Button>
                        )}
                      </div>
                    </div>
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
