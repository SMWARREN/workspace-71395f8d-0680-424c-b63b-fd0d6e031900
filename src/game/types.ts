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
  // Animation state
  justRotated?: boolean
  justCrushed?: boolean
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
  isGenerated?: boolean
  par?: number          // optimal solve moves
}

export interface GameState {
  currentLevel: Level | null
  tiles: Tile[]
  wallOffset: number
  compressionActive: boolean
  compressionRate: number
  moves: number
  status: 'menu' | 'tutorial' | 'idle' | 'playing' | 'won' | 'lost'
  completedLevels: number[]
  bestMoves: Record<number, number>
  history: Tile[][]
  lastRotatedPos: Position | null
  showTutorial: boolean
  generatedLevels: Level[]
  elapsedSeconds: number
  screenShake: boolean
}

export interface GameActions {
  loadLevel: (level: Level) => void
  restartLevel: () => void
  startGame: () => void
  tapTile: (x: number, y: number) => void
  advanceWalls: () => void
  checkWin: () => boolean
  goToMenu: () => void
  undoMove: () => void
  completeTutorial: () => void
  addGeneratedLevel: (level: Level) => void
  deleteGeneratedLevel: (id: number) => void
  tickTimer: () => void
  triggerShake: () => void
}
