// @ts-nocheck
class ChessSounds {
  private audioContext: AudioContext | null = null
  private enabled = true

  constructor() {
    // Lazy init del AudioContext (para evitar problemas con autoplay)
    this.init()
  }

  private init() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.15) {
    if (!this.enabled || !this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.frequency.value = frequency
    oscillator.type = type

    // Envelope suave para evitar clicks
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + duration)
  }

  // Movimiento normal - sonido sutil y elegante
  move() {
    if (!this.audioContext) return
    
    // Doble tono para simular pieza moviéndose
    this.playTone(440, 0.08, 'sine', 0.12) // A4
    setTimeout(() => {
      this.playTone(554, 0.08, 'sine', 0.08) // C#5
    }, 40)
  }

  // Captura - sonido más pronunciado
  capture() {
    if (!this.audioContext) return
    
    // Sonido más grave y corto
    this.playTone(330, 0.12, 'sine', 0.18) // E4
    setTimeout(() => {
      this.playTone(220, 0.10, 'sine', 0.15) // A3
    }, 50)
  }

  // Jaque - sonido de alerta
  check() {
    if (!this.audioContext) return
    
    this.playTone(880, 0.15, 'square', 0.20) // A5
    setTimeout(() => {
      this.playTone(880, 0.15, 'square', 0.18)
    }, 150)
  }

  // Jaque mate - sonido épico
  checkmate() {
    if (!this.audioContext) return
    
    const notes = [523, 659, 784, 1047] // C-E-G-C (acorde)
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.3, 'sine', 0.15)
      }, i * 80)
    })
  }

  // Movimiento ilegal - sonido de error suave
  illegal() {
    if (!this.audioContext) return
    
    this.playTone(150, 0.15, 'sawtooth', 0.10)
  }

  // Castling - sonido especial
  castle() {
    if (!this.audioContext) return
    
    this.playTone(392, 0.10, 'sine', 0.14) // G4
    setTimeout(() => {
      this.playTone(523, 0.10, 'sine', 0.14) // C5
    }, 60)
    setTimeout(() => {
      this.playTone(659, 0.10, 'sine', 0.12) // E5
    }, 120)
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  isEnabled() {
    return this.enabled
  }
}

// Singleton
let soundsInstance: ChessSounds | null = null

export function getSounds(): ChessSounds {
  if (!soundsInstance) {
    soundsInstance = new ChessSounds()
  }
  return soundsInstance
}
