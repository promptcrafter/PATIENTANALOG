// Enhanced Games System - Utility Functions & Helpers

import { Game, LearningPath, UserProgress, Difficulty, PlayTime } from './enhanced-games-data';

/**
 * FILTERING & SEARCH UTILITIES
 */

export const filterGames = (
  games: Game[],
  searchTerm: string,
  filters: any
): Game[] => {
  return games.filter(game => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchName = game.name.toLowerCase().includes(search);
      const matchDesc = game.description.toLowerCase().includes(search);
      const matchTags = game.skillsGained.some(skill => 
        skill.toLowerCase().includes(search)
      );
      if (!matchName && !matchDesc && !matchTags) return false;
    }

    // Apply all other filters
    if (filters.category && !game.category.includes(filters.category)) return false;
    if (filters.technology && !game.technology.includes(filters.technology)) return false;
    if (filters.subject && !game.subject.includes(filters.subject)) return false;
    if (filters.type && game.type !== filters.type) return false;
    if (filters.difficulty && game.difficulty !== filters.difficulty) return false;
    if (filters.playTime && game.playTime !== filters.playTime) return false;
    if (filters.device && !game.devices.includes(filters.device)) return false;

    return true;
  });
};

/**
 * SORTING UTILITIES
 */

export const sortGames = (
  games: Game[],
  sortBy: 'featured' | 'popular' | 'new' | 'rating' | 'difficulty' | 'time'
): Game[] => {
  const sorted = [...games];

  switch (sortBy) {
    case 'featured':
      return sorted.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return b.averageRating - a.averageRating;
      });

    case 'popular':
      return sorted.sort((a, b) => b.totalPlays - a.totalPlays);

    case 'new':
      return sorted.sort((a, b) => {
        if (a.isNew && !b.isNew) return -1;
        if (!a.isNew && b.isNew) return 1;
        return 0;
      });

    case 'rating':
      return sorted.sort((a, b) => b.averageRating - a.averageRating);

    case 'difficulty':
      const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
      return sorted.sort((a, b) => 
        difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
      );

    case 'time':
      const timeOrder = { '5min': 1, '15min': 2, '30min': 3, '45min+': 4 };
      return sorted.sort((a, b) => 
        timeOrder[a.playTime] - timeOrder[b.playTime]
      );

    default:
      return sorted;
  }
};

/**
 * RECOMMENDATION ALGORITHMS
 */

export const getRecommendedGames = (
  allGames: Game[],
  userProgress: UserProgress
): Game[] => {
  const completed = Array.from(userProgress.completedGames);
  const recommendedIds = new Set<string>();
  const scores = new Map<string, number>();

  // Get direct recommendations from completed games
  completed.forEach(gameId => {
    const game = allGames.find(g => g.id === gameId);
    game?.nextRecommended.forEach(id => {
      recommendedIds.add(id);
      scores.set(id, (scores.get(id) || 0) + 3); // Direct recommendations get +3
    });
  });

  // Add games from the same learning paths
  const activePath = userProgress.currentPath;
  if (activePath) {
    const pathGames = allGames.filter(g => g.partOfPath?.includes(activePath));
    pathGames.forEach(game => {
      if (!userProgress.completedGames.has(game.id)) {
        recommendedIds.add(game.id);
        scores.set(game.id, (scores.get(game.id) || 0) + 2); // Same path +2
      }
    });
  }

  // Add similar games by technology/subject
  completed.forEach(gameId => {
    const completedGame = allGames.find(g => g.id === gameId);
    if (!completedGame) return;

    allGames.forEach(game => {
      if (userProgress.completedGames.has(game.id)) return;
      
      // Same technology +1
      const sharedTech = game.technology.filter(t => 
        completedGame.technology.includes(t)
      );
      if (sharedTech.length > 0) {
        recommendedIds.add(game.id);
        scores.set(game.id, (scores.get(game.id) || 0) + sharedTech.length);
      }

      // Same subject +1
      const sharedSubject = game.subject.filter(s => 
        completedGame.subject.includes(s)
      );
      if (sharedSubject.length > 0) {
        recommendedIds.add(game.id);
        scores.set(game.id, (scores.get(game.id) || 0) + sharedSubject.length);
      }
    });
  });

  // Convert to array and sort by score
  const recommended = Array.from(recommendedIds)
    .map(id => ({
      game: allGames.find(g => g.id === id)!,
      score: scores.get(id) || 0
    }))
    .filter(item => item.game)
    .sort((a, b) => b.score - a.score)
    .map(item => item.game);

  return recommended.slice(0, 6);
};

export const getNextInPath = (
  path: LearningPath,
  allGames: Game[],
  userProgress: UserProgress
): Game | null => {
  const nextGameId = path.games.find(id => !userProgress.completedGames.has(id));
  return nextGameId ? allGames.find(g => g.id === nextGameId) || null : null;
};

/**
 * PROGRESS CALCULATIONS
 */

export const calculatePathProgress = (
  path: LearningPath,
  userProgress: UserProgress
): number => {
  const completed = path.games.filter(id => 
    userProgress.completedGames.has(id)
  ).length;
  return Math.round((completed / path.games.length) * 100);
};

export const calculateOverallProgress = (
  allGames: Game[],
  userProgress: UserProgress
): number => {
  return Math.round((userProgress.completedGames.size / allGames.length) * 100);
};

export const getSkillsAcquired = (
  allGames: Game[],
  userProgress: UserProgress
): string[] => {
  const skills = new Set<string>();
  
  Array.from(userProgress.completedGames).forEach(gameId => {
    const game = allGames.find(g => g.id === gameId);
    game?.skillsGained.forEach(skill => skills.add(skill));
  });

  return Array.from(skills);
};

export const getTotalPlayTime = (
  allGames: Game[],
  userProgress: UserProgress
): number => {
  const timeMap: Record<PlayTime, number> = {
    '5min': 5,
    '15min': 15,
    '30min': 30,
    '45min+': 45
  };

  let totalMinutes = 0;
  
  Array.from(userProgress.completedGames).forEach(gameId => {
    const game = allGames.find(g => g.id === gameId);
    if (game) {
      totalMinutes += timeMap[game.playTime];
    }
  });

  return totalMinutes;
};

/**
 * ACHIEVEMENT SYSTEM
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (games: Game[], progress: UserProgress) => boolean;
}

export const achievements: Achievement[] = [
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first game',
    icon: '🎯',
    condition: (_, progress) => progress.completedGames.size >= 1
  },
  {
    id: 'quick-learner',
    name: 'Quick Learner',
    description: 'Complete 5 games',
    icon: '⚡',
    condition: (_, progress) => progress.completedGames.size >= 5
  },
  {
    id: 'dedicated-student',
    name: 'Dedicated Student',
    description: 'Complete 10 games',
    icon: '📚',
    condition: (_, progress) => progress.completedGames.size >= 10
  },
  {
    id: 'biotech-master',
    name: 'Biotech Master',
    description: 'Complete 25 games',
    icon: '🔬',
    condition: (_, progress) => progress.completedGames.size >= 25
  },
  {
    id: 'genetics-expert',
    name: 'Genetics Expert',
    description: 'Complete all genetics games',
    icon: '🧬',
    condition: (games, progress) => {
      const geneticsGames = games.filter(g => g.subject.includes('genetics'));
      return geneticsGames.every(g => progress.completedGames.has(g.id));
    }
  },
  {
    id: 'immunology-specialist',
    name: 'Immunology Specialist',
    description: 'Complete all immunology games',
    icon: '🦠',
    condition: (games, progress) => {
      const immunoGames = games.filter(g => g.subject.includes('immunology'));
      return immunoGames.every(g => progress.completedGames.has(g.id));
    }
  },
  {
    id: 'path-completer',
    name: 'Path Completer',
    description: 'Complete an entire learning path',
    icon: '🛤️',
    condition: (games, progress) => {
      // Check if any path is 100% complete
      return false; // Implement based on your path system
    }
  },
  {
    id: 'speed-runner',
    name: 'Speed Runner',
    description: 'Complete 10 quick-play games',
    icon: '💨',
    condition: (games, progress) => {
      const quickGames = games.filter(g => 
        g.category.includes('quick-play') && progress.completedGames.has(g.id)
      );
      return quickGames.length >= 10;
    }
  },
  {
    id: 'deep-diver',
    name: 'Deep Diver',
    description: 'Complete 5 deep-dive games',
    icon: '🌊',
    condition: (games, progress) => {
      const deepGames = games.filter(g => 
        g.category.includes('deep-dive') && progress.completedGames.has(g.id)
      );
      return deepGames.length >= 5;
    }
  },
  {
    id: 'five-star-collector',
    name: 'Five Star Collector',
    description: 'Play all 5-star rated games',
    icon: '⭐',
    condition: (games, progress) => {
      const fiveStarGames = games.filter(g => g.averageRating >= 4.9);
      return fiveStarGames.every(g => progress.completedGames.has(g.id));
    }
  }
];

export const checkAchievements = (
  games: Game[],
  progress: UserProgress
): Achievement[] => {
  return achievements.filter(achievement => 
    achievement.condition(games, progress)
  );
};

/**
 * UI HELPER FUNCTIONS
 */

export const getDifficultyStars = (difficulty: Difficulty): string => {
  const starMap = { 
    beginner: 1, 
    intermediate: 3, 
    advanced: 5 
  };
  return '⭐'.repeat(starMap[difficulty]);
};

export const getDifficultyColor = (difficulty: Difficulty): string => {
  const colorMap = {
    beginner: '#2ECC71',
    intermediate: '#F39C12',
    advanced: '#E74C3C'
  };
  return colorMap[difficulty];
};

export const getDeviceIcon = (devices: string[]): string => {
  if (devices.includes('both')) return '💻📱';
  if (devices.includes('desktop')) return '💻';
  if (devices.includes('mobile')) return '📱';
  return '';
};

export const formatPlayTime = (playTime: PlayTime): string => {
  const map: Record<PlayTime, string> = {
    '5min': '5 minutes',
    '15min': '15 minutes',
    '30min': '30 minutes',
    '45min+': '45+ minutes'
  };
  return map[playTime];
};

export const formatTotalTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

/**
 * CATEGORY HELPERS
 */

export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'for-kenneth': '#4ECDC4',
    'clinical-research': '#667EEA',
    'quick-play': '#F093FB',
    'deep-dive': '#4FACFE',
    'new-this-week': '#FA709A'
  };
  return colors[category] || '#95A5A6';
};

export const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    'for-kenneth': '🎮',
    'clinical-research': '🔬',
    'quick-play': '⚡',
    'deep-dive': '🧪',
    'new-this-week': '🆕'
  };
  return icons[category] || '🎯';
};

/**
 * STATISTICS & ANALYTICS
 */

export const getGameStatistics = (
  allGames: Game[],
  userProgress: UserProgress
) => {
  const completed = userProgress.completedGames.size;
  const total = allGames.length;
  const inProgress = Array.from(userProgress.gameProgress.keys()).filter(
    id => !userProgress.completedGames.has(id)
  ).length;

  const skillsAcquired = getSkillsAcquired(allGames, userProgress);
  const totalPlayTime = getTotalPlayTime(allGames, userProgress);
  const achievementsUnlocked = checkAchievements(allGames, userProgress);

  // Difficulty breakdown
  const byDifficulty = {
    beginner: 0,
    intermediate: 0,
    advanced: 0
  };

  Array.from(userProgress.completedGames).forEach(gameId => {
    const game = allGames.find(g => g.id === gameId);
    if (game) byDifficulty[game.difficulty]++;
  });

  // Subject breakdown
  const bySubject: Record<string, number> = {};
  Array.from(userProgress.completedGames).forEach(gameId => {
    const game = allGames.find(g => g.id === gameId);
    game?.subject.forEach(subject => {
      bySubject[subject] = (bySubject[subject] || 0) + 1;
    });
  });

  return {
    completed,
    total,
    inProgress,
    percentComplete: Math.round((completed / total) * 100),
    skillsAcquired: skillsAcquired.length,
    totalPlayTime: formatTotalTime(totalPlayTime),
    achievementsUnlocked: achievementsUnlocked.length,
    totalAchievements: achievements.length,
    byDifficulty,
    bySubject,
    strongestSubject: Object.entries(bySubject).sort((a, b) => b[1] - a[1])[0]
  };
};

/**
 * LOCAL STORAGE HELPERS
 */

export const saveUserProgress = (progress: UserProgress): void => {
  try {
    const data = {
      completedGames: Array.from(progress.completedGames),
      lastPlayed: progress.lastPlayed,
      achievements: progress.achievements,
      currentPath: progress.currentPath,
      gameProgress: Array.from(progress.gameProgress.entries())
    };
    localStorage.setItem('patientAnalogProgress', JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save progress:', error);
  }
};

export const loadUserProgress = (): UserProgress | null => {
  try {
    const data = localStorage.getItem('patientAnalogProgress');
    if (!data) return null;

    const parsed = JSON.parse(data);
    return {
      completedGames: new Set(parsed.completedGames),
      lastPlayed: parsed.lastPlayed,
      achievements: parsed.achievements,
      currentPath: parsed.currentPath,
      gameProgress: new Map(parsed.gameProgress)
    };
  } catch (error) {
    console.error('Failed to load progress:', error);
    return null;
  }
};

/**
 * VALIDATION HELPERS
 */

export const validateGameData = (game: Game): boolean => {
  const required = ['id', 'name', 'description', 'type', 'difficulty', 'playTime'];
  const hasAllFields = required.every(field => game[field as keyof Game]);
  
  if (!hasAllFields) {
    console.warn(`Game ${game.id} missing required fields`);
    return false;
  }

  return true;
};

export const validateUserProgress = (progress: UserProgress): boolean => {
  if (!(progress.completedGames instanceof Set)) return false;
  if (!Array.isArray(progress.lastPlayed)) return false;
  if (!(progress.gameProgress instanceof Map)) return false;
  return true;
};

/**
 * EXPORT ALL UTILITIES
 */

export default {
  // Filtering & Sorting
  filterGames,
  sortGames,
  
  // Recommendations
  getRecommendedGames,
  getNextInPath,
  
  // Progress
  calculatePathProgress,
  calculateOverallProgress,
  getSkillsAcquired,
  getTotalPlayTime,
  
  // Achievements
  checkAchievements,
  achievements,
  
  // UI Helpers
  getDifficultyStars,
  getDifficultyColor,
  getDeviceIcon,
  formatPlayTime,
  formatTotalTime,
  getCategoryColor,
  getCategoryIcon,
  
  // Statistics
  getGameStatistics,
  
  // Storage
  saveUserProgress,
  loadUserProgress,
  
  // Validation
  validateGameData,
  validateUserProgress
};
