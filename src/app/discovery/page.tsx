"use client"

import { useEffect, useState, useCallback } from "react"
import {
  ClipboardList, RefreshCcw, Search, Mail, Phone,
  Building2, Clock, CheckCircle2, XCircle, AlertCircle,
  ChevronDown, ExternalLink,
} from "lucide-react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const API_BASE = import.meta.env.VITE_API_URL ?? ""
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("sdai_token")}`, "Content-Type": "application/json" })

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
  status: string
  created_at: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  new:         { label: "New",         color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",    icon: AlertCircle },
  contacted:   { label: "Contacted",   color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300", icon: Clock },
  qualified:   { label: "Qualified",   color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300", icon: CheckCircle2 },
  converted:   { label: "Converted",   color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",  icon: CheckCircle2 },
  not_a_fit:   { label: "Not a Fit",   color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",        icon: XCircle },
}

const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })

export default function DiscoveryPage() {
  const [leads, setLeads] = useState<Discovery[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selected, setSelected] = useState<Discovery | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const qs = statusFilter !== "all" ? `?status=${statusFilter}` : ""
    fetch(`${API_BASE}/api/v1/discovery/${qs}`, { headers: auth() })
      .then(r => r.ok ? r.json() : [])
      .then(setLeads)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [statusFilter])

  useEffect(() => { load() }, [load])

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

  const newCount = leads.filter(l => l.status === "new").length
  const convertedCount = leads.filter(l => l.status === "converted").length

  return (
    <BaseLayout title="Discovery Forms" description="Leads from the website contact form">
      <div className="px-4 lg:px-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Leads",  value: leads.length,   color: "text-foreground" },
            { label: "New",          value: newCount,       color: "text-blue-600" },
            { label: "Converted",    value: convertedCount, color: "text-green-600" },
            { label: "Conv. Rate",   value: leads.length > 0 ? `${Math.round((convertedCount / leads.length) * 100)}%` : "0%", color: "text-purple-600" },
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
            <Input placeholder="Search leads…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="not_a_fit">Not a Fit</SelectItem>
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
            <p className="font-medium">No leads yet</p>
            <p className="text-sm text-muted-foreground mt-1">Discovery form submissions from your website will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(lead => {
              const sc = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.new
              const StatusIcon = sc.icon
              return (
                <Card key={lead.id} className="hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setSelected(lead)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{lead.full_name}</span>
                          {lead.company_name && <span className="text-xs text-muted-foreground">· {lead.company_name}</span>}
                          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${sc.color}`}>
                            <StatusIcon className="size-2.5" />{sc.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Mail className="size-3" />{lead.email}</span>
                          {lead.phone && <span className="flex items-center gap-1"><Phone className="size-3" />{lead.phone}</span>}
                          {lead.industry && <span className="flex items-center gap-1"><Building2 className="size-3" />{lead.industry}</span>}
                        </div>
                        {lead.goals && <p className="text-xs text-foreground/70 line-clamp-1">{lead.goals}</p>}
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0 text-right space-y-1">
                        <div className="flex items-center gap-1"><Clock className="size-3" />{fmt(lead.created_at)}</div>
                        <Select
                          value={lead.status}
                          onValueChange={v => { updateStatus(lead.id, v); }}
                        >
                          <SelectTrigger
                            className="h-7 text-xs w-32"
                            onClick={e => e.stopPropagation()}
                          >
                            <SelectValue />
                            <ChevronDown className="size-3 ml-1" />
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

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="size-5 text-primary" />
              {selected?.full_name}
              {selected?.company_name && <span className="text-muted-foreground font-normal text-sm">· {selected.company_name}</span>}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              {/* Contact */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/30">
                <div><p className="text-xs text-muted-foreground mb-0.5">Email</p><a href={`mailto:${selected.email}`} className="text-primary hover:underline flex items-center gap-1">{selected.email}<ExternalLink className="size-3" /></a></div>
                <div><p className="text-xs text-muted-foreground mb-0.5">Phone</p><p>{selected.phone || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground mb-0.5">Company</p><p>{selected.company_name || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground mb-0.5">Website</p>{selected.website ? <a href={selected.website} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">{selected.website}<ExternalLink className="size-3" /></a> : <p>—</p>}</div>
                <div><p className="text-xs text-muted-foreground mb-0.5">Industry</p><p>{selected.industry || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground mb-0.5">Team Size</p><p>{selected.business_size || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground mb-0.5">Revenue</p><p>{selected.monthly_revenue || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground mb-0.5">Budget</p><p>{selected.budget || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground mb-0.5">Timeline</p><p>{selected.timeline || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground mb-0.5">How they found us</p><p>{selected.referral_source || "—"}</p></div>
              </div>

              {selected.goals && <div><p className="text-xs font-medium text-muted-foreground mb-1">Goals</p><p className="text-foreground/80 whitespace-pre-wrap">{selected.goals}</p></div>}
              {selected.current_pain && <div><p className="text-xs font-medium text-muted-foreground mb-1">Current Pain Points</p><p className="text-foreground/80 whitespace-pre-wrap">{selected.current_pain}</p></div>}
              {selected.agent_types && <div><p className="text-xs font-medium text-muted-foreground mb-1">Interested In</p><p className="text-foreground/80">{selected.agent_types}</p></div>}
              {selected.notes && <div><p className="text-xs font-medium text-muted-foreground mb-1">Additional Notes</p><p className="text-foreground/80 whitespace-pre-wrap">{selected.notes}</p></div>}

              <div className="flex items-center gap-3 pt-2 border-t">
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
                  <a href={`mailto:${selected.email}`}><Mail className="size-3.5 mr-1.5" />Email Lead</a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </BaseLayout>
  )
}
