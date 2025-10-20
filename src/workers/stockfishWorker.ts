// Worker que crea la instancia del paquete `stockfish` y expone una interfaz UCI simple.
// Este archivo se incluye como worker de módulo por Vite: new Worker(new URL('./workers/stockfishWorker.ts', import.meta.url), { type: 'module' })

// @ts-ignore
import stockfish from 'stockfish'

const engine: any = (typeof stockfish === 'function') ? stockfish() : stockfish

engine.onmessage = (ev: any) => {
  // reenviar al hilo principal tal como viene
  try { postMessage(ev.data) } catch (e) { /* ignore */ }
}

// iniciar UCI
try {
  engine.postMessage('uci')
  engine.postMessage('isready')
} catch (e) {
  // ignore
}

onmessage = (ev: MessageEvent) => {
  const msg = ev.data
  try {
    // si es string, mandarlo directo
    if (typeof msg === 'string') {
      engine.postMessage(msg)
      return
    }

    // si es objeto con 'cmd', enviar cmd
    if (msg && typeof msg === 'object') {
      if (msg.cmd) engine.postMessage(msg.cmd)
      else if (msg.type === 'position' && msg.fen) engine.postMessage(`position fen ${msg.fen}`)
      else if (msg.type === 'go' && msg.movetime) engine.postMessage(`go movetime ${msg.movetime}`)
    }
  } catch (e) {
    // si algo falla, intentar notificar
    try { postMessage({ error: String(e) }) } catch (_) {}
  }
}
