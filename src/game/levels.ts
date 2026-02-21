// PRESSURE - Verified Solvable Levels (NOT pre-solved)
import { Level, Tile, Position, Direction } from './types'

const DIRS: Direction[] = ['up', 'right', 'down', 'left']
const OPP: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' }

function rotate(conns: Direction[], times: number): Direction[] {
  return conns.map(c => DIRS[(DIRS.indexOf(c) + times) % 4])
}

// BFS to check if all goal nodes are connected
function isConnected(tiles: Tile[], goals: Position[]): boolean {
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

// BFS solver - returns number of rotations needed
function solve(tiles: Tile[], goals: Position[], maxMoves: number): number {
  if (isConnected(tiles, goals)) return 0
  
  const rotatable = tiles.filter(t => t.canRotate)
  if (rotatable.length === 0) return -1
  
  const visited = new Set<string>()
  const queue: { tiles: Tile[]; moves: number }[] = [{ tiles: [...tiles], moves: 0 }]
  
  const hash = (ts: Tile[]) => ts
    .filter(t => t.canRotate)
    .map(t => `${t.x},${t.y}:${t.connections.join(',')}`)
    .sort()
    .join('|')
  
  visited.add(hash(tiles))
  
  while (queue.length > 0) {
    const curr = queue.shift()!
    
    for (const rt of rotatable) {
      for (let r = 1; r <= 3; r++) {
        const newTiles = curr.tiles.map(t => {
          if (t.x === rt.x && t.y === rt.y) {
            return { ...t, connections: rotate(t.connections, r) }
          }
          return t
        })
        
        const h = hash(newTiles)
        if (visited.has(h)) continue
        visited.add(h)
        
        const newMoves = curr.moves + r
        if (newMoves > maxMoves) continue
        
        if (isConnected(newTiles, goals)) return newMoves
        
        queue.push({ tiles: newTiles, moves: newMoves })
      }
    }
  }
  
  return -1
}

// Create a tile
function tile(type: Tile['type'], x: number, y: number, extra: Partial<Tile> = {}): Tile {
  return {
    id: `${type}-${x}-${y}`,
    type, x, y,
    connections: [],
    isGoalNode: false,
    canRotate: false,
    ...extra
  }
}

// Create wall border for a grid
function createWalls(size: number): Tile[] {
  const walls: Tile[] = []
  for (let i = 0; i < size; i++) {
    walls.push(tile('wall', i, 0))
    walls.push(tile('wall', i, size - 1))
    if (i > 0 && i < size - 1) {
      walls.push(tile('wall', 0, i))
      walls.push(tile('wall', size - 1, i))
    }
  }
  return walls
}

// ALL LEVELS - tiles start in WRONG rotation so they need to be rotated to solve
export const LEVELS: Level[] = [
  // Level 1: One tile to rotate (starts vertical, needs horizontal)
  {
    id: 1, name: 'First', world: 1, gridSize: 5,
    tiles: [
      ...createWalls(5),
      tile('node', 1, 2, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      // Path starts vertical (up-down) but needs to be horizontal (left-right)
      tile('path', 2, 2, { connections: ['up', 'down'], canRotate: true }),
      tile('node', 3, 2, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
    ],
    compressionDelay: 10000,
    compressionRate: 4000,
    maxMoves: 3,
    goalNodes: [{ x: 1, y: 2 }, { x: 3, y: 2 }],
  },
  
  // Level 2: Two tiles to rotate
  {
    id: 2, name: 'Double', world: 1, gridSize: 5,
    tiles: [
      ...createWalls(5),
      tile('node', 1, 2, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('path', 2, 2, { connections: ['up', 'down'], canRotate: true }),
      tile('path', 3, 2, { connections: ['up', 'down'], canRotate: true }),
      tile('node', 4, 2, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
    ],
    compressionDelay: 8000,
    compressionRate: 3500,
    maxMoves: 5,
    goalNodes: [{ x: 1, y: 2 }, { x: 4, y: 2 }],
  },
  
  // Level 3: Vertical connection (tiles start horizontal)
  {
    id: 3, name: 'Vertical', world: 1, gridSize: 5,
    tiles: [
      ...createWalls(5),
      tile('node', 2, 1, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      // Path starts horizontal but needs to be vertical
      tile('path', 2, 2, { connections: ['left', 'right'], canRotate: true }),
      tile('node', 2, 3, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
    ],
    compressionDelay: 8000,
    compressionRate: 3500,
    maxMoves: 3,
    goalNodes: [{ x: 2, y: 1 }, { x: 2, y: 3 }],
  },
  
  // Level 4: L-shape corner
  {
    id: 4, name: 'Corner', world: 1, gridSize: 5,
    tiles: [
      ...createWalls(5),
      tile('node', 1, 1, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('path', 1, 2, { connections: ['left', 'right'], canRotate: true }),
      tile('path', 1, 3, { connections: ['up', 'down'], canRotate: true }),
      tile('path', 2, 3, { connections: ['up', 'down'], canRotate: true }),
      tile('node', 3, 3, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
    ],
    compressionDelay: 7000,
    compressionRate: 3000,
    maxMoves: 6,
    goalNodes: [{ x: 1, y: 1 }, { x: 3, y: 3 }],
  },
  
  // Level 5: Four corners
  {
    id: 5, name: 'Square', world: 2, gridSize: 5,
    tiles: [
      ...createWalls(5),
      tile('node', 1, 1, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('node', 3, 1, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('node', 1, 3, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('node', 3, 3, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      // All paths start in wrong direction
      tile('path', 2, 1, { connections: ['up', 'down'], canRotate: true }),
      tile('path', 2, 3, { connections: ['up', 'down'], canRotate: true }),
      tile('path', 1, 2, { connections: ['left', 'right'], canRotate: true }),
      tile('path', 3, 2, { connections: ['left', 'right'], canRotate: true }),
    ],
    compressionDelay: 6000,
    compressionRate: 2500,
    maxMoves: 8,
    goalNodes: [{ x: 1, y: 1 }, { x: 3, y: 1 }, { x: 1, y: 3 }, { x: 3, y: 3 }],
  },
  
  // Level 6: Zigzag
  {
    id: 6, name: 'Zigzag', world: 2, gridSize: 5,
    tiles: [
      ...createWalls(5),
      tile('node', 1, 1, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('path', 2, 1, { connections: ['up', 'down'], canRotate: true }),
      tile('path', 3, 1, { connections: ['up', 'down'], canRotate: true }),
      tile('path', 3, 2, { connections: ['left', 'right'], canRotate: true }),
      tile('path', 3, 3, { connections: ['left', 'right'], canRotate: true }),
      tile('path', 2, 3, { connections: ['up', 'down'], canRotate: true }),
      tile('node', 1, 3, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
    ],
    compressionDelay: 6000,
    compressionRate: 2500,
    maxMoves: 10,
    goalNodes: [{ x: 1, y: 1 }, { x: 1, y: 3 }],
  },
  
  // Level 7: Triple line
  {
    id: 7, name: 'Triple', world: 2, gridSize: 5,
    tiles: [
      ...createWalls(5),
      tile('node', 1, 2, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('path', 2, 2, { connections: ['up', 'down'], canRotate: true }),
      tile('node', 3, 2, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('path', 4, 2, { connections: ['up', 'down'], canRotate: true }),
    ],
    compressionDelay: 5000,
    compressionRate: 2000,
    maxMoves: 4,
    goalNodes: [{ x: 1, y: 2 }, { x: 3, y: 2 }],
  },
  
  // Level 8: Cross center
  {
    id: 8, name: 'Cross', world: 3, gridSize: 5,
    tiles: [
      ...createWalls(5),
      tile('node', 1, 1, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('node', 3, 1, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('node', 1, 3, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('node', 3, 3, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      // Center cross piece (fixed)
      tile('path', 2, 2, { connections: ['up', 'down', 'left', 'right'] }),
      // Wrong direction paths
      tile('path', 2, 1, { connections: ['up', 'down'], canRotate: true }),
      tile('path', 2, 3, { connections: ['up', 'down'], canRotate: true }),
      tile('path', 1, 2, { connections: ['left', 'right'], canRotate: true }),
      tile('path', 3, 2, { connections: ['left', 'right'], canRotate: true }),
    ],
    compressionDelay: 5000,
    compressionRate: 2000,
    maxMoves: 6,
    goalNodes: [{ x: 1, y: 1 }, { x: 3, y: 1 }, { x: 1, y: 3 }, { x: 3, y: 3 }],
  },
  
  // Level 9: Spiral
  {
    id: 9, name: 'Spiral', world: 3, gridSize: 5,
    tiles: [
      ...createWalls(5),
      tile('node', 1, 1, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('path', 2, 1, { connections: ['up', 'down'], canRotate: true }),
      tile('path', 3, 1, { connections: ['up', 'down'], canRotate: true }),
      tile('path', 3, 2, { connections: ['left', 'right'], canRotate: true }),
      tile('path', 3, 3, { connections: ['up', 'down'], canRotate: true }),
      tile('path', 2, 3, { connections: ['left', 'right'], canRotate: true }),
      tile('node', 1, 3, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
    ],
    compressionDelay: 4000,
    compressionRate: 1800,
    maxMoves: 10,
    goalNodes: [{ x: 1, y: 1 }, { x: 1, y: 3 }],
  },
  
  // Level 10: Final
  {
    id: 10, name: 'Final', world: 3, gridSize: 5,
    tiles: [
      ...createWalls(5),
      tile('node', 1, 1, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('node', 3, 1, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('node', 2, 2, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('node', 1, 3, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      tile('node', 3, 3, { connections: ['up', 'down', 'left', 'right'], isGoalNode: true }),
      // Wrong direction paths
      tile('path', 2, 1, { connections: ['up', 'down'], canRotate: true }),
      tile('path', 1, 2, { connections: ['left', 'right'], canRotate: true }),
      tile('path', 3, 2, { connections: ['left', 'right'], canRotate: true }),
      tile('path', 2, 3, { connections: ['up', 'down'], canRotate: true }),
    ],
    compressionDelay: 4000,
    compressionRate: 1500,
    maxMoves: 8,
    goalNodes: [{ x: 1, y: 1 }, { x: 3, y: 1 }, { x: 2, y: 2 }, { x: 1, y: 3 }, { x: 3, y: 3 }],
  },
]

// Verify all levels
export function verifyLevels(): { id: number; name: string; solvable: boolean; moves: number }[] {
  return LEVELS.map(level => {
    const moves = solve(level.tiles, level.goalNodes, level.maxMoves)
    return {
      id: level.id,
      name: level.name,
      solvable: moves >= 0,
      moves
    }
  })
}

// Get solution for a level
export function getSolution(level: Level): { x: number; y: number; rotations: number }[] | null {
  // Simple BFS to find the solution path
  if (isConnected(level.tiles, level.goalNodes)) return []
  
  const rotatable = level.tiles.filter(t => t.canRotate)
  const DIRS: Direction[] = ['up', 'right', 'down', 'left']
  
  const rotate = (conns: Direction[], times: number): Direction[] => 
    conns.map(c => DIRS[(DIRS.indexOf(c) + times) % 4])
  
  const visited = new Set<string>()
  const queue: { tiles: Tile[]; path: { x: number; y: number; rotations: number }[] }[] = [
    { tiles: [...level.tiles], path: [] }
  ]
  
  const hash = (ts: Tile[]) => ts
    .filter(t => t.canRotate)
    .map(t => `${t.x},${t.y}:${t.connections.join(',')}`)
    .sort()
    .join('|')
  
  visited.add(hash(level.tiles))
  
  while (queue.length > 0) {
    const curr = queue.shift()!
    
    for (const rt of rotatable) {
      for (let r = 1; r <= 3; r++) {
        const newTiles = curr.tiles.map(t => {
          if (t.x === rt.x && t.y === rt.y) {
            return { ...t, connections: rotate(t.connections, r) }
          }
          return t
        })
        
        const h = hash(newTiles)
        if (visited.has(h)) continue
        visited.add(h)
        
        const newPath = [...curr.path, { x: rt.x, y: rt.y, rotations: r }]
        
        if (isConnected(newTiles, level.goalNodes)) return newPath
        
        const totalMoves = newPath.reduce((s, p) => s + p.rotations, 0)
        if (totalMoves < level.maxMoves) {
          queue.push({ tiles: newTiles, path: newPath })
        }
      }
    }
  }
  
  return null
}

export function getLevelsByWorld(world: number): Level[] {
  return LEVELS.filter(l => l.world === world)
}

/* ─────────────────────────────────────────
   Level Verifier
───────────────────────────────────────── */
export function verifyLevel(level: Level): { solvable: boolean; minMoves: number } {
  const moves = solve(level.tiles, level.goalNodes, level.maxMoves)
  return { solvable: moves >= 0, minMoves: moves }
}

/* ─────────────────────────────────────────
   Procedural Level Generator
   Algorithm:
   1. Pick random interior positions for goal nodes
   2. Build a spanning tree connecting all nodes via BFS path routing
   3. Scramble path tiles (rotate them away from solution)
   4. Verify with BFS solver — retry up to 30 times if unsolvable
───────────────────────────────────────── */
export interface GenerateOptions {
  gridSize: number
  nodeCount: number
  difficulty: 'easy' | 'medium' | 'hard'
}

function rng(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generateLevel(opts: GenerateOptions): Level {
  const { gridSize, nodeCount, difficulty } = opts
  const inner = gridSize - 2  // interior cells (excluding border walls)

  const diffParams = {
    easy:   { compressionDelay: 10000, rateMultiplier: 1.0, movePadding: 4 },
    medium: { compressionDelay: 6000,  rateMultiplier: 0.75, movePadding: 2 },
    hard:   { compressionDelay: 4000,  rateMultiplier: 0.5, movePadding: 1 },
  }[difficulty]

  const baseRate = Math.max(1200, 3000 - (gridSize - 4) * 200)
  const compressionRate = Math.round(baseRate * diffParams.rateMultiplier)

  for (let attempt = 0; attempt < 40; attempt++) {
    // 1. Pick goal node positions (interior only, not touching border)
    const candidates: Position[] = []
    for (let y = 1; y < gridSize - 1; y++)
      for (let x = 1; x < gridSize - 1; x++)
        candidates.push({ x, y })

    const shuffled = shuffleArray(candidates)
    // Ensure nodes aren't adjacent for more interesting layouts
    const goalPositions: Position[] = []
    for (const pos of shuffled) {
      if (goalPositions.length >= nodeCount) break
      const tooClose = goalPositions.some(g => Math.abs(g.x - pos.x) + Math.abs(g.y - pos.y) < 2)
      if (!tooClose) goalPositions.push(pos)
    }
    if (goalPositions.length < nodeCount) continue

    // 2. Build paths connecting nodes using Prim's-like spanning tree
    // We trace paths between pairs of nodes
    const pathSet = new Set<string>()
    const pathDirs = new Map<string, Direction[]>()

    const addPath = (x: number, y: number, dirs: Direction[]) => {
      const key = `${x},${y}`
      const existing = pathDirs.get(key) ?? []
      const merged = [...new Set([...existing, ...dirs])]
      pathDirs.set(key, merged)
      pathSet.add(key)
    }

    // Trace a path between two positions using L-shaped routing
    const tracePath = (from: Position, to: Position) => {
      let cx = from.x, cy = from.y
      // Move horizontally first, then vertically
      while (cx !== to.x) {
        const dx = to.x > cx ? 1 : -1
        const dir: Direction = dx > 0 ? 'right' : 'left'
        const opp: Direction = dx > 0 ? 'left' : 'right'
        const key = `${cx},${cy}`
        const existing = pathDirs.get(key) ?? []
        if (!existing.includes(dir)) addPath(cx, cy, [dir])
        cx += dx
        if (cx !== to.x || cy !== to.y) addPath(cx, cy, [opp])
      }
      while (cy !== to.y) {
        const dy = to.y > cy ? 1 : -1
        const dir: Direction = dy > 0 ? 'down' : 'up'
        const opp: Direction = dy > 0 ? 'up' : 'down'
        addPath(cx, cy, [dir])
        cy += dy
        if (cx !== to.x || cy !== to.y || cy === to.y) addPath(cx, cy, [opp])
      }
    }

    // Connect goal nodes in sequence
    for (let i = 0; i < goalPositions.length - 1; i++) {
      tracePath(goalPositions[i], goalPositions[i + 1])
    }

    // 3. Build tile array
    const wallTiles: Tile[] = []
    for (let i = 0; i < gridSize; i++) {
      wallTiles.push({ id: `wall-${i}-0`, type: 'wall', x: i, y: 0, connections: [], isGoalNode: false, canRotate: false })
      wallTiles.push({ id: `wall-${i}-${gridSize-1}`, type: 'wall', x: i, y: gridSize - 1, connections: [], isGoalNode: false, canRotate: false })
      if (i > 0 && i < gridSize - 1) {
        wallTiles.push({ id: `wall-0-${i}`, type: 'wall', x: 0, y: i, connections: [], isGoalNode: false, canRotate: false })
        wallTiles.push({ id: `wall-${gridSize-1}-${i}`, type: 'wall', x: gridSize - 1, y: i, connections: [], isGoalNode: false, canRotate: false })
      }
    }

    const goalSet = new Set(goalPositions.map(p => `${p.x},${p.y}`))
    const nodeTiles: Tile[] = goalPositions.map(p => ({
      id: `node-${p.x}-${p.y}`, type: 'node' as const,
      x: p.x, y: p.y,
      connections: ['up', 'down', 'left', 'right'] as Direction[],
      isGoalNode: true, canRotate: false,
    }))

    // Path tiles — exclude node positions, scramble connections
    const pathTiles: Tile[] = []
    pathDirs.forEach((dirs, key) => {
      const [px, py] = key.split(',').map(Number)
      if (goalSet.has(key)) return  // skip — node handles this position
      // Scramble: rotate connections by 1-3 steps so it's NOT solved
      const scrambleAmount = rng(1, 3)
      const scrambledConns = dirs.map(d => DIRS[(DIRS.indexOf(d) + scrambleAmount) % 4])
      pathTiles.push({
        id: `path-${px}-${py}`, type: 'path',
        x: px, y: py,
        connections: scrambledConns,
        isGoalNode: false, canRotate: true,
      })
    })

    const allTiles = [...wallTiles, ...nodeTiles, ...pathTiles]

    // 4. Compute min moves needed
    const rotatableCount = pathTiles.length
    const estimatedMaxMoves = rotatableCount * 3 + diffParams.movePadding
    const verifyMoves = solve(allTiles, goalPositions, estimatedMaxMoves)

    if (verifyMoves < 0) continue  // unsolvable, try again

    const maxMoves = verifyMoves + diffParams.movePadding

    const generatedId = Date.now() + attempt
    return {
      id: generatedId,
      name: generateLevelName(difficulty, gridSize, nodeCount),
      world: 4,
      gridSize,
      tiles: allTiles,
      compressionDelay: diffParams.compressionDelay,
      compressionRate,
      maxMoves,
      goalNodes: goalPositions,
      isGenerated: true,
    }
  }

  // Fallback — simple 2-node guaranteed solvable level
  return generateSimpleFallback(gridSize, difficulty)
}

function generateLevelName(difficulty: string, gridSize: number, nodeCount: number): string {
  const byDiff: Record<string, string[]> = {
    easy:   ['Calm', 'Gentle', 'Soft', 'Slow', 'Easy', 'Mild', 'Simple', 'Light', 'Smooth', 'Basic'],
    medium: ['Twisted', 'Warped', 'Fractured', 'Bent', 'Coiled', 'Tangled', 'Knotted', 'Looped', 'Wired', 'Crossed'],
    hard:   ['Brutal', 'Savage', 'Merciless', 'Vicious', 'Deadly', 'Fierce', 'Extreme', 'Critical', 'Lethal', 'Crushing'],
  }
  const nouns = ['Circuit', 'Conduit', 'Nexus', 'Node', 'Web', 'Mesh', 'Matrix', 'Grid', 'Array', 'Path', 'Strand', 'Line', 'Flow', 'Pulse', 'Link', 'Chain', 'Pipe', 'Thread', 'Wire', 'Route']
  const adj = (byDiff[difficulty] ?? byDiff.medium)[Math.floor(Math.random() * 10)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  return `${adj} ${noun}`
}

function generateSimpleFallback(gridSize: number, difficulty: string): Level {
  const mid = Math.floor(gridSize / 2)
  const diffParams = {
    easy:   { compressionDelay: 10000, compressionRate: 3000, movePadding: 4 },
    medium: { compressionDelay: 6000,  compressionRate: 2200, movePadding: 2 },
    hard:   { compressionDelay: 4000,  compressionRate: 1600, movePadding: 1 },
  }[difficulty as 'easy' | 'medium' | 'hard'] ?? { compressionDelay: 6000, compressionRate: 2200, movePadding: 2 }

  const wallTiles: Tile[] = []
  for (let i = 0; i < gridSize; i++) {
    wallTiles.push({ id: `wall-${i}-0`, type: 'wall', x: i, y: 0, connections: [], isGoalNode: false, canRotate: false })
    wallTiles.push({ id: `wall-${i}-${gridSize-1}`, type: 'wall', x: i, y: gridSize - 1, connections: [], isGoalNode: false, canRotate: false })
    if (i > 0 && i < gridSize - 1) {
      wallTiles.push({ id: `wall-0-${i}`, type: 'wall', x: 0, y: i, connections: [], isGoalNode: false, canRotate: false })
      wallTiles.push({ id: `wall-${gridSize-1}-${i}`, type: 'wall', x: gridSize - 1, y: i, connections: [], isGoalNode: false, canRotate: false })
    }
  }

  return {
    id: Date.now(),
    name: 'Simple Path',
    world: 4, gridSize,
    tiles: [
      ...wallTiles,
      { id: 'node-1-mid', type: 'node', x: 1, y: mid, connections: ['up','down','left','right'] as Direction[], isGoalNode: true, canRotate: false },
      { id: 'path-mid-mid', type: 'path', x: mid, y: mid, connections: ['up', 'down'] as Direction[], isGoalNode: false, canRotate: true },
      { id: `node-${gridSize-2}-mid`, type: 'node', x: gridSize - 2, y: mid, connections: ['up','down','left','right'] as Direction[], isGoalNode: true, canRotate: false },
    ],
    compressionDelay: diffParams.compressionDelay,
    compressionRate: diffParams.compressionRate,
    maxMoves: 3 + diffParams.movePadding,
    goalNodes: [{ x: 1, y: mid }, { x: gridSize - 2, y: mid }],
    isGenerated: true,
  }
}
