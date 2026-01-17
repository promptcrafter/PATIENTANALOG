#!/usr/bin/env python3
"""
Comprehensive Link and Asset Audit Script
Checks for broken links, missing assets, and 404 errors
"""

import os
import re
from pathlib import Path
from collections import defaultdict
import xml.etree.ElementTree as ET

class LinkAuditor:
    def __init__(self, root_dir):
        self.root_dir = Path(root_dir)
        self.broken_links = []
        self.missing_assets = []
        self.invalid_html_links = []
        self.sitemap_issues = []
        self.total_links = 0
        self.total_assets = 0
        self.files_checked = 0

    def check_file_exists(self, file_path):
        """Check if a file exists, handling both files and directories"""
        p = Path(file_path)
        # Check if it exists as a file
        if p.exists() and p.is_file():
            return True
        # Check if it exists as a directory with index.html
        if p.exists() and p.is_dir():
            index_file = p / "index.html"
            return index_file.exists()
        # Check if adding index.html makes it valid
        index_path = Path(str(p) + "/index.html")
        if index_path.exists():
            return True
        return False

    def resolve_path(self, current_file, link):
        """Resolve relative and absolute paths"""
        current_dir = Path(current_file).parent

        # Skip external links, anchors, javascript, mailto, tel
        if any(link.startswith(x) for x in ['http://', 'https://', '#', 'javascript:', 'mailto:', 'tel:', 'data:']):
            return None

        # Remove query strings and anchors
        link = link.split('?')[0].split('#')[0]

        if not link or link == '/':
            return None

        # Handle absolute paths (starting with /)
        if link.startswith('/'):
            target = self.root_dir / link.lstrip('/')
        else:
            # Handle relative paths
            target = current_dir / link

        return target.resolve()

    def extract_links_from_html(self, file_path):
        """Extract all href and src attributes from HTML file"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Find all href links
            href_pattern = r'href=["\']([^"\']+)["\']'
            src_pattern = r'src=["\']([^"\']+)["\']'

            hrefs = re.findall(href_pattern, content)
            srcs = re.findall(src_pattern, content)

            return hrefs, srcs
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
            return [], []

    def check_html_extension_links(self, file_path, hrefs):
        """Check for .html links that should be clean URLs (except kids-zone games)"""
        for href in hrefs:
            # Skip external links
            if any(href.startswith(x) for x in ['http://', 'https://', '#', 'javascript:', 'mailto:', 'tel:']):
                continue

            # Check if it ends with .html
            if href.endswith('.html'):
                # Allow .html in kids-zone games and some specific files
                if '/games/kids-zone/' in href or '/games/mini-games/' in href:
                    continue
                if href in ['404.html', 'offline.html', 'privacy.html', 'terms.html', 'thank-you.html']:
                    continue
                if href.endswith('about.html') or href.endswith('contact.html'):
                    continue

                # This might be an issue
                self.invalid_html_links.append({
                    'file': str(file_path),
                    'link': href,
                    'type': 'Possible .html extension that should be clean URL'
                })

    def audit_html_file(self, file_path):
        """Audit a single HTML file for broken links"""
        self.files_checked += 1
        hrefs, srcs = self.extract_links_from_html(file_path)

        # Check HTML extension usage
        self.check_html_extension_links(file_path, hrefs)

        # Check href links
        for href in hrefs:
            self.total_links += 1
            target = self.resolve_path(file_path, href)
            if target and not self.check_file_exists(target):
                self.broken_links.append({
                    'file': str(file_path),
                    'link': href,
                    'resolved': str(target),
                    'type': 'href'
                })

        # Check src assets
        for src in srcs:
            self.total_assets += 1
            target = self.resolve_path(file_path, src)
            if target and not self.check_file_exists(target):
                self.missing_assets.append({
                    'file': str(file_path),
                    'asset': src,
                    'resolved': str(target),
                    'type': 'src'
                })

    def audit_sitemap(self, sitemap_path):
        """Check if URLs in sitemap have corresponding files"""
        try:
            tree = ET.parse(sitemap_path)
            root = tree.getroot()

            # Handle namespace
            ns = {'sm': 'http://www.sitemaps.org/schemas/sitemap/0.9'}

            for url_elem in root.findall('.//sm:loc', ns):
                url = url_elem.text
                if not url:
                    continue

                # Extract path from URL
                path = url.replace('https://patientanalog.com', '').replace('http://patientanalog.com', '')
                if not path or path == '/':
                    path = '/index.html'

                # Convert clean URL to file path
                if not path.endswith('.html') and not path.endswith('/'):
                    # Try as directory with index.html
                    test_path = self.root_dir / path.lstrip('/') / 'index.html'
                    if not test_path.exists():
                        # Try adding .html
                        test_path = self.root_dir / (path.lstrip('/') + '.html')
                        if not test_path.exists():
                            self.sitemap_issues.append({
                                'url': url,
                                'expected_path': str(test_path),
                                'type': 'Page not found'
                            })
                elif path.endswith('/'):
                    test_path = self.root_dir / path.lstrip('/') / 'index.html'
                    if not test_path.exists():
                        self.sitemap_issues.append({
                            'url': url,
                            'expected_path': str(test_path),
                            'type': 'Page not found'
                        })
                else:
                    test_path = self.root_dir / path.lstrip('/')
                    if not test_path.exists():
                        self.sitemap_issues.append({
                            'url': url,
                            'expected_path': str(test_path),
                            'type': 'Page not found'
                        })

        except Exception as e:
            print(f"Error parsing sitemap {sitemap_path}: {e}")

    def audit_all(self):
        """Run complete audit"""
        print("Starting comprehensive link audit...")
        print("="*80)

        # Find all HTML files
        html_files = list(self.root_dir.rglob("*.html"))
        total_html = len(html_files)
        print(f"Found {total_html} HTML files to audit")

        # Audit HTML files
        print("\nAuditing HTML files for broken links and missing assets...")
        for i, html_file in enumerate(html_files, 1):
            if i % 50 == 0:
                print(f"  Progress: {i}/{total_html} files checked...")
            self.audit_html_file(html_file)

        # Audit sitemaps
        print("\nAuditing sitemap files...")
        sitemap_files = [
            'sitemap-pages.xml',
            'sitemap-games.xml',
            'sitemap-simulations.xml',
            'sitemap-portfolio.xml',
            'sitemap-news.xml'
        ]

        for sitemap_file in sitemap_files:
            sitemap_path = self.root_dir / sitemap_file
            if sitemap_path.exists():
                print(f"  Checking {sitemap_file}...")
                self.audit_sitemap(sitemap_path)

        self.print_report()

    def print_report(self):
        """Print comprehensive audit report"""
        print("\n" + "="*80)
        print("COMPREHENSIVE LINK AUDIT REPORT")
        print("="*80)

        print(f"\nFILES CHECKED: {self.files_checked}")
        print(f"TOTAL LINKS CHECKED: {self.total_links}")
        print(f"TOTAL ASSETS CHECKED: {self.total_assets}")

        print("\n" + "-"*80)
        print(f"BROKEN LINKS FOUND: {len(self.broken_links)}")
        print("-"*80)
        if self.broken_links:
            for issue in self.broken_links[:50]:  # Show first 50
                print(f"\nFile: {issue['file']}")
                print(f"  Link: {issue['link']}")
                print(f"  Expected at: {issue['resolved']}")
            if len(self.broken_links) > 50:
                print(f"\n... and {len(self.broken_links) - 50} more broken links")
        else:
            print("No broken links found!")

        print("\n" + "-"*80)
        print(f"MISSING ASSETS FOUND: {len(self.missing_assets)}")
        print("-"*80)
        if self.missing_assets:
            for issue in self.missing_assets[:50]:  # Show first 50
                print(f"\nFile: {issue['file']}")
                print(f"  Asset: {issue['asset']}")
                print(f"  Expected at: {issue['resolved']}")
            if len(self.missing_assets) > 50:
                print(f"\n... and {len(self.missing_assets) - 50} more missing assets")
        else:
            print("No missing assets found!")

        print("\n" + "-"*80)
        print(f"SITEMAP ISSUES FOUND: {len(self.sitemap_issues)}")
        print("-"*80)
        if self.sitemap_issues:
            for issue in self.sitemap_issues[:50]:  # Show first 50
                print(f"\nURL: {issue['url']}")
                print(f"  Expected at: {issue['expected_path']}")
                print(f"  Issue: {issue['type']}")
            if len(self.sitemap_issues) > 50:
                print(f"\n... and {len(self.sitemap_issues) - 50} more sitemap issues")
        else:
            print("No sitemap issues found!")

        print("\n" + "-"*80)
        print(f"INVALID .HTML EXTENSION USAGE: {len(self.invalid_html_links)}")
        print("-"*80)
        if self.invalid_html_links:
            for issue in self.invalid_html_links[:50]:  # Show first 50
                print(f"\nFile: {issue['file']}")
                print(f"  Link: {issue['link']}")
                print(f"  Note: {issue['type']}")
            if len(self.invalid_html_links) > 50:
                print(f"\n... and {len(self.invalid_html_links) - 50} more .html extension issues")
        else:
            print("No invalid .html extension usage found!")

        print("\n" + "="*80)
        print("SUMMARY")
        print("="*80)
        total_issues = len(self.broken_links) + len(self.missing_assets) + len(self.sitemap_issues)
        if total_issues == 0:
            print("EXCELLENT! No critical issues found.")
        else:
            print(f"Total critical issues found: {total_issues}")
            print(f"  - Broken links: {len(self.broken_links)}")
            print(f"  - Missing assets: {len(self.missing_assets)}")
            print(f"  - Sitemap issues: {len(self.sitemap_issues)}")

        if self.invalid_html_links:
            print(f"\nWarning: {len(self.invalid_html_links)} links use .html extension (may need clean URL conversion)")

        print("\n" + "="*80)

if __name__ == "__main__":
    root_directory = r"C:\Users\josep\Desktop\HYBRID FINAL926pm\HYBRID FINAL926pm"
    auditor = LinkAuditor(root_directory)
    auditor.audit_all()
