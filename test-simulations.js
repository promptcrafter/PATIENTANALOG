/**
 * PATIENT ANALOG - Comprehensive Simulation Bug Testing Suite
 * Tests all HTML simulation files for common issues
 * Run with: node test-simulations.js
 */

const fs = require('fs');
const path = require('path');

// ANSI colors for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: []
};

// Files to test
const simulationFiles = [
  'brain-organoid-simulator.html',
  'cardiac-safety-testing.html',
  'car-t-cell-therapy.html',
  'ecosystem-dynamics.html',
  'epidemiological-transmission.html',
  'gene-regulatory-network.html',
  'liver-toxicity-testing.html',
  'metabolic-network-flux.html',
  'multi-organ-digital-twin.html',
  'neural-plasticity.html',
  'organoid-assembly-builder.html',
  'protein-folding-dynamics.html',
  'quantum-drug-docking.html',
  'index.html'
];

console.log(`${colors.cyan}${colors.bold}
╔══════════════════════════════════════════════════════════════╗
║     PATIENT ANALOG - Simulation Bug Testing Suite            ║
║     Comprehensive HTML/CSS/JS Validation                     ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);

/**
 * TEST 1: HTML Structure Validation
 */
function testHTMLStructure(content, filename) {
  const issues = [];

  // Check for DOCTYPE
  if (!content.includes('<!DOCTYPE html>')) {
    issues.push({ type: 'error', msg: 'Missing DOCTYPE declaration' });
  }

  // Check for essential meta tags
  if (!content.includes('<meta charset=')) {
    issues.push({ type: 'error', msg: 'Missing charset meta tag' });
  }
  if (!content.includes('<meta name="viewport"')) {
    issues.push({ type: 'warning', msg: 'Missing viewport meta tag (mobile issues)' });
  }

  // Check for closing tags balance
  const openTags = (content.match(/<(html|head|body|div|section|script|style)[\s>]/gi) || []).length;
  const closeTags = (content.match(/<\/(html|head|body|div|section|script|style)>/gi) || []).length;

  // Check for unclosed script tags
  const scriptOpens = (content.match(/<script/gi) || []).length;
  const scriptCloses = (content.match(/<\/script>/gi) || []).length;
  if (scriptOpens !== scriptCloses) {
    issues.push({ type: 'error', msg: `Unclosed script tags: ${scriptOpens} opens, ${scriptCloses} closes` });
  }

  // Check for unclosed style tags
  const styleOpens = (content.match(/<style/gi) || []).length;
  const styleCloses = (content.match(/<\/style>/gi) || []).length;
  if (styleOpens !== styleCloses) {
    issues.push({ type: 'error', msg: `Unclosed style tags: ${styleOpens} opens, ${styleCloses} closes` });
  }

  // Check for title tag
  if (!content.includes('<title>')) {
    issues.push({ type: 'warning', msg: 'Missing title tag' });
  }

  // Check for lang attribute
  if (!content.includes('<html lang=')) {
    issues.push({ type: 'warning', msg: 'Missing lang attribute on html tag' });
  }

  return issues;
}

/**
 * TEST 2: JavaScript Syntax Validation
 */
function testJavaScript(content, filename) {
  const issues = [];

  // Extract all script content
  const scriptMatches = content.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];

  scriptMatches.forEach((scriptBlock, index) => {
    // Skip external scripts
    if (scriptBlock.includes('src=')) return;

    const scriptContent = scriptBlock.replace(/<script[^>]*>|<\/script>/gi, '');
    if (!scriptContent.trim()) return;

    // Check for common JS errors

    // Unclosed brackets
    const openBrackets = (scriptContent.match(/\{/g) || []).length;
    const closeBrackets = (scriptContent.match(/\}/g) || []).length;
    if (openBrackets !== closeBrackets) {
      issues.push({ type: 'error', msg: `Script block ${index + 1}: Unbalanced curly braces (${openBrackets} open, ${closeBrackets} close)` });
    }

    // Unclosed parentheses
    const openParens = (scriptContent.match(/\(/g) || []).length;
    const closeParens = (scriptContent.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      issues.push({ type: 'error', msg: `Script block ${index + 1}: Unbalanced parentheses (${openParens} open, ${closeParens} close)` });
    }

    // Unclosed square brackets
    const openSquare = (scriptContent.match(/\[/g) || []).length;
    const closeSquare = (scriptContent.match(/\]/g) || []).length;
    if (openSquare !== closeSquare) {
      issues.push({ type: 'error', msg: `Script block ${index + 1}: Unbalanced square brackets (${openSquare} open, ${closeSquare} close)` });
    }

    // Check for undefined common variables used without declaration
    if (scriptContent.includes('undefined') && scriptContent.includes('= undefined')) {
      issues.push({ type: 'warning', msg: `Script block ${index + 1}: Explicit undefined assignment (potential issue)` });
    }

    // Check for console.log left in production
    const consoleLogs = (scriptContent.match(/console\.(log|warn|error)/g) || []).length;
    if (consoleLogs > 5) {
      issues.push({ type: 'warning', msg: `Script block ${index + 1}: ${consoleLogs} console statements (consider removing for production)` });
    }

    // Check for eval() usage (security risk)
    if (scriptContent.includes('eval(')) {
      issues.push({ type: 'warning', msg: `Script block ${index + 1}: eval() usage detected (security risk)` });
    }

    // Check for innerHTML without sanitization
    const innerHTMLCount = (scriptContent.match(/\.innerHTML\s*=/g) || []).length;
    if (innerHTMLCount > 0) {
      issues.push({ type: 'info', msg: `Script block ${index + 1}: ${innerHTMLCount} innerHTML assignments (ensure input is sanitized)` });
    }
  });

  return issues;
}

/**
 * TEST 3: CSS Validation
 */
function testCSS(content, filename) {
  const issues = [];

  // Extract all style content
  const styleMatches = content.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];

  styleMatches.forEach((styleBlock, index) => {
    const styleContent = styleBlock.replace(/<style[^>]*>|<\/style>/gi, '');
    if (!styleContent.trim()) return;

    // Check for unclosed braces
    const openBraces = (styleContent.match(/\{/g) || []).length;
    const closeBraces = (styleContent.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      issues.push({ type: 'error', msg: `Style block ${index + 1}: Unbalanced braces (${openBraces} open, ${closeBraces} close)` });
    }

    // Check for missing semicolons (common error)
    const propsWithoutSemicolon = styleContent.match(/[a-z-]+\s*:\s*[^;{}]+[^;\s{}]\s*\}/gi) || [];
    if (propsWithoutSemicolon.length > 0) {
      issues.push({ type: 'warning', msg: `Style block ${index + 1}: Possible missing semicolons before closing braces` });
    }

    // Check for !important overuse
    const importantCount = (styleContent.match(/!important/gi) || []).length;
    if (importantCount > 10) {
      issues.push({ type: 'warning', msg: `Style block ${index + 1}: ${importantCount} !important declarations (consider refactoring)` });
    }

    // Check for vendor prefix consistency
    if (styleContent.includes('-webkit-') && !styleContent.includes('-moz-') && styleContent.includes('transform')) {
      issues.push({ type: 'info', msg: `Style block ${index + 1}: -webkit- prefix without -moz- (browser compatibility)` });
    }
  });

  return issues;
}

/**
 * TEST 4: Resource Path Validation
 */
function testResourcePaths(content, filename) {
  const issues = [];

  // Check for broken relative paths
  const srcMatches = content.match(/src=["']([^"']+)["']/gi) || [];
  const hrefMatches = content.match(/href=["']([^"']+)["']/gi) || [];

  [...srcMatches, ...hrefMatches].forEach(match => {
    const pathMatch = match.match(/["']([^"']+)["']/);
    if (!pathMatch) return;

    const resourcePath = pathMatch[1];

    // Skip external URLs, data URIs, anchors, mailto, tel
    if (resourcePath.startsWith('http') ||
        resourcePath.startsWith('//') ||
        resourcePath.startsWith('data:') ||
        resourcePath.startsWith('#') ||
        resourcePath.startsWith('mailto:') ||
        resourcePath.startsWith('tel:') ||
        resourcePath.startsWith('javascript:')) {
      return;
    }

    // Check for paths that might be broken
    if (resourcePath.includes('../../../')) {
      issues.push({ type: 'warning', msg: `Deep relative path: ${resourcePath} (may break on deployment)` });
    }

    // Check for absolute paths that should be relative
    if (resourcePath.startsWith('/') && !resourcePath.startsWith('/assets/') && !resourcePath.startsWith('/favicon')) {
      // This is fine for root-relative paths
    }
  });

  // Check for missing favicon
  if (!content.includes('favicon')) {
    issues.push({ type: 'warning', msg: 'Missing favicon reference' });
  }

  return issues;
}

/**
 * TEST 5: Accessibility Checks
 */
function testAccessibility(content, filename) {
  const issues = [];

  // Check for images without alt text
  const imgTags = content.match(/<img[^>]+>/gi) || [];
  imgTags.forEach(img => {
    if (!img.includes('alt=')) {
      issues.push({ type: 'warning', msg: 'Image without alt attribute found' });
    }
  });

  // Check for buttons without accessible text
  const buttonTags = content.match(/<button[^>]*>[\s\S]*?<\/button>/gi) || [];
  buttonTags.forEach(btn => {
    if (btn.match(/<button[^>]*>\s*<\/button>/i)) {
      issues.push({ type: 'warning', msg: 'Empty button element found' });
    }
  });

  // Check for form inputs without labels
  const inputTags = content.match(/<input[^>]+>/gi) || [];
  const labelTags = content.match(/<label[^>]*>/gi) || [];
  if (inputTags.length > labelTags.length + 5) {
    issues.push({ type: 'info', msg: `${inputTags.length} inputs but only ${labelTags.length} labels (accessibility)` });
  }

  // Check for color contrast issues (basic check for white on light backgrounds)
  if (content.includes('color: #fff') && content.includes('background: #fff')) {
    issues.push({ type: 'warning', msg: 'Potential color contrast issue (white on white)' });
  }

  return issues;
}

/**
 * TEST 6: Performance Checks
 */
function testPerformance(content, filename) {
  const issues = [];

  // Check file size
  const sizeKB = Buffer.byteLength(content, 'utf8') / 1024;
  if (sizeKB > 500) {
    issues.push({ type: 'warning', msg: `Large file size: ${sizeKB.toFixed(1)}KB (consider splitting)` });
  }

  // Check for inline styles count
  const inlineStyles = (content.match(/style=["'][^"']+["']/gi) || []).length;
  if (inlineStyles > 100) {
    issues.push({ type: 'info', msg: `${inlineStyles} inline styles (consider moving to stylesheet)` });
  }

  // Check for large embedded images (base64)
  const base64Images = content.match(/data:image\/[^;]+;base64,[^"']+/gi) || [];
  base64Images.forEach((img, i) => {
    const sizeKB = img.length * 0.75 / 1024; // Approximate decoded size
    if (sizeKB > 50) {
      issues.push({ type: 'warning', msg: `Large base64 image #${i + 1}: ~${sizeKB.toFixed(1)}KB (use external file)` });
    }
  });

  // Check for render-blocking resources
  const blockingScripts = content.match(/<script(?![^>]*async)(?![^>]*defer)[^>]*src=/gi) || [];
  if (blockingScripts.length > 2) {
    issues.push({ type: 'info', msg: `${blockingScripts.length} render-blocking scripts (consider async/defer)` });
  }

  return issues;
}

/**
 * TEST 7: Security Checks
 */
function testSecurity(content, filename) {
  const issues = [];

  // Check for inline event handlers (XSS risk)
  const inlineEvents = content.match(/on(click|load|error|mouseover|submit)=["'][^"']*["']/gi) || [];
  if (inlineEvents.length > 20) {
    issues.push({ type: 'info', msg: `${inlineEvents.length} inline event handlers (consider addEventListener)` });
  }

  // Check for document.write usage
  if (content.includes('document.write')) {
    issues.push({ type: 'warning', msg: 'document.write usage detected (avoid for security)' });
  }

  // Check for target="_blank" without rel="noopener"
  const blankLinks = content.match(/target=["']_blank["']/gi) || [];
  const noopenerLinks = content.match(/rel=["'][^"']*noopener[^"']*["']/gi) || [];
  if (blankLinks.length > noopenerLinks.length) {
    issues.push({ type: 'warning', msg: 'target="_blank" without rel="noopener" (security risk)' });
  }

  return issues;
}

/**
 * TEST 8: Canvas/WebGL Specific Checks
 */
function testCanvasWebGL(content, filename) {
  const issues = [];

  // Check for canvas without fallback
  const canvasTags = content.match(/<canvas[^>]*>[\s\S]*?<\/canvas>/gi) || [];
  canvasTags.forEach((canvas, i) => {
    if (canvas.match(/<canvas[^>]*>\s*<\/canvas>/i)) {
      issues.push({ type: 'info', msg: `Canvas #${i + 1} has no fallback content` });
    }
  });

  // Check for requestAnimationFrame usage
  if (content.includes('setInterval') && content.includes('canvas')) {
    if (!content.includes('requestAnimationFrame')) {
      issues.push({ type: 'warning', msg: 'Using setInterval for animation (use requestAnimationFrame for better performance)' });
    }
  }

  // Check for WebGL context error handling
  if (content.includes('getContext') && content.includes('webgl')) {
    if (!content.includes('webgl') || !content.match(/getContext\s*\([^)]*\)\s*;?\s*if/)) {
      issues.push({ type: 'info', msg: 'WebGL usage detected - ensure fallback for unsupported browsers' });
    }
  }

  return issues;
}

/**
 * TEST 9: Three.js Specific Checks
 */
function testThreeJS(content, filename) {
  const issues = [];

  if (!content.includes('three') && !content.includes('THREE')) {
    return issues; // Not a Three.js file
  }

  // Check for renderer disposal
  if (content.includes('WebGLRenderer') && !content.includes('dispose')) {
    issues.push({ type: 'info', msg: 'Three.js renderer without dispose() call (memory leak risk)' });
  }

  // Check for window resize handler
  if (content.includes('WebGLRenderer') && !content.includes('resize')) {
    issues.push({ type: 'warning', msg: 'Three.js without window resize handler' });
  }

  // Check for animation loop
  if (content.includes('THREE.') && !content.includes('requestAnimationFrame') && !content.includes('animate')) {
    issues.push({ type: 'warning', msg: 'Three.js scene may be static (no animation loop found)' });
  }

  return issues;
}

/**
 * TEST 10: Simulation-Specific Logic Checks
 */
function testSimulationLogic(content, filename) {
  const issues = [];

  // Check for start/stop/reset controls
  if (content.includes('simulation') || content.includes('Simulation')) {
    if (!content.includes('start') && !content.includes('Start')) {
      issues.push({ type: 'info', msg: 'No start control found for simulation' });
    }
    if (!content.includes('stop') && !content.includes('Stop') && !content.includes('pause') && !content.includes('Pause')) {
      issues.push({ type: 'info', msg: 'No stop/pause control found for simulation' });
    }
    if (!content.includes('reset') && !content.includes('Reset')) {
      issues.push({ type: 'info', msg: 'No reset control found for simulation' });
    }
  }

  // Check for parameter validation
  if (content.includes('slider') || content.includes('range')) {
    if (!content.includes('min') || !content.includes('max')) {
      issues.push({ type: 'warning', msg: 'Sliders without min/max constraints' });
    }
  }

  // Check for error boundaries in simulations
  if (content.includes('try') && content.includes('catch')) {
    // Good - has error handling
  } else if (content.includes('simulation') || content.includes('animate')) {
    issues.push({ type: 'info', msg: 'Consider adding try-catch for simulation robustness' });
  }

  return issues;
}

/**
 * Main Test Runner
 */
function runTests(filename) {
  const filepath = path.join(__dirname, 'simulations', filename);

  if (!fs.existsSync(filepath)) {
    console.log(`${colors.red}✗ File not found: ${filename}${colors.reset}`);
    testResults.failed++;
    return;
  }

  const content = fs.readFileSync(filepath, 'utf8');

  console.log(`\n${colors.blue}${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.cyan}Testing: ${filename}${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

  const allIssues = [];

  // Run all tests
  allIssues.push(...testHTMLStructure(content, filename));
  allIssues.push(...testJavaScript(content, filename));
  allIssues.push(...testCSS(content, filename));
  allIssues.push(...testResourcePaths(content, filename));
  allIssues.push(...testAccessibility(content, filename));
  allIssues.push(...testPerformance(content, filename));
  allIssues.push(...testSecurity(content, filename));
  allIssues.push(...testCanvasWebGL(content, filename));
  allIssues.push(...testThreeJS(content, filename));
  allIssues.push(...testSimulationLogic(content, filename));

  // Report issues
  const errors = allIssues.filter(i => i.type === 'error');
  const warnings = allIssues.filter(i => i.type === 'warning');
  const infos = allIssues.filter(i => i.type === 'info');

  if (errors.length === 0 && warnings.length === 0) {
    console.log(`${colors.green}✓ All tests passed!${colors.reset}`);
    testResults.passed++;
  } else {
    if (errors.length > 0) {
      testResults.failed++;
      testResults.errors.push({ file: filename, errors: errors });
    } else {
      testResults.passed++;
    }
  }

  errors.forEach(e => {
    console.log(`${colors.red}  ✗ ERROR: ${e.msg}${colors.reset}`);
  });

  warnings.forEach(w => {
    console.log(`${colors.yellow}  ⚠ WARNING: ${w.msg}${colors.reset}`);
    testResults.warnings++;
  });

  infos.forEach(i => {
    console.log(`${colors.cyan}  ℹ INFO: ${i.msg}${colors.reset}`);
  });

  // File stats
  const lines = content.split('\n').length;
  const sizeKB = (Buffer.byteLength(content, 'utf8') / 1024).toFixed(1);
  console.log(`${colors.reset}  📊 Stats: ${lines} lines, ${sizeKB}KB`);
}

/**
 * Run all tests
 */
console.log(`\n${colors.bold}Starting tests for ${simulationFiles.length} files...${colors.reset}\n`);

simulationFiles.forEach(file => {
  runTests(file);
});

// Final summary
console.log(`\n${colors.cyan}${colors.bold}
╔══════════════════════════════════════════════════════════════╗
║                      TEST SUMMARY                            ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);

console.log(`${colors.green}  ✓ Passed: ${testResults.passed}${colors.reset}`);
console.log(`${colors.red}  ✗ Failed: ${testResults.failed}${colors.reset}`);
console.log(`${colors.yellow}  ⚠ Warnings: ${testResults.warnings}${colors.reset}`);

if (testResults.errors.length > 0) {
  console.log(`\n${colors.red}${colors.bold}Critical Errors Found:${colors.reset}`);
  testResults.errors.forEach(err => {
    console.log(`\n${colors.red}  ${err.file}:${colors.reset}`);
    err.errors.forEach(e => {
      console.log(`${colors.red}    - ${e.msg}${colors.reset}`);
    });
  });
}

console.log(`\n${colors.cyan}Test completed at ${new Date().toLocaleString()}${colors.reset}\n`);
