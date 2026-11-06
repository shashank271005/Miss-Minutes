import { useEffect, useRef, useState } from 'react'
import './App.css'

function getTime() {
  const now = new Date()
  let hours = now.getHours()
  const period = hours >= 12 ? 'PM' : 'AM'

  hours = hours % 12 || 12

  return {
    hours: String(hours).padStart(2, '0'),
    minutes: String(now.getMinutes()).padStart(2, '0'),
    seconds: String(now.getSeconds()).padStart(2, '0'),
    period,
  }
}

function Digit({ value }) {
  const [displayValue, setDisplayValue] = useState(value)
  const [flip, setFlip] = useState(null)

  useEffect(() => {
    if (value === displayValue) return undefined

    setFlip({ from: displayValue, to: value })
    const timer = window.setTimeout(() => {
      setDisplayValue(value)
      setFlip(null)
    }, 560)

    return () => window.clearTimeout(timer)
  }, [value, displayValue])

  return (
    <span className={`digit${flip ? ' is-flipping' : ''}`} aria-hidden="true">
      {flip ? (
        <>
          <span className="digit-roll-old">{flip.from}</span>
          <span className="digit-roll-new">{flip.to}</span>
        </>
      ) : (
        <>
          <span className="digit-half digit-half-top">{displayValue}</span>
          <span className="digit-half digit-half-bottom">{displayValue}</span>
        </>
      )}
    </span>
  )
}

function TimePanel({ value, label, period }) {
  return (
    <div className="time-panel" aria-label={`${label} ${value}`}>
      <div className="digits">
        <Digit value={value[0]} />
        <Digit value={value[1]} />
      </div>
      {label === 'Hours' && <span className="period">{period}</span>}
    </div>
  )
}

function RollingSeconds({ value }) {
  const [displayValue, setDisplayValue] = useState(value)
  const [transition, setTransition] = useState(null)

  useEffect(() => {
    if (value === displayValue) return undefined

    setTransition({ from: displayValue, to: value })
    const timer = window.setTimeout(() => {
      setDisplayValue(value)
      setTransition(null)
    }, 500)

    return () => window.clearTimeout(timer)
  }, [value, displayValue])

  return (
    <span className="seconds-slot" data-value={transition?.to || displayValue}>
      {transition ? (
        <>
          <span className="seconds-old">{transition.from}</span>
          <span className="seconds-new">{transition.to}</span>
        </>
      ) : (
        <span>{displayValue}</span>
      )}
    </span>
  )
}

function MinimalClock({ time }) {
  return (
    <section className="minimal-clock" aria-label="Minimal current time">
      <span>{time.hours}</span>
      <b aria-hidden="true">:</b>
      <span>{time.minutes}</span>
      <b aria-hidden="true">:</b>
      <RollingSeconds value={time.seconds} />
      <span className="minimal-period">{time.period}</span>
    </section>
  )
}

function App() {
  const [time, setTime] = useState(getTime)
  const [showMinimal, setShowMinimal] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const pointerStart = useRef(null)
  const audioContext = useRef(null)
  const soundEnabled = useRef(false)

  useEffect(() => {
    const timer = window.setInterval(() => setTime(getTime()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!showMinimal || !soundEnabled.current || !audioContext.current) return undefined

    const context = audioContext.current
    const noise = context.createBufferSource()
    const noiseBuffer = context.createBuffer(1, context.sampleRate * 0.045, context.sampleRate)
    const noiseData = noiseBuffer.getChannelData(0)
    const filter = context.createBiquadFilter()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const startTime = context.currentTime

    for (let index = 0; index < noiseData.length; index += 1) {
      noiseData[index] = Math.random() * 2 - 1
    }

    noise.buffer = noiseBuffer
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(2400, startTime)
    filter.Q.setValueAtTime(1.2, startTime)
    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(1450, startTime)
    gain.gain.setValueAtTime(0.0001, startTime)
    gain.gain.exponentialRampToValueAtTime(0.06, startTime + 0.002)
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.045)
    noise.connect(filter)
    filter.connect(gain)
    oscillator.connect(gain)
    gain.connect(context.destination)
    noise.start(startTime)
    noise.stop(startTime + 0.045)
    oscillator.start(startTime)
    oscillator.stop(startTime + 0.045)

    return () => {
      noise.disconnect()
      filter.disconnect()
      oscillator.disconnect()
      gain.disconnect()
    }
  }, [showMinimal, time.seconds])

  const handlePointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (!audioContext.current) audioContext.current = new AudioContext()
    if (audioContext.current.state === 'suspended') audioContext.current.resume()
    soundEnabled.current = true
    pointerStart.current = event.clientX
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
  }

  const handlePointerMove = (event) => {
    if (pointerStart.current === null) return
    const rawOffset = event.clientX - pointerStart.current
    const allowedOffset = showMinimal ? Math.max(0, rawOffset) : Math.min(0, rawOffset)

    if ((!showMinimal && rawOffset < -90) || (showMinimal && rawOffset > 90)) {
      setShowMinimal(!showMinimal)
      pointerStart.current = null
      setDragging(false)
      setDragOffset(0)
      return
    }

    setDragOffset(allowedOffset)
  }

  const handleWheel = (event) => {
    if (Math.abs(event.deltaX) < 24) return
    setShowMinimal(event.deltaX < 0)
  }

  const handlePointerUp = () => {
    if (pointerStart.current === null) return
    const distance = dragOffset
    const shouldSwitch = showMinimal ? distance > 90 : distance < -90
    setShowMinimal(shouldSwitch ? !showMinimal : showMinimal)
    pointerStart.current = null
    setDragging(false)
    setDragOffset(0)
  }

  return (
    <main
      className={`clock-stage${dragging ? ' is-dragging' : ''}${showMinimal ? ' show-minimal' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div
        className="clock-track"
        style={{
          '--base-shift': showMinimal ? '-50%' : '0%',
          '--drag-offset': `${dragOffset}px`,
        }}
      >
        <div className="clock-view">
          <section className="clock" aria-label="Current time">
            <TimePanel value={time.hours} label="Hours" period={time.period} />
            <span className="separator" aria-hidden="true">:</span>
            <TimePanel value={time.minutes} label="Minutes" />
          </section>
        </div>
        <div className="clock-view">
          <MinimalClock time={time} />
        </div>
      </div>
    </main>
  )
}

export default App
