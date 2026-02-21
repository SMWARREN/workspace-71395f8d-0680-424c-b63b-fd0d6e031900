// PRESSURE - Core Game Types

export type Direction = 'up' | 'down' | 'left' | 'right'

export interface Position {
  x: number
  y: number
}

export interface Tile {
  id: string
  type: 'empty' | 'wall' | 'node' | 'path' | 'crushed'
  x: number
  y: number
  connections: Direction[]
  isGoalNode: boolean
  canRotate: boolean
}

export interface Level {
  id: number
  name: string
  world: number
  gridSize: number
  tiles: Tile[]
  compressionDelay: number
  compressionRate: number
  maxMoves: number
  goalNodes: Position[]
}

export interface GameState {
  currentLevel: Level | null
  tiles: Tile[]
  wallOffset: number
  compressionActive: boolean
  compressionRate: number
  moves: number
  status: 'menu' | 'idle' | 'playing' | 'won' | 'lost'
  completedLevels: number[]
  bestMoves: Record<number, number>
}

export interface GameActions {
  loadLevel: (level: Level) => void
  restartLevel: () => void
  startGame: () => void
  tapTile: (x: number, y: number) => void
  advanceWalls: () => void
  checkWin: () => boolean
  goToMenu: () => void
}
