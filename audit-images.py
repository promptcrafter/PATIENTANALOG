#!/usr/bin/env python3
"""
Comprehensive Image Audit Tool
Scans all pages to verify images match scientific content
"""
import os
import re
from pathlib import Path
from bs4 import BeautifulSoup
import json

# Scientific topic keywords and what images should show
TOPICS = {
    'brain-organoid': {
        'keywords': ['brain organoid', 'cerebral organoid', 'cortical organoid'],
        'correct_images': ['brain organoid spheroid', 'neural rosettes', '3D brain culture'],
        'incorrect_images': ['brain anatomy diagram', 'neuron illustration', 'heart', 'liver']
    },
    'liver-organoid': {
        'keywords': ['liver organoid', 'hepatic organoid'],
        'correct_images': ['liver organoid', 'hepatocyte spheroid'],
        'incorrect_images': ['liver anatomy', 'brain', 'kidney', 'heart']
    },
    'kidney-organoid': {
        'keywords': ['kidney organoid', 'renal organoid'],
        'correct_images': ['kidney organoid', 'nephron structure'],
        'incorrect_images': ['kidney anatomy', 'brain', 'liver', 'heart']
    },
    'heart-organoid': {
        'keywords': ['heart organoid', 'cardiac organoid', 'cardiomyocyte'],
        'correct_images': ['cardiac organoid', 'beating heart organoid', 'cardiomyocyte spheroid'],
        'incorrect_images': ['heart anatomy diagram', 'brain', 'liver', 'kidney']
    },
    'organ-on-chip': {
        'keywords': ['organ on chip', 'organ-on-chip', 'microfluidic', 'chip'],
        'correct_images': ['microfluidic device', 'chip with channels', 'organ chip platform'],
        'incorrect_images': ['organoid blob', 'generic cells', 'anatomy diagram']
    },
    'digital-twin': {
        'keywords': ['digital twin', 'computational model', 'simulation'],
        'correct_images': ['3D computer model', 'simulation visualization', 'data visualization'],
        'incorrect_images': ['real tissue', 'actual organoid', 'microscopy']
    }
}

def extract_page_info(filepath):
    """Extract page topic and images"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        soup = BeautifulSoup(content, 'html.parser')

        # Get page title
        title = soup.find('title')
        title_text = title.get_text() if title else ''

        # Get all headings
        headings = [h.get_text() for h in soup.find_all(['h1', 'h2', 'h3'])]

        # Get all images
        images = []
        for img in soup.find_all('img'):
            src = img.get('src', '')
            alt = img.get('alt', '')
            # Get surrounding text
            parent_text = img.parent.get_text() if img.parent else ''
            images.append({
                'src': src,
                'alt': alt,
                'context': parent_text[:200]
            })

        # Get background images from inline styles
        bg_images = re.findall(r'background-image:\s*url\(["\']?([^"\']+)["\']?\)', content)
        for bg in bg_images:
            images.append({
                'src': bg,
                'alt': 'background-image',
                'context': 'inline style'
            })

        return {
            'title': title_text,
            'headings': headings,
            'images': images,
            'url_path': str(filepath)
        }

    except Exception as e:
        return {'error': str(e), 'url_path': str(filepath)}

def detect_topic(page_info):
    """Detect what scientific topic the page is about"""
    text = (page_info.get('title', '') + ' ' +
            ' '.join(page_info.get('headings', []))).lower()

    detected = []
    for topic, data in TOPICS.items():
        for keyword in data['keywords']:
            if keyword.lower() in text:
                detected.append(topic)
                break

    return detected

def analyze_image_mismatch(image, page_topics):
    """Check if image might be incorrect for the page topic"""
    issues = []
    src = image.get('src', '').lower()
    alt = image.get('alt', '').lower()

    if not page_topics:
        return []  # Can't determine if no clear topic

    for topic in page_topics:
        topic_data = TOPICS.get(topic, {})
        incorrect = topic_data.get('incorrect_images', [])

        # Check if image name/alt suggests wrong content
        for wrong_term in incorrect:
            if wrong_term.lower() in src or wrong_term.lower() in alt:
                issues.append({
                    'severity': 'HIGH',
                    'reason': f'Image suggests "{wrong_term}" but page is about {topic}',
                    'image': src,
                    'alt': alt
                })

    # Check for generic stock photos
    generic_terms = ['stock', 'shutterstock', 'istock', 'generic', 'placeholder']
    for term in generic_terms:
        if term in src.lower():
            issues.append({
                'severity': 'MEDIUM',
                'reason': f'Generic stock image on scientific page',
                'image': src,
                'alt': alt
            })

    return issues

def audit_site():
    """Main audit function"""
    root = Path('.')
    html_files = list(root.glob('**/*.html'))

    print(f"Auditing {len(html_files)} HTML files for image accuracy...\n")

    all_issues = []
    files_with_issues = 0
    total_issues = 0

    for filepath in html_files:
        page_info = extract_page_info(filepath)

        if 'error' in page_info:
            continue

        topics = detect_topic(page_info)

        if not topics or not page_info.get('images'):
            continue  # Skip pages without clear topics or images

        page_issues = []
        for image in page_info['images']:
            mismatches = analyze_image_mismatch(image, topics)
            if mismatches:
                page_issues.extend(mismatches)

        if page_issues:
            files_with_issues += 1
            total_issues += len(page_issues)
            all_issues.append({
                'file': str(filepath),
                'topics': topics,
                'title': page_info.get('title', ''),
                'issues': page_issues
            })

    return all_issues, files_with_issues, total_issues

def generate_report(issues, files_with_issues, total_issues):
    """Generate detailed report"""
    print("="*80)
    print("IMAGE AUDIT REPORT")
    print("="*80)
    print(f"\nFiles with issues: {files_with_issues}")
    print(f"Total issues found: {total_issues}\n")

    # Save detailed report
    with open('image-audit-report.json', 'w', encoding='utf-8') as f:
        json.dump(issues, f, indent=2)

    print("Detailed report saved to: image-audit-report.json")

    # Print summary of high-priority issues
    high_priority = [issue for page in issues for issue in page['issues'] if issue['severity'] == 'HIGH']

    if high_priority:
        print(f"\n{len(high_priority)} HIGH PRIORITY mismatches found:")
        for i, issue in enumerate(high_priority[:10], 1):
            print(f"\n{i}. {issue['reason']}")
            print(f"   Image: {issue['image']}")

    print("\n" + "="*80)
    print("NEXT STEPS:")
    print("1. Review image-audit-report.json for all issues")
    print("2. Download scientifically accurate images from:")
    print("   - BioRender (licensed scientific illustrations)")
    print("   - PubMed Central (CC-licensed research images)")
    print("   - Unsplash/Pexels (for generic lab equipment)")
    print("3. Run replacement script with correct images")
    print("="*80)

if __name__ == '__main__':
    print("Starting comprehensive image audit...\n")
    issues, files_count, issues_count = audit_site()
    generate_report(issues, files_count, issues_count)
