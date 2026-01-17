#!/bin/bash
# Add Google AdSense meta tag to all HTML files missing it

meta_tag='  <meta name="google-adsense-account" content="ca-pub-2494888434613702">'
files_updated=0

# Find all HTML files that don't have the meta tag
while IFS= read -r file; do
  # Check if file has charset or viewport meta tag
  if grep -q '<meta charset' "$file" || grep -q '<meta name="viewport"' "$file"; then
    # Insert after the first meta tag in head section
    sed -i '0,/<meta [^>]*>/s||\0\n'"$meta_tag"'|' "$file"
    ((files_updated++))
    echo "Updated: $file"
  fi
done < <(find . -name "*.html" -type f ! -exec grep -q "google-adsense-account" {} \; -print)

echo ""
echo "Total files updated: $files_updated"
