'use client'

import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/game/store'
import { LEVELS, getSolution } from '@/game/levels'

export default function GameBoard() {
  const {
    currentLevel,
    tiles,
    wallOffset,
    compressionActive,
    compressionRate,
    moves,
    status,
    loadLevel,
    startGame,
    tapTile,
    advanceWalls,
    restartLevel,
    goToMenu,
    completedLevels,
    bestMoves,
  } = useGameStore()

  const [world, setWorld] = useState(1)
  const [showHint, setShowHint] = useState(false)
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)

  // Solution for hints
  const solution = currentLevel ? getSolution(currentLevel) : null

  // Game loop for wall compression
  useEffect(() => {
    if (status === 'playing' && compressionActive) {
      gameLoopRef.current = setInterval(() => {
        advanceWalls()
      }, compressionRate)
      return () => {
        if (gameLoopRef.current) clearInterval(gameLoopRef.current)
      }
    }
  }, [status, compressionActive, compressionRate, advanceWalls])

  // Calculate max compression steps
  const maxOffset = currentLevel ? Math.floor(currentLevel.gridSize / 2) : 2
  const compressionPercent = currentLevel ? Math.round((wallOffset / maxOffset) * 100) : 0

  // Menu Screen
  if (status === 'menu' || !currentLevel) {
    return (
      <div style={styles.screen}>
        <h1 style={styles.title}>PRESSURE</h1>
        <p style={styles.subtitle}>Connect nodes before walls crush them</p>
        
        <div style={styles.worldTabs}>
          {[1, 2, 3].map(w => (
            <button
              key={w}
              style={{
                ...styles.worldTab,
                ...(world === w ? styles.worldTabActive : {})
              }}
              onClick={() => setWorld(w)}
            >
              {w}
            </button>
          ))}
        </div>
        
        <div style={styles.levelGrid}>
          {LEVELS.filter(l => l.world === world).map(level => {
            const done = completedLevels.includes(level.id)
            const best = bestMoves[level.id]
            return (
              <button
                key={level.id}
                style={{
                  ...styles.levelBtn,
                  ...(done ? styles.levelBtnDone : {})
                }}
                onClick={() => loadLevel(level)}
              >
                {level.id}
                {best && <span style={styles.star}>★</span>}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Get hint position
  const hintPos = showHint && solution && solution.length > 0 ? solution[0] : null

  // Game Screen
  return (
    <div style={styles.screen}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.headerBtn} onClick={goToMenu}>←</button>
        <div style={styles.headerCenter}>
          <div style={styles.levelName}>{currentLevel.name}</div>
          <div style={styles.levelNum}>Level {currentLevel.id}</div>
        </div>
        <button style={styles.headerBtn} onClick={restartLevel}>↻</button>
      </div>

      {/* Compression indicator */}
      <div style={styles.compressionBox}>
        <div style={styles.compressionLabel}>
          <span>WALLS</span>
          <span>{compressionPercent}%</span>
        </div>
        <div style={styles.compressionTrack}>
          <div 
            style={{
              ...styles.compressionFill,
              width: `${compressionPercent}%`,
              background: compressionPercent > 60 ? '#ef4444' : compressionPercent > 30 ? '#f59e0b' : '#22c55e'
            }}
          />
        </div>
      </div>

      {/* Moves */}
      <div style={styles.moves}>
        <span style={styles.movesNum}>{moves}</span>
        <span style={styles.movesMax}>/{currentLevel.maxMoves} moves</span>
      </div>

      {/* Board */}
      <div style={styles.boardWrap}>
        <div 
          style={{
            ...styles.board,
            gridTemplateColumns: `repeat(${currentLevel.gridSize}, 1fr)`
          }}
        >
          {Array.from({ length: currentLevel.gridSize }, (_, y) =>
            Array.from({ length: currentLevel.gridSize }, (_, x) => {
              const tile = tiles.find(t => t.x === x && t.y === y)
              const distFromEdge = Math.min(x, y, currentLevel.gridSize - 1 - x, currentLevel.gridSize - 1 - y)
              
              // Determine what to show
              let type = 'empty'
              let connections: string[] = []
              let canRotate = false
              let isGoalNode = false
              
              if (tile) {
                type = tile.type
                connections = tile.connections
                canRotate = tile.canRotate
                isGoalNode = tile.isGoalNode
              } else if (distFromEdge >= wallOffset) {
                // This is inside the current safe zone - check if it's being crushed
                // Empty space inside
              }
              
              // Check if this is a hint tile
              const isHint = hintPos && hintPos.x === x && hintPos.y === y
              
              // Check if this tile is in danger zone
              const inDanger = distFromEdge === wallOffset && type !== 'wall' && type !== 'empty'
              
              return (
                <div
                  key={`${x}-${y}`}
                  style={{
                    ...styles.tile,
                    ...getTileStyle(type, canRotate, isGoalNode, inDanger, isHint || false, distFromEdge, wallOffset),
                  }}
                  onClick={() => canRotate && status === 'playing' && tapTile(x, y)}
                >
                  {/* Connection lines */}
                  {(type === 'path' || type === 'node') && connections.length > 0 && (
                    <>
                      {connections.includes('up') && <div style={{...styles.conn, ...styles.connUp}} />}
                      {connections.includes('down') && <div style={{...styles.conn, ...styles.connDown}} />}
                      {connections.includes('left') && <div style={{...styles.conn, ...styles.connLeft}} />}
                      {connections.includes('right') && <div style={{...styles.conn, ...styles.connRight}} />}
                      <div style={styles.connCenter} />
                    </>
                  )}
                  {isGoalNode && <div style={styles.nodeDot} />}
                  {canRotate && <div style={styles.rotateDot} />}
                </div>
              )
            })
          )}
        </div>

        {/* Overlays */}
        
        {/* Visual crushing walls overlay */}
        {wallOffset > 0 && status === 'playing' && (
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              borderRadius: 16,
            }}
          >
            {/* Dark overlay for crushed areas */}
            <div 
              style={{
                position: 'absolute',
                inset: 0,
                background: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 5px,
                  rgba(127, 29, 29, 0.15) 5px,
                  rgba(127, 29, 29, 0.15) 10px
                )`,
                clipPath: `polygon(
                  0% 0%, 
                  100% 0%, 
                  100% 100%, 
                  0% 100%,
                  0% 0%,
                  ${(wallOffset / currentLevel.gridSize) * 100}% ${(wallOffset / currentLevel.gridSize) * 100}%,
                  ${(1 - wallOffset / currentLevel.gridSize) * 100}% ${(wallOffset / currentLevel.gridSize) * 100}%,
                  ${(1 - wallOffset / currentLevel.gridSize) * 100}% ${(1 - wallOffset / currentLevel.gridSize) * 100}%,
                  ${(wallOffset / currentLevel.gridSize) * 100}% ${(1 - wallOffset / currentLevel.gridSize) * 100}%,
                  ${(wallOffset / currentLevel.gridSize) * 100}% ${(wallOffset / currentLevel.gridSize) * 100}%
                )`,
              }}
            />
          </div>
        )}
        
        {status === 'idle' && (
          <div style={styles.overlay}>
            <div style={styles.overlayTitle}>{currentLevel.name}</div>
            <div style={styles.overlayText}>
              Tap amber tiles to rotate paths. Connect all green nodes!
            </div>
            {solution && solution.length > 0 && (
              <div style={styles.overlayPar}>Par: {solution.length} moves</div>
            )}
            <button style={styles.startBtn} onClick={startGame}>START</button>
          </div>
        )}

        {status === 'won' && (
          <div style={{...styles.overlay, ...styles.overlayWin}}>
            <div style={styles.overlayIcon}>✓</div>
            <div style={styles.overlayTitle}>CONNECTED!</div>
            <div style={styles.overlayText}>{moves} moves</div>
            {currentLevel.id < 10 ? (
              <button 
                style={styles.nextBtn}
                onClick={() => {
                  const next = LEVELS.find(l => l.id === currentLevel.id + 1)
                  if (next) loadLevel(next)
                }}
              >
                NEXT →
              </button>
            ) : (
              <button style={styles.nextBtn} onClick={goToMenu}>MENU</button>
            )}
          </div>
        )}

        {status === 'lost' && (
          <div style={{...styles.overlay, ...styles.overlayLose}}>
            <div style={styles.overlayIcon}>✗</div>
            <div style={styles.overlayTitle}>CRUSHED!</div>
            <div style={styles.overlayText}>A node was destroyed</div>
            <button style={styles.nextBtn} onClick={restartLevel}>RETRY</button>
          </div>
        )}
      </div>

      {/* Hint button */}
      {status === 'playing' && solution && solution.length > 0 && (
        <button style={styles.hintBtn} onClick={() => setShowHint(s => !s)}>
          {showHint ? 'Hide Hint' : '💡 Hint'}
        </button>
      )}
    </div>
  )
}

// Styles
const styles: Record<string, React.CSSProperties> = {
  screen: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(180deg, #0d0d15 0%, #080810 100%)',
    color: '#fff',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    padding: 'env(safe-area-inset-top, 16px) env(safe-area-inset-right, 16px) env(safe-area-inset-bottom, 16px) env(safe-area-inset-left, 16px)',
  },
  
  // Menu
  title: {
    fontSize: 'clamp(2rem, 10vw, 3.5rem)',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
    fontSize: 'clamp(0.8rem, 3vw, 1rem)',
    marginBottom: 32,
  },
  worldTabs: {
    display: 'flex',
    gap: 8,
    marginBottom: 20,
  },
  worldTab: {
    width: 44,
    height: 44,
    borderRadius: 12,
    border: '2px solid #222',
    background: '#111',
    color: '#666',
    fontSize: '1.1rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  worldTabActive: {
    background: '#1a1a24',
    borderColor: '#333',
    color: '#fff',
  },
  levelGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 10,
    width: 'min(280px, 80vw)',
  },
  levelBtn: {
    aspectRatio: 1,
    borderRadius: 12,
    border: '2px solid #222',
    background: 'linear-gradient(135deg, #1a1a24 0%, #0f0f18 100%)',
    color: '#888',
    fontSize: '1.3rem',
    fontWeight: 700,
    cursor: 'pointer',
    position: 'relative' as const,
  },
  levelBtnDone: {
    background: 'linear-gradient(135deg, #166534 0%, #14532d 100%)',
    borderColor: '#22c55e',
    color: '#fff',
  },
  star: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    background: '#fbbf24',
    borderRadius: '50%',
    fontSize: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#000',
  },
  
  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 'min(90vw, 400px)',
    marginBottom: 12,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    border: 'none',
    background: 'rgba(255,255,255,0.05)',
    color: '#888',
    fontSize: '1.3rem',
    cursor: 'pointer',
  },
  headerCenter: {
    textAlign: 'center' as const,
  },
  levelName: {
    fontSize: '1.1rem',
    fontWeight: 700,
  },
  levelNum: {
    fontSize: '0.75rem',
    color: '#555',
  },
  
  // Compression
  compressionBox: {
    width: 'min(90vw, 400px)',
    marginBottom: 8,
  },
  compressionLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.7rem',
    color: '#555',
    letterSpacing: '0.1em',
    marginBottom: 4,
  },
  compressionTrack: {
    height: 8,
    background: '#111',
    borderRadius: 4,
    overflow: 'hidden',
    border: '1px solid #1a1a1a',
  },
  compressionFill: {
    height: '100%',
    transition: 'width 0.3s',
  },
  
  // Moves
  moves: {
    marginBottom: 12,
  },
  movesNum: {
    fontSize: '1.5rem',
    fontWeight: 700,
  },
  movesMax: {
    fontSize: '0.9rem',
    color: '#555',
  },
  
  // Board
  boardWrap: {
    position: 'relative' as const,
    width: 'min(85vw, 85vh, 360px)',
    aspectRatio: 1,
  },
  board: {
    width: '100%',
    height: '100%',
    display: 'grid',
    gap: 4,
    padding: 8,
    background: '#0a0a0f',
    borderRadius: 16,
    border: '2px solid #1a1a24',
    boxSizing: 'border-box' as const,
  },
  tile: {
    borderRadius: 6,
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Connections
  conn: {
    position: 'absolute' as const,
    background: 'rgba(255,255,255,0.85)',
  },
  connUp: { top: 0, left: '50%', transform: 'translateX(-50%)', width: 4, height: '50%', borderRadius: '2px 2px 0 0' },
  connDown: { bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 4, height: '50%', borderRadius: '0 0 2px 2px' },
  connLeft: { left: 0, top: '50%', transform: 'translateY(-50%)', width: '50%', height: 4, borderRadius: '2px 0 0 2px' },
  connRight: { right: 0, top: '50%', transform: 'translateY(-50%)', width: '50%', height: 4, borderRadius: '0 2px 2px 0' },
  connCenter: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 8,
    height: 8,
    background: 'rgba(255,255,255,0.85)',
    borderRadius: '50%',
  },
  nodeDot: {
    width: '50%',
    height: '50%',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.4)',
  },
  rotateDot: {
    position: 'absolute' as const,
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    background: '#fcd34d',
    borderRadius: '50%',
    boxShadow: '0 0 6px rgba(252,211,77,0.6)',
  },
  
  // Overlay
  overlay: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(8,8,12,0.95)',
    borderRadius: 16,
  },
  overlayWin: {
    background: 'rgba(22,101,52,0.95)',
  },
  overlayLose: {
    background: 'rgba(127,29,29,0.95)',
  },
  overlayTitle: {
    fontSize: '1.5rem',
    fontWeight: 800,
    marginBottom: 8,
  },
  overlayText: {
    fontSize: '0.9rem',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 16,
    textAlign: 'center' as const,
    padding: '0 20px',
  },
  overlayPar: {
    fontSize: '0.9rem',
    color: '#fbbf24',
    marginBottom: 20,
  },
  overlayIcon: {
    fontSize: '3rem',
    marginBottom: 8,
  },
  startBtn: {
    padding: '14px 48px',
    fontSize: '1.1rem',
    fontWeight: 700,
    border: 'none',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    color: '#fff',
    cursor: 'pointer',
  },
  nextBtn: {
    padding: '12px 32px',
    fontSize: '1rem',
    fontWeight: 700,
    border: 'none',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.15)',
    color: '#fff',
    cursor: 'pointer',
  },
  hintBtn: {
    marginTop: 16,
    padding: '10px 20px',
    border: 'none',
    borderRadius: 8,
    background: 'rgba(251,191,36,0.1)',
    color: '#fbbf24',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
}

function getTileStyle(
  type: string, 
  canRotate: boolean, 
  isGoalNode: boolean,
  inDanger: boolean,
  isHint: boolean,
  distFromEdge: number,
  wallOffset: number
): React.CSSProperties {
  const base: React.CSSProperties = { cursor: canRotate ? 'pointer' : 'default' }
  
  if (type === 'wall') {
    return {
      ...base,
      background: 'linear-gradient(135deg, #1a1a28 0%, #0f0f18 100%)',
      border: '1px solid #252535',
    }
  }
  
  if (type === 'crushed') {
    return {
      ...base,
      background: 'linear-gradient(135deg, #1a0808 0%, #0f0505 100%)',
      border: '1px solid #2a1515',
    }
  }
  
  if (type === 'node') {
    return {
      ...base,
      background: 'linear-gradient(135deg, #166534 0%, #14532d 100%)',
      border: '2px solid #22c55e',
      boxShadow: '0 0 15px rgba(34,197,94,0.3)',
    }
  }
  
  if (type === 'path') {
    if (canRotate) {
      return {
        ...base,
        background: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)',
        border: '2px solid #f59e0b',
        boxShadow: inDanger ? '0 0 0 2px rgba(239,68,68,0.5)' : isHint ? '0 0 0 3px #fbbf24' : '0 0 10px rgba(245,158,11,0.25)',
      }
    }
    return {
      ...base,
      background: 'linear-gradient(135deg, #1e3a5f 0%, #1a365d 100%)',
      border: '1px solid #2563eb',
    }
  }
  
  // Empty - show as dark
  return {
    ...base,
    background: 'rgba(20, 20, 30, 0.3)',
  }
}
