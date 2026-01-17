# QUICK FIX GUIDE - Link & Asset Issues
## Priority-Based Repair Instructions

---

## CRITICAL FIXES (Do These First)

### 1. Synapse Game - Missing JavaScript Files ⚠️

**Issue:** Game references two JS files that don't exist
**File:** `games/synapse/index.html`
**Lines 21-23:**
```html
<script src="js/audio-manager.js" defer></script>
<script src="js/aaa-game-engine.js" defer></script>
```

**Options:**
- **Option A:** Remove these script tags if functionality isn't needed
- **Option B:** Restore the missing files from backup
- **Option C:** Create minimal stub files to prevent errors

**Quick Fix (Remove references):**
```html
<!-- Remove or comment out lines 21-23 -->
```

---

### 2. Kenneth Biotech - Wrong Asset Path ⚠️

**Issue:** Image reference uses wrong path
**File:** `games/kenneth-biotech/index.html`
**Current:** `assets/bob-front.jpg`
**Actual location:** `bob-front.jpg` (in same directory)

**Fix:** Search and replace in the file:
```
Find: assets/bob-front.jpg
Replace: bob-front.jpg
```

---

## HIGH PRIORITY FIXES

### 3. Technology Pages - Broken Sibling References

**Issue:** Pages use incomplete relative paths for sibling pages

**Pattern to Find:**
```html
<a href="organ-on-chip-systems">
<a href="organoids-complete-guide">
<a href="digital-twins-healthcare">
<a href="ipsc-technology">
```

**Fix Pattern:**
```html
<a href="../organ-on-chip-systems/">
<a href="../organoids-complete-guide/">
<a href="../digital-twins-healthcare/">
<a href="../ipsc-technology/">
```

**Files to Update:**
- `pages/technology/digital-twins-healthcare/index.html`
- `pages/technology/organ-on-chip-systems/index.html`
- `pages/technology/organoids-complete-guide/index.html`
- `pages/technology/ipsc-technology/index.html`
- `pages/technology/microphysiological-systems/index.html`
- `pages/technology/new-approach-methodologies/index.html`
- `pages/technology/heart-models/index.html`
- `pages/technology/liver-models/index.html`
- `pages/technology/kidney-models/index.html`
- `pages/technology/quantum-drug-discovery/index.html`

**Bulk Fix Script (PowerShell):**
```powershell
$files = Get-ChildItem "pages\technology\*\index.html" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw

    # Fix sibling page references
    $content = $content -replace 'href="organ-on-chip-systems"', 'href="../organ-on-chip-systems/"'
    $content = $content -replace 'href="organoids-complete-guide"', 'href="../organoids-complete-guide/"'
    $content = $content -replace 'href="digital-twins-healthcare"', 'href="../digital-twins-healthcare/"'
    $content = $content -replace 'href="ipsc-technology"', 'href="../ipsc-technology/"'
    $content = $content -replace 'href="microphysiological-systems"', 'href="../microphysiological-systems/"'
    $content = $content -replace 'href="new-approach-methodologies"', 'href="../new-approach-methodologies/"'
    $content = $content -replace 'href="liver-models"', 'href="../liver-models/"'
    $content = $content -replace 'href="heart-models"', 'href="../heart-models/"'

    Set-Content $file.FullName $content -NoNewline
}

Write-Host "Fixed technology page cross-references"
```

---

### 4. Science Pages - Broken Sibling References

**Same pattern as technology pages**

**Files Affected:** All files in `pages/science/*/index.html`

**Example Issues:**
- `pages/science/assembloids/index.html` → Links to `brain-organoids-research/`
- Multiple science pages cross-referencing each other

**Bulk Fix Script (PowerShell):**
```powershell
$files = Get-ChildItem "pages\science\*\index.html" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw

    # Fix common science page cross-references
    $content = $content -replace 'href="brain-organoids-research/"', 'href="../brain-organoids-research/"'
    $content = $content -replace 'href="multi-organ-systems/"', 'href="../multi-organ-systems/"'
    $content = $content -replace 'href="brain-organoids-research"', 'href="../brain-organoids-research/"'
    $content = $content -replace 'href="organ-on-chip-systems"', 'href="../../technology/organ-on-chip-systems/"'

    Set-Content $file.FullName $content -NoNewline
}

Write-Host "Fixed science page cross-references"
```

---

### 5. Fix Wrong Directory References

**Issue:** Technology pages linking to companies in wrong location

**Files:**
- `pages/technology/digital-twins-healthcare/index.html`
- `pages/technology/liver-models/index.html`

**Find:**
```html
href="../companies/insilico-medicine"
href="../companies/emulate"
href="../companies/"
```

**Replace:**
```html
href="../../companies/insilico-medicine/"
href="../../companies/emulate/"
href="../../companies/"
```

---

### 6. Fix Regulatory Cross-Reference

**File:** `pages/technology/new-approach-methodologies/index.html`

**Find:**
```html
href="../regulatory/fda-modernization-act"
```

**Replace:**
```html
href="../../regulatory/fda-modernization-act/"
```

---

## MEDIUM PRIORITY FIXES

### 7. Update Sitemap - Remove Missing Languages

**File:** `sitemap-pages.xml`

**Remove these lines:**
```xml
<url><loc>https://patientanalog.com/fil/</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
<url><loc>https://patientanalog.com/ky/</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
<url><loc>https://patientanalog.com/mt/</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
```

**Or create placeholder directories:**
```bash
mkdir fil ky mt
echo "<!DOCTYPE html><html><head><title>Coming Soon</title></head><body><h1>Coming Soon</h1></body></html>" > fil/index.html
echo "<!DOCTYPE html><html><head><title>Coming Soon</title></head><body><h1>Coming Soon</h1></body></html>" > ky/index.html
echo "<!DOCTYPE html><html><head><title>Coming Soon</title></head><body><h1>Coming Soon</h1></body></html>" > mt/index.html
```

---

### 8. Fix Resources Page

**File:** `pages/resources/index.html`

**Option A - Create missing glossary:**
```bash
mkdir pages/resources/glossary
# Copy glossary content or create index.html
```

**Option B - Update link to point to existing glossary:**
**Find:**
```html
href="glossary"
```

**Replace:**
```html
href="/glossary"
```

---

## LOW PRIORITY FIXES

### 9. Science Pages .html Extensions

**Files:**
- `pages/science/liver-toxicity-testing/index.html` → Links to `quality-control-mps.html`
- `pages/science/tumor-organoids-cancer/index.html` → Links to `ovarian-organoids.html`

**Verify these files exist:**
```bash
# Check if they're actual HTML files or should be directory links
ls pages/science/liver-toxicity-testing/quality-control-mps.html
ls pages/science/tumor-organoids-cancer/ovarian-organoids.html
```

**If they're directories, update links:**
```html
<!-- Change from -->
href="quality-control-mps.html"
<!-- To -->
href="../quality-control-mps/"
```

---

## AUTOMATED FIX SCRIPT (Complete)

**File:** `fix-all-links.ps1`

```powershell
# Fix All Broken Links Script
Write-Host "Starting link repair..." -ForegroundColor Green

# 1. Fix Kenneth Biotech asset path
Write-Host "`n1. Fixing Kenneth Biotech asset path..." -ForegroundColor Yellow
$kbFile = "games\kenneth-biotech\index.html"
if (Test-Path $kbFile) {
    $content = Get-Content $kbFile -Raw
    $content = $content -replace 'assets/bob-front\.jpg', 'bob-front.jpg'
    Set-Content $kbFile $content -NoNewline
    Write-Host "   ✓ Fixed" -ForegroundColor Green
}

# 2. Fix Synapse game (remove broken script references)
Write-Host "`n2. Fixing Synapse game..." -ForegroundColor Yellow
$synapseFile = "games\synapse\index.html"
if (Test-Path $synapseFile) {
    $content = Get-Content $synapseFile -Raw
    $content = $content -replace '<script src="js/audio-manager\.js" defer></script>', '<!-- Audio manager removed - file not found -->'
    $content = $content -replace '<script src="js/aaa-game-engine\.js" defer></script>', '<!-- Game engine removed - file not found -->'
    Set-Content $synapseFile $content -NoNewline
    Write-Host "   ✓ Fixed" -ForegroundColor Green
}

# 3. Fix technology pages
Write-Host "`n3. Fixing technology pages..." -ForegroundColor Yellow
$techFiles = Get-ChildItem "pages\technology\*\index.html" -Recurse

foreach ($file in $techFiles) {
    $content = Get-Content $file.FullName -Raw
    $modified = $false

    # Fix sibling references
    if ($content -match 'href="organ-on-chip-systems"[^/]') {
        $content = $content -replace 'href="organ-on-chip-systems"', 'href="../organ-on-chip-systems/"'
        $modified = $true
    }
    if ($content -match 'href="organoids-complete-guide"[^/]') {
        $content = $content -replace 'href="organoids-complete-guide"', 'href="../organoids-complete-guide/"'
        $modified = $true
    }
    if ($content -match 'href="digital-twins-healthcare"[^/]') {
        $content = $content -replace 'href="digital-twins-healthcare"', 'href="../digital-twins-healthcare/"'
        $modified = $true
    }
    if ($content -match 'href="ipsc-technology"[^/]') {
        $content = $content -replace 'href="ipsc-technology"', 'href="../ipsc-technology/"'
        $modified = $true
    }
    if ($content -match 'href="microphysiological-systems"[^/]') {
        $content = $content -replace 'href="microphysiological-systems"', 'href="../microphysiological-systems/"'
        $modified = $true
    }
    if ($content -match 'href="new-approach-methodologies"[^/]') {
        $content = $content -replace 'href="new-approach-methodologies"', 'href="../new-approach-methodologies/"'
        $modified = $true
    }
    if ($content -match 'href="liver-models"[^/]') {
        $content = $content -replace 'href="liver-models"', 'href="../liver-models/"'
        $modified = $true
    }
    if ($content -match 'href="heart-models"[^/]') {
        $content = $content -replace 'href="heart-models"', 'href="../heart-models/"'
        $modified = $true
    }

    # Fix companies references
    $content = $content -replace 'href="\.\./companies/([^"]+)"', 'href="../../companies/$1/"'

    # Fix regulatory references
    $content = $content -replace 'href="\.\./regulatory/([^"]+)"', 'href="../../regulatory/$1/"'

    if ($modified) {
        Set-Content $file.FullName $content -NoNewline
        Write-Host "   ✓ Fixed: $($file.Name)" -ForegroundColor Green
    }
}

# 4. Fix science pages
Write-Host "`n4. Fixing science pages..." -ForegroundColor Yellow
$scienceFiles = Get-ChildItem "pages\science\*\index.html" -Recurse

foreach ($file in $scienceFiles) {
    $content = Get-Content $file.FullName -Raw
    $modified = $false

    # Fix sibling references
    if ($content -match 'href="brain-organoids-research["/]"[^/]') {
        $content = $content -replace 'href="brain-organoids-research/"', 'href="../brain-organoids-research/"'
        $content = $content -replace 'href="brain-organoids-research"', 'href="../brain-organoids-research/"'
        $modified = $true
    }
    if ($content -match 'href="multi-organ-systems["/]"[^/]') {
        $content = $content -replace 'href="multi-organ-systems/"', 'href="../multi-organ-systems/"'
        $content = $content -replace 'href="multi-organ-systems"', 'href="../multi-organ-systems/"'
        $modified = $true
    }

    if ($modified) {
        Set-Content $file.FullName $content -NoNewline
        Write-Host "   ✓ Fixed: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`n✓ All fixes complete!" -ForegroundColor Green
Write-Host "`nRemaining manual tasks:" -ForegroundColor Yellow
Write-Host "  - Update sitemap-pages.xml (remove fil, ky, mt)" -ForegroundColor White
Write-Host "  - Review resources/glossary link" -ForegroundColor White
```

---

## VERIFICATION STEPS

After applying fixes, run:

```bash
# Re-run the audit script
python audit_links.py

# Should show significantly fewer errors
```

---

## ESTIMATED TIME

- Critical fixes: 15 minutes
- High priority: 30 minutes
- Medium priority: 15 minutes
- Low priority: 10 minutes
- **Total: ~70 minutes**

---

*End of Quick Fix Guide*
