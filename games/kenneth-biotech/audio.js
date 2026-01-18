/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Kenneth's AMAZING Biotech Adventure - Audio System
 * Satisfying sounds for every action!
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

KennethGame.Audio = (function() {
    
    let audioContext = null;
    let masterGain = null;
    let sfxGain = null;
    let musicGain = null;
    let initialized = false;
    
    // Volume settings
    let masterVolume = 0.7;
    let sfxVolume = 0.8;
    let musicVolume = 0.5;
    
    /**
     * Initialize audio system
     */
    function init() {
        if (initialized) return;
        
        audioContext = KennethGame.AudioBridge.getContext();
        if (!audioContext) {
            console.warn('Audio: No audio context available');
            return;
        }
        
        masterGain = KennethGame.AudioBridge.getMasterGain();
        
        // Create SFX and music gain nodes
        sfxGain = audioContext.createGain();
        sfxGain.connect(masterGain);
        sfxGain.gain.setValueAtTime(sfxVolume, audioContext.currentTime);
        
        musicGain = audioContext.createGain();
        musicGain.connect(masterGain);
        musicGain.gain.setValueAtTime(musicVolume, audioContext.currentTime);
        
        initialized = true;
        console.log('🔊 Audio system initialized!');
    }
    
    /**
     * Resume audio context after user interaction
     */
    async function resume() {
        await KennethGame.AudioBridge.resume();
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SOUND GENERATORS - Synthesized sounds for Kenneth!
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Play a satisfying placement sound
     */
    function playPlacement() {
        if (!audioContext || !initialized) return;
        
        const now = audioContext.currentTime;
        
        // Create a pleasant "plop" sound
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(sfxGain);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        osc.start(now);
        osc.stop(now + 0.2);
    }
    
    /**
     * Play connection sound - satisfying "zing"
     */
    function playConnection() {
        if (!audioContext || !initialized) return;
        
        const now = audioContext.currentTime;
        
        // Rising tone
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(sfxGain);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
        
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        
        osc.start(now);
        osc.stop(now + 0.25);
    }
    
    /**
     * Play synergy sound - magical sparkle!
     */
    function playSynergy() {
        if (!audioContext || !initialized) return;
        
        const now = audioContext.currentTime;
        
        // Magical ascending arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        
        notes.forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(sfxGain);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.08);
            
            gain.gain.setValueAtTime(0, now + i * 0.08);
            gain.gain.linearRampToValueAtTime(0.2, now + i * 0.08 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.3);
            
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.35);
        });
        
        // Add sparkle
        const noise = audioContext.createOscillator();
        const noiseGain = audioContext.createGain();
        noise.connect(noiseGain);
        noiseGain.connect(sfxGain);
        
        noise.type = 'sine';
        noise.frequency.setValueAtTime(2000, now + 0.2);
        noise.frequency.exponentialRampToValueAtTime(4000, now + 0.4);
        
        noiseGain.gain.setValueAtTime(0.05, now + 0.2);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        
        noise.start(now + 0.2);
        noise.stop(now + 0.5);
    }
    
    /**
     * Play combo sound - exciting buildup
     */
    function playCombo(level) {
        if (!audioContext || !initialized) return;
        
        const now = audioContext.currentTime;
        const baseFreq = 300 + (level * 100);
        
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(sfxGain);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, now + 0.1);
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.start(now);
        osc.stop(now + 0.15);
    }
    
    /**
     * Play success/level complete - triumphant fanfare!
     */
    function playSuccess() {
        if (!audioContext || !initialized) return;
        
        const now = audioContext.currentTime;
        
        // Victory fanfare notes
        const melody = [
            { freq: 523.25, time: 0, dur: 0.15 },     // C5
            { freq: 659.25, time: 0.15, dur: 0.15 },  // E5
            { freq: 783.99, time: 0.3, dur: 0.15 },   // G5
            { freq: 1046.50, time: 0.45, dur: 0.4 },  // C6 (held)
        ];
        
        melody.forEach(note => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(sfxGain);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.freq, now + note.time);
            
            gain.gain.setValueAtTime(0, now + note.time);
            gain.gain.linearRampToValueAtTime(0.25, now + note.time + 0.02);
            gain.gain.setValueAtTime(0.25, now + note.time + note.dur - 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + note.dur);
            
            osc.start(now + note.time);
            osc.stop(now + note.time + note.dur + 0.1);
        });
    }
    
    /**
     * Play error - gentle "nope" sound
     */
    function playError() {
        if (!audioContext || !initialized) return;
        
        const now = audioContext.currentTime;
        
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(sfxGain);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        osc.start(now);
        osc.stop(now + 0.2);
    }
    
    /**
     * Play click - UI feedback
     */
    function playClick() {
        if (!audioContext || !initialized) return;
        
        const now = audioContext.currentTime;
        
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(sfxGain);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        
        osc.start(now);
        osc.stop(now + 0.05);
    }
    
    /**
     * Play hover sound
     */
    function playHover() {
        if (!audioContext || !initialized) return;
        
        const now = audioContext.currentTime;
        
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(sfxGain);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
        
        osc.start(now);
        osc.stop(now + 0.03);
    }
    
    /**
     * Play power-up activation
     */
    function playPowerUp() {
        if (!audioContext || !initialized) return;
        
        const now = audioContext.currentTime;
        
        // Whoosh up sound
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(sfxGain);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(1000, now + 0.2);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.3);
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        
        osc.start(now);
        osc.stop(now + 0.35);
    }
    
    /**
     * Play star earned sound
     */
    function playStar() {
        if (!audioContext || !initialized) return;
        
        const now = audioContext.currentTime;
        
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(sfxGain);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1100, now + 0.1);
        osc.frequency.setValueAtTime(1320, now + 0.2);
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.setValueAtTime(0.2, now + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        
        osc.start(now);
        osc.stop(now + 0.4);
    }
    
    /**
     * Play countdown warning
     */
    function playWarning() {
        if (!audioContext || !initialized) return;
        
        const now = audioContext.currentTime;
        
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(sfxGain);
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.setValueAtTime(0.08, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.start(now);
        osc.stop(now + 0.15);
    }
    
    /**
     * Play opening motif
     */
    function playMotif() {
        if (!audioContext || !initialized) return;
        
        const now = audioContext.currentTime;
        
        // Welcoming tune
        const notes = [
            { freq: 392, time: 0, dur: 0.2 },      // G4
            { freq: 523.25, time: 0.2, dur: 0.2 }, // C5
            { freq: 659.25, time: 0.4, dur: 0.3 }, // E5
        ];
        
        notes.forEach(note => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(sfxGain);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.freq, now + note.time);
            
            gain.gain.setValueAtTime(0, now + note.time);
            gain.gain.linearRampToValueAtTime(0.15, now + note.time + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + note.dur);
            
            osc.start(now + note.time);
            osc.stop(now + note.time + note.dur + 0.1);
        });
    }
    
    /**
     * Play time's up sound
     */
    function playTimeUp() {
        if (!audioContext || !initialized) return;
        
        const now = audioContext.currentTime;
        
        // Descending notes
        const notes = [440, 349.23, 293.66];
        
        notes.forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(sfxGain);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.15);
            
            gain.gain.setValueAtTime(0.2, now + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.2);
            
            osc.start(now + i * 0.15);
            osc.stop(now + i * 0.15 + 0.25);
        });
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // VOLUME CONTROLS
    // ═══════════════════════════════════════════════════════════════════════
    
    function setMasterVolume(value) {
        masterVolume = Math.max(0, Math.min(1, value));
        if (masterGain && audioContext) {
            masterGain.gain.setValueAtTime(masterVolume, audioContext.currentTime);
        }
    }
    
    function setSFXVolume(value) {
        sfxVolume = Math.max(0, Math.min(1, value));
        if (sfxGain && audioContext) {
            sfxGain.gain.setValueAtTime(sfxVolume, audioContext.currentTime);
        }
    }
    
    function setMusicVolume(value) {
        musicVolume = Math.max(0, Math.min(1, value));
        if (musicGain && audioContext) {
            musicGain.gain.setValueAtTime(musicVolume, audioContext.currentTime);
        }
    }
    
    function getMasterVolume() { return masterVolume; }
    function getSFXVolume() { return sfxVolume; }
    function getMusicVolume() { return musicVolume; }
    
    return {
        init,
        resume,
        playPlacement,
        playConnection,
        playSynergy,
        playCombo,
        playSuccess,
        playError,
        playClick,
        playHover,
        playPowerUp,
        playStar,
        playWarning,
        playMotif,
        playTimeUp,
        setMasterVolume,
        setSFXVolume,
        setMusicVolume,
        getMasterVolume,
        getSFXVolume,
        getMusicVolume
    };
})();
// v20260117-FULL
