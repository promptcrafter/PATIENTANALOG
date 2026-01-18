#!/usr/bin/env python3
"""
Clean up sitemap.xml - remove duplicate URLs
Keep version WITH trailing slash, remove version WITHOUT
"""
import re

def cleanup_sitemap(filepath):
    """Remove duplicate URLs from sitemap"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    seen_urls = {}
    cleaned_lines = []
    removed = 0

    for line in lines:
        # Check if this is a URL line
        url_match = re.search(r'<loc>(https://[^<]+)</loc>', line)

        if url_match:
            full_url = url_match.group(1)

            # Remove trailing slash to compare
            base_url = full_url.rstrip('/')

            # Check if we've seen this base URL before
            if base_url in seen_urls:
                # We've seen this URL before
                # Keep the one WITH trailing slash
                if full_url.endswith('/'):
                    # This one has slash, replace the old one
                    old_line = seen_urls[base_url]
                    if old_line in cleaned_lines:
                        cleaned_lines.remove(old_line)
                    cleaned_lines.append(line)
                    seen_urls[base_url] = line
                    removed += 1
                else:
                    # This one has no slash, skip it (keep the slashed version)
                    removed += 1
                    continue
            else:
                # First time seeing this URL
                seen_urls[base_url] = line
                cleaned_lines.append(line)
        else:
            # Not a URL line, keep it
            cleaned_lines.append(line)

    # Write cleaned content
    cleaned_content = '\n'.join(cleaned_lines)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(cleaned_content)

    return removed

if __name__ == '__main__':
    removed_count = cleanup_sitemap('sitemap.xml')
    print(f"Cleaned sitemap.xml")
    print(f"Removed {removed_count} duplicate URLs")
    print(f"Kept versions WITH trailing slash (/)")
