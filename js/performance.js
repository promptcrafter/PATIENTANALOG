/**
 * Patient Analog Performance Module
 * Handles lazy loading, preloading, page transitions, and PWA features
 */
(function() {
    'use strict';

    const PA_PERF = {
        config: {
            lazyLoadThreshold: '200px',
            transitionDuration: 300
        },

        init: function() {
            this.registerServiceWorker();
            this.setupLazyLoading();
            this.setupPageTransitions();
            this.setupMicroInteractions();
            console.log('[PA-Perf] Performance module initialized');
        },

        registerServiceWorker: function() {
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js')
                        .then(function(reg) {
                            console.log('[PA-Perf] SW registered:', reg.scope);
                        })
                        .catch(function(err) {
                            console.log('[PA-Perf] SW failed:', err);
                        });
                });
            }
        },

        setupLazyLoading: function() {
            var lazyImages = document.querySelectorAll('img[data-src], iframe[data-src]');
            
            if ('IntersectionObserver' in window) {
                var observer = new IntersectionObserver(function(entries) {
                    entries.forEach(function(entry) {
                        if (entry.isIntersecting) {
                            var el = entry.target;
                            if (el.dataset.src) {
                                el.src = el.dataset.src;
                                el.removeAttribute('data-src');
                            }
                            el.classList.add('pa-loaded');
                            observer.unobserve(el);
                        }
                    });
                }, { rootMargin: this.config.lazyLoadThreshold });

                lazyImages.forEach(function(img) { observer.observe(img); });
            }
        },

        setupPageTransitions: function() {
            var self = this;
            
            var overlay = document.createElement('div');
            overlay.id = 'pa-transition';
            overlay.innerHTML = '<div class="pa-spinner"></div>';
            document.body.appendChild(overlay);

            var css = document.createElement('style');
            css.textContent = '#pa-transition{position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:99999;display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transition:all .3s}.pa-spinner{width:50px;height:50px;border:3px solid rgba(0,255,136,.2);border-top-color:#00ff88;border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}#pa-transition.active{opacity:1;visibility:visible}.pa-fade{animation:fadeIn .4s ease}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}';
            document.head.appendChild(css);

            document.addEventListener('click', function(e) {
                var link = e.target.closest('a');
                if (link && link.href && link.href.indexOf(location.origin) === 0 && 
                    !link.hasAttribute('download') && link.target !== '_blank' && link.href !== location.href) {
                    e.preventDefault();
                    overlay.classList.add('active');
                    setTimeout(function() { location.href = link.href; }, self.config.transitionDuration);
                }
            });

            // pa-fade disabled - using existing CSS animation
        },

        setupMicroInteractions: function() {
            var css = document.createElement('style');
            css.textContent = '.pa-lift{transition:transform .2s,box-shadow .2s}.pa-lift:hover{transform:translateY(-4px);box-shadow:0 10px 30px rgba(0,255,136,.2)}.pa-glow:hover{box-shadow:0 0 20px rgba(0,212,255,.4)}.pa-ripple{position:absolute;border-radius:50%;background:rgba(255,255,255,.3);transform:scale(0);animation:ripple .6s ease-out;pointer-events:none}@keyframes ripple{to{transform:scale(4);opacity:0}}';
            document.head.appendChild(css);

            document.addEventListener('click', function(e) {
                var btn = e.target.closest('button,.btn');
                if (btn) {
                    var ripple = document.createElement('span');
                    ripple.className = 'pa-ripple';
                    var rect = btn.getBoundingClientRect();
                    var size = Math.max(rect.width, rect.height);
                    ripple.style.cssText = 'width:'+size+'px;height:'+size+'px;left:'+(e.clientX-rect.left-size/2)+'px;top:'+(e.clientY-rect.top-size/2)+'px';
                    btn.style.position = 'relative';
                    btn.style.overflow = 'hidden';
                    btn.appendChild(ripple);
                    setTimeout(function() { ripple.remove(); }, 600);
                }
            });

            document.querySelectorAll('.card,.feature-card,.glass-card').forEach(function(el) {
                el.classList.add('pa-lift');
            });
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { PA_PERF.init(); });
    } else {
        PA_PERF.init();
    }

    window.PA_PERF = PA_PERF;
})();
