import os
import glob

# Get all HTML files in inquiry folder
inquiry_folder = r"C:\Users\josep\Desktop\HYBRID FINAL926pm\HYBRID FINAL926pm\inquiry"
html_files = glob.glob(os.path.join(inquiry_folder, "*.html"))

updated_count = 0
errors = []

for file_path in html_files:
    try:
        # Read file
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if file contains the pattern
        if 'href="/portfolio.html"' in content:
            # Replace the pattern
            new_content = content.replace('href="/portfolio.html"', 'href="/portfolio"')

            # Write back
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)

            updated_count += 1
            print(f"Updated: {os.path.basename(file_path)}")
    except Exception as e:
        errors.append(f"{os.path.basename(file_path)}: {str(e)}")

print(f"\n{'='*60}")
print(f"Total files updated: {updated_count}")
if errors:
    print(f"\nErrors encountered:")
    for error in errors:
        print(f"  - {error}")
else:
    print("No errors encountered!")
