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

function Icon({ name }) {
  const paths = {
    clock: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    timer: (
      <>
        <path d="M8 3h8M12 3v3M7 7l10 10M17 7 7 17" />
        <path d="M7 7a7 7 0 1 0 10 10" />
      </>
    ),
    stopwatch: (
      <>
        <circle cx="12" cy="13" r="6.5" />
        <path d="M12 6.5V4M9.5 4h5M17 8l1.5-1.5M12 10v3l2 1.5" />
      </>
    ),
    palette: (
      <>
        <path d="M12 4a8 8 0 0 0 0 16h1.5a1.5 1.5 0 0 0 0-3H12a2 2 0 0 1 0-4h2a6 6 0 0 0 0-9Z" />
        <circle cx="7.5" cy="10" r=".8" /><circle cx="9" cy="6.8" r=".8" /><circle cx="13" cy="6" r=".8" />
      </>
    ),
    sound: (
      <>
        <path d="M4 10v4h3l4 3V7l-4 3H4Z" />
        <path d="M15 10a3 3 0 0 1 0 4M17 8a6 6 0 0 1 0 8" />
      </>
    ),
    display: (
      <>
        <rect x="4" y="6" width="16" height="11" rx="1.5" />
        <path d="M9 20h6M12 17v3" />
      </>
    ),
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

function StopwatchPage() {
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return undefined
    const timer = window.setInterval(() => setElapsed((value) => value + 10), 10)
    return () => window.clearInterval(timer)
  }, [running])

  const minutes = String(Math.floor(elapsed / 60000)).padStart(2, '0')
  const seconds = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0')
  const hundredths = String(Math.floor((elapsed % 1000) / 10)).padStart(2, '0')

  return (
    <section className="mode-page stopwatch-page" aria-labelledby="stopwatch-title">
      <h1 id="stopwatch-title">{minutes}:{seconds}<small>.{hundredths}</small></h1>
      <div className="stopwatch-actions">
        <button type="button" className="secondary-button" onClick={() => { setElapsed(0); setRunning(false) }}>Reset</button>
        <button type="button" className="primary-button" onClick={() => setRunning(!running)}>{running ? 'Pause' : 'Start'}</button>
      </div>
    </section>
  )
}

function formatTimer(seconds) {
  const hours = String(Math.floor(seconds / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
  const remainingSeconds = String(seconds % 60).padStart(2, '0')
  return `${hours}:${minutes}:${remainingSeconds}`
}

function WheelPicker({ value, max, label, onChange }) {
  const values = [-2, -1, 0, 1, 2].map((offset) => (value + offset + max + 1) % (max + 1))

  return (
    <div className="wheel-picker" aria-label={label}>
      {values.map((item, index) => (
        <button
          type="button"
          className={`wheel-value wheel-position-${index}${index === 2 ? ' selected' : ''}`}
          key={`${item}-${index}`}
          aria-label={`${String(item).padStart(2, '0')} ${label}`}
          onClick={() => onChange(item)}
        >
          {String(item).padStart(2, '0')}
        </button>
      ))}
      <span className="wheel-label">{label}</span>
    </div>
  )
}

function TimerPage() {
  const [duration, setDuration] = useState(15 * 60)
  const [remaining, setRemaining] = useState(15 * 60)
  const [running, setRunning] = useState(false)
  const [started, setStarted] = useState(false)
  const endSound = useRef(new Audio('/timer end.mp3'))
  const soundPlayed = useRef(false)

  useEffect(() => {
    if (!running) return undefined
    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          setRunning(false)
          if (!soundPlayed.current) {
            soundPlayed.current = true
            endSound.current.currentTime = 0
            endSound.current.play().catch((error) => {
              console.error('Unable to play timer completion sound.', error)
            })
          }
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [running])

  const updateDuration = (part, value) => {
    const values = {
      hours: Math.floor(duration / 3600),
      minutes: Math.floor((duration % 3600) / 60),
      seconds: duration % 60,
    }
    const nextDuration = part === 'hours'
      ? Number(value) * 3600 + values.minutes * 60 + values.seconds
      : part === 'minutes'
        ? values.hours * 3600 + Number(value) * 60 + values.seconds
        : values.hours * 3600 + values.minutes * 60 + Number(value)
    setDuration(nextDuration)
    setRemaining(nextDuration)
  }

  const reset = () => {
    setRunning(false)
    setStarted(false)
    setRemaining(duration)
  }

  if (!started) {
    const hours = Math.floor(duration / 3600)
    const minutes = Math.floor((duration % 3600) / 60)
    const seconds = duration % 60
    return (
      <section className="mode-page timer-page" aria-labelledby="timer-title">
        <div className="timer-setup">
          <div className="timer-picker" aria-label="Timer duration">
            <WheelPicker value={hours} max={23} label="hours" onChange={(value) => updateDuration('hours', value)} />
            <WheelPicker value={minutes} max={59} label="minutes" onChange={(value) => updateDuration('minutes', value)} />
            <WheelPicker value={seconds} max={59} label="seconds" onChange={(value) => updateDuration('seconds', value)} />
          </div>
          <button type="button" className="primary-button timer-start" onClick={() => { soundPlayed.current = false; setStarted(true); setRunning(true) }}>Start</button>
        </div>
      </section>
    )
  }

  const progress = duration ? remaining / duration : 0
  return (
    <section className="mode-page timer-page timer-running" aria-labelledby="timer-title">
      <div className="timer-ring" style={{ '--progress': `${progress * 360}deg` }}>
        <div className="timer-readout">
          <h1 id="timer-title">{formatTimer(remaining)}</h1>
          <p>Total {Math.ceil(duration / 60)} minutes</p>
        </div>
      </div>
      <div className="timer-actions">
        <button type="button" className="round-button stop-button" aria-label="Stop timer" onClick={reset}>■</button>
        <button type="button" className="round-button" aria-label={running ? 'Pause timer' : 'Resume timer'} onClick={() => setRunning(!running)}>
          {running ? (
            <span className="timer-symbol" aria-hidden="true">
              <span className="pause-bar" />
              <span className="pause-bar" />
            </span>
          ) : (
            <svg className="timer-symbol play-symbol" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 4.5a1.5 1.5 0 0 1 2.3-1.25l10.2 7.25a1.85 1.85 0 0 1 0 3l-10.2 7.25A1.5 1.5 0 0 1 7 19.5z" />
            </svg>
          )}
        </button>
      </div>
    </section>
  )
}

function App() {
  const [time, setTime] = useState(getTime)
  const [showMinimal, setShowMinimal] = useState(false)
  const [activeMode, setActiveMode] = useState('clock')
  const [dragging, setDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const pointerStart = useRef(null)
  const audioContext = useRef(null)
  const soundEnabled = useRef(false)
  const stopTickSound = useRef(() => {})

  useEffect(() => {
    const timer = window.setInterval(() => setTime(getTime()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (activeMode !== 'clock' || !showMinimal || !soundEnabled.current || !audioContext.current) return undefined

    stopTickSound.current()
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

    stopTickSound.current = () => {
      noise.stop()
      oscillator.stop()
      noise.disconnect()
      filter.disconnect()
      oscillator.disconnect()
      gain.disconnect()
    }

    return () => {
      stopTickSound.current()
      stopTickSound.current = () => {}
    }
  }, [activeMode, showMinimal, time.seconds])

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

  const pages = {
    clock: (
      <main
        className={`clock-stage${dragging ? ' is-dragging' : ''}${showMinimal ? ' show-minimal' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        onContextMenu={(event) => event.preventDefault()}
      >
        <div className="clock-track" style={{ '--base-shift': showMinimal ? '-50%' : '0%', '--drag-offset': `${dragOffset}px` }}>
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
    ),
    timer: <TimerPage />,
    stopwatch: <StopwatchPage />,
  }

  const modes = [
    { id: 'timer', label: 'Timer' },
    { id: 'stopwatch', label: 'Stopwatch' },
    { id: 'clock', label: 'Clock' },
  ]

  return (
    <div className={`app-shell mode-${activeMode}`}>
      {pages[activeMode]}
      <nav
        className="mode-nav"
        aria-label="Clock modes"
        style={{ '--active-index': modes.findIndex(({ id }) => id === activeMode) }}
      >
        {modes.map(({ id, label }) => (
          <button
            type="button"
            className={activeMode === id ? 'active' : ''}
            key={id}
            aria-label={label}
            aria-current={activeMode === id ? 'page' : undefined}
            onClick={() => setActiveMode(id)}
          >
            <Icon name={id} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App
