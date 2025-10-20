// @ts-nocheck
import { useState, useEffect } from 'react'
import { Chess } from 'chess.js'
import { getStockfish } from './lib/stockfish'
import type { StockfishEngine } from './lib/stockfish'
import { getSounds } from './lib/sounds'

function App() {
  const [game] = useState(() => new Chess())
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [legalMoves, setLegalMoves] = useState<string[]>([])
  const [moveHistory, setMoveHistory] = useState<string[]>([])
  const [boardKey, setBoardKey] = useState(0)
  
  const [engine, setEngine] = useState<StockfishEngine | null>(null)
  const [engineLevel, setEngineLevel] = useState(5)
  const [playingAgainstEngine, setPlayingAgainstEngine] = useState(false)
  const [engineThinking, setEngineThinking] = useState(false)

  const [keyboardMove, setKeyboardMove] = useState('')
  const [keyboardError, setKeyboardError] = useState('')

  const [showSplash, setShowSplash] = useState(true)
  const splashImage = new URL('./assets/daniel-alonso-gomez.jpg', import.meta.url).href
  const fallbackSplashImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAQAAABWA1nAAAAACXBIWXMAAAsTAAALEwEAmpwYAAACfUlEQVR4nO3dv27cMBAG0CSIBjKQrEmUtAapQJMYblJRk0J9CErRg7Cg9K9iN4zi0n/B/x59ZvxGAAAAAIDf8x7DHsMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAx4DHgMeAz7bfsT7EvYT9gv2C/YL9gv2C/YL9gv2C/YL9gv2C/YL9gv2C/YL9gv2C/YL9gv2C/YL9gv2C/YL9gv2C/YL9gv2C/YL9gv2C/YL9gv2C/YL9gv2C/YL9gv2C/YL9gv2C/YL9gv2C/YL9gv2C/YL9gv2C/YL9gv2C/YL9gv2C/YL9gv0C4z6jvt9v3wIAAAAAAABAUcAX5S7F4t8AAAAASUVORK5CYII='

  const dismissSplash = () => setShowSplash(false)
  
  const [settings, setSettings] = useState({
    showBoard: true,
    showCoordinates: true,
    showOwnPieces: true,
    showOpponentPieces: true,
    monochrome: false,
    identicalPieces: false,
    dragAndDrop: false,
    clickInput: true,
    keyboardInput: false,
    sounds: true
  })
  
  // AÑADIDO: Detectar móvil
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  
  const sounds = getSounds()
  
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1']
  const board = game.board()

  const pieces: Record<string, string> = {
    'wp': '♙', 'wn': '♘', 'wb': '♗', 'wr': '♖', 'wq': '♕', 'wk': '♔',
    'bp': '♟', 'bn': '♞', 'bb': '♝', 'br': '♜', 'bq': '♛', 'bk': '♚'
  }

  const identicalPiece = '●'

  // Inicializar motor
  useEffect(() => {
    let mounted = true
    
    getStockfish().then(eng => {
      if (mounted) {
        setEngine(eng)
        console.log('✅ Stockfish cargado')
      }
    }).catch(err => {
      console.error('❌ Error cargando Stockfish:', err)
    })
    
    return () => {
      mounted = false
    }
  }, [])

  // AÑADIDO: Detectar cambios de tamaño
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const shouldEngineMove = 
      playingAgainstEngine && 
      game.turn() === 'b' && 
      !game.isGameOver() && 
      engine &&
      !engineThinking &&
      moveHistory.length > 0 &&
      !showSplash

    if (shouldEngineMove) {
      const timer = setTimeout(() => {
        makeEngineMove()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [moveHistory.length, playingAgainstEngine, engineThinking, showSplash])

  useEffect(() => {
    if (!showSplash) return
    const timer = setTimeout(() => setShowSplash(false), 3500)
    return () => clearTimeout(timer)
  }, [showSplash])

  const makeEngineMove = async () => {
    if (!engine || engineThinking) return
    
    setEngineThinking(true)
    
    try {
      const fen = game.fen()
      console.log('🤖 Motor calculando desde FEN:', fen)
      
      const bestMove = await engine.getBestMove(fen, engineLevel)
      console.log('🤖 Mejor movimiento:', bestMove)
      
      if (bestMove && bestMove.length >= 4) {
        const from = bestMove.substring(0, 2)
        const to = bestMove.substring(2, 4)
        const promotion = bestMove[4] || 'q'
        
        const move = game.move({ from, to, promotion })
        
        if (move) {
          playMoveSound(move)
          setMoveHistory(prev => [...prev, move.san])
          setBoardKey(k => k + 1)
          console.log('✅ Motor movió:', move.san)
        }
      }
    } catch (error) {
      console.error('❌ Error del motor:', error)
    } finally {
      setEngineThinking(false)
    }
  }

  const handleSquareClick = (square: string) => {
    if (!settings.clickInput) return
    if (playingAgainstEngine && game.turn() === 'b') return
    if (engineThinking) return
    
    if (selectedSquare) {
      if (legalMoves.includes(square)) {
        try {
          const move = game.move({ from: selectedSquare, to: square })
          if (move) {
            playMoveSound(move)
            setMoveHistory(prev => [...prev, move.san])
            setSelectedSquare(null)
            setLegalMoves([])
            setBoardKey(k => k + 1)
          }
        } catch {
          selectSquare(square)
        }
      } else {
        selectSquare(square)
      }
    } else {
      selectSquare(square)
    }
  }

  const selectSquare = (square: string) => {
    try {
      const moves = game.moves({ square: square as any, verbose: true })
      if (moves.length > 0) {
        setSelectedSquare(square)
        setLegalMoves(moves.map((m: any) => m.to))
      } else {
        setSelectedSquare(null)
        setLegalMoves([])
      }
    } catch {
      setSelectedSquare(null)
      setLegalMoves([])
    }
  }

  const handleKeyboardMove = (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyboardMove.trim()) return
    
    setKeyboardError('')
    
    try {
      const moves = game.moves()
      const matching = moves.find(m => 
        m.toLowerCase() === keyboardMove.toLowerCase().trim() ||
        m.toLowerCase().replace(/[+#]/g, '') === keyboardMove.toLowerCase().trim()
      )
      
      if (matching) {
        const move = game.move(matching)
        if (move) {
          playMoveSound(move)
          setMoveHistory(prev => [...prev, move.san])
          setBoardKey(k => k + 1)
          setKeyboardMove('')
          return
        }
      }
      
      const input = keyboardMove.toLowerCase().trim()
      if (input.length >= 4) {
        const from = input.substring(0, 2)
        const to = input.substring(2, 4)
        const promotion = input[4]
        
        const move = game.move({ from, to, promotion })
        if (move) {
          playMoveSound(move)
          setMoveHistory(prev => [...prev, move.san])
          setBoardKey(k => k + 1)
          setKeyboardMove('')
          return
        }
      }
      
      sounds.illegal()
      setKeyboardError('❌ Movimiento inválido')
      setTimeout(() => setKeyboardError(''), 2000)
    } catch (error) {
      sounds.illegal()
      setKeyboardError('❌ Formato incorrecto')
      setTimeout(() => setKeyboardError(''), 2000)
    }
  }

  const resetGame = () => {
    game.reset()
    setSelectedSquare(null)
    setLegalMoves([])
    setMoveHistory([])
    setBoardKey(k => k + 1)
    setKeyboardMove('')
    setKeyboardError('')
  }

  const toggleEnginePlay = () => {
    setPlayingAgainstEngine(!playingAgainstEngine)
    resetGame()
  }

  const applyPreset = (preset: string) => {
    switch(preset) {
      case 'blind':
        setSettings({
          ...settings,
          showBoard: false,
          showOwnPieces: false,
          showOpponentPieces: false,
          keyboardInput: true,
          clickInput: false
        })
        break
      case 'semi':
        setSettings({
          ...settings,
          showBoard: true,
          showOwnPieces: false,
          showOpponentPieces: false,
          showCoordinates: true,
          keyboardInput: true
        })
        break
      case 'rival':
        setSettings({
          ...settings,
          showBoard: true,
          showOwnPieces: false,
          showOpponentPieces: true
        })
        break
      case 'mono':
        setSettings({
          ...settings,
          monochrome: true
        })
        break
    }
  }

  const shouldShowPiece = (piece: any) => {
    if (!piece) return false
    if (piece.color === 'w' && !settings.showOwnPieces) return false
    if (piece.color === 'b' && !settings.showOpponentPieces) return false
    return true
  }

  const getLevelName = (level: number) => {
    if (level <= 3) return '🟢 Principiante'
    if (level <= 7) return '🟡 Intermedio'
    if (level <= 12) return '🟠 Avanzado'
    if (level <= 17) return '🔴 Experto'
    return '🟣 Maestro'
  }

  const playMoveSound = (move: any) => {
    if (!settings.sounds) return

    if (game.isCheckmate()) {
      sounds.checkmate()
    } else if (game.isCheck()) {
      sounds.check()
    } else if (move.san.includes('O-O')) {
      sounds.castle()
    } else if (move.captured || move.san.includes('x')) {
      sounds.capture()
    } else {
      sounds.move()
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0e27 0%, #1e3a8a 50%, #0f172a 100%)',
      color: 'white',
      padding: isMobile ? '1rem' : '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {showSplash && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'radial-gradient(circle at center, rgba(15,23,42,0.95) 0%, rgba(2,6,23,0.98) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '2rem',
            cursor: 'pointer'
          }}
          onClick={dismissSplash}
        >
          <div
            style={{
              width: 'min(90vw, 520px)',
              background: 'rgba(15, 23, 42, 0.85)',
              borderRadius: '20px',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              boxShadow: '0 25px 60px rgba(15, 23, 42, 0.6)',
              padding: '2.5rem 2rem',
              textAlign: 'center',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                overflow: 'hidden',
                margin: '0 auto 1.5rem',
                border: '4px solid rgba(96, 165, 250, 0.7)',
                boxShadow: '0 12px 30px rgba(37, 99, 235, 0.35)'
              }}
            >
              <img
                src={splashImage}
                alt="Retrato de Daniel Alonso Gómez"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(event) => {
                  const img = event.currentTarget
                  if (img.src !== fallbackSplashImage) {
                    img.src = fallbackSplashImage
                  }
                }}
              />
            </div>

            <h1 style={{
              fontSize: '2.25rem',
              margin: 0,
              fontWeight: 700,
              background: 'linear-gradient(to right, #60a5fa, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Daniel Alonso Gómez
            </h1>

            <p style={{
              marginTop: '0.75rem',
              marginBottom: '2rem',
              fontSize: '1.1rem',
              color: '#cbd5f5'
            }}>
              Hecho por Daniel Alonso Gómez
            </p>

            <button
              onClick={dismissSplash}
              style={{
                padding: '0.9rem 2.5rem',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'white',
                background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
                border: 'none',
                borderRadius: '999px',
                cursor: 'pointer',
                boxShadow: '0 10px 25px rgba(37, 99, 235, 0.45)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 16px 35px rgba(37, 99, 235, 0.55)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(37, 99, 235, 0.45)'
              }}
            >
              Entrar
            </button>

            <span style={{
              position: 'absolute',
              bottom: '1rem',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '0.75rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(148, 163, 184, 0.7)'
            }}>
              Toque para continuar
            </span>
          </div>
        </div>
      )}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 400px',
        gap: '2rem',
        alignItems: 'start'
      }}>
        
        {/* COLUMNA IZQUIERDA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ 
              fontSize: isMobile ? '2rem' : '3rem',
              fontWeight: 'bold', 
              margin: 0,
              background: 'linear-gradient(to right, #60a5fa, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              ♟️ Ajedrez a Ciegas
            </h1>
            <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
              {engine ? '✅ Motor Stockfish cargado' : '⏳ Cargando motor...'}
            </p>
          </div>

          {/* Input por teclado */}
          {settings.keyboardInput && (
            <div style={{
              backgroundColor: 'rgba(30, 41, 59, 0.9)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '1.5rem',
              border: '2px solid rgba(59, 130, 246, 0.5)',
              boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)'
            }}>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 'bold', 
                marginBottom: '1rem',
                color: '#60a5fa'
              }}>
                ⌨️ Input por Teclado
              </h3>
              
              <form onSubmit={handleKeyboardMove} style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  value={keyboardMove}
                  onChange={(e) => setKeyboardMove(e.target.value)}
                  placeholder="e4, Nf3, e2e4..."
                  disabled={engineThinking || (playingAgainstEngine && game.turn() === 'b')}
                  autoFocus
                  style={{
                    flex: 1,
                    padding: '1rem',
                    fontSize: '1.125rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '2px solid rgba(148, 163, 184, 0.3)',
                    borderRadius: '8px',
                    color: 'white',
                    outline: 'none',
                    fontFamily: 'ui-monospace, monospace'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(59, 130, 246, 0.6)'
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(148, 163, 184, 0.3)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={!keyboardMove.trim() || engineThinking}
                  style={{
                    padding: '1rem 2rem',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: keyboardMove.trim() && !engineThinking ? 'pointer' : 'not-allowed',
                    opacity: keyboardMove.trim() && !engineThinking ? 1 : 0.5,
                    transition: 'all 0.2s'
                  }}
                >
                  ▶️ Mover
                </button>
              </form>

              {keyboardError && (
                <p style={{
                  marginTop: '0.75rem',
                  color: '#ef4444',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  {keyboardError}
                </p>
              )}

              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: '#94a3b8',
                lineHeight: '1.5'
              }}>
                <p style={{ margin: '0.25rem 0', fontWeight: '600', color: '#60a5fa' }}>
                  💡 Formatos aceptados:
                </p>
                <p style={{ margin: '0.25rem 0' }}>
                  • <strong>SAN:</strong> e4, Nf3, O-O, Qxd5+
                </p>
                <p style={{ margin: '0.25rem 0' }}>
                  • <strong>LAN:</strong> e2e4, g1f3, e7e8q
                </p>
              </div>
            </div>
          )}

          {/* Tablero */}
          {settings.showBoard ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              perspective: '1000px'
            }}>
              <div 
                key={boardKey}
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(8, calc((100vw - 3rem) / 8))' : 'repeat(8, 80px)',
                  gridTemplateRows: isMobile ? 'repeat(8, calc((100vw - 3rem) / 8))' : 'repeat(8, 80px)',
                  border: '6px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: `
                    0 0 40px rgba(59, 130, 246, 0.3),
                    0 20px 60px rgba(0, 0, 0, 0.5),
                    inset 0 0 0 1px rgba(255, 255, 255, 0.1)
                  `,
                  position: 'relative',
                  opacity: engineThinking ? 0.6 : 1,
                  transition: 'opacity 0.3s'
                }}>
                {ranks.map((rank, rankIdx) =>
                  files.map((file, fileIdx) => {
                    const square = `${file}${rank}`
                    const piece = board[rankIdx][fileIdx]
                    const isLight = (rankIdx + fileIdx) % 2 === 0
                    const isSelected = selectedSquare === square
                    const isLegalMove = legalMoves.includes(square)
                    const showPiece = shouldShowPiece(piece)
                    const pieceKey = piece ? `${piece.color}${piece.type}` : null

                    return (
                      <div
                        key={square}
                        onClick={() => handleSquareClick(square)}
                        style={{
                          backgroundColor: settings.monochrome 
                            ? (isLight ? '#64748b' : '#334155')
                            : (isLight ? '#f0d9b5' : '#b58863'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: isMobile ? '2.5rem' : '4rem',
                          cursor: engineThinking ? 'wait' : 'pointer',
                          position: 'relative',
                          outline: isSelected ? '4px solid #3b82f6' : 'none',
                          outlineOffset: '-4px',
                          transition: 'all 0.2s ease',
                          boxShadow: isSelected ? 'inset 0 0 20px rgba(59, 130, 246, 0.3)' : 'none'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected && !engineThinking) {
                            e.currentTarget.style.filter = 'brightness(1.2)'
                            e.currentTarget.style.transform = 'scale(1.05)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.filter = 'brightness(1)'
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                      >
                        {settings.showCoordinates && fileIdx === 0 && (
                          <span style={{
                            position: 'absolute',
                            top: '4px',
                            left: '6px',
                            fontSize: isMobile ? '0.5rem' : '0.75rem',
                            fontWeight: 'bold',
                            color: isLight ? '#b58863' : '#f0d9b5',
                            opacity: 0.7
                          }}>
                            {rank}
                          </span>
                        )}
                        {settings.showCoordinates && rankIdx === 7 && (
                          <span style={{
                            position: 'absolute',
                            bottom: '4px',
                            right: '6px',
                            fontSize: isMobile ? '0.5rem' : '0.75rem',
                            fontWeight: 'bold',
                            color: isLight ? '#b58863' : '#f0d9b5',
                            opacity: 0.7
                          }}>
                            {file}
                          </span>
                        )}

                        {piece && showPiece && (
                          <span style={{ 
                            color: settings.monochrome 
                              ? '#cbd5e1'
                              : (piece.color === 'w' ? '#ffffff' : '#1a1a1a'),
                            textShadow: piece.color === 'w' 
                              ? '0 3px 8px rgba(0,0,0,0.6), 0 0 20px rgba(255,255,255,0.3)'
                              : '0 2px 4px rgba(0,0,0,0.4)',
                            userSelect: 'none',
                            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                            transition: 'transform 0.2s ease'
                          }}>
                            {settings.identicalPieces ? identicalPiece : pieces[pieceKey!]}
                          </span>
                        )}

                        {isLegalMove && (
                          <div style={{
                            position: 'absolute',
                            width: piece ? '70%' : (isMobile ? '20px' : '30px'),
                            height: piece ? '70%' : (isMobile ? '20px' : '30px'),
                            backgroundColor: 'rgba(34, 197, 94, 0.5)',
                            borderRadius: piece ? '8px' : '50%',
                            border: piece ? '3px solid #22c55e' : 'none',
                            opacity: 0.85,
                            pointerEvents: 'none',
                            boxShadow: '0 0 20px rgba(34, 197, 94, 0.6)'
                          }} />
                        )}
                      </div>
                    )
                  })
                )}

                {engineThinking && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(15, 23, 42, 0.95)',
                    padding: '2rem',
                    borderRadius: '12px',
                    border: '2px solid rgba(59, 130, 246, 0.5)',
                    boxShadow: '0 0 40px rgba(59, 130, 246, 0.4)'
                  }}>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '1.5rem',
                      color: '#60a5fa',
                      animation: 'pulse 1.5s infinite'
                    }}>
                      🤖 Pensando...
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              height: '640px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '12px',
              border: '2px dashed rgba(148, 163, 184, 0.3)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '4rem', margin: '0 0 1rem 0' }}>🙈</p>
                <p style={{ fontSize: '1.5rem', color: '#94a3b8' }}>
                  Modo Ciego Total Activado
                </p>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' }}>
                  {engineThinking ? '🤖 El motor está pensando...' : 'Usa el input por teclado arriba ⬆️'}
                </p>
              </div>
            </div>
          )}

          {/* Info de turno */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{
              backgroundColor: 'rgba(30, 41, 59, 0.8)',
              backdropFilter: 'blur(10px)',
              padding: '1rem 2rem',
              borderRadius: '12px',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
                Turno: {game.turn() === 'w' ? '⚪ Blancas (Tú)' : '⚫ Negras' + (playingAgainstEngine ? ' (Motor)' : '')}
                {engineThinking && ' 🤖'}
              </p>
            </div>

            {game.isCheck() && !game.isGameOver() && (
              <div style={{
                backgroundColor: 'rgba(220, 38, 38, 0.9)',
                padding: '1rem 2rem',
                borderRadius: '12px',
                animation: 'pulse 2s infinite',
                boxShadow: '0 0 20px rgba(220, 38, 38, 0.5)'
              }}>
                <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: 'bold' }}>
                  ⚠️ ¡JAQUE!
                </p>
              </div>
            )}

            {game.isGameOver() && (
              <div style={{
                backgroundColor: 'rgba(22, 163, 74, 0.9)',
                padding: '1rem 2rem',
                borderRadius: '12px',
                boxShadow: '0 0 20px rgba(22, 163, 74, 0.5)'
              }}>
                <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
                  {game.isCheckmate() ? 
                    (game.turn() === 'w' ? '👑 ¡Ganaste! (Mate)' : '💀 Perdiste (Mate)') : 
                   game.isDraw() ? '🤝 Tablas' : '🏁 Fin'}
                </p>
              </div>
            )}
          </div>

          {/* Botones */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={resetGame}
              style={{
                padding: '1rem 2rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.6)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)'
              }}
            >
              🔄 Nueva Partida
            </button>

            <button
              onClick={toggleEnginePlay}
              disabled={!engine}
              style={{
                padding: '1rem 2rem',
                background: playingAgainstEngine 
                  ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                  : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: engine ? 'pointer' : 'not-allowed',
                opacity: engine ? 1 : 0.5,
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (engine) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {playingAgainstEngine ? '✅ Vs Motor' : '🤖 Jugar vs Motor'}
            </button>
          </div>
        </div>

        {/* COLUMNA DERECHA (solo desktop) */}
        {!isMobile && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            
            {/* Control del Motor */}
            {engine && (
              <div style={{
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
              }}>
                <h2 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  marginBottom: '1rem',
                  color: '#a78bfa'
                }}>
                  🤖 Motor Stockfish
                </h2>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>
                      Nivel: {engineLevel}
                    </span>
                    <span style={{ fontSize: '0.875rem', color: '#a78bfa', fontWeight: '600' }}>
                      {getLevelName(engineLevel)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={engineLevel}
                    onChange={(e) => setEngineLevel(Number(e.target.value))}
                    disabled={playingAgainstEngine && moveHistory.length > 0}
                    style={{
                      width: '100%',
                      height: '8px',
                      borderRadius: '4px',
                      outline: 'none',
                      background: 'linear-gradient(to right, #22c55e, #eab308, #ef4444)',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: '#64748b',
                    marginTop: '0.25rem'
                  }}>
                    <span>Fácil</span>
                    <span>Medio</span>
                    <span>Difícil</span>
                  </div>
                </div>

                <p style={{
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  {playingAgainstEngine 
                    ? '✅ Jugando contra el motor (tú Blancas, motor Negras)'
                    : '💡 Click en "Jugar vs Motor" para empezar'}
                </p>
              </div>
            )}

            {/* Panel de Controles Visuales */}
            <div style={{
              backgroundColor: 'rgba(30, 41, 59, 0.8)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '1.5rem',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
            }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                marginBottom: '1.5rem',
                color: '#60a5fa'
              }}>
                ⚙️ Controles Visuales
              </h2>

              {/* Presets */}
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                  Presets rápidos:
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem'
                }}>
                  {[
                    { name: 'Ciego Total', key: 'blind' },
                    { name: 'Semi-ciego', key: 'semi' },
                    { name: 'Solo Rival', key: 'rival' },
                    { name: 'Monocromo', key: 'mono' }
                  ].map(preset => (
                    <button
                      key={preset.key}
                      onClick={() => applyPreset(preset.key)}
                      style={{
                        padding: '0.5rem',
                        background: 'rgba(59, 130, 246, 0.2)',
                        color: '#93c5fd',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
                      }}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { label: 'Mostrar tablero', key: 'showBoard' },
                  { label: 'Mostrar coordenadas', key: 'showCoordinates' },
                  { label: 'Mostrar piezas propias', key: 'showOwnPieces' },
                  { label: 'Mostrar piezas rivales', key: 'showOpponentPieces' },
                  { label: 'Modo monocromo', key: 'monochrome' },
                  { label: 'Fichas idénticas', key: 'identicalPieces' },
                  { label: 'Input por teclado', key: 'keyboardInput' },
                  { label: 'Sonidos', key: 'sounds' }
                ].map(toggle => (
                  <label
                    key={toggle.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={settings[toggle.key as keyof typeof settings]}
                      onChange={(e) => setSettings({
                        ...settings,
                        [toggle.key]: e.target.checked
                      })}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer',
                        accentColor: '#3b82f6'
                      }}
                    />
                    <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
                      {toggle.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Historial */}
            {moveHistory.length > 0 && (
              <div style={{
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600',
                  marginBottom: '1rem',
                  color: '#60a5fa'
                }}>
                  📜 Historial ({moveHistory.length} jugadas)
                </h3>
                <div style={{ 
                  fontFamily: 'ui-monospace, monospace', 
                  fontSize: '0.875rem',
                  color: '#cbd5e1',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem'
                }}>
                  {moveHistory.map((move, idx) => {
                    const moveNum = Math.floor(idx / 2) + 1
                    const isWhite = idx % 2 === 0
                    return (
                      <div key={idx} style={{ 
                        padding: '0.25rem 0.5rem',
                        background: 'rgba(148, 163, 184, 0.1)',
                        borderRadius: '4px'
                      }}>
                        {isWhite && (
                          <span style={{ color: '#64748b', fontWeight: '600' }}>
                            {moveNum}. 
                          </span>
                        )}
                        <span style={{ 
                          color: isWhite ? '#93c5fd' : '#fbbf24',
                          marginLeft: '0.25rem'
                        }}>
                          {move}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PANEL MÓVIL (solo móvil) */}
        {isMobile && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            marginTop: '1rem'
          }}>
            
            {/* Historial móvil */}
            {moveHistory.length > 0 && (
              <div style={{
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                borderRadius: '12px',
                padding: '1rem',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                <h3 style={{ fontSize: '1rem', color: '#60a5fa', marginBottom: '0.75rem' }}>
                  📜 Historial ({moveHistory.length})
                </h3>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  color: '#cbd5e1',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.25rem'
                }}>
                  {moveHistory.map((move, idx) => {
                    const moveNum = Math.floor(idx / 2) + 1
                    const isWhite = idx % 2 === 0
                    return (
                      <div key={idx} style={{ 
                        padding: '0.25rem 0.5rem',
                        background: 'rgba(148, 163, 184, 0.1)',
                        borderRadius: '4px'
                      }}>
                        {isWhite && <span style={{ color: '#64748b', fontWeight: '600' }}>{moveNum}. </span>}
                        <span style={{ color: isWhite ? '#93c5fd' : '#fbbf24' }}>{move}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Control nivel motor móvil */}
            {engine && (
              <div style={{
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                borderRadius: '12px',
                padding: '1rem',
                border: '1px solid rgba(148, 163, 184, 0.2)'
              }}>
                <h3 style={{ fontSize: '1rem', color: '#a78bfa', marginBottom: '0.75rem' }}>
                  🤖 Nivel: {engineLevel} - {getLevelName(engineLevel)}
                </h3>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={engineLevel}
                  onChange={(e) => setEngineLevel(Number(e.target.value))}
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '4px',
                    background: 'linear-gradient(to right, #22c55e, #eab308, #ef4444)'
                  }}
                />
              </div>
            )}

            {/* Opciones desplegables móvil */}
            <details style={{
              backgroundColor: 'rgba(30, 41, 59, 0.8)',
              borderRadius: '12px',
              padding: '1rem',
              border: '1px solid rgba(148, 163, 184, 0.2)'
            }}>
              <summary style={{
                fontSize: '1rem',
                color: '#60a5fa',
                cursor: 'pointer',
                fontWeight: 'bold',
                listStyle: 'none',
                userSelect: 'none'
              }}>
                ⚙️ Opciones de Vista
              </summary>
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { label: 'Tablero', key: 'showBoard' },
                  { label: 'Coordenadas', key: 'showCoordinates' },
                  { label: 'Mis piezas', key: 'showOwnPieces' },
                  { label: 'Rival', key: 'showOpponentPieces' },
                  { label: 'Monocromo', key: 'monochrome' },
                  { label: 'Idénticas', key: 'identicalPieces' },
                  { label: 'Teclado', key: 'keyboardInput' },
                  { label: 'Sonidos', key: 'sounds' }
                ].map(toggle => (
                  <label
                    key={toggle.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(148, 163, 184, 0.05)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={settings[toggle.key as keyof typeof settings]}
                      onChange={(e) => setSettings({
                        ...settings,
                        [toggle.key]: e.target.checked
                      })}
                      style={{
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        accentColor: '#3b82f6'
                      }}
                    />
                    <span style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>
                      {toggle.label}
                    </span>
                  </label>
                ))}
              </div>
            </details>

            {/* Presets móvil */}
            <div style={{
              backgroundColor: 'rgba(30, 41, 59, 0.8)',
              borderRadius: '12px',
              padding: '1rem',
              border: '1px solid rgba(148, 163, 184, 0.2)'
            }}>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                Presets:
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem'
              }}>
                {[
                  { name: 'Ciego', key: 'blind' },
                  { name: 'Semi', key: 'semi' },
                  { name: 'Rival', key: 'rival' },
                  { name: 'Mono', key: 'mono' }
                ].map(preset => (
                  <button
                    key={preset.key}
                    onClick={() => applyPreset(preset.key)}
                    style={{
                      padding: '0.75rem',
                      background: 'rgba(59, 130, 246, 0.2)',
                      color: '#93c5fd',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      touchAction: 'manipulation'
                    }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.7);
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }

        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }

        details > summary {
          list-style: none;
        }

        details > summary::-webkit-details-marker {
          display: none;
        }

        details > summary::before {
          content: '▶ ';
          transition: transform 0.2s;
        }

        details[open] > summary::before {
          content: '▼ ';
        }
      `}</style>
    </div>
  )
}

export default App
