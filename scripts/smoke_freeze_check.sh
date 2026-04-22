#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
TOKEN="${TOKEN:-}"
LANG_CODE="${LANG_CODE:-en}"

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required"
  exit 1
fi

AUTH_ARGS=()
if [ -n "$TOKEN" ]; then
  AUTH_ARGS=(-H "Authorization: Bearer $TOKEN")
fi

call_api() {
  local method="$1"
  local path="$2"
  local body="${3:-}"

  if [ -n "$body" ]; then
    curl -sS -X "$method" "$BASE_URL$path" \
      "${AUTH_ARGS[@]}" \
      -H "Content-Type: application/json" \
      -H "Accept-Language: $LANG_CODE" \
      --data "$body"
    return
  fi

  curl -sS -X "$method" "$BASE_URL$path" \
    "${AUTH_ARGS[@]}" \
    -H "Accept-Language: $LANG_CODE"
}

extract_id() {
  echo "$1" | jq -r '.data.id // .data.transfer.id // .data.inventory.id // .data.invoice.id // empty'
}

run_flow() {
  local name="$1"
  local create_method="$2"
  local create_path="$3"
  local create_body="$4"
  local next_method="${5:-}"
  local next_path_template="${6:-}"
  local next_body="${7:-}"
  local delete_method="${8:-}"
  local delete_path_template="${9:-}"

  echo "== $name =="
  local resp
  resp="$(call_api "$create_method" "$create_path" "$create_body")"
  echo "$resp"

  local id
  id="$(extract_id "$resp")"
  if [ -z "$id" ]; then
    echo "create failed, skipping dependent steps"
    return 0
  fi

  if [ -n "$next_method" ] && [ -n "$next_path_template" ]; then
    call_api "$next_method" "${next_path_template//\{id\}/$id}" "$next_body" || true
  fi

  if [ -n "$delete_method" ] && [ -n "$delete_path_template" ]; then
    call_api "$delete_method" "${delete_path_template//\{id\}/$id}" || true
  fi
}

run_flow "inventory" \
  POST "/api/v1/inventories?lang=$LANG_CODE" \
  '{"date":"2026-04-20","storage_id":"00000000-0000-0000-0000-000000000001","description":"smoke inventory","status":"draft"}' \
  "" "" "" \
  DELETE "/api/v1/inventories/{id}"

run_flow "invoice" \
  POST "/api/v1/invoices?lang=$LANG_CODE" \
  '{"date":"2026-04-20T10:00:00Z","storage_id":"00000000-0000-0000-0000-000000000001","supplier_id":"00000000-0000-0000-0000-000000000011","status":"draft"}' \
  "" "" "" \
  DELETE "/api/v1/invoices/{id}"

run_flow "deduction" \
  POST "/api/v1/deductions?lang=$LANG_CODE" \
  '{"date":"2026-04-20","storage_id":"00000000-0000-0000-0000-000000000001","status":"draft","items":[{"ingredient_id":"00000000-0000-0000-0000-000000000101","quantity":"1"}]}' \
  PUT "/api/v1/deductions/{id}" '{"description":"smoke deduction update"}' \
  DELETE "/api/v1/deductions/{id}"

run_flow "shipment" \
  POST "/api/v1/shipments?lang=$LANG_CODE" \
  '{"date":"2026-04-20T10:00:00Z","storage_id":"00000000-0000-0000-0000-000000000001","status":"draft"}' \
  PUT "/api/v1/shipments/{id}" '{"description":"smoke shipment update"}' \
  DELETE "/api/v1/shipments/{id}"

run_flow "outgoing invoice" \
  POST "/api/v1/outgoing-invoices?lang=$LANG_CODE" \
  '{"date":"2026-04-20T10:00:00Z","storage_id":"00000000-0000-0000-0000-000000000001","description":"smoke outgoing"}' \
  PUT "/api/v1/outgoing-invoices/{id}" '{"description":"smoke outgoing update"}' \
  DELETE "/api/v1/outgoing-invoices/{id}"

run_flow "transfer" \
  POST "/api/v1/transfers?lang=$LANG_CODE" \
  '{"from_branch_id":"00000000-0000-0000-0000-000000000021","to_branch_id":"00000000-0000-0000-0000-000000000022","from_storage_id":"00000000-0000-0000-0000-000000000001","to_storage_id":"00000000-0000-0000-0000-000000000002","status":"draft","description":"smoke transfer"}' \
  PUT "/api/v1/transfers/{id}/items/batch" '{"status":"draft","items":[{"ingredient_id":"00000000-0000-0000-0000-000000000101","quantity":"1"}]}' \
  DELETE "/api/v1/transfers/{id}"

run_flow "order" \
  POST "/api/v1/orders?lang=$LANG_CODE" \
  '{"order_type":"takeaway","guest_count":1,"items":[{"good_id":"00000000-0000-0000-0000-000000000201","quantity":1}]}' \
  PATCH "/api/v1/orders/{id}/status" '{"status":"cancelled"}' \
  DELETE "/api/v1/orders/{id}"

echo "== report =="
call_api GET "/api/v1/ingredient-reports?lang=$LANG_CODE&storage_id=00000000-0000-0000-0000-000000000001&start_date=2026-04-01&end_date=2026-04-30" || true
