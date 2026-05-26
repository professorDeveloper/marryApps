# Staff API

> **Module:** staff  
> **Base URL:** https://api.maryai.uz/  
> **Last Updated:** 2026-05-23T03:18:48.642Z

---

## Endpoints

## /api/v1/orders/waiter/{waiterId}

### GET /api/v1/orders/waiter/{waiterId} 🔒

**Summary:** Get orders by waiter

**Description:** Get orders filtered by waiter ID with pagination

**Parameters:**

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| lang | query | string | No | Language (uz, ru, en) |
| waiterId | path | string | Yes | Waiter ID |
| limit | query | integer | No | Limit |
| offset | query | integer | No | Offset |

**Responses:**

- **200**: OK
  ```json
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/model.OrderResponse"
  }
}
```

- **400**: Bad Request
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```

- **401**: Unauthorized
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```

- **500**: Internal Server Error
  ```json
{
  "$ref": "#/definitions/model.ErrorResponse"
}
```


