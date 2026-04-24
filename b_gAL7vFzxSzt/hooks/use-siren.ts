'use client'

import { useEffect, useRef, useCallback } from 'react'

export function useSiren(isActive: boolean) {
  const ctxRef = useRef<AudioContext | null>(null)
  const oscRef = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const lfoRef = useRef<OscillatorNode | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const unlockedRef = useRef(false)

  // Хэрэглэгч анх дарахад AudioContext unlock хийнэ
  const unlock = useCallback(() => {
    if (unlockedRef.current) return
    unlockedRef.current = true
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext()
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume()
    }
  }, [])

  useEffect(() => {
    window.addEventListener('click', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('click', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [unlock])

  const stopSiren = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    try {
      oscRef.current?.stop()
      lfoRef.current?.stop()
    } catch (_) {}
    oscRef.current = null
    lfoRef.current = null
    gainRef.current = null
  }, [])

  const startSiren = useCallback(() => {
    if (!unlockedRef.current) return
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext()
    }
    const ctx = ctxRef.current
    if (ctx.state === 'suspended') ctx.resume()

    stopSiren()

    // Siren: 2 давтамж хооронд ээлжлэх (800Hz ↔ 1200Hz)
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.value = 900

    lfo.type = 'sine'
    lfo.frequency.value = 1.2  // 1.2 удаа/секунд ээлжлэх
    lfoGain.gain.value = 250   // ±250Hz хэлбэлзэл

    lfo.connect(lfoGain)
    lfoGain.connect(osc.frequency)

    gain.gain.value = 0.4
    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    lfo.start()

    oscRef.current = osc
    gainRef.current = gain
    lfoRef.current = lfo
  }, [stopSiren])

  useEffect(() => {
    if (isActive) {
      startSiren()
    } else {
      stopSiren()
    }
    return () => stopSiren()
  }, [isActive, startSiren, stopSiren])
}
