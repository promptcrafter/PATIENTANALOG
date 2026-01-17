/**
 * Cookie Consent Banner for Patient Analog
 * GDPR & AdSense Compliant
 * Version: 1.0.0
 */

(function() {
    'use strict';

    const CONSENT_KEY = 'pa_cookie_consent';
    const CONSENT_VERSION = '1.0';

    // Default consent state
    const defaultConsent = {
        version: CONSENT_VERSION,
        timestamp: null,
        essential: true, // Always true, required for site function
        analytics: false,
        advertising: false,
        preferences: false
    };

    // Check if consent already given
    function getStoredConsent() {
        try {
            const stored = localStorage.getItem(CONSENT_KEY);
            if (stored) {
                const consent = JSON.parse(stored);
                // Check if consent version matches
                if (consent.version === CONSENT_VERSION) {
                    return consent;
                }
            }
        } catch (e) {
            console.warn('Cookie consent: Could not read stored consent');
        }
        return null;
    }

    // Save consent
    function saveConsent(consent) {
        consent.timestamp = new Date().toISOString();
        consent.version = CONSENT_VERSION;
        try {
            localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
        } catch (e) {
            console.warn('Cookie consent: Could not save consent');
        }
    }

    // Apply consent settings
    function applyConsent(consent) {
        // Google Analytics is not currently used on this site
        // If you add GA in the future, replace GA_MEASUREMENT_ID with your actual ID
        // Example: window['ga-disable-G-XXXXXXXXXX'] = !consent.analytics;

        // Handle advertising consent for AdSense
        if (consent.advertising) {
            // AdSense already loaded, enable personalized ads
            if (typeof window.adsbygoogle !== 'undefined') {
                // Ads can show personalized content
            }
        } else {
            // Request non-personalized ads only
            (adsbygoogle = window.adsbygoogle || []).requestNonPersonalizedAds = 1;
        }

        // Dispatch event for other scripts
        window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: consent }));
    }

    // Create and inject banner HTML
    function createBanner() {
        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.innerHTML = `
            <div class="cookie-consent-container">
                <div class="cookie-consent-content">
                    <div class="cookie-consent-text">
                        <h3>We value your privacy</h3>
                        <p>We use cookies to enhance your browsing experience, serve personalized ads, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
                        <a href="/legal/cookies" class="cookie-link">Cookie Policy</a> |
                        <a href="/legal/privacy" class="cookie-link">Privacy Policy</a></p>
                    </div>
                    <div class="cookie-consent-buttons">
                        <button id="cookie-accept-all" class="cookie-btn cookie-btn-primary">Accept All</button>
                        <button id="cookie-reject-nonessential" class="cookie-btn cookie-btn-secondary">Essential Only</button>
                        <button id="cookie-customize" class="cookie-btn cookie-btn-tertiary">Customize</button>
                    </div>
                </div>

                <div class="cookie-consent-customize" id="cookie-customize-panel" style="display: none;">
                    <div class="cookie-options">
                        <label class="cookie-option">
                            <input type="checkbox" id="consent-essential" checked disabled>
                            <span class="cookie-option-info">
                                <strong>Essential</strong>
                                <small>Required for site functionality</small>
                            </span>
                        </label>
                        <label class="cookie-option">
                            <input type="checkbox" id="consent-analytics">
                            <span class="cookie-option-info">
                                <strong>Analytics</strong>
                                <small>Help us improve our site</small>
                            </span>
                        </label>
                        <label class="cookie-option">
                            <input type="checkbox" id="consent-advertising">
                            <span class="cookie-option-info">
                                <strong>Advertising</strong>
                                <small>Personalized ads via Google AdSense</small>
                            </span>
                        </label>
                        <label class="cookie-option">
                            <input type="checkbox" id="consent-preferences">
                            <span class="cookie-option-info">
                                <strong>Preferences</strong>
                                <small>Remember your settings</small>
                            </span>
                        </label>
                    </div>
                    <button id="cookie-save-preferences" class="cookie-btn cookie-btn-primary">Save Preferences</button>
                </div>
            </div>
        `;
        document.body.appendChild(banner);
        return banner;
    }

    // Inject styles
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #cookie-consent-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(180deg, rgba(10, 22, 40, 0.98) 0%, rgba(10, 22, 40, 0.99) 100%);
                border-top: 1px solid rgba(0, 85, 255, 0.3);
                padding: 20px;
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.5);
                animation: slideUp 0.4s ease-out;
            }

            @keyframes slideUp {
                from { transform: translateY(100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            .cookie-consent-container {
                max-width: 1200px;
                margin: 0 auto;
            }

            .cookie-consent-content {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: space-between;
                gap: 20px;
            }

            .cookie-consent-text {
                flex: 1;
                min-width: 280px;
            }

            .cookie-consent-text h3 {
                color: #0055ff;
                margin: 0 0 8px 0;
                font-size: 18px;
                font-weight: 600;
            }

            .cookie-consent-text p {
                color: #e8eef4;
                margin: 0;
                font-size: 14px;
                line-height: 1.5;
            }

            .cookie-link {
                color: #0055ff;
                text-decoration: none;
            }

            .cookie-link:hover {
                text-decoration: underline;
            }

            .cookie-consent-buttons {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }

            .cookie-btn {
                padding: 12px 24px;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                white-space: nowrap;
            }

            .cookie-btn-primary {
                background: linear-gradient(135deg, #0055ff, #00b8e6);
                color: #0a1628;
            }

            .cookie-btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(0, 85, 255, 0.4);
            }

            .cookie-btn-secondary {
                background: rgba(0, 85, 255, 0.15);
                color: #0055ff;
                border: 1px solid rgba(0, 85, 255, 0.3);
            }

            .cookie-btn-secondary:hover {
                background: rgba(0, 85, 255, 0.25);
            }

            .cookie-btn-tertiary {
                background: transparent;
                color: #8fa3b8;
                border: 1px solid rgba(143, 163, 184, 0.3);
            }

            .cookie-btn-tertiary:hover {
                color: #e8eef4;
                border-color: rgba(143, 163, 184, 0.5);
            }

            .cookie-consent-customize {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid rgba(0, 85, 255, 0.15);
            }

            .cookie-options {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
            }

            .cookie-option {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                cursor: pointer;
                padding: 12px;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.05);
                transition: border-color 0.2s;
            }

            .cookie-option:hover {
                border-color: rgba(0, 85, 255, 0.3);
            }

            .cookie-option input[type="checkbox"] {
                width: 20px;
                height: 20px;
                margin-top: 2px;
                accent-color: #0055ff;
                cursor: pointer;
            }

            .cookie-option input[type="checkbox"]:disabled {
                opacity: 0.7;
                cursor: not-allowed;
            }

            .cookie-option-info {
                display: flex;
                flex-direction: column;
            }

            .cookie-option-info strong {
                color: #e8eef4;
                font-size: 14px;
            }

            .cookie-option-info small {
                color: #8fa3b8;
                font-size: 12px;
                margin-top: 2px;
            }

            @media (max-width: 768px) {
                #cookie-consent-banner {
                    padding: 15px;
                }

                .cookie-consent-content {
                    flex-direction: column;
                    align-items: stretch;
                }

                .cookie-consent-buttons {
                    justify-content: stretch;
                }

                .cookie-btn {
                    flex: 1;
                    text-align: center;
                }

                .cookie-options {
                    grid-template-columns: 1fr;
                }
            }

            /* Settings link in footer */
            .cookie-settings-link {
                cursor: pointer;
                color: #0055ff;
            }

            .cookie-settings-link:hover {
                text-decoration: underline;
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize banner
    function init() {
        const existingConsent = getStoredConsent();

        if (existingConsent) {
            // User already consented, apply settings
            applyConsent(existingConsent);
            return;
        }

        // No consent yet, show banner
        injectStyles();
        const banner = createBanner();

        // Event handlers
        const acceptAllBtn = document.getElementById('cookie-accept-all');
        const rejectBtn = document.getElementById('cookie-reject-nonessential');
        const customizeBtn = document.getElementById('cookie-customize');
        const savePrefsBtn = document.getElementById('cookie-save-preferences');
        const customizePanel = document.getElementById('cookie-customize-panel');

        acceptAllBtn.addEventListener('click', function() {
            const consent = {
                essential: true,
                analytics: true,
                advertising: true,
                preferences: true
            };
            saveConsent(consent);
            applyConsent(consent);
            banner.remove();
        });

        rejectBtn.addEventListener('click', function() {
            const consent = {
                essential: true,
                analytics: false,
                advertising: false,
                preferences: false
            };
            saveConsent(consent);
            applyConsent(consent);
            banner.remove();
        });

        customizeBtn.addEventListener('click', function() {
            customizePanel.style.display = customizePanel.style.display === 'none' ? 'block' : 'none';
        });

        savePrefsBtn.addEventListener('click', function() {
            const consent = {
                essential: true,
                analytics: document.getElementById('consent-analytics').checked,
                advertising: document.getElementById('consent-advertising').checked,
                preferences: document.getElementById('consent-preferences').checked
            };
            saveConsent(consent);
            applyConsent(consent);
            banner.remove();
        });
    }

    // Allow reopening preferences
    window.openCookiePreferences = function() {
        localStorage.removeItem(CONSENT_KEY);
        init();
    };

    // Get current consent status
    window.getCookieConsent = function() {
        return getStoredConsent() || defaultConsent;
    };

    // Wait for DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
