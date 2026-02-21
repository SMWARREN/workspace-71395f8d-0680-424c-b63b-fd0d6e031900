'use client'

import { useState } from 'react'
import { Tile } from '@/game/types'

// Tutorial step content
const TUTORIAL_STEPS = [
  {
    title: "Welcome to PRESSURE",
    subtitle: "A time-compression puzzle game",
    content: "The walls are closing in. Your goal is to connect all the green nodes before everything gets crushed.",
    demo: null,
  },
  {
    title: "Goal Nodes",
    subtitle: "Your objective",
    content: "These green circles are Goal Nodes. You must connect ALL of them with paths to win the level. If any goal node gets crushed by the walls, you lose!",
    demo: { type: 'node', color: 'emerald' },
  },
  {
    title: "Paths",
    subtitle: "The connections",
    content: "Blue tiles are Paths. They connect nodes together. The white lines show which directions the path connects. This path connects UP and DOWN.",
    demo: { type: 'path', connections: ['up', 'down'], color: 'blue' },
  },
  {
    title: "Rotatable Paths",
    subtitle: "Tap to rotate!",
    content: "Amber-colored paths can be ROTATED! Tap them to rotate 90°. The small dot in the corner indicates it's rotatable. Use these to redirect paths!",
    demo: { type: 'path', connections: ['up', 'right'], color: 'amber', canRotate: true },
  },
  {
    title: "Walls",
    subtitle: "The danger zone",
    content: "Gray tiles are Walls. Static walls (dark gray) don't move. But MOVING WALLS (lighter, pulsing) will crush inward as time passes! They turn RED when about to crush.",
    demo: { type: 'moving-wall', color: 'gray' },
  },
  {
    title: "Compression",
    subtitle: "Time is pressure",
    content: "Watch the compression bar at the top. When it activates, walls start crushing inward. The bar shows danger level: GREEN (safe) → AMBER (warning) → RED (critical!).",
    demo: { type: 'compression' },
  },
  {
    title: "How to Win",
    subtitle: "Connect before crush",
    content: "1. Look at where the goal nodes are\n2. Plan which paths need to rotate\n3. Tap rotatable paths to connect all nodes\n4. Complete BEFORE compression reaches the nodes!\n\nThink early. Move once. Survive the squeeze.",
    demo: { type: 'win' },
  },
]

// Demo tile component for tutorial
const DemoTile = ({ demo }: { demo: typeof TUTORIAL_STEPS[0]['demo'] }) => {
  if (!demo) return null

  if (demo.type === 'compression') {
    return (
      <div className="flex flex-col gap-3 items-center">
        <div className="flex gap-1">
          <div className="w-16 h-8 rounded bg-emerald-500/50 border border-emerald-400/50" />
          <div className="w-16 h-8 rounded bg-amber-500/50 border border-amber-400/50" />
          <div className="w-16 h-8 rounded bg-red-500/50 border border-red-400/50 animate-pulse" />
        </div>
        <p className="text-slate-500 text-sm">Compression levels: Safe → Warning → Critical</p>
      </div>
    )
  }

  if (demo.type === 'win') {
    return (
      <div className="flex flex-col gap-3 items-center">
        <div className="flex items-center gap-2">
          {/* Node 1 */}
          <div className="w-12 h-12 rounded-lg bg-emerald-500 border-2 border-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <div className="w-5 h-5 rounded-full bg-white/40 border border-white/60" />
          </div>
          {/* Path */}
          <div className="w-8 h-12 rounded-lg bg-amber-500/80 border-2 border-amber-400 flex items-center justify-center relative">
            <div className="absolute left-0 right-0 top-1/2 h-2 bg-white/60 -translate-y-1/2" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-300 rounded-full border border-amber-200" />
          </div>
          {/* Node 2 */}
          <div className="w-12 h-12 rounded-lg bg-emerald-500 border-2 border-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <div className="w-5 h-5 rounded-full bg-white/40 border border-white/60" />
          </div>
        </div>
        <p className="text-emerald-400 font-medium">✓ Connected!</p>
      </div>
    )
  }

  // Regular tile demo
  const getBgColor = () => {
    switch (demo.color) {
      case 'emerald': return 'bg-emerald-500 border-emerald-400 shadow-lg shadow-emerald-500/30'
      case 'blue': return 'bg-blue-500/80 border-blue-400 shadow-md shadow-blue-500/30'
      case 'amber': return 'bg-amber-500/80 border-amber-400 shadow-md shadow-amber-500/30'
      case 'gray': return 'bg-slate-600 border-slate-500 shadow-lg shadow-slate-900/50 animate-pulse'
      default: return 'bg-slate-700 border-slate-600'
    }
  }

  const renderConnections = () => {
    if (!demo.connections || demo.connections.length === 0) return null
    
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full">
          {demo.connections?.includes('up') && (
            <div className="absolute left-1/2 top-0 w-1/4 h-1/2 bg-white/60 -translate-x-1/2 rounded-b" />
          )}
          {demo.connections?.includes('down') && (
            <div className="absolute left-1/2 bottom-0 w-1/4 h-1/2 bg-white/60 -translate-x-1/2 rounded-t" />
          )}
          {demo.connections?.includes('left') && (
            <div className="absolute top-1/2 left-0 w-1/2 h-1/4 bg-white/60 -translate-y-1/2 rounded-r" />
          )}
          {demo.connections?.includes('right') && (
            <div className="absolute top-1/2 right-0 w-1/2 h-1/4 bg-white/60 -translate-y-1/2 rounded-l" />
          )}
          <div className="absolute left-1/2 top-1/2 w-2 h-2 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 items-center">
      <div 
        className={`w-20 h-20 rounded-lg border-2 relative flex items-center justify-center ${getBgColor()}`}
      >
        {demo.type === 'node' && (
          <div className="w-10 h-10 rounded-full bg-white/30 border-2 border-white/50 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-white/50" />
          </div>
        )}
        {demo.type === 'path' && renderConnections()}
        {demo.canRotate && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-300 rounded-full border border-amber-200 shadow-sm" />
        )}
        {demo.type === 'moving-wall' && (
          <span className="text-white/60 text-xs">CRUSHES</span>
        )}
      </div>
      {demo.canRotate && (
        <p className="text-amber-400 text-sm animate-pulse">↑ Tap me! ↑</p>
      )}
    </div>
  )
}

interface TutorialScreenProps {
  onComplete: () => void
}

export default function TutorialScreen({ onComplete }: TutorialScreenProps) {
  const [step, setStep] = useState(0)
  const currentStep = TUTORIAL_STEPS[step]
  const isLastStep = step === TUTORIAL_STEPS.length - 1

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6">
      {/* Progress dots */}
      <div className="flex gap-2 mb-8">
        {TUTORIAL_STEPS.map((_, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === step ? 'bg-white w-6' : 'bg-slate-600 hover:bg-slate-500'
            }`}
          />
        ))}
      </div>

      {/* Content card */}
      <div className="max-w-sm w-full bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-1">{currentStep.title}</h2>
          <p className="text-slate-400">{currentStep.subtitle}</p>
        </div>

        {/* Demo visualization */}
        {currentStep.demo && (
          <div className="flex justify-center mb-6 py-4 bg-slate-900/50 rounded-xl">
            <DemoTile demo={currentStep.demo} />
          </div>
        )}

        {/* Description */}
        <div className="bg-slate-900/30 rounded-xl p-4 mb-6">
          <p className="text-slate-300 text-sm whitespace-pre-line leading-relaxed">
            {currentStep.content}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors"
            >
              ← Back
            </button>
          )}
          {isLastStep ? (
            <button
              onClick={onComplete}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20"
            >
              Play Now! →
            </button>
          ) : (
            <button
              onClick={() => setStep(step + 1)}
              className="flex-1 py-3 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors"
            >
              Next →
            </button>
          )}
        </div>
      </div>

      {/* Skip button */}
      <button
        onClick={onComplete}
        className="mt-6 text-slate-500 hover:text-slate-400 text-sm transition-colors"
      >
        Skip Tutorial
      </button>
    </div>
  )
}
