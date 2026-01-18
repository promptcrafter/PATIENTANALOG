/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Kenneth's AMAZING Biotech Adventure - Audio Bridge
 * Shared audio context management for platform integration
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

KennethGame.AudioBridge = (function() {
    // Private state
    let _audioContext = null;
    let _masterGain = null;
    let _isShared = false;
    let _initialized = false;
    
    /**
     * Get or create the audio context
     * @returns {AudioContext|null}
     */
    function getContext() {
        if (_audioContext) return _audioContext;
        
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                console.warn('AudioBridge: Web Audio API not supported');
                return null;
            }
            
            _audioContext = new AudioContextClass();
            _masterGain = _audioContext.createGain();
            _masterGain.connect(_audioContext.destination);
            _masterGain.gain.setValueAtTime(0.7, _audioContext.currentTime);
            _initialized = true;
            
            console.log('🔊 AudioBridge: Created local AudioContext');
            return _audioContext;
        } catch (e) {
            console.warn('AudioBridge: Failed to create AudioContext', e);
            return null;
        }
    }
    
    /**
     * Set a shared audio context from external platform
     * @param {AudioContext} context - External AudioContext
     * @param {GainNode} [gainNode] - Optional external gain node
     */
    function setSharedContext(context, gainNode) {
        if (!context) {
            console.warn('AudioBridge: Invalid shared context');
            return false;
        }
        
        _audioContext = context;
        _isShared = true;
        
        if (gainNode) {
            _masterGain = gainNode;
        } else {
            _masterGain = context.createGain();
            _masterGain.connect(context.destination);
            _masterGain.gain.setValueAtTime(0.7, context.currentTime);
        }
        
        _initialized = true;
        console.log('🔊 AudioBridge: Using shared AudioContext');
        return true;
    }
    
    /**
     * Get the master gain node
     * @returns {GainNode|null}
     */
    function getMasterGain() {
        if (!_initialized) getContext();
        return _masterGain;
    }
    
    /**
     * Resume audio context (required after user interaction)
     * @returns {Promise}
     */
    async function resume() {
        if (_audioContext && _audioContext.state === 'suspended') {
            try {
                await _audioContext.resume();
                console.log('🔊 AudioBridge: Context resumed');
            } catch (e) {
                console.warn('AudioBridge: Failed to resume', e);
            }
        }
    }
    
    /**
     * Check if audio is available
     * @returns {boolean}
     */
    function isAvailable() {
        return _initialized && _audioContext !== null;
    }
    
    /**
     * Check if using shared context
     * @returns {boolean}
     */
    function isShared() {
        return _isShared;
    }
    
    /**
     * Get current time from audio context
     * @returns {number}
     */
    function getCurrentTime() {
        return _audioContext ? _audioContext.currentTime : 0;
    }
    
    // Public API
    return {
        getContext,
        setSharedContext,
        getMasterGain,
        resume,
        isAvailable,
        isShared,
        getCurrentTime
    };
})();

console.log('🔊 Audio Bridge loaded!');
// v20260117-FULL
