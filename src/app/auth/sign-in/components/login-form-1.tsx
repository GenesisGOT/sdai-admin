"use client"

import { useState } from "react"
import { Lock, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const API_BASE = import.meta.env.VITE_API_URL ?? ""

export function LoginForm1({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [passcode, setPasscode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!passcode.trim() || loading) return
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      })
      if (!res.ok) throw new Error("Incorrect passcode")
      const data = await res.json()
      localStorage.setItem("sdai_token", data.access_token)
      // Full reload so AuthContext picks up the new token, then land on /admin
      window.location.href = "/admin"
    } catch {
      setError("Incorrect passcode. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="size-5 text-primary" />
          </div>
          <CardTitle className="text-xl">Admin Access</CardTitle>
          <CardDescription>Enter the admin passcode to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Input
              type="password"
              inputMode="numeric"
              autoFocus
              placeholder="Passcode"
              value={passcode}
              onChange={e => setPasscode(e.target.value)}
              className="text-center tracking-widest"
            />
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" disabled={loading || !passcode.trim()} className="w-full">
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Enter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
