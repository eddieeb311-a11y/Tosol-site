import type { Incident, ResponsePoint, Gateway } from './types'

export const mockIncidents: Incident[] = [
  {
    id: 'INC-2024-001',
    priority: 'critical',
    status: 'active',
    building: 'А Блок',
    district: 'Баянгол дүүрэг',
    floor: '1',
    zone: 'Дэнлүүний танхим',
    alarmSource: 'Галын Дохиоллын FACP Реле',
    timeDetected: new Date(Date.now() - 240000),
    timeBridged: new Date(Date.now() - 237000),
    timeReceived: new Date(Date.now() - 234000),
    coordinates: [47.9184, 106.9177],
  },
  {
    id: 'INC-2024-002',
    priority: 'high',
    status: 'active',
    building: 'А Блок',
    district: 'Баянгол дүүрэг',
    floor: 'Подвал',
    zone: 'Цахилгааны өрөо',
    alarmSource: 'Галын Дохиоллын Утааны Мэдрэгч',
    timeDetected: new Date(Date.now() - 780000),
    timeBridged: new Date(Date.now() - 777000),
    timeReceived: new Date(Date.now() - 774000),
    coordinates: [47.9212, 106.9234],
  },
  {
    id: 'INC-2024-003',
    priority: 'medium',
    status: 'active',
    building: 'Б Блок',
    district: 'Баянгол дүүрэг',
    floor: '1',
    zone: 'Агуулах',
    alarmSource: 'Галын Дохиоллын Дулааны Мэдрэгч',
    timeDetected: new Date(Date.now() - 480000),
    timeBridged: new Date(Date.now() - 477000),
    timeReceived: new Date(Date.now() - 474000),
    coordinates: [47.9156, 106.9145],
  },
  {
    id: 'INC-2024-004',
    priority: 'high',
    status: 'active',
    building: 'Б Блок',
    district: 'Баянгол дүүрэг',
    floor: '—',
    zone: 'Шатны буланд',
    alarmSource: 'Галын Дохиоллын Гар Товчлуур',
    timeDetected: new Date(Date.now() - 1860000),
    timeBridged: new Date(Date.now() - 1857000),
    timeReceived: new Date(Date.now() - 1854000),
    coordinates: [47.9170, 106.9160],
  },
]

export const mockResponsePoints: ResponsePoint[] = [
  {
    id: 'RP-001',
    name: 'Баянгол Галын Анги №1',
    type: 'fire_station',
    coordinates: [47.9134, 106.9097],
    distance: 1.2,
    eta: 4,
    isNearest: true,
  },
  {
    id: 'RP-002',
    name: 'Төв Яаралтай Тусламжийн Анги',
    type: 'emergency_center',
    coordinates: [47.9245, 106.9312],
    distance: 2.8,
    eta: 8,
    isNearest: false,
  },
  {
    id: 'RP-003',
    name: 'Сүхбаатар Галын Анги №2',
    type: 'fire_station',
    coordinates: [47.9298, 106.9187],
    distance: 3.1,
    eta: 9,
    isNearest: false,
  },
]

export const mockGateway: Gateway = {
  id: 'GW-UB-047',
  name: 'Дотоод Гарц — А Блок',
  coordinates: [47.9180, 106.9170],
  battery: 87,
  rssi: -72,
  snr: 9.5,
  lastHeartbeat: new Date(Date.now() - 15000),
  status: 'online',
}

export const consoleLocation: [number, number] = [47.9265, 106.9350]

let testCounter = 5

export function createTestIncident(): Incident {
  const locations = [
    { building: 'А Блок', floor: '1', zone: 'Дэнлүүний танхим', coords: [47.9184, 106.9177] as [number, number] },
    { building: 'А Блок', floor: 'Подвал', zone: 'Цахилгааны өрөо', coords: [47.9212, 106.9234] as [number, number] },
    { building: 'Б Блок', floor: '1', zone: 'Агуулах', coords: [47.9156, 106.9145] as [number, number] },
    { building: 'Б Блок', floor: '—', zone: 'Шатны буланд', coords: [47.9170, 106.9160] as [number, number] },
  ]
  const loc = locations[Math.floor(Math.random() * locations.length)]
  const priorities: Incident['priority'][] = ['critical', 'high', 'medium']
  const now = Date.now()
  const id = `INC-TEST-${String(testCounter++).padStart(3, '0')}`
  return {
    id,
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    status: 'active',
    building: loc.building,
    district: 'Баянгол дүүрэг',
    floor: loc.floor,
    zone: loc.zone,
    alarmSource: 'Туршилтын Дохио',
    timeDetected: new Date(now),
    timeBridged: new Date(now + 3000),
    timeReceived: new Date(now + 6000),
    coordinates: loc.coords,
  }
}
