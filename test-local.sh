#!/usr/bin/env bash
# FlexRouter AI — Local Test Script
# Run: bash test-local.sh

API="http://localhost:3001/api"
KEY="dev-secret-key-change-in-production"

echo "========================================="
echo "  FlexRouter AI — Local Tests"
echo "========================================="
echo ""

# Check if server is running
echo "📡 Checking server..."
HEALTH=$(curl -s --max-time 5 "$API/health")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  echo "✅ Server is running"
else
  echo "❌ Server is NOT running. Run: cd apps/api && node dist/main.js"
  exit 1
fi
echo ""

# 1. Available Employees
echo "👥 GET /employees/available"
echo "-----------------------------------------"
EMPLOYEES=$(curl -s -H "x-api-key: $KEY" "$API/employees/available")
TOTAL=$(echo "$EMPLOYEES" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('total',0))" 2>/dev/null)
echo "Total available: $TOTAL"
echo "$EMPLOYEES" | python3 -m json.tool 2>/dev/null | head -30
echo ""

# 2. KPI
echo "📊 GET /kpi"
echo "-----------------------------------------"
KPI=$(curl -s -H "x-api-key: $KEY" "$API/kpi")
echo "$KPI" | python3 -m json.tool 2>/dev/null | head -20
echo ""

# 3. Routing — Price Negotiation
echo "🤖 POST /routing/route — Price Negotiation"
echo "-----------------------------------------"
RESULT=$(curl -s -X POST "$API/routing/route" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $KEY" \
  -d '{
    "messageText": "Добрый день, нужен расчёт на этикетку 58х40мм, тираж 50000 шт, полипропилен белый, печать 4+0",
    "channel": "email",
    "clientEmail": "client@example.com"
  }')
echo "$RESULT" | python3 -m json.tool 2>/dev/null
echo ""

# 4. Routing — Technical Question
echo "🤖 POST /routing/route — Technical Question"
echo "-----------------------------------------"
RESULT=$(curl -s -X POST "$API/routing/route" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $KEY" \
  -d '{
    "messageText": "Здравствуйте! Этикетка отклеивается в холодильнике при +4°C. Можете предложить решение?",
    "channel": "email",
    "clientEmail": "tech@example.com"
  }')
echo "$RESULT" | python3 -m json.tool 2>/dev/null
echo ""

# 5. Routing — Delivery Status
echo "🤖 POST /routing/route — Delivery Status"
echo "-----------------------------------------"
RESULT=$(curl -s -X POST "$API/routing/route" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $KEY" \
  -d '{
    "messageText": "Когда будет готов заказ? Когда привезут нашу партию?",
    "channel": "email",
    "clientEmail": "delivery@example.com"
  }')
echo "$RESULT" | python3 -m json.tool 2>/dev/null
echo ""

# 6. Analytics — Managers
echo "📈 GET /analytics/managers"
echo "-----------------------------------------"
curl -s -H "x-api-key: $KEY" "$API/analytics/managers" | python3 -m json.tool 2>/dev/null | head -20
echo ""

# 7. Analytics — Funnel
echo "📈 GET /analytics/funnel"
echo "-----------------------------------------"
curl -s -H "x-api-key: $KEY" "$API/analytics/funnel" | python3 -m json.tool 2>/dev/null | head -15
echo ""

# 8. Mailing Candidates
echo "📧 GET /mailing/candidates"
echo "-----------------------------------------"
curl -s -H "x-api-key: $KEY" "$API/mailing/candidates?inactiveDays=30&limit=10" | python3 -m json.tool 2>/dev/null | head -15
echo ""

echo "========================================="
echo "  Tests Complete"
echo "========================================="
