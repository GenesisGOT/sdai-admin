"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Webhook, Code2, Plus, Trash2, Send, Copy, Check, RefreshCcw, Users,
} from "lucide-react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const API_BASE = import.meta.env.VITE_API_URL ?? ""
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("sdai_token")}`, "Content-Type": "application/json" })

interface Customer { id: number; company_name: string; email: string }
interface Agent { id: number; name: string; agent_type: string; status: string }
interface Integration { id: number; provider: string; auth_token: string; config: { events?: string[] } | null; is_active: boolean }

export default function IntegrationsPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [clientId, setClientId] = useState<string>("")
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(false)
  const [newUrl, setNewUrl] = useState("")
  const [adding, setAdding] = useState(false)
  const [testing, setTesting] = useState<number | null>(null)
  const [testResult, setTestResult] = useState<Record<number, string>>({})
  const [copied, setCopied] = useState<number | null>(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/admin/customers`, { headers: auth() })
      .then(r => r.ok ? r.json() : []).then(setCustomers).catch(() => {})
  }, [])

  const loadClient = useCallback((cid: string) => {
    if (!cid) return
    setLoading(true)
    Promise.all([
      fetch(`${API_BASE}/api/v1/admin/customers/${cid}/integrations`, { headers: auth() }).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE}/api/v1/admin/customers/${cid}/agents`, { headers: auth() }).then(r => r.ok ? r.json() : []),
    ]).then(([ints, ags]) => { setIntegrations(ints); setAgents(ags) })
      .catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { if (clientId) loadClient(clientId) }, [clientId, loadClient])

  async function addWebhook() {
    if (!newUrl.startsWith("http")) return
    setAdding(true)
    await fetch(`${API_BASE}/api/v1/admin/customers/${clientId}/integrations`, {
      method: "POST", headers: auth(), body: JSON.stringify({ url: newUrl }),
    })
    setNewUrl(""); setAdding(false); loadClient(clientId)
  }

  async function testWebhook(id: number) {
    setTesting(id)
    const r = await fetch(`${API_BASE}/api/v1/admin/integrations/${id}/test`, { method: "POST", headers: auth() })
    setTestResult(p => ({ ...p, [id]: r.ok ? "✓ Delivered" : "✗ Failed" }))
    setTesting(null)
  }

  async function deleteWebhook(id: number) {
    if (!confirm("Remove this webhook?")) return
    await fetch(`${API_BASE}/api/v1/admin/integrations/${id}`, { method: "DELETE", headers: auth() })
    loadClient(clientId)
  }

  function embedCode(agentId: number) {
    return `<script src="${API_BASE}/api/v1/webchat/widget.js" data-agent="${agentId}" data-title="Chat with us" data-color="#2563eb"></script>`
  }

  function copyEmbed(agentId: number) {
    navigator.clipboard.writeText(embedCode(agentId))
    setCopied(agentId); setTimeout(() => setCopied(null), 1500)
  }

  const webhooks = integrations.filter(i => i.provider === "zapier")

  return (
    <BaseLayout title="Integrations & Widgets" description="Connect a client's agents into their CRM and website">
      <div className="px-4 lg:px-6 space-y-6">
        {/* Client picker */}
        <div className="flex items-center gap-3">
          <Users className="size-4 text-muted-foreground" />
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger className="w-80"><SelectValue placeholder="Select a client…" /></SelectTrigger>
            <SelectContent>
              {customers.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.company_name} ({c.email})</SelectItem>)}
            </SelectContent>
          </Select>
          {clientId && <Button variant="outline" size="icon" onClick={() => loadClient(clientId)}><RefreshCcw className="size-4" /></Button>}
        </div>

        {!clientId ? (
          <div className="flex flex-col items-center justify-center py-20 border rounded-xl text-center">
            <Webhook className="size-12 text-muted-foreground mb-3" />
            <p className="font-medium">Select a client to manage their integrations</p>
          </div>
        ) : loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Webhooks */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 font-semibold"><Webhook className="size-4 text-primary" />CRM Webhooks</div>
                <p className="text-xs text-muted-foreground -mt-2">Agent events (replies, leads, bookings) push to this URL — connect Zapier, Make, or any CRM.</p>
                <div className="flex gap-2">
                  <Input placeholder="https://hooks.zapier.com/…" value={newUrl} onChange={e => setNewUrl(e.target.value)} />
                  <Button onClick={addWebhook} disabled={adding || !newUrl.startsWith("http")}><Plus className="size-4" /></Button>
                </div>
                {webhooks.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No webhooks yet.</p>
                ) : webhooks.map(w => (
                  <div key={w.id} className="flex items-center gap-2 rounded-lg border p-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono truncate">{w.auth_token}</div>
                      {testResult[w.id] && <div className="text-[11px] mt-0.5">{testResult[w.id]}</div>}
                    </div>
                    <Button size="sm" variant="ghost" disabled={testing === w.id} onClick={() => testWebhook(w.id)} title="Send test event"><Send className="size-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteWebhook(w.id)}><Trash2 className="size-3.5" /></Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Web-chat widgets */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 font-semibold"><Code2 className="size-4 text-primary" />Website Chat Widget</div>
                <p className="text-xs text-muted-foreground -mt-2">Paste this snippet into the client's website to add their AI agent as a chat bubble.</p>
                {agents.filter(a => a.status === "active").length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No active agents. Deploy & activate an agent first.</p>
                ) : agents.filter(a => a.status === "active").map(a => (
                  <div key={a.id} className="rounded-lg border p-3 space-y-2">
                    <div className="text-sm font-medium">{a.name} <span className="text-xs text-muted-foreground">· {a.agent_type}</span></div>
                    <pre className="text-[10px] bg-muted rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">{embedCode(a.id)}</pre>
                    <Button size="sm" variant="outline" className="w-full" onClick={() => copyEmbed(a.id)}>
                      {copied === a.id ? <><Check className="size-3.5 mr-1.5" />Copied!</> : <><Copy className="size-3.5 mr-1.5" />Copy embed code</>}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </BaseLayout>
  )
}
