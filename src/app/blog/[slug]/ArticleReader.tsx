'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface ArticleReaderProps {
  text: string
  onSentenceChange?: (index: number) => void
  onStop?: () => void
}

type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2

const SPEED_OPTIONS: { value: PlaybackSpeed; label: string }[] = [
  { value: 0.5, label: '0.5x' },
  { value: 0.75, label: '0.75x' },
  { value: 1, label: '1x' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
  { value: 2, label: '2x' },
]

export function splitIntoSentences(text: string): string[] {
  const sentences = text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 2)
  
  return sentences
}

export default function ArticleReader({ text, onSentenceChange, onStop }: ArticleReaderProps) {
  const [isSupported, setIsSupported] = useState(true)
  const [voicesLoaded, setVoicesLoaded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [speed, setSpeed] = useState<PlaybackSpeed>(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const currentIndexRef = useRef(0)
  const sentencesRef = useRef<string[]>([])
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const speedMenuRef = useRef<HTMLDivElement>(null)
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const failureCountRef = useRef(0)

  // Check TTS support and wait for voices to load
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsSupported(false)
      return
    }

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      
      if (voices.length > 0) {
        const englishVoice = voices.find(v => v.lang.startsWith('en-US')) 
          || voices.find(v => v.lang.startsWith('en'))
          || voices[0]
        selectedVoiceRef.current = englishVoice
        setVoicesLoaded(true)
      }
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

    let attempts = 0
    const maxAttempts = 10
    const retryInterval = setInterval(() => {
      attempts++
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) {
        loadVoices()
        clearInterval(retryInterval)
      } else if (attempts >= maxAttempts) {
        clearInterval(retryInterval)
        setVoicesLoaded(true)
      }
    }, 500)

    return () => {
      window.speechSynthesis.onvoiceschanged = null
      clearInterval(retryInterval)
    }
  }, [])

  // Close speed menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (speedMenuRef.current && !speedMenuRef.current.contains(event.target as Node)) {
        setShowSpeedMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel()
      onStop?.()
    }
  }, [onStop])

  const handleStop = useCallback(() => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
    setIsPaused(false)
    currentIndexRef.current = 0
    failureCountRef.current = 0
    onSentenceChange?.(-1)
    onStop?.()
  }, [onSentenceChange, onStop])

  const speakSentence = useCallback((index: number) => {
    if (index >= sentencesRef.current.length) {
      setIsPlaying(false)
      setIsPaused(false)
      currentIndexRef.current = 0
      failureCountRef.current = 0
      onSentenceChange?.(-1)
      onStop?.()
      return
    }

    const sentence = sentencesRef.current[index]
    
    if (!sentence || sentence.trim().length < 3) {
      currentIndexRef.current = index + 1
      speakSentence(index + 1)
      return
    }

    const utterance = new SpeechSynthesisUtterance(sentence)
    utterance.rate = speed
    utterance.lang = 'en-US'
    
    if (selectedVoiceRef.current) {
      utterance.voice = selectedVoiceRef.current
      utterance.lang = selectedVoiceRef.current.lang
    }
    
    utterance.onstart = () => {
      failureCountRef.current = 0 // Reset on successful start
      onSentenceChange?.(index)
    }
    
    utterance.onend = () => {
      currentIndexRef.current = index + 1
      setTimeout(() => speakSentence(index + 1), 100)
    }
    
    utterance.onerror = (event) => {
      if (event.error === 'interrupted' || event.error === 'canceled') {
        return
      }
      
      if (event.error === 'synthesis-failed') {
        failureCountRef.current++
        
        // If first 3 sentences all fail, TTS is not working on this device
        if (failureCountRef.current >= 3 && index < 5) {
          setError('Text-to-speech is not available on this device')
          handleStop()
          return
        }
        
        // Otherwise skip and try next sentence
        currentIndexRef.current = index + 1
        setTimeout(() => speakSentence(index + 1), 100)
        return
      }
      
      handleStop()
    }
    
    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [speed, onSentenceChange, onStop, handleStop])

  const handlePlay = useCallback(() => {
    if (!isSupported || !voicesLoaded) return
    
    // Clear any previous error
    setError(null)
    failureCountRef.current = 0
    
    if (isPaused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
      setIsPlaying(true)
      return
    }
    
    window.speechSynthesis.cancel()
    sentencesRef.current = splitIntoSentences(text)
    
    if (sentencesRef.current.length === 0) {
      return
    }
    
    currentIndexRef.current = 0
    setIsPlaying(true)
    setIsPaused(false)
    
    setTimeout(() => {
      speakSentence(0)
    }, 100)
  }, [isSupported, voicesLoaded, isPaused, text, speakSentence])

  const handlePause = useCallback(() => {
    window.speechSynthesis.pause()
    setIsPaused(true)
    setIsPlaying(false)
  }, [])

  const handleSpeedChange = useCallback((newSpeed: PlaybackSpeed) => {
    setSpeed(newSpeed)
    setShowSpeedMenu(false)
    
    if (isPlaying && !isPaused) {
      const currentIndex = currentIndexRef.current
      window.speechSynthesis.cancel()
      
      setTimeout(() => {
        const sentence = sentencesRef.current[currentIndex]
        if (!sentence || sentence.trim().length < 3) return
        
        const utterance = new SpeechSynthesisUtterance(sentence)
        utterance.rate = newSpeed
        utterance.lang = 'en-US'
        
        if (selectedVoiceRef.current) {
          utterance.voice = selectedVoiceRef.current
          utterance.lang = selectedVoiceRef.current.lang
        }
        
        utterance.onstart = () => {
          onSentenceChange?.(currentIndex)
        }
        
        utterance.onend = () => {
          currentIndexRef.current = currentIndex + 1
          setTimeout(() => speakSentence(currentIndex + 1), 100)
        }
        
        utterance.onerror = (event) => {
          if (event.error !== 'interrupted' && event.error !== 'canceled') {
            if (event.error === 'synthesis-failed') {
              currentIndexRef.current = currentIndex + 1
              setTimeout(() => speakSentence(currentIndex + 1), 100)
              return
            }
          }
        }
        
        utteranceRef.current = utterance
        window.speechSynthesis.speak(utterance)
      }, 100)
    }
  }, [isPlaying, isPaused, onSentenceChange, speakSentence])

  const dismissError = useCallback(() => {
    setError(null)
  }, [])

  if (!isSupported) {
    return null
  }

  // Show error message
  if (error) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 text-red-600 text-[13px] font-sans">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="hidden sm:inline">{error}</span>
          <span className="sm:hidden">TTS unavailable</span>
          <button 
            onClick={dismissError}
            className="ml-1 hover:text-red-800"
            aria-label="Dismiss"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {/* Play/Pause Button */}
      {isPlaying ? (
        <button
          onClick={handlePause}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#171d2b]/10 hover:bg-[#171d2b]/15 transition-colors text-[#171d2b] text-[13px] font-sans"
          aria-label="Pause"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
          <span className="hidden sm:inline">Pause</span>
        </button>
      ) : (
        <button
          onClick={handlePlay}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#171d2b]/10 hover:bg-[#171d2b]/15 transition-colors text-[#171d2b] text-[13px] font-sans"
          aria-label={isPaused ? 'Resume' : 'Listen'}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          <span className="hidden sm:inline">{isPaused ? 'Resume' : 'Listen'}</span>
        </button>
      )}

      {/* Stop Button */}
      {(isPlaying || isPaused) && (
        <button
          onClick={handleStop}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-[#171d2b]/10 hover:bg-[#171d2b]/15 transition-colors text-[#171d2b]"
          aria-label="Stop"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h12v12H6z" />
          </svg>
        </button>
      )}

      {/* Speed Control */}
      {(isPlaying || isPaused) && (
        <div className="relative" ref={speedMenuRef}>
          <button
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-[#171d2b]/10 hover:bg-[#171d2b]/15 transition-colors text-[#171d2b] text-[12px] font-sans"
            aria-label="Playback speed"
          >
            {speed}x
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showSpeedMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-[#171d2b]/10 py-1 z-50 min-w-[70px]">
              {SPEED_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSpeedChange(option.value)}
                  className={`w-full px-3 py-1.5 text-left text-[12px] font-sans hover:bg-[#171d2b]/5 transition-colors ${
                    speed === option.value ? 'text-[#171d2b] font-medium bg-[#171d2b]/5' : 'text-[#171d2b]/70'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
