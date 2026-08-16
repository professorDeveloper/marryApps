# POS API flow — backend uchun

Barcha endpointlar `Bearer` token bilan. Response format: `{ "data": ... }`.

---

## Time-based (soatlik) stol

### 1. Zakaz ochish
```
POST /orders                              { table_id, guest_count, items: [], status: "open", order_type: "dine_in" }
POST /orders/{id}/table-timer/start       timer boshlash
```

### 2. Taom qo'shish
```
GET  /orders/table/{tableId}              → orderId
POST /orders/{orderId}/items              { items: [{good_id, quantity}] }
```

### 3. Timer sync (har 60s, ekran ochiq)
```
GET /orders/{id}/table-timer              → { state, total_active_sec, price_per_hour }
GET /bills/{id}                           → pause_periods
```

### 4. Pause / Resume
```
POST /orders/{id}/table-timer/pause
POST /orders/{id}/table-timer/resume
```

### 5. Item o'chirish
```
POST /order-items/{itemId}/cancel         status=cancelled ga o'tadi, o'chirilmaydi
```

### 6. To'lov
```
GET  /bills/{tableId}                     → detail (hour_price, goods, grand_total)
POST /orders/{id}/pay                     { customer_paid_amount, payment_type, discount_amount? }
```
Agar jami = 0 bo'lsa:
```
POST /orders/{id}/cancel
```

---

## Oddiy stol

### 1. Zakaz ochish (taomlar bilan birga)
```
POST /orders                              { table_id, guest_count, items: [{good_id, quantity}], status: "open", order_type: "dine_in" }
```

### 2. Band stolga taom qo'shish
```
GET  /orders/table/{tableId}              → orderId
POST /orders/{orderId}/items              { items: [...] }
```

### 3. Item o'chirish
```
POST /order-items/{itemId}/cancel
```

### 4. Detail ko'rish
```
GET /bills/{tableId}                      → goods, food_sum, service_amount, grand_total
```

### 5. To'lov
```
POST /orders/{id}/pay                     { customer_paid_amount, payment_type, discount_amount? }
```

---

## Muhim qoidalar

- **Discount**: `discount_amount` yoki `discount_percent` — faqat bittasi.
- **Cancelled item** summaga kirmaydi, lekin tarixda qoladi.
- **Time-based hisob**: `hour_price = price_per_hour × ((now − started_at − sum(pauses)) / 3600)`
- **Order statuslar**: `open, cooking, ready, served, paid, cancelled, reserved`
- **Item statuslar**: `pending, cooking, ready, served, cancelled`
- **Timer statuslar**: `running, paused, stopped, none`
