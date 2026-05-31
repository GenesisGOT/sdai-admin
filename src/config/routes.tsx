import { lazy } from 'react'
import { Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'

const AdminHome       = lazy(() => import('@/app/admin/page'))
const LangFlow        = lazy(() => import('@/app/langflow/page'))
const Requests        = lazy(() => import('@/app/requests/page'))
const Integrations    = lazy(() => import('@/app/admin/integrations/page'))
const Discovery       = lazy(() => import('@/app/discovery/page'))
const AdminClient     = lazy(() => import('@/app/admin/clients/page'))
const AdminReplies    = lazy(() => import('@/app/admin/replies/page'))
const AdminContacts   = lazy(() => import('@/app/admin/contacts/page'))
const AdminInvitations = lazy(() => import('@/app/admin/invitations/page'))
const AdminAnalytics  = lazy(() => import('@/app/admin/analytics/page'))
const AdminTemplates  = lazy(() => import('@/app/admin/templates/page'))

const SignIn = lazy(() => import('@/app/auth/sign-in/page'))

const UserSettings        = lazy(() => import('@/app/settings/user/page'))
const AccountSettings     = lazy(() => import('@/app/settings/account/page'))
const BillingSettings     = lazy(() => import('@/app/settings/billing/page'))
const AppearanceSettings  = lazy(() => import('@/app/settings/appearance/page'))
const NotificationSettings = lazy(() => import('@/app/settings/notifications/page'))

const NotFound = lazy(() => import('@/app/errors/not-found/page'))
const Forbidden = lazy(() => import('@/app/errors/forbidden/page'))

export interface RouteConfig {
  path: string
  element: React.ReactNode
  children?: RouteConfig[]
}

export const routes: RouteConfig[] = [
  // Default → admin home
  { path: "/", element: <Navigate to="/admin" replace /> },

  // Auth
  { path: "/auth/sign-in", element: <SignIn /> },

  // Admin pages (all protected)
  { path: "/admin",                  element: <ProtectedRoute><AdminHome /></ProtectedRoute> },
  { path: "/admin/clients/:id",      element: <ProtectedRoute><AdminClient /></ProtectedRoute> },
  { path: "/admin/replies",          element: <ProtectedRoute><AdminReplies /></ProtectedRoute> },
  { path: "/admin/contacts",         element: <ProtectedRoute><AdminContacts /></ProtectedRoute> },
  { path: "/admin/invitations",      element: <ProtectedRoute><AdminInvitations /></ProtectedRoute> },
  { path: "/admin/analytics",        element: <ProtectedRoute><AdminAnalytics /></ProtectedRoute> },
  { path: "/admin/templates",        element: <ProtectedRoute><AdminTemplates /></ProtectedRoute> },
  { path: "/langflow",               element: <ProtectedRoute><LangFlow /></ProtectedRoute> },
  { path: "/requests",               element: <ProtectedRoute><Requests /></ProtectedRoute> },
  { path: "/admin/integrations",     element: <ProtectedRoute><Integrations /></ProtectedRoute> },
  { path: "/discovery",              element: <ProtectedRoute><Discovery /></ProtectedRoute> },

  // Settings
  { path: "/settings/user",          element: <ProtectedRoute><UserSettings /></ProtectedRoute> },
  { path: "/settings/account",       element: <ProtectedRoute><AccountSettings /></ProtectedRoute> },
  { path: "/settings/billing",       element: <ProtectedRoute><BillingSettings /></ProtectedRoute> },
  { path: "/settings/appearance",    element: <ProtectedRoute><AppearanceSettings /></ProtectedRoute> },
  { path: "/settings/notifications", element: <ProtectedRoute><NotificationSettings /></ProtectedRoute> },

  // Errors
  { path: "/errors/forbidden",       element: <Forbidden /> },
  { path: "*",                        element: <NotFound /> },
]
