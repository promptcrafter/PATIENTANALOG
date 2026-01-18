#!/bin/bash
# IndexNow URL Submission Script

KEY="c15a6db34bec470a8d6565042ca5bb0a"
HOST="patientanalog.com"
KEYFILE="https://patientanalog.com/c15a6db34bec470a8d6565042ca5bb0a.txt"

# Submit sitemap (fastest method)
echo "Submitting sitemap to IndexNow..."
curl -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json" \
  -d "{
    \"host\": \"$HOST\",
    \"key\": \"$KEY\",
    \"keyLocation\": \"$KEYFILE\",
    \"urlList\": [
      \"https://patientanalog.com/sitemap.xml\"
    ]
  }"

echo ""
echo "✅ Sitemap submitted to IndexNow!"
echo "This will notify: Bing, Yandex, Naver, Seznam, Yep, Amazon"
