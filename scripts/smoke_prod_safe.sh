#!/bin/bash
set -euo pipefail

# Configuration
BASE_URL=${API_URL:-"http://localhost:8080/api/v1"}
TOKEN=${AUTH_TOKEN:-"your_token_here"}
HEADER="Authorization: Bearer $TOKEN"

echo "🚀 Starting PROD-SAFE smoke tests..."

# 1. INVOICE FLOW
echo "Testing Invoice flow..."
INV_RESP=$(curl -s -X POST "$BASE_URL/invoices" -H "$HEADER" -H "Content-Type: application/json" -d '{
    "supplier_id": "00000000-0000-0000-0000-000000000000",
    "total_amount": "100.00",
    "status": "pending"
}')
INV_ID=$(echo "$INV_RESP" | jq -r '.data.id // empty')

if [ -z "$INV_ID" ]; then
    echo "❌ Invoice creation failed, skipping details"
else
    echo "✅ Invoice created: $INV_ID"
    # Clean up
    curl -s -X DELETE "$BASE_URL/invoices/$INV_ID" -H "$HEADER" > /dev/null
fi

# 2. DEDUCTION FLOW
echo "Testing Deduction flow..."
DED_RESP=$(curl -s -X POST "$BASE_URL/deductions" -H "$HEADER" -H "Content-Type: application/json" -d '{
    "storage_id": "00000000-0000-0000-0000-000000000000",
    "date": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "items": [],
    "status": "draft"
}')
DED_ID=$(echo "$DED_RESP" | jq -r '.data.id // empty')

if [ -z "$DED_ID" ]; then
    echo "❌ Deduction creation failed"
else
    echo "✅ Deduction created: $DED_ID"
    curl -s -X DELETE "$BASE_URL/deductions/$DED_ID" -H "$HEADER" > /dev/null
fi

# 3. SHIPMENT FLOW
echo "Testing Shipment flow..."
SHP_RESP=$(curl -s -X POST "$BASE_URL/shipments" -H "$HEADER" -H "Content-Type: application/json" -d '{
    "status": "draft"
}')
SHP_ID=$(echo "$SHP_RESP" | jq -r '.data.id // empty')

if [ -z "$SHP_ID" ]; then
    echo "❌ Shipment creation failed"
else
    echo "✅ Shipment created: $SHP_ID"
    curl -s -X DELETE "$BASE_URL/shipments/$SHP_ID" -H "$HEADER" > /dev/null
fi

# 4. TRANSFER FLOW (Cross-branch fix check)
echo "Testing Transfer flow..."
TRN_RESP=$(curl -s -X POST "$BASE_URL/transfers" -H "$HEADER" -H "Content-Type: application/json" -d '{
    "from_branch_id": "00000000-0000-0000-0000-000000000001",
    "to_branch_id": "00000000-0000-0000-0000-000000000002",
    "from_storage_id": "00000000-0000-0000-0000-000000000001",
    "to_storage_id": "00000000-0000-0000-0000-000000000002",
    "status": "draft"
}')
TRN_ID=$(echo "$TRN_RESP" | jq -r '.data.id // empty')

if [ -z "$TRN_ID" ]; then
    echo "❌ Transfer creation failed"
else
    echo "✅ Transfer created: $TRN_ID"
    curl -s -X DELETE "$BASE_URL/transfers/$TRN_ID" -H "$HEADER" > /dev/null
fi

echo "🏁 Smoke tests completed."