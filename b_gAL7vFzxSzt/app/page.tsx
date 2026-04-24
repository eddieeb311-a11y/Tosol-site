'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Navigation } from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { IncidentQueue } from '@/components/dashboard/incident-queue'
import { IncidentDetails } from '@/components/dashboard/incident-details'
import { SignalIndicator } from '@/components/dashboard/signal-indicator'
import { mockResponsePoints } from '@/lib/mock-data'
import { useFireData } from '@/hooks/use-fire-data'

const ResponseMap = dynamic(
  () => import('@/components/dashboard/response-map').then(mod => mod.ResponseMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[oklch(0.1_0.005_260)]">
        <div className="text-center">
          <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[var(--signal-blue)] border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    )
  }
)

export default function EmergencyDashboard() {
  const { incidents, gateway, connected, acknowledge, resolve, addTestIncident } = useFireData()
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null)

  // Auto-select first active incident
  const activeIncidents = incidents.filter(i => i.status === 'active')
  const effectiveSelectedId = selectedIncidentId && incidents.find(i => i.id === selectedIncidentId)
    ? selectedIncidentId
    : (activeIncidents[0]?.id ?? incidents[0]?.id ?? null)

  const selectedIncident = incidents.find(i => i.id === effectiveSelectedId) || null
  const nearestResponse = mockResponsePoints.find(r => r.isNearest) || null

  const handleAcknowledge = () => {
    if (effectiveSelectedId) acknowledge(effectiveSelectedId)
  }

  const handleEscalate = () => {
    if (effectiveSelectedId) {
      resolve(effectiveSelectedId)
      const next = incidents.find(i => i.id !== effectiveSelectedId && i.status === 'active')
      if (next) setSelectedIncidentId(next.id)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <DashboardHeader incidents={incidents} connected={connected} />

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 flex-shrink-0 border-r border-border overflow-hidden">
          <IncidentQueue
            incidents={incidents}
            selectedId={effectiveSelectedId}
            onSelect={setSelectedIncidentId}
          />
        </aside>

        <main className="relative flex-1 overflow-hidden">
          <ResponseMap
            incident={selectedIncident}
            responsePoints={mockResponsePoints}
            gateway={gateway}
          />

          <SignalIndicator isActive={!!selectedIncident} />

          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
            {selectedIncident && nearestResponse ? (
              <div className="rounded-lg bg-card/95 px-5 py-2.5 backdrop-blur-sm border border-[var(--alert-critical)]/40 shadow-lg flex items-center gap-3">
                <span className="flex h-2 w-2 rounded-full bg-[var(--alert-critical)] animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--alert-critical)]">
                  Гал Түймэр Идэвхтэй
                </span>
                <span className="h-3.5 w-px bg-border" />
                <Navigation className="h-3 w-3 text-[var(--status-online)]" />
                <span className="text-xs font-medium text-foreground">{nearestResponse.name}</span>
                <span className="text-xs text-muted-foreground">томилогдсон</span>
                <span className="h-3.5 w-px bg-border" />
                <span className="font-mono text-sm font-bold text-[var(--status-online)]">
                  {nearestResponse.eta} мин
                </span>
              </div>
            ) : (
              <div className="rounded-lg bg-card/95 px-4 py-2 backdrop-blur-sm border border-border shadow-lg">
                <p className="text-xs font-medium text-muted-foreground">
                  {connected ? 'Идэвхтэй осол байхгүй — Систем хянаж байна' : 'Серверт холбогдож байна...'}
                </p>
              </div>
            )}
          </div>

          {/* Test button */}
          <div className="absolute bottom-4 right-4 z-[1000]">
            <button
              onClick={addTestIncident}
              className="rounded-lg bg-card/95 border border-[var(--warning-amber)]/50 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[var(--warning-amber)] hover:bg-[var(--warning-amber)]/10 backdrop-blur-sm transition-colors"
            >
              ⚡ Туршилтын Дохио
            </button>
          </div>
        </main>

        <aside className="w-96 flex-shrink-0 border-l border-border overflow-hidden">
          <IncidentDetails
            incident={selectedIncident}
            nearestResponse={nearestResponse}
            gateway={gateway}
            onAcknowledge={handleAcknowledge}
            onEscalate={handleEscalate}
          />
        </aside>
      </div>
    </div>
  )
}
