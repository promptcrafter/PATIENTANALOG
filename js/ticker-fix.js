/**
 * Ticker Fix - Applies all ticker CSS and JS fixes
 * Include this script at the end of body on all pages
 * Updated: Taller ticker with better visibility for all 3 rows
 */
(function() {
  // Add CSS fixes
  var style = document.createElement('style');
  style.textContent = `
    /* TICKER SIZE OVERRIDE - COMPACT, NO TOP PADDING */
    #live-ticker,
    .live-ticker-bar {
      min-height: 115px !important;
      max-height: 115px !important;
      height: 115px !important;
      padding: 0 !important;
      overflow: visible !important;
      box-sizing: border-box !important;
      z-index: 2147483647 !important;
      position: fixed !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      background: rgba(0,0,0,0.95) !important;
    }

    .live-ticker-inner {
      min-height: 105px !important;
      height: 105px !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: flex-start !important;
      gap: 0px !important;
      padding: 0 !important;
      overflow: visible !important;
      box-sizing: border-box !important;
    }

    .live-ticker-row {
      min-height: 32px !important;
      height: 34px !important;
      display: flex !important;
      align-items: center !important;
      padding: 2px 10px !important;
      flex-shrink: 0 !important;
      visibility: visible !important;
      opacity: 1 !important;
    }

    .live-ticker-row.ticker-news-row {
      min-height: 32px !important;
      height: 34px !important;
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
    }

    /* Reset margins on all ticker elements */
    .live-ticker-bar,
    .live-ticker-inner,
    .live-ticker-row,
    .ticker-scroll,
    .breaking-news-container {
      margin: 0 !important;
      margin-top: 0 !important;
      padding-top: 0 !important;
    }

    .ticker-row-secondary,
    .ticker-row-secondary .ticker-scroll {
      margin: 0 !important;
      padding: 0 !important;
    }

    /* TOP TICKER - Scrolling animation */
    .live-ticker-items {
      display: inline-flex !important;
      flex-wrap: nowrap !important;
      white-space: nowrap !important;
      animation: tickerScrollTop 400s linear infinite !important;
      will-change: transform !important;
    }

    @keyframes tickerScrollTop {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }

    .ticker-item,
    .ticker-static {
      flex-shrink: 0 !important;
      white-space: nowrap !important;
    }

    /* MIDDLE TICKER - Slow scroll */
    @keyframes tickerScrollSlow {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }

    .ticker-scroll,
    .ticker-scroll-content,
    span.ticker-scroll,
    span.ticker-scroll-content,
    .live-ticker-row .ticker-scroll,
    .live-ticker-row .ticker-scroll-content,
    .ticker-row-secondary .ticker-scroll,
    .ticker-row-secondary .ticker-scroll-content,
    #live-ticker .ticker-scroll,
    #live-ticker .ticker-scroll-content {
      animation: tickerScrollSlow 600s linear infinite !important;
      -webkit-animation: tickerScrollSlow 600s linear infinite !important;
    }

    /* Font size */
    .live-ticker-row *,
    .ticker-item,
    .ticker-static,
    .ticker-highlight,
    .scroll-item {
      font-size: 11px !important;
    }
  `;
  document.head.appendChild(style);

  // Force ticker size via inline styles - EXACT MATCH TO INDEX.HTML
  function forceTickerSize() {
    var ticker = document.getElementById('live-ticker');
    if (ticker) {
      ticker.style.cssText = 'height:115px!important;min-height:115px!important;max-height:115px!important;padding:0!important;overflow:visible!important;z-index:2147483647!important;position:fixed!important;bottom:0!important;left:0!important;right:0!important;background:rgba(0,0,0,0.95)!important;';
    }
    var tickerBar = document.querySelector('.live-ticker-bar');
    if (tickerBar) {
      tickerBar.style.cssText = 'height:110px!important;min-height:110px!important;overflow:visible!important;';
    }
    var tickerInner = document.querySelector('.live-ticker-inner');
    if (tickerInner) {
      tickerInner.style.cssText = 'height:105px!important;min-height:105px!important;display:flex!important;flex-direction:column!important;justify-content:flex-start!important;gap:0px!important;padding:0!important;overflow:visible!important;';
    }
    var rows = document.querySelectorAll('.live-ticker-row');
    rows.forEach(function(row) {
      row.style.cssText = 'min-height:32px!important;height:34px!important;display:flex!important;align-items:center!important;visibility:visible!important;opacity:1!important;flex-shrink:0!important;padding:2px 10px!important;margin:0!important;';
    });
  }

  // Duplicate top ticker items for seamless infinite scroll
  function duplicateTopTicker() {
    var tickerItems = document.querySelector('.live-ticker-items');
    if (tickerItems && !tickerItems.dataset.duplicated) {
      var items = tickerItems.innerHTML;
      tickerItems.innerHTML = items + items;
      tickerItems.dataset.duplicated = 'true';
    }
  }

  // Force slow ticker speed via inline styles
  function forceTickerSpeed() {
    var tickerScrolls = document.querySelectorAll('.ticker-scroll, .ticker-scroll-content');
    tickerScrolls.forEach(function(el) {
      el.style.setProperty('animation-duration', '600s', 'important');
    });
    var tickerItems = document.querySelector('.live-ticker-items');
    if (tickerItems) {
      tickerItems.style.setProperty('animation-duration', '400s', 'important');
    }
  }

  // Run on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    forceTickerSize();
    duplicateTopTicker();
    forceTickerSpeed();
  });

  // Run after everything loads
  window.addEventListener('load', function() {
    forceTickerSize();
    duplicateTopTicker();
    forceTickerSpeed();
  });

  // Run again after delays for dynamic content
  setTimeout(function() {
    forceTickerSize();
    duplicateTopTicker();
    forceTickerSpeed();
  }, 1000);

  setTimeout(function() {
    forceTickerSize();
    duplicateTopTicker();
    forceTickerSpeed();
  }, 3000);

  setTimeout(forceTickerSpeed, 5000);
})();
// v20260117-FULL
