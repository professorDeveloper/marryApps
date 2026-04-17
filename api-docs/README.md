# MaryAI API Documentation

> **Version:** 1.0  
> **Base URL:** https://api.maryai.uz/  
> **Description:** MaryAI API server with multi-language support (uz, ru, en)  
> **Last Updated:** 2026-04-17T08:55:38.960Z

---

## 📚 API Modules

This documentation is organized by functional modules for easier navigation:

### [ADMIN](./admin.md) - 👑 Administrative functions and brand management
*4 endpoints*

### [AUTH](./auth.md) - 🔐 Authentication & authorization endpoints
*5 endpoints*

### [BILLING](./billing.md) - 💳 Bills, payments, and financial operations
*2 endpoints*

### [BRANCHES](./branches.md) - 🏪 Branch management and operations
*6 endpoints*

### [CAFE](./cafe.md) - ☕ Cafe table management and reservations
*13 endpoints*

### [CORE](./core.md) - ⚙️ Core system endpoints
*145 endpoints*

### [CASH](./cash.md) - 💰 Cash register and shift management
*8 endpoints*

### [MENU](./menu.md) - 📋 Menu items, categories, and modifiers
*18 endpoints*

### [WAREHOUSE](./warehouse.md) - 📦 Inventory, stock, and warehouse management
*54 endpoints*

### [STAFF](./staff.md) - 👥 Staff management and operations
*4 endpoints*

### [REPORTS](./reports.md) - 📊 Reporting and analytics
*2 endpoints*

### [I18N](./i18n.md) - 🌍 Internationalization and translations
*3 endpoints*

### [USERS](./users.md) - 👤 User management and profiles
*6 endpoints*

---

## 🔐 Authentication

Most endpoints require Bearer token authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-token>
```

---

## 📊 Quick Stats

- **Total Modules**: 13
- **Total Endpoints**: 270

---

## 🚀 How to Update

Run the update script to refresh all documentation:

```bash
./update-api-docs.sh
```

---

## 📋 Data Models

Common data models are shared across modules. Refer to individual module documentation for specific model usage.

---

*This documentation is automatically generated from the Swagger/OpenAPI specification*  
*Last updated: 2026-04-17T08:55:38.960Z*
