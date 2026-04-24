'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Incident, Gateway } from '@/lib/types'
import { mockGateway } from '@/lib/mock-data'

const WS_URL = 'wss://fire-lora-server.onrender.com'

function eventToIncident(event: any): Incident {
  const loc = event.location || {}
  const now = event.timestamp ? new Date(event.timestamp).getTime() : Date.now()
  const priority: Incident['priority'] =
    event.eventTypeCode === 1
      ? event.sourceCode === 1 ? 'critical' : 'high'
      : 'medium'

  return {
    id: `${event.deviceId}-${event.sequence ?? now}`,
    priority,
    status: 'active',
    building: loc.building || event.deviceId,
    district: loc.district || 'Баянгол дүүрэг',
    floor: loc.floor || '—',
    zone: loc.zone || '—',
    alarmSource:
      event.source === 'facp' ? 'Галын Дохиоллын FACP Реле'
      : event.source === 'button' ? 'Галын Дохиоллын Гар Товчлуур'
      : 'Систем',
    timeDetected: new Date(now),
    timeBridged: new Date(now + 3000),
    timeReceived: new Date(now + 6000),
    coordinates: [loc.lat ?? 47.9184, loc.lng ?? 106.9177],
  }
}

export function useFireData() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [gateway, setGateway] = useState<Gateway>({
    ...mockGateway,
    lastHeartbeat: new Date(0), // SSR-safe: hydration зөрөхгүй
  })
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      console.log('[WS] Connected to fire-lora-server')
    }

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data)

        if (data.type === 'init') {
          // Server restart — rebuild active alarms from devices
          const activeIncidents: Incident[] = []
          for (const device of Object.values(data.devices ?? {}) as any[]) {
            if (device.alarm) {
              activeIncidents.push(eventToIncident({
                deviceId: device.deviceId,
                eventTypeCode: 1,
                sourceCode: device.source === 'facp' ? 1 : 2,
                source: device.source,
                sequence: device.sequence,
                timestamp: device.lastSeen ? new Date(device.lastSeen).toISOString() : new Date().toISOString(),
                location: device.location,
              }))
            }
          }
          setIncidents(activeIncidents)

          // Update gateway info from first device
          const firstDevice = Object.values(data.devices ?? {})[0] as any
          if (firstDevice) {
            setGateway(prev => ({
              ...prev,
              rssi: firstDevice.rssi ?? prev.rssi,
              snr: firstDevice.snr ?? prev.snr,
              status: firstDevice.status === 'online' ? 'online' : 'offline',
              lastHeartbeat: new Date(),
            }))
          }
        }

        if (data.type === 'update' && data.event) {
          const event = data.event

          // Update gateway signal
          if (event.rssi) {
            setGateway(prev => ({
              ...prev,
              rssi: event.rssi,
              snr: event.snr ?? prev.snr,
              status: 'online',
              lastHeartbeat: new Date(),
              id: event.gatewayId || prev.id,
            }))
          }

          if (event.alarm && event.eventType === 'alarm') {
            // New alarm — add to incidents
            const incident = eventToIncident(event)
            setIncidents(prev => {
              // Replace if same device already has active alarm
              const filtered = prev.filter(i => !i.id.startsWith(event.deviceId + '-') || i.status !== 'active')
              return [incident, ...filtered]
            })
          } else if (event.eventType === 'heartbeat' && !event.alarm) {
            // Alarm cleared — resolve that device's incidents
            setIncidents(prev =>
              prev.map(i =>
                i.id.startsWith(event.deviceId + '-') && i.status === 'active'
                  ? { ...i, status: 'resolved' as const }
                  : i
              )
            )
          }
        }
      } catch (e) {
        console.error('[WS] Parse error', e)
      }
    }

    ws.onclose = () => {
      setConnected(false)
      console.log('[WS] Disconnected — reconnecting in 5s')
      reconnectRef.current = setTimeout(connect, 5000)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  const acknowledge = useCallback((id: string) => {
    setIncidents(prev => prev.map(i =>
      i.id === id && i.status === 'active'
        ? { ...i, status: 'acknowledged' as const, timeAcknowledged: new Date() }
        : i
    ))
  }, [])

  const resolve = useCallback((id: string) => {
    setIncidents(prev => prev.map(i =>
      i.id === id ? { ...i, status: 'resolved' as const } : i
    ))
  }, [])

  const addTestIncident = useCallback(() => {
    const locations = [
      { building: 'А Блок', floor: '1', zone: 'Дэнлүүний танхим', lat: 47.9184, lng: 106.9177 },
      { building: 'А Блок', floor: 'Подвал', zone: 'Цахилгааны өрөо', lat: 47.9212, lng: 106.9234 },
      { building: 'Б Блок', floor: '1', zone: 'Агуулах', lat: 47.9156, lng: 106.9145 },
      { building: 'Б Блок', floor: '—', zone: 'Шатны буланд', lat: 47.9170, lng: 106.9160 },
    ]
    const loc = locations[Math.floor(Math.random() * locations.length)]
    const now = Date.now()
    const incident: Incident = {
      id: `test-${now}`,
      priority: 'critical',
      status: 'active',
      building: loc.building,
      district: 'Баянгол дүүрэг',
      floor: loc.floor,
      zone: loc.zone,
      alarmSource: 'Туршилтын Дохио',
      timeDetected: new Date(now),
      timeBridged: new Date(now + 3000),
      timeReceived: new Date(now + 6000),
      coordinates: [loc.lat, loc.lng],
    }
    setIncidents(prev => [incident, ...prev])
  }, [])

  return { incidents, gateway, connected, acknowledge, resolve, addTestIncident }
}
