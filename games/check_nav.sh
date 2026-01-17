#!/bin/bash
echo "COMPREHENSIVE NAVIGATION CHECK"
echo "=============================="

find . -name "*.html" | sort | while read f; do
  file=$(basename "$f")
  dir=$(dirname "$f")
  
  # Check all 4 required elements
  css1=$(grep -c "inline-extracted.css" "$f" 2>/dev/null || echo 0)
  css2=$(grep -c "nav-force.css" "$f" 2>/dev/null || echo 0)
  nav=$(grep -c 'nav class="nav-bar" id="main-nav"' "$f" 2>/dev/null || echo 0)
  script=$(grep -c "main-qZqwn-yL.js" "$f" 2>/dev/null || echo 0)
  
  total=$((css1 + css2 + nav + script))
  
  if [ $total -lt 4 ]; then
    echo "MISSING in $dir/$file:"
    [ $css1 -eq 0 ] && echo "  - inline-extracted.css"
    [ $css2 -eq 0 ] && echo "  - nav-force.css"
    [ $nav -eq 0 ] && echo "  - nav element"
    [ $script -eq 0 ] && echo "  - main-qZqwn-yL.js"
  fi
done
echo "=============================="
echo "Check completed!"
