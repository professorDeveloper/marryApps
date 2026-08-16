🧱 GLOBAL RULES (Apply Everywhere)
🔎 Search
Use search bars where defined
Text search should match relevant fields (name, description, etc.)
🔽 Filters
Use consistent filter UI
Use period filter (start_date, end_date) where required
📊 Sorting
Sorting must be enabled only for specified fields
🔁 GLOBAL FEATURE (VERY IMPORTANT)
Ingredient Filter (NEW)

Must be added to:

Invoice
Transfers
Inventory
Dispatches
Expense Invoices
Separation Acts

✅ Works even if ingredient is NOT shown in table
✅ Filters related records by ingredient

📦 CORE PAGES
1. Department
🔎 Search: name
🔽 Filter: storage
📊 Sorting: none
2. Categories
🔎 Search: name
🔽 Filters: storage, department
📊 Sorting: created date
3. Ingredient Group
🔎 Search: group name
4. Ingredients
🔎 Search: name
🔽 Filters: ingredient group, measurement
📊 Sorting: price
5. Semi-Finished (Compound)
🔎 Search: name
🔽 Filter: measurement group
📊 Sorting: price, quantity
6. Meals
🔎 Search: name
🔽 Filters: category, price, cooking time
📊 Sorting: cost price
7. Storage
🔎 Search: name
📊 STOCK & INVENTORY
8. Ingredient Stock
🔎 Search: ingredient name
🔽 Filters: storage, measurement
📊 Sorting: quantity, price per unit, created date
❗ Shows ONLY current stock (NO period filter)
9. Inventory
🔎 Search: description
🔽 Filters: storage, status, period
🔽 + Ingredient filter
📊 Sorting:
remaining
shortage
surplus
date
📄 DOCUMENTS / OPERATIONS
10. Invoice
🔽 Filters:
supplier (rename from "name" → "supplier")
storage
status
period
ingredient
📊 Sorting:
date
total amount
❗ Ensure period filter works correctly
11. Transfers
🔽 Filters:
branch / from / to
warehouse (from → to)
group
status
period
ingredient
📊 Sorting:
balance
date
12. Dispatches
🔽 Filters:
warehouse
supplier (rename "name" → supplier if needed)
status
period
ingredient
📊 Sorting:
total amount
paid amount
date
13. Expense Invoices
🔽 Filters:
warehouse
group
status
period
ingredient
📊 Sorting:
total amount
date
14. Separation Acts
🔽 Filters:
source ingredient
warehouse
group
status
period
ingredient
📊 Sorting:
total amount
date
15. Deductions
🔽 Filters:
warehouse
group
status
period
📊 Sorting:
balance
date
👥 SUPPLIERS & PEOPLE
16. Suppliers
🔎 Search: name, phone
17. Employees
🔎 Search:
full name
username
phone
🔽 Filters:
role
status
🛠️ Fix:
rename phone column properly
🍽️ OPERATIONS
18. Order Management
🔽 Filters:
status
table
hall
type (dine-in / takeout)
schedule date
period
📊 Sorting:
schedule date
📈 REPORTS
19. Bill Reports
🔽 Filters:
waiter
hall
table
guest
payment type
status
period
📊 Sorting:
open time
close time
guests
food cost
total
service
discount
cost
20. Ingredient Reports
🔽 Filters:
ingredient
unit
period
📊 Sorting:
cost
start qty
in
out
surplus / shortage
qty cost
end cost
21. Goods Reports
🔽 Filters:
goods
period
📊 Sorting:
total qty
avg sell price
total sell
avg cost
total cost
avg markup
total markup
22. Cashworks Report
🔽 Filters:
period
cashier
💰 FINANCE
23. Transactions
🔽 Filters:
type
cashier
group
full name
pay type
customer
period
📊 Sorting:
total
customer paid
change
date
24. Transaction Groups
🔎 Search: name
📊 Sorting: created date
25. Cashiers
🔎 Search: name
📊 Sorting: created date
🏢 SYSTEM / STRUCTURE
26. Devices
🔎 Search: IP address
🔽 Filters:
type
connection type
category
27. Halls
🔎 Search: name
28. Management
❗ Not defined yet
29. Store
❗ No filters / features needed
⚠️ IMPORTANT FIXES (DON’T MISS)
Rename:
Invoice → “name” ➜ supplier
Dispatches → “name” ➜ supplier (if same meaning)
Employees → fix phone column naming
Ensure:
Period filters work correctly everywhere
Ingredient filter works relationally
Search works correctly (not just UI)