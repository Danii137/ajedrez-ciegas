return (
  <div style={{ 
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0e27 0%, #1e3a8a 50%, #0f172a 100%)',
    color: 'white',
    padding: '1rem',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  }}>
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: window.innerWidth > 768 ? '1fr 400px' : '1fr',
      gap: '2rem',
      alignItems: 'start'
    }}>
      
      {/* COLUMNA PRINCIPAL */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Título */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: window.innerWidth > 768 ? '3rem' : '2rem',
            fontWeight: 'bold', 
            margin: 0,
            background: 'linear-gradient(to right, #60a5fa, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            ♟️ Ajedrez a Ciegas
          </h1>
          <p style={{ color: '#94a3b8', marginTop: '0.5rem', fontSize: '0.875rem' }}>
            {engine ? '✅ Motor listo' : '⏳ Cargando...'}
          </p>
        </div>

        {/* Input por teclado */}
        {settings.keyboardInput && (
          <div style={{
            backgroundColor: 'rgba(30, 41, 59, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '1rem',
            border: '2px solid rgba(59, 130, 246, 0.5)',
            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)'
          }}>
            <h3 style={{ 
              fontSize: '1.125rem',
              fontWeight: 'bold', 
              marginBottom: '0.75rem',
              color: '#60a5fa'
            }}>
              ⌨️ Input
            </h3>
            
            <form onSubmit={handleKeyboardMove} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input
                type="text"
                value={keyboardMove}
                onChange={(e) => setKeyboardMove(e.target.value)}
                placeholder="e4, Nf3..."
                disabled={engineThinking || (playingAgainstEngine && game.turn() === 'b')}
                autoFocus={window.innerWidth > 768}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '2px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  outline: 'none',
                  fontFamily: 'ui-monospace, monospace'
                }}
              />
              <button
                type="submit"
                disabled={!keyboardMove.trim() || engineThinking}
                style={{
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: keyboardMove.trim() && !engineThinking ? 'pointer' : 'not-allowed',
                  opacity: keyboardMove.trim() && !engineThinking ? 1 : 0.5
                }}
              >
                ▶️ Mover
              </button>
            </form>

            {keyboardError && (
              <p style={{ marginTop: '0.5rem', color: '#ef4444', fontSize: '0.875rem', fontWeight: '600' }}>
                {keyboardError}
              </p>
            )}

            <div style={{
              marginTop: '0.75rem',
              padding: '0.5rem',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: '#94a3b8'
            }}>
              💡 <strong>SAN:</strong> e4, Nf3, O-O • <strong>LAN:</strong> e2e4
            </div>
          </div>
        )}

        {/* Tablero */}
        {settings.showBoard ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            overflowX: 'auto'
          }}>
            <div 
              key={boardKey}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(8, ${window.innerWidth > 768 ? '80px' : 'calc((100vw - 3rem) / 8)'})`,
                gridTemplateRows: `repeat(8, ${window.innerWidth > 768 ? '80px' : 'calc((100vw - 3rem) / 8)'})`,
                border: '6px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 0 40px rgba(59, 130, 246, 0.3), 0 20px 60px rgba(0, 0, 0, 0.5)',
                position: 'relative',
                opacity: engineThinking ? 0.6 : 1,
                transition: 'opacity 0.3s',
                maxWidth: window.innerWidth > 768 ? '640px' : 'calc(100vw - 2rem)'
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
                        fontSize: window.innerWidth > 768 ? '4rem' : '2.5rem',
                        cursor: engineThinking ? 'wait' : 'pointer',
                        position: 'relative',
                        outline: isSelected ? '4px solid #3b82f6' : 'none',
                        outlineOffset: '-4px',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? 'inset 0 0 20px rgba(59, 130, 246, 0.3)' : 'none',
                        touchAction: 'manipulation'
                      }}
                      onTouchStart={(e) => {
                        e.currentTarget.style.filter = 'brightness(1.2)'
                      }}
                      onTouchEnd={(e) => {
                        e.currentTarget.style.filter = 'brightness(1)'
                      }}
                    >
                      {settings.showCoordinates && fileIdx === 0 && (
                        <span style={{
                          position: 'absolute',
                          top: '2px',
                          left: '4px',
                          fontSize: window.innerWidth > 768 ? '0.75rem' : '0.5rem',
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
                          bottom: '2px',
                          right: '4px',
                          fontSize: window.innerWidth > 768 ? '0.75rem' : '0.5rem',
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
                          pointerEvents: 'none'
                        }}>
                          {settings.identicalPieces ? identicalPiece : pieces[pieceKey!]}
                        </span>
                      )}

                      {isLegalMove && (
                        <div style={{
                          position: 'absolute',
                          width: piece ? '70%' : (window.innerWidth > 768 ? '30px' : '20px'),
                          height: piece ? '70%' : (window.innerWidth > 768 ? '30px' : '20px'),
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
                  padding: window.innerWidth > 768 ? '2rem' : '1.5rem',
                  borderRadius: '12px',
                  border: '2px solid rgba(59, 130, 246, 0.5)',
                  boxShadow: '0 0 40px rgba(59, 130, 246, 0.4)'
                }}>
                  <p style={{ 
                    margin: 0, 
                    fontSize: window.innerWidth > 768 ? '1.5rem' : '1.125rem',
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
            height: window.innerWidth > 768 ? '640px' : '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '12px',
            border: '2px dashed rgba(148, 163, 184, 0.3)'
          }}>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <p style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>🙈</p>
              <p style={{ fontSize: window.innerWidth > 768 ? '1.5rem' : '1.125rem', color: '#94a3b8' }}>
                Modo Ciego Total
              </p>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' }}>
                {engineThinking ? '🤖 Motor pensando...' : 'Usa input arriba ⬆️'}
              </p>
            </div>
          </div>
        )}

        {/* Info de turno y estado */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            backdropFilter: 'blur(10px)',
            padding: '0.75rem 1.5rem',
            borderRadius: '12px',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}>
            <p style={{ margin: 0, fontSize: window.innerWidth > 768 ? '1.125rem' : '0.875rem', fontWeight: '600' }}>
              {game.turn() === 'w' ? '⚪ Blancas' : '⚫ Negras'}
              {playingAgainstEngine && game.turn() === 'b' && ' (Motor)'}
              {engineThinking && ' 🤖'}
            </p>
          </div>

          {game.isCheck() && !game.isGameOver() && (
            <div style={{
              backgroundColor: 'rgba(220, 38, 38, 0.9)',
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              animation: 'pulse 2s infinite',
              boxShadow: '0 0 20px rgba(220, 38, 38, 0.5)'
            }}>
              <p style={{ margin: 0, fontSize: window.innerWidth > 768 ? '1.125rem' : '0.875rem', fontWeight: 'bold' }}>
                ⚠️ ¡JAQUE!
              </p>
            </div>
          )}

          {game.isGameOver() && (
            <div style={{
              backgroundColor: 'rgba(22, 163, 74, 0.9)',
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              boxShadow: '0 0 20px rgba(22, 163, 74, 0.5)'
            }}>
              <p style={{ margin: 0, fontSize: window.innerWidth > 768 ? '1.25rem' : '1rem', fontWeight: 'bold' }}>
                {game.isCheckmate() ? 
                  (game.turn() === 'w' ? '👑 ¡Ganaste!' : '💀 Perdiste') : 
                 game.isDraw() ? '🤝 Tablas' : '🏁 Fin'}
              </p>
            </div>
          )}
        </div>

        {/* Botones */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={resetGame}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: window.innerWidth > 768 ? '1rem' : '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
              touchAction: 'manipulation'
            }}
          >
            🔄 Nueva Partida
          </button>

          <button
            onClick={toggleEnginePlay}
            disabled={!engine}
            style={{
              padding: '0.75rem 1.5rem',
              background: playingAgainstEngine 
                ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: window.innerWidth > 768 ? '1rem' : '0.875rem',
              fontWeight: '600',
              cursor: engine ? 'pointer' : 'not-allowed',
              opacity: engine ? 1 : 0.5,
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
              touchAction: 'manipulation'
            }}
          >
            {playingAgainstEngine ? '✅ Vs Motor' : '🤖 Vs Motor'}
          </button>
        </div>

        {/* Historial en móvil */}
        {window.innerWidth <= 768 && moveHistory.length > 0 && (
          <div style={{
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '1rem',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            <h3 style={{ 
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '0.75rem',
              color: '#60a5fa'
            }}>
              📜 Historial ({moveHistory.length})
            </h3>
            <div style={{ 
              fontFamily: 'ui-monospace, monospace', 
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
                    <span style={{ color: isWhite ? '#93c5fd' : '#fbbf24', marginLeft: '0.25rem' }}>
                      {move}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* COLUMNA DERECHA (solo desktop) */}
      {window.innerWidth > 768 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          
          {/* Panel del Motor */}
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
                🤖 Motor
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

              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, lineHeight: '1.5' }}>
                {playingAgainstEngine 
                  ? '✅ Jugando vs motor (Negras)'
                  : '💡 Click "Vs Motor"'}
              </p>
            </div>
          )}

          {/* Panel de Controles */}
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
              ⚙️ Controles
            </h2>

            {/* Presets */}
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                Presets:
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
                      cursor: 'pointer'
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
                { label: 'Coordenadas', key: 'showCoordinates' },
                { label: 'Piezas propias', key: 'showOwnPieces' },
                { label: 'Piezas rivales', key: 'showOpponentPieces' },
                { label: 'Monocromo', key: 'monochrome' },
                { label: 'Fichas idénticas', key: 'identicalPieces' },
                { label: 'Input teclado', key: 'keyboardInput' },
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
                    borderRadius: '6px'
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

          {/* Historial desktop */}
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
                📜 Historial ({moveHistory.length})
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
                      {isWhite && <span style={{ color: '#64748b', fontWeight: '600' }}>{moveNum}. </span>}
                      <span style={{ color: isWhite ? '#93c5fd' : '#fbbf24', marginLeft: '0.25rem' }}>
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

      {/* Panel móvil de controles (abajo) */}
      {window.innerWidth <= 768 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginTop: '1rem'
        }}>
          
          {/* Control del motor en móvil */}
          {engine && (
            <div style={{
              backgroundColor: 'rgba(30, 41, 59, 0.8)',
              borderRadius: '12px',
              padding: '1rem',
              border: '1px solid rgba(148, 163, 184, 0.2)'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#a78bfa' }}>
                🤖 Nivel: {engineLevel}
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
              <p style={{ fontSize: '0.75rem', color: '#a78bfa', marginTop: '0.5rem' }}>
                {getLevelName(engineLevel)}
              </p>
            </div>
          )}

          {/* Toggles en acordeón móvil */}
          <details style={{
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            borderRadius: '12px',
            padding: '1rem',
            border: '1px solid rgba(148, 163, 184, 0.2)'
          }}>
            <summary style={{
              fontSize: '1.125rem',
              fontWeight: 'bold',
              color: '#60a5fa',
              cursor: 'pointer',
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
                { label: 'Piezas rival', key: 'showOpponentPieces' },
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
                    onChange={(e) => setSettings({ ...settings, [toggle.key]: e.target.checked })}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#3b82f6' }}
                  />
                  <span style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>
                    {toggle.label}
                  </span>
                </label>
              ))}
            </div>
          </details>

          {/* Presets en móvil */}
          <div style={{
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            borderRadius: '12px',
            padding: '1rem',
            border: '1px solid rgba(148, 163, 184, 0.2)'
          }}>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
              Presets rápidos:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
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

      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #3b82f6;
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      }

      details > summary::-webkit-details-marker {
        display: none;
      }

      details > summary::before {
        content: '▶';
        display: inline-block;
        margin-right: 0.5rem;
        transition: transform 0.2s;
      }

      details[open] > summary::before {
        transform: rotate(90deg);
      }
    `}</style>
  </div>
)
