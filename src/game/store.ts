// PRESSURE - Game Store with REAL wall compression
import { create } from 'zustand'
import { GameState, GameActions, Level, Tile, Position, Direction } from './types'

const DIRS: Direction[] = ['up', 'right', 'down', 'left']
const OPP: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' }

const initialState: GameState = {
  currentLevel: null,
  tiles: [],
  wallOffset: 0,
  compressionActive: false,
  compressionRate: 3000,
  moves: 0,
  status: 'menu',
  completedLevels: [],
  bestMoves: {},
}

function rotateConnections(conns: Direction[], times: number): Direction[] {
  return conns.map(c => DIRS[(DIRS.indexOf(c) + times) % 4])
}

function checkConnected(tiles: Tile[], goals: Position[]): boolean {
  if (goals.length < 2) return true
  
  const getTile = (x: number, y: number) => tiles.find(t => t.x === x && t.y === y)
  
  const visited = new Set<string>()
  const queue: Position[] = [goals[0]]
  visited.add(`${goals[0].x},${goals[0].y}`)
  const connected = new Set([`${goals[0].x},${goals[0].y}`])
  
  while (queue.length > 0) {
    const curr = queue.shift()!
    const tile = getTile(curr.x, curr.y)
    if (!tile) continue
    
    for (const d of tile.connections) {
      let nx = curr.x, ny = curr.y
      if (d === 'up') ny--; else if (d === 'down') ny++
      else if (d === 'left') nx--; else if (d === 'right') nx++
      
      const key = `${nx},${ny}`
      if (visited.has(key)) continue
      
      const neighbor = getTile(nx, ny)
      if (!neighbor || neighbor.type === 'wall' || neighbor.type === 'crushed') continue
      
      if (neighbor.connections.includes(OPP[d])) {
        visited.add(key)
        queue.push({ x: nx, y: ny })
        if (goals.some(g => g.x === nx && g.y === ny)) connected.add(key)
      }
    }
  }
  
  return goals.every(g => connected.has(`${g.x},${g.y}`))
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  loadLevel: (level: Level) => {
    set({
      currentLevel: level,
      tiles: level.tiles.map(t => ({ ...t, connections: [...t.connections] })),
      wallOffset: 0,
      compressionActive: false,
      compressionRate: level.compressionRate,
      moves: 0,
      status: 'idle',
    })
  },

  restartLevel: () => {
    const { currentLevel } = get()
    if (currentLevel) get().loadLevel(currentLevel)
  },

  startGame: () => {
    const { currentLevel } = get()
    if (!currentLevel) return
    
    set({ status: 'playing' })
    
    if (get().checkWin()) return
    
    // Start compression after delay
    setTimeout(() => {
      if (get().status === 'playing') {
        set({ compressionActive: true })
      }
    }, currentLevel.compressionDelay)
  },

  tapTile: (x: number, y: number) => {
    const { tiles, status, moves, currentLevel } = get()
    if (status !== 'playing') return
    
    const tile = tiles.find(t => t.x === x && t.y === y)
    if (!tile?.canRotate) return
    if (currentLevel && moves >= currentLevel.maxMoves) return

    const newTiles = tiles.map(t => {
      if (t.x === x && t.y === y) {
        return { ...t, connections: rotateConnections(t.connections, 1) }
      }
      return t
    })

    set({ tiles: newTiles, moves: moves + 1 })
    get().checkWin()
  },

  advanceWalls: () => {
    const { wallOffset, compressionActive, status, tiles, currentLevel } = get()
    if (status !== 'playing' || !compressionActive || !currentLevel) return

    const newOffset = wallOffset + 1
    const gridSize = currentLevel.gridSize
    
    // Check if any goal node is being crushed
    let crushedNode = false
    const newTiles = tiles.map(t => {
      // Calculate if this tile is in the crush zone
      const distFromEdge = Math.min(t.x, t.y, gridSize - 1 - t.x, gridSize - 1 - t.y)
      
      if (distFromEdge < newOffset) {
        if (t.type === 'node') {
          crushedNode = true
          return { ...t, type: 'crushed' as const, connections: [], canRotate: false }
        }
        if (t.type === 'path') {
          return { ...t, type: 'crushed' as const, connections: [], canRotate: false }
        }
      }
      return t
    })
    
    set({ tiles: newTiles, wallOffset: newOffset })
    
    if (crushedNode) {
      set({ status: 'lost', compressionActive: false })
    }
  },

  checkWin: () => {
    const { tiles, currentLevel, moves } = get()
    if (!currentLevel) return false

    if (checkConnected(tiles, currentLevel.goalNodes)) {
      set(state => {
        const newCompleted = [...new Set([...state.completedLevels, currentLevel.id])]
        const newBest = { ...state.bestMoves }
        if (!newBest[currentLevel.id] || moves < newBest[currentLevel.id]) {
          newBest[currentLevel.id] = moves
        }
        return { 
          status: 'won', 
          completedLevels: newCompleted, 
          bestMoves: newBest,
          compressionActive: false 
        }
      })
      return true
    }
    return false
  },

  goToMenu: () => {
    set({ status: 'menu', currentLevel: null, compressionActive: false })
  },
}))
