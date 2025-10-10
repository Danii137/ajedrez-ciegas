import { Chess } from 'chess.js'

export class StockfishEngine {
  private ready = true

  async init() {
    console.log('✅ Motor de ajedrez listo (motor simplificado)')
    return Promise.resolve()
  }

  send(_command: string) {}

  async getBestMove(fen: string, skillLevel: number): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const game = new Chess(fen)
        const moves = game.moves({ verbose: true })
        
        if (moves.length === 0) {
          resolve('')
          return
        }

        let selectedMove

        if (skillLevel <= 3) {
          // Nivel bajo: movimiento aleatorio
          selectedMove = moves[Math.floor(Math.random() * moves.length)]
        } else if (skillLevel <= 10) {
          // Nivel medio: prefiere capturas
          const captures = moves.filter(m => m.captured)
          if (captures.length > 0 && Math.random() > 0.3) {
            selectedMove = captures[Math.floor(Math.random() * captures.length)]
          } else {
            selectedMove = moves[Math.floor(Math.random() * moves.length)]
          }
        } else {
          // Nivel alto: evalúa mejor movimiento
          let bestMove = moves[0]
          let bestScore = -999999

          for (const move of moves) {
            game.move(move)
            const score = this.evaluatePosition(game)
            game.undo()

            if (score > bestScore) {
              bestScore = score
              bestMove = move
            }
          }
          selectedMove = bestMove
        }

        const moveStr = selectedMove.from + selectedMove.to + (selectedMove.promotion || '')
        console.log('🎯 Motor mueve:', moveStr, '(', selectedMove.san, ')')
        resolve(moveStr)
      }, 300) // Simular "pensamiento"
    })
  }

  private evaluatePosition(game: Chess): number {
    if (game.isCheckmate()) return game.turn() === 'w' ? -10000 : 10000
    if (game.isDraw()) return 0

    const pieceValues: Record<string, number> = {
      'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0
    }

    let score = 0
    const board = game.board()

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j]
        if (piece) {
          const value = pieceValues[piece.type] || 0
          score += piece.color === 'b' ? value : -value
        }
      }
    }

    // Bonus por movilidad
    score += game.moves().length * 0.1

    // Bonus por jaque
    if (game.isCheck()) {
      score += game.turn() === 'w' ? -50 : 50
    }

    return score
  }

  destroy() {
    console.log('Motor detenido')
  }
}

let engineInstance: StockfishEngine | null = null

export async function getStockfish(): Promise<StockfishEngine> {
  if (!engineInstance) {
    engineInstance = new StockfishEngine()
    await engineInstance.init()
  }
  return engineInstance
}
