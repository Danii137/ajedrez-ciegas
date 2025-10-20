// Integración con Stockfish WASM/Worker.
// Este módulo intenta crear un Web Worker que cargue `public/stockfish/stockfish.js`.
// Si falla (entorno no soportado o carga), cae al motor simplificado incluido.

import { Chess } from 'chess.js'
import stockfishScriptUrl from 'stockfish/src/stockfish-17.1-lite-single-03e3232.js?url'
import stockfishWasmUrl from 'stockfish/src/stockfish-17.1-lite-single-03e3232.wasm?url'

type WorkerLike = {
  postMessage: (msg: any) => void
  addEventListener: (type: string, listener: (ev: MessageEvent<any>) => void) => void
  removeEventListener: (type: string, listener: (ev: MessageEvent<any>) => void) => void
  terminate?: () => void
}

// helper: espera hasta que predicate() sea true o timeout
function waitFor(predicate: () => boolean, timeout = 3000, interval = 50) {
  return new Promise<void>((resolve, reject) => {
    const start = Date.now()
    const iv = setInterval(() => {
      try {
        if (predicate()) {
          clearInterval(iv)
          resolve()
          return
        }
        if (Date.now() - start > timeout) {
          clearInterval(iv)
          reject(new Error('waitFor timeout'))
        }
      } catch (err) {
        clearInterval(iv)
        reject(err)
      }
    }, interval)
  })
}

class RealStockfish {
  private worker: WorkerLike | null = null
  private ready = false
  private readyListenerAttached = false
  private blobUrl: string | null = null
  private currentSkillLevel = -1
  private strongMode = false

  private readonly readyHandler = (ev: MessageEvent<any>) => {
    const payload = ev && 'data' in ev ? ev.data : ev

    if (typeof payload === 'string') {
      if (payload.includes('uciok') || payload.includes('readyok') || payload.includes('bestmove')) {
        this.ready = true
      }
      return
    }

    if (!payload) return

    if (payload === 'uciok' || payload === 'readyok') {
      this.ready = true
      return
    }

    if (typeof payload === 'object' && (payload.bestmove || payload.type === 'ready')) {
      this.ready = true
    }
  }

  private attachReadyListener() {
    if (!this.worker || this.readyListenerAttached) return
    try {
      this.worker.addEventListener('message', this.readyHandler)
      this.readyListenerAttached = true
    } catch (err) {
      console.warn('No se pudo registrar listener de Stockfish:', err)
    }
  }

  private async handshake() {
    if (!this.worker) throw new Error('Stockfish no disponible')
    this.ready = false
    this.attachReadyListener()

    try { this.worker.postMessage('uci') } catch (e) {}
    try { this.worker.postMessage('isready') } catch (e) {}

    await waitFor(() => this.ready, 5000)
  }

  private cleanupWorker() {
    if (this.worker) {
      try { this.worker.removeEventListener('message', this.readyHandler) } catch (e) {}
      try { this.worker.terminate?.() } catch (e) {}
    }
    this.worker = null
    this.readyListenerAttached = false
    this.ready = false
    if (this.blobUrl) {
      try { URL.revokeObjectURL(this.blobUrl) } catch (e) {}
      this.blobUrl = null
    }
    this.currentSkillLevel = -1
    this.strongMode = false
  }

  async init() {
    this.cleanupWorker()
    let lastError: unknown = null

    try {
      this.worker = this.createWorkerFromAssets()
      await this.handshake()
      return
    } catch (err) {
      console.warn('No se pudo iniciar Stockfish desde assets locales:', err)
      this.cleanupWorker()
      lastError = err
    }

    throw lastError ?? new Error('No se pudo iniciar Stockfish')
  }

  private createWorkerFromAssets(): WorkerLike {
    const workerSource = `
      const wasmUrl = '${stockfishWasmUrl}';
      try {
        importScripts('${stockfishScriptUrl}');
      } catch (e) {
        postMessage({ error: 'importScripts failed', detail: String(e) });
        throw e;
      }

      const engine = self.Stockfish({
        locateFile(path) {
          if (typeof path === 'string' && path.endsWith('.wasm')) return wasmUrl;
          return path;
        }
      });

      engine.onmessage = function (event) {
        try { postMessage(event.data); } catch (err) { /* ignore */ }
      };

      onmessage = function (event) {
        try { engine.postMessage(event.data); } catch (err) { /* ignore */ }
      };

      try {
        engine.postMessage('uci');
        engine.postMessage('isready');
      } catch (err) {
        try { postMessage({ error: String(err) }); } catch (_) {}
      }
    `

    const blob = new Blob([workerSource], { type: 'application/javascript' })
    const blobUrl = URL.createObjectURL(blob)
    this.blobUrl = blobUrl
    return new Worker(blobUrl) as unknown as WorkerLike
  }

  send(cmd: string) {
    try {
      if (!this.worker) return
      // many stockfish builds expect raw strings
      this.worker.postMessage(cmd)
    } catch (err) {
      // ignore
    }
  }

  async getBestMove(fen: string, level: number, timeoutMs = 8000): Promise<string> {
    if (!this.worker) return ''

    const worker = this.worker

    const clampedLevel = Math.max(0, Math.min(20, Math.round(level)))
    if (clampedLevel !== this.currentSkillLevel) {
      try {
        worker.postMessage(`setoption name Skill Level value ${clampedLevel}`)

        if (clampedLevel < 20) {
          const elo = Math.round(800 + (clampedLevel / 20) * 1800)
          worker.postMessage('setoption name UCI_LimitStrength value true')
          worker.postMessage(`setoption name UCI_Elo value ${elo}`)
          worker.postMessage('setoption name Slow Mover value 80')
          worker.postMessage('setoption name Hash value 64')
          this.strongMode = false
        } else {
          worker.postMessage('setoption name UCI_LimitStrength value false')
          worker.postMessage('setoption name Slow Mover value 100')
          worker.postMessage('setoption name Hash value 256')
          worker.postMessage('setoption name Threads value 1')
          this.strongMode = true
        }
        worker.postMessage('isready')
      } catch (err) {
        // ignore
      }
      this.currentSkillLevel = clampedLevel
    }

    const baseTime = Math.round((clampedLevel / 20) ** 2 * 15000 + 500)
    const movetime = Math.min(30000, Math.max(400, baseTime))
    const useDepth = clampedLevel >= 16 || this.strongMode
    const depth = Math.min(30, Math.max(12, Math.round(8 + clampedLevel * 1.2)))
    const timeoutBudget = useDepth
      ? Math.max(timeoutMs, 25000)
      : Math.max(timeoutMs, movetime + 2000)

    return new Promise((resolve) => {
      let finished = false

      const handler = (ev: MessageEvent) => {
        const d = ev.data
        let text = ''
        if (typeof d === 'string') text = d
        else if (d && typeof d === 'object') text = d.bestmove || d.data || ''

        if (!text) return

        // buscar línea bestmove
        const lines = text.split(/\r?\n/)
        for (const line of lines) {
          if (line.startsWith('bestmove')) {
            const parts = line.split(' ')
            const mv = parts[1] || ''
            finished = true
            cleanup()
            resolve(mv)
            return
          }
          // algunas builds envían JSON { bestmove: 'e2e4' }
          try {
            const obj = typeof d === 'string' ? null : d
            if (obj && obj.bestmove) {
              finished = true
              cleanup()
              resolve(obj.bestmove)
              return
            }
          } catch (e) {}
        }
      }

      const cleanup = () => {
        try { worker.removeEventListener('message', handler) } catch (e) {}
        clearTimeout(timeout)
      }

      // set timeout
      const timeout = setTimeout(() => {
        if (finished) return
        finished = true
        cleanup()
        resolve('')
      }, timeoutBudget)

      try {
        // attach listener
        worker.addEventListener('message', handler)
        // enviar posición y orden de búsqueda
        worker.postMessage(`position fen ${fen}`)
        if (useDepth) worker.postMessage(`go depth ${depth}`)
        else worker.postMessage(`go movetime ${movetime}`)
      } catch (err) {
        cleanup()
        resolve('')
      }
    })
  }

  destroy() {
    this.cleanupWorker()
  }
}

// Fallback: motor simplificado existente
class SimpleEngine {
  async init() {
    console.log('\u2705 Motor simplificado listo')
  }

  send(_command: string) {}

  async getBestMove(fen: string, skillLevel: number): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const game = new Chess(fen)
        const moves = game.moves({ verbose: true })
        if (moves.length === 0) return resolve('')

        // heurística simple: captura > desarrollo > aleatorio según nivel
        let selected
        if (skillLevel <= 3) {
          selected = moves[Math.floor(Math.random() * moves.length)]
        } else if (skillLevel <= 10) {
          const captures = moves.filter(m => m.captured)
          if (captures.length > 0 && Math.random() > 0.3) {
            selected = captures[Math.floor(Math.random() * captures.length)]
          } else {
            selected = moves[Math.floor(Math.random() * moves.length)]
          }
        } else {
          // evaluación muy básica
          let best = moves[0]
          let bestScore = -Infinity
          for (const m of moves) {
            game.move(m)
            const score = evaluatePosition(game)
            game.undo()
            if (score > bestScore) {
              bestScore = score
              best = m
            }
          }
          selected = best
        }

        resolve(selected.from + selected.to + (selected.promotion || ''))
      }, 200)
    })
  }

  destroy() {}
}

function evaluatePosition(game: Chess): number {
  if (game.isCheckmate()) return game.turn() === 'w' ? -10000 : 10000
  if (game.isDraw()) return 0
  const vals: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
  let score = 0
  const b = game.board()
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const p = b[i][j]
      if (p) score += (p.color === 'b' ? 1 : -1) * (vals[p.type] || 0)
    }
  }
  score += game.moves().length * 0.1
  if (game.isCheck()) score += game.turn() === 'w' ? -50 : 50
  return score
}

let instance: any = null

export async function getStockfish() {
  if (instance) return instance

  // Intentar usar RealStockfish
  try {
    const real = new RealStockfish()
    await real.init()
    instance = real
    console.log('\u2705 Stockfish worker listo')
    return instance
  } catch (err) {
    console.warn('No se pudo iniciar Stockfish worker, usando fallback simplificado:', err)
    const simple = new SimpleEngine()
    await simple.init()
    instance = simple
    return instance
  }
}

export type StockfishEngine = {
  init: () => Promise<void>
  send: (cmd: string) => void
  getBestMove: (fen: string, level: number) => Promise<string>
  destroy: () => void
}
