#!/usr/bin/env python3
"""
Add inline images to all science pages systematically
Uses existing organoid and organ-chip images from /assets/images/
"""

import os
import re

# Image mapping: page_keyword → (image_path, alt_text, caption)
IMAGE_MAP = {
    # Brain/Neural organoids
    'brain': ('/assets/images/organoids/organoid1.png',
              'Brain organoid 3D culture microscopy',
              '3D cerebral organoid structure for neurological disease modeling and drug testing'),

    # Kidney organoids
    'kidney': ('/assets/images/organoids/organoid2.png',
               'Kidney organoid nephron structure',
               'Renal organoid with nephron-like structures for kidney disease modeling and nephrotoxicity testing'),

    # Heart/Cardiac organoids
    'cardiac': ('/assets/images/organoids/organoid2.png',
                'Cardiac organoid tissue structure',
                'Cardiac organoid for heart disease modeling and cardiotoxicity screening'),

    # Lung organoids
    'lung': ('/assets/images/organoids/organoid2.png',
             'Lung organoid alveolar structure',
             'Pulmonary organoid for respiratory disease modeling and drug testing'),

    # Pancreatic organoids
    'pancreatic': ('/assets/images/organoids/organoid2.png',
                   'Pancreatic organoid islet structure',
                   'Pancreatic organoid with islet-like structures for diabetes research and beta cell studies'),

    # Colon/Gut organoids
    'colon': ('/assets/images/organoids/organoid2.png',
              'Colon organoid intestinal structure',
              'Intestinal organoid for gut disease modeling and drug absorption studies'),

    'gut': ('/assets/images/organoids/organoid2.png',
            'Gut organoid intestinal epithelium',
            'Intestinal organoid with crypt-villus architecture for microbiome and disease studies'),

    # Tumor/Cancer organoids
    'tumor': ('/assets/images/organoids/organoid2.png',
              'Tumor organoid cancer model',
              'Patient-derived tumor organoid for cancer research and personalized drug screening'),

    # Bladder organoids
    'bladder': ('/assets/images/organoids/organoid2.png',
                'Bladder organoid urothelial structure',
                'Bladder organoid for urological disease modeling'),

    # Bone marrow organoids
    'bone': ('/assets/images/organoids/organoid2.png',
             'Bone marrow organoid hematopoietic structure',
             'Bone marrow organoid for blood disease modeling and hematopoiesis studies'),

    # Ovarian organoids
    'ovarian': ('/assets/images/organoids/organoid2.png',
                'Ovarian organoid follicular structure',
                'Ovarian organoid for reproductive research and cancer modeling'),

    # Prostate organoids
    'prostate': ('/assets/images/organoids/organoid2.png',
                 'Prostate organoid glandular structure',
                 'Prostate organoid for cancer research and drug screening'),

    # Retinal organoids
    'retinal': ('/assets/images/organoids/organoid2.png',
                'Retinal organoid layered structure',
                'Retinal organoid with photoreceptor layers for eye disease modeling'),

    # Thyroid organoids
    'thyroid': ('/assets/images/organoids/organoid2.png',
                'Thyroid organoid follicular structure',
                'Thyroid organoid for endocrine research and disease modeling'),

    # Organ-on-chip specific pages
    'chip': ('/assets/images/organ-chip-angle.png',
             'Organ-on-chip microfluidic device',
             'Microfluidic organ-on-chip system with integrated sensors and perfusion channels'),

    'manufacturing': ('/assets/images/organ-chip-closeup.png',
                      'Organ-chip manufacturing and fabrication',
                      'Precision-engineered organ-on-chip device showing microfluidic channel architecture'),

    # Multi-organ systems
    'multi': ('/assets/images/multi-organ-chips.png',
              'Multi-organ-on-chip connected system',
              'Interconnected multi-organ chip platform for systemic drug testing and metabolism studies'),

    # Blood-brain barrier
    'blood-brain': ('/assets/images/organ-chip-topview.png',
                    'Blood-brain barrier organ-chip model',
                    'Organ-chip model of the blood-brain barrier for CNS drug delivery studies'),

    # Skin-on-chip
    'skin': ('/assets/images/organ-chip-angle.png',
             'Skin-on-chip model',
             'Microfluidic skin model for cosmetics testing and dermatological research'),

    # Placenta-on-chip
    'placenta': ('/assets/images/organ-chip-angle.png',
                 'Placenta-on-chip maternal-fetal interface',
                 'Organ-chip model of the placental barrier for pregnancy drug safety testing'),
}

# Science pages directory
SCIENCE_DIR = 'pages/science'

def add_image_to_page(filepath, page_name):
    """Add inline image to a science page"""

    # Determine which image to use based on page name
    image_path, alt_text, caption = None, None, None

    for keyword, (img, alt, cap) in IMAGE_MAP.items():
        if keyword in page_name.lower():
            image_path, alt_text, caption = img, alt, cap
            break

    # Default to organoid2 if no match
    if not image_path:
        image_path = '/assets/images/organoids/organoid2.png'
        alt_text = 'Organoid 3D tissue culture model'
        caption = '3D organoid structure for disease modeling and drug testing'

    # Read file
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        print(f"ERROR: Could not read {filepath}")
        return False

    # Check if image already exists
    if 'Inline Organoid Image' in content or 'Inline Organ-Chip Image' in content:
        print(f"SKIP:  {page_name} - already has image")
        return False

    # Find insertion point - try multiple patterns
    # Pattern 1: After info-box, before next h2
    pattern1 = r'(</div>\s*\n\s*<h2>)'
    match = re.search(pattern1, content)

    if not match:
        # Pattern 2: After stats-grid closing divs
        pattern2 = r'(</div>\s*</div>\s*</div>\s*\n\s*<!-- )'
        match = re.search(pattern2, content)

    if not match:
        # Pattern 3: After content-section
        pattern3 = r'(</div>\s*\n\s*<div class="content-section">)'
        match = re.search(pattern3, content)

    if not match:
        # Pattern 4: After programs-grid
        pattern4 = r'(</div>\s*</div>\s*\n\s*<div><h2>)'
        match = re.search(pattern4, content)

    if not match:
        # Pattern 5: After info-box, before programs-grid
        pattern5 = r'(</div>\s*\n\s*<div class="programs-grid">)'
        match = re.search(pattern5, content)

    if not match:
        print(f"WARN:  {page_name} - could not find insertion point")
        return False

    # Create image block
    image_block = f'''
<!-- Inline Organoid/Organ-Chip Image -->
<div style="width: 100%; max-width: 1000px; margin: 60px auto; padding: 0 20px;">
  <img src="{image_path}"
       alt="{alt_text}"
       loading="lazy"
       style="width: 100%; height: auto; max-height: 500px; object-fit: contain; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,255,255,0.2);">
  <p style="text-align: center; color: rgba(255,255,255,0.7); font-size: 0.9rem; margin-top: 12px; font-style: italic;">{caption}</p>
</div>

<!-- '''

    # Insert image
    new_content = content[:match.start(1)] + image_block + content[match.start(1):]

    # Write back
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"OK: {page_name} - image added")
        return True
    except:
        print(f"ERROR: {page_name} - could not write file")
        return False

def main():
    """Process all science pages"""

    if not os.path.exists(SCIENCE_DIR):
        print(f"ERROR: Science directory not found: {SCIENCE_DIR}")
        return

    # Get all subdirectories in /pages/science/
    subdirs = [d for d in os.listdir(SCIENCE_DIR)
               if os.path.isdir(os.path.join(SCIENCE_DIR, d))]

    print(f"\nADDING IMAGES TO {len(subdirs)} SCIENCE PAGES")
    print("=" * 60)

    added = 0
    skipped = 0
    failed = 0

    for subdir in sorted(subdirs):
        index_path = os.path.join(SCIENCE_DIR, subdir, 'index.html')

        if not os.path.exists(index_path):
            continue

        result = add_image_to_page(index_path, subdir)

        if result:
            added += 1
        elif result is False:
            skipped += 1
        else:
            failed += 1

    print("\n" + "=" * 60)
    print("SUMMARY:")
    print(f"   + Images added: {added}")
    print(f"   - Skipped (already has image): {skipped}")
    print(f"   X Failed: {failed}")
    print(f"   = Total pages: {len(subdirs)}")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    main()
