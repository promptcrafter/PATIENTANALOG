/**
 * SoundManager.js - Audio System
 * Patient Analog Mini-Games Engine
 *
 * Features:
 * - Sound effects management
 * - Background music control
 * - Volume control
 * - Mute toggle
 * - Web Audio API with HTML5 fallback
 */

class SoundManager {
  constructor() {
    this.sounds = {};
    this.music = null;
    this.musicVolume = 0.3;
    this.sfxVolume = 0.5;
    this.muted = false;
    this.musicMuted = false;
    this.initialized = false;

    // Try to use Web Audio API
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
    } catch (e) {
      console.warn('[SoundManager] Web Audio API not available, using HTML5 Audio');
      this.audioContext = null;
    }

    // Load saved preferences
    this.loadPreferences();

    // Resume audio context on user interaction
    if (this.audioContext) {
      const resume = () => {
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
        document.removeEventListener('click', resume);
        document.removeEventListener('keydown', resume);
        document.removeEventListener('touchstart', resume);
      };
      document.addEventListener('click', resume);
      document.addEventListener('keydown', resume);
      document.addEventListener('touchstart', resume);
    }
  }

  loadPreferences() {
    try {
      const prefs = localStorage.getItem('pa_sound_prefs');
      if (prefs) {
        const data = JSON.parse(prefs);
        this.muted = data.muted || false;
        this.musicMuted = data.musicMuted || false;
        this.sfxVolume = data.sfxVolume ?? 0.5;
        this.musicVolume = data.musicVolume ?? 0.3;
      }
    } catch (e) {
      // Use defaults
    }
  }

  savePreferences() {
    try {
      localStorage.setItem('pa_sound_prefs', JSON.stringify({
        muted: this.muted,
        musicMuted: this.musicMuted,
        sfxVolume: this.sfxVolume,
        musicVolume: this.musicVolume
      }));
    } catch (e) {
      // Ignore
    }
  }

  async load(name, url) {
    try {
      if (this.audioContext) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.sounds[name] = { buffer: audioBuffer, type: 'webaudio' };
      } else {
        const audio = new Audio(url);
        audio.preload = 'auto';
        this.sounds[name] = { audio: audio, type: 'html5' };
      }
      console.log(`[SoundManager] Loaded: ${name}`);
    } catch (e) {
      console.warn(`[SoundManager] Failed to load ${name}:`, e);
    }
  }

  play(name, options = {}) {
    if (this.muted) return;

    const sound = this.sounds[name];
    if (!sound) {
      console.warn(`[SoundManager] Sound not found: ${name}`);
      return;
    }

    const volume = (options.volume ?? 1) * this.sfxVolume;
    const loop = options.loop || false;

    try {
      if (sound.type === 'webaudio' && this.audioContext) {
        const source = this.audioContext.createBufferSource();
        source.buffer = sound.buffer;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(this.masterGain);

        source.loop = loop;
        source.start(0);

        return source;
      } else if (sound.audio) {
        const audio = sound.audio.cloneNode();
        audio.volume = volume;
        audio.loop = loop;
        audio.play().catch(() => {});
        return audio;
      }
    } catch (e) {
      console.warn(`[SoundManager] Error playing ${name}:`, e);
    }
  }

  playMusic(url) {
    this.stopMusic();

    try {
      this.music = new Audio(url);
      this.music.loop = true;
      this.music.volume = this.musicMuted ? 0 : this.musicVolume;
      this.music.play().catch(() => {});
    } catch (e) {
      console.warn('[SoundManager] Error playing music:', e);
    }
  }

  stopMusic() {
    if (this.music) {
      this.music.pause();
      this.music.currentTime = 0;
      this.music = null;
    }
  }

  pauseMusic() {
    if (this.music) {
      this.music.pause();
    }
  }

  resumeMusic() {
    if (this.music && !this.musicMuted) {
      this.music.play().catch(() => {});
    }
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.music) {
      this.music.volume = this.musicMuted ? 0 : this.musicVolume;
    }
    this.savePreferences();
  }

  setSfxVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.savePreferences();
  }

  mute() {
    this.muted = true;
    this.savePreferences();
  }

  unmute() {
    this.muted = false;
    this.savePreferences();
  }

  toggleMute() {
    this.muted = !this.muted;
    this.savePreferences();
    return this.muted;
  }

  muteMusic() {
    this.musicMuted = true;
    if (this.music) {
      this.music.volume = 0;
    }
    this.savePreferences();
  }

  unmuteMusic() {
    this.musicMuted = false;
    if (this.music) {
      this.music.volume = this.musicVolume;
    }
    this.savePreferences();
  }

  toggleMuteMusic() {
    this.musicMuted = !this.musicMuted;
    if (this.music) {
      this.music.volume = this.musicMuted ? 0 : this.musicVolume;
    }
    this.savePreferences();
    return this.musicMuted;
  }

  isMuted() {
    return this.muted;
  }

  isMusicMuted() {
    return this.musicMuted;
  }
}

// Singleton instance
const soundManager = new SoundManager();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SoundManager, soundManager };
}
if (typeof window !== 'undefined') {
  window.SoundManager = SoundManager;
  window.soundManager = soundManager;
}
// v20260117-FULL
