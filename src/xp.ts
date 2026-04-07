export interface LevelInfo {
  level: number;
  name: string;
  xpForNext: number | null; // null = max level
  xpInCurrentLevel: number;
  progressInLevel: number; // 0–1
}

const LEVELS = [
  { level: 1, name: 'Anfänger',       threshold: 0    },
  { level: 2, name: 'Lernender',      threshold: 100  },
  { level: 3, name: 'Fortgeschrittener', threshold: 300 },
  { level: 4, name: 'Experte',        threshold: 700  },
  { level: 5, name: 'Meister',        threshold: 1500 },
  { level: 6, name: 'Legende',        threshold: 3500 },
  { level: 7, name: 'Guru',           threshold: 7000 },
];

export function getLevelInfo(xp: number): LevelInfo {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.threshold) current = l;
    else break;
  }

  const idx = LEVELS.indexOf(current);
  const next = LEVELS[idx + 1] ?? null;

  if (!next) {
    return {
      level: current.level,
      name: current.name,
      xpForNext: null,
      xpInCurrentLevel: xp - current.threshold,
      progressInLevel: 1,
    };
  }

  const span = next.threshold - current.threshold;
  const earned = xp - current.threshold;

  return {
    level: current.level,
    name: current.name,
    xpForNext: next.threshold - xp,
    xpInCurrentLevel: earned,
    progressInLevel: earned / span,
  };
}

export function getLevelThreshold(level: number): number {
  return LEVELS.find((l) => l.level === level)?.threshold ?? 0;
}
