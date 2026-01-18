/**
 * ScoreManager.js - Score & Leaderboard System
 * Patient Analog Mini-Games Engine
 *
 * Features:
 * - localStorage persistence
 * - Multiple game support
 * - Leaderboard management
 * - Score statistics
 */

class ScoreManager {
  constructor(gameId) {
    this.gameId = gameId;
    this.storageKey = `pa_scores_${gameId}`;
    this.currentScore = 0;
    this.highScore = 0;
    this.scores = [];

    this.load();
  }

  load() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.highScore = parsed.highScore || 0;
        this.scores = parsed.scores || [];
      }
    } catch (e) {
      console.warn('[ScoreManager] Failed to load scores:', e);
    }
  }

  save() {
    try {
      const data = {
        highScore: this.highScore,
        scores: this.scores.slice(0, 100) // Keep top 100
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {
      console.warn('[ScoreManager] Failed to save scores:', e);
    }
  }

  reset() {
    this.currentScore = 0;
  }

  add(points) {
    this.currentScore += points;
    return this.currentScore;
  }

  subtract(points) {
    this.currentScore = Math.max(0, this.currentScore - points);
    return this.currentScore;
  }

  set(points) {
    this.currentScore = points;
    return this.currentScore;
  }

  get() {
    return this.currentScore;
  }

  getHighScore() {
    return this.highScore;
  }

  submit(name = 'Anonymous') {
    const score = this.currentScore;
    const entry = {
      name: name.slice(0, 20),
      score: score,
      date: new Date().toISOString(),
      level: this.level || 1
    };

    // Update high score
    if (score > this.highScore) {
      this.highScore = score;
    }

    // Add to scores list
    this.scores.push(entry);

    // Sort by score descending
    this.scores.sort((a, b) => b.score - a.score);

    // Keep top 100
    this.scores = this.scores.slice(0, 100);

    this.save();

    // Return rank
    return this.scores.findIndex(s => s === entry) + 1;
  }

  getLeaderboard(limit = 10) {
    return this.scores.slice(0, limit);
  }

  getRank(score) {
    const rank = this.scores.filter(s => s.score > score).length + 1;
    return rank;
  }

  getStats() {
    if (this.scores.length === 0) {
      return { total: 0, average: 0, highest: 0, lowest: 0, games: 0 };
    }

    const scores = this.scores.map(s => s.score);
    return {
      total: scores.reduce((a, b) => a + b, 0),
      average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      highest: Math.max(...scores),
      lowest: Math.min(...scores),
      games: scores.length
    };
  }

  clearAll() {
    this.currentScore = 0;
    this.highScore = 0;
    this.scores = [];
    localStorage.removeItem(this.storageKey);
  }

  // Format score with commas
  static format(score) {
    return score.toLocaleString();
  }

  // Format time as mm:ss
  static formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScoreManager;
}
if (typeof window !== 'undefined') {
  window.ScoreManager = ScoreManager;
}
// v20260117-FULL
