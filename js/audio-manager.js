/**
 * PatientAnalog.com - Global Audio Manager
 * Single source of truth for sound state across all pages and modules
 *
 * @version 1.0.0
 * @description Implements global sound toggle with localStorage persistence,
 * cross-tab synchronization, and module subscription system.
 *
 * Usage:
 *   AudioManager.init();           // Initialize on page load
 *   AudioManager.toggle();         // Toggle sound on/off
 *   AudioManager.isEnabled();      // Check current state
 *   AudioManager.subscribe(fn);    // Subscribe to state changes
 *   AudioManager.getContext();     // Get shared AudioContext
 */

const AudioManager = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    // PRIVATE STATE
    // ═══════════════════════════════════════════════════════════

    const STORAGE_KEY = 'pa_sound_enabled';
    let _enabled = false;  // GDPR/AdSense compliant: Sound OFF by default
    let _audioContext = null;
    let _masterGain = null;
    let _initialized = false;
    const _subscribers = new Set();

    // ═══════════════════════════════════════════════════════════
    // PRIVATE METHODS
    // ═══════════════════════════════════════════════════════════

    /**
     * Load persisted state from localStorage
     */
    function loadState() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            // Default to false (sound off) if not set - GDPR/AdSense compliant
            _enabled = stored === 'true';  // Only enable if explicitly set to 'true'
        } catch (e) {
            console.warn('[AudioManager] localStorage unavailable:', e);
            _enabled = false;  // Safe default: sound off
        }
    }

    /**
     * Save state to localStorage
     */
    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, _enabled.toString());
        } catch (e) {
            console.warn('[AudioManager] Could not save state:', e);
        }
    }

    /**
     * Notify all subscribers of state change
     */
    function notifySubscribers() {
        _subscribers.forEach(callback => {
            try {
                callback(_enabled);
            } catch (e) {
                console.error('[AudioManager] Subscriber error:', e);
            }
        });

        // Dispatch custom event for non-subscribed modules
        window.dispatchEvent(new CustomEvent('pa-sound-toggle', {
            detail: { enabled: _enabled }
        }));

        // Also emit via EventBus if available
        if (typeof EventBus !== 'undefined' && EventBus.emit) {
            EventBus.emit('sound:toggle', { enabled: _enabled });
        }
    }

    /**
     * Update all UI elements that show sound state
     */
    function updateUI() {
        // Update buttons with data-sound-toggle attribute
        document.querySelectorAll('[data-sound-toggle]').forEach(btn => {
            btn.setAttribute('aria-pressed', _enabled.toString());

            // Update icon if present
            const icon = btn.querySelector('.sound-icon, .icon');
            if (icon) {
                icon.textContent = _enabled ? '🔊' : '🔇';
            }

            // Update text if present
            const text = btn.querySelector('.sound-text');
            if (text) {
                text.textContent = _enabled ? 'Sound On' : 'Sound Off';
            }
        });

        // Update legacy sound toggles (class-based)
        document.querySelectorAll('.sound-toggle').forEach(btn => {
            btn.setAttribute('aria-pressed', _enabled.toString());
            const icon = btn.querySelector('.icon, span');
            if (icon && (icon.textContent === '🔊' || icon.textContent === '🔇')) {
                icon.textContent = _enabled ? '🔊' : '🔇';
            }
        });

        // Update body class for CSS-based indicators
        document.body.classList.toggle('sound-enabled', _enabled);
        document.body.classList.toggle('sound-disabled', !_enabled);
    }

    /**
     * Create or get shared AudioContext
     */
    function ensureAudioContext() {
        if (!_audioContext) {
            try {
                _audioContext = new (window.AudioContext || window.webkitAudioContext)();
                _masterGain = _audioContext.createGain();
                _masterGain.connect(_audioContext.destination);
                _masterGain.gain.value = _enabled ? 1 : 0;
                console.log('[AudioManager] AudioContext created');
            } catch (e) {
                console.warn('[AudioManager] Could not create AudioContext:', e);
            }
        }
        return _audioContext;
    }

    /**
     * Resume AudioContext (required after user interaction)
     */
    function resumeContext() {
        if (_audioContext && _audioContext.state === 'suspended') {
            _audioContext.resume().catch(e => {
                console.warn('[AudioManager] Could not resume context:', e);
            });
        }
    }

    /**
     * Handle storage events for cross-tab sync
     */
    function handleStorageChange(e) {
        if (e.key === STORAGE_KEY) {
            const newValue = e.newValue === 'true';
            if (newValue !== _enabled) {
                _enabled = newValue;
                updateMasterGain();
                updateUI();
                notifySubscribers();
                console.log('[AudioManager] Synced from another tab:', _enabled);
            }
        }
    }

    /**
     * Update master gain based on enabled state
     */
    function updateMasterGain() {
        if (_masterGain) {
            _masterGain.gain.setValueAtTime(
                _enabled ? 1 : 0,
                _audioContext ? _audioContext.currentTime : 0
            );
        }

        // Also suspend/resume context for better performance
        if (_audioContext) {
            if (!_enabled) {
                // Don't suspend immediately - let any playing sounds finish
                setTimeout(() => {
                    if (!_enabled && _audioContext.state === 'running') {
                        // Keep context ready but gain at 0
                    }
                }, 500);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════

    return {
        /**
         * Initialize the AudioManager
         * Should be called once on page load
         */
        init: function() {
            if (_initialized) {
                console.log('[AudioManager] Already initialized');
                return this;
            }

            console.log('[AudioManager] Initializing...');

            // Load persisted state
            loadState();

            // Set up cross-tab synchronization
            window.addEventListener('storage', handleStorageChange);

            // Set up user interaction handler to enable audio
            const enableAudio = () => {
                ensureAudioContext();
                resumeContext();
                document.removeEventListener('click', enableAudio);
                document.removeEventListener('touchstart', enableAudio);
                document.removeEventListener('keydown', enableAudio);
            };

            document.addEventListener('click', enableAudio, { once: true });
            document.addEventListener('touchstart', enableAudio, { once: true });
            document.addEventListener('keydown', enableAudio, { once: true });

            // Initial UI update
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', updateUI);
            } else {
                updateUI();
            }

            _initialized = true;
            console.log('[AudioManager] Initialized. Sound:', _enabled ? 'ON' : 'OFF');

            return this;
        },

        /**
         * Toggle sound on/off
         * @returns {boolean} New enabled state
         */
        toggle: function() {
            _enabled = !_enabled;
            saveState();
            updateMasterGain();
            updateUI();
            notifySubscribers();
            resumeContext();

            console.log('[AudioManager] Sound toggled:', _enabled ? 'ON' : 'OFF');
            return _enabled;
        },

        /**
         * Set sound enabled state explicitly
         * @param {boolean} enabled - Whether sound should be enabled
         */
        setEnabled: function(enabled) {
            if (_enabled !== enabled) {
                _enabled = enabled;
                saveState();
                updateMasterGain();
                updateUI();
                notifySubscribers();
            }
            return this;
        },

        /**
         * Check if sound is currently enabled
         * @returns {boolean}
         */
        isEnabled: function() {
            return _enabled;
        },

        /**
         * Alias for isEnabled() for backward compatibility
         */
        get enabled() {
            return _enabled;
        },

        /**
         * Subscribe to sound state changes
         * @param {function} callback - Function to call when state changes
         * @returns {function} Unsubscribe function
         */
        subscribe: function(callback) {
            if (typeof callback === 'function') {
                _subscribers.add(callback);
                // Immediately call with current state
                callback(_enabled);
            }
            return () => _subscribers.delete(callback);
        },

        /**
         * Get shared AudioContext (creates if needed)
         * @returns {AudioContext|null}
         */
        getContext: function() {
            ensureAudioContext();
            resumeContext();
            return _audioContext;
        },

        /**
         * Get master gain node
         * @returns {GainNode|null}
         */
        getMasterGain: function() {
            ensureAudioContext();
            return _masterGain;
        },

        /**
         * Resume audio context (call after user interaction)
         */
        resume: function() {
            resumeContext();
            return this;
        },

        /**
         * Play a simple tone (utility method)
         * @param {number} frequency - Frequency in Hz
         * @param {number} duration - Duration in seconds
         * @param {string} type - Oscillator type (sine, square, sawtooth, triangle)
         * @param {number} volume - Volume 0-1
         */
        playTone: function(frequency, duration, type, volume) {
            if (!_enabled) return;

            const ctx = this.getContext();
            if (!ctx) return;

            try {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = type || 'sine';
                osc.frequency.setValueAtTime(frequency || 440, ctx.currentTime);

                gain.gain.setValueAtTime(volume || 0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (duration || 0.3));

                osc.connect(gain);
                gain.connect(_masterGain || ctx.destination);

                osc.start();
                osc.stop(ctx.currentTime + (duration || 0.3));
            } catch (e) {
                console.warn('[AudioManager] Could not play tone:', e);
            }
        },

        /**
         * Check if AudioManager has been initialized
         * @returns {boolean}
         */
        isInitialized: function() {
            return _initialized;
        },

        /**
         * Force UI update (useful after dynamic content load)
         */
        refreshUI: function() {
            updateUI();
            return this;
        }
    };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AudioManager.init());
} else {
    AudioManager.init();
}

// Expose globally
window.AudioManager = AudioManager;

console.log('[AudioManager] Module loaded');
// v20260117-FULL
