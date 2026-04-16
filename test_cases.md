Test Cases for Inventory
1) Inventory compares against stock at the inventory time, not current stock

Setup

Monday 10:00: invoice adds 30 eggs
Thursday 10:00: invoice adds 50 eggs
Wednesday 12:00: inventory is entered
Counted quantity = 30 eggs

Expected

Inventory should compare against stock as of Wednesday 12:00
Expected system quantity = 30
Difference = 0
No shortage, no surplus
2) Inventory must ignore future transactions

Setup

Monday 10:00: invoice adds 30 eggs
Thursday 10:00: invoice adds 50 eggs
Wednesday 12:00: inventory is entered
Counted quantity = 20 eggs

Expected

Expected system quantity = 30
Shortage = 10
Thursday invoice must not affect the Wednesday inventory comparison
3) Inventory should create a correction movement, not rewrite invoice history

Setup

Monday 10:00: invoice adds 30 eggs
Wednesday 12:00: inventory count = 20 eggs

Expected

A shortage adjustment movement is created for 10 eggs
Monday invoice remains unchanged
No past movement is edited or deleted
4) Active inventory should update live stock to the counted quantity

Setup

Current live stock before inventory = 30 eggs
Wednesday inventory count = 20 eggs
Inventory is activated

Expected

ingredient_stock.quantity becomes 20
A shortage movement is stored for 10 eggs
Live stock reflects the corrected balance
5) Draft inventory must not permanently change live stock

Setup

Current live stock = 30 eggs
Inventory item is saved as draft with counted quantity = 20 eggs

Expected

Live stock remains 30
Draft state stores the entered count
No stock correction movement is applied until activation
6) Inventory system quantity must be reconstructed from timeline

Setup

Friday 09:00: invoice adds 15 eggs
Monday 10:00: invoice adds 30 eggs
Wednesday 12:00: inventory is entered
Counted quantity = 40 eggs

Expected

System quantity at Wednesday is 45
Difference = -5
Shortage movement = 5 eggs
Test Cases for Ingredient Reports
7) Report should include only movements inside the selected period, plus correct beginning quantity

Setup

Friday 09:00: invoice adds 15 eggs
Monday 10:00: invoice adds 30 eggs
Thursday 10:00: invoice adds 50 eggs
Report period: Saturday 00:00 to Wednesday 23:59

Expected

Beginning quantity = 15
In = 30
Out = 0
Ending quantity = 45
Thursday 50 eggs must not appear in this report
8) Report must use business date (effective_at), not entry date (created_at)

Setup

Monday stock document exists, but it is entered on Thursday
effective_at = Monday
created_at = Thursday
Report period includes Monday to Wednesday

Expected

Movement appears in Monday–Wednesday report
If the report uses only created_at, the test should fail
Report must show the movement on Monday based on effective_at
9) Report must not miss a Monday invoice when filtered for the correct period

Setup

Monday 08:00: invoice adds 30 eggs
Report period: Monday 00:00 to Monday 23:59

Expected

Beginning quantity = 0
In = 30
Out = 0
Ending quantity = 30
Monday invoice must appear in the result
10) Report must include inventory surplus and shortage

Setup

Monday 10:00: invoice adds 30 eggs
Wednesday 12:00: inventory count = 20 eggs
Inventory is activated and creates shortage movement of 10 eggs

Expected

Report should show shortage in the shortage column
The inventory correction must not be invisible
Ending quantity should reflect the correction
11) Report must treat inventory surplus as incoming correction

Setup

Monday 10:00: invoice adds 30 eggs
Wednesday 12:00: inventory count = 35 eggs
Inventory is activated and creates surplus movement of 5 eggs

Expected

Report should show surplus = 5
Ending quantity should be 35
Surplus must be included in totals
12) Report boundary should not double-count movements on the exact end boundary

Setup

Movement happens exactly at report end timestamp
Report period: start = 2026-04-01 00:00:00, end = 2026-04-07 23:59:59

Expected

Movement must appear once only
It must not be counted both as beginning stock and inside the period
No double counting in beginning quantity and in/out totals
13) Report beginning quantity must come from stock before the period start

Setup

Friday 09:00: invoice adds 15 eggs
Saturday 10:00: invoice adds 30 eggs
Report period: Sunday 00:00 to Sunday 23:59

Expected

Beginning quantity = 45
In = 0
Out = 0
Ending quantity = 45
14) Report must include outgoing movements such as orders, deductions, and write-offs

Setup

Monday 10:00: invoice adds 30 eggs
Tuesday 10:00: order uses 5 eggs
Wednesday 10:00: write-off removes 3 eggs
Report period: Monday to Wednesday

Expected

Beginning quantity = 0
In = 30
Out = 8
Ending quantity = 22
Test Cases for Time and Data Consistency
15) Report and inventory must stay correct across timezone-sensitive timestamps

Setup

A movement is stored with timezone-aware timestamp
Report period is created in a different timezone
Same calendar day, different offset

Expected

Movement belongs to the correct business day
No off-by-one-day error
No missing invoice because of timezone conversion
16) Backdated invoice must affect historical report, not just current stock

Setup

Today is Thursday
User enters invoice with effective_at = Monday
Quantity = 30

Expected

Monday report includes that invoice
Current stock also reflects it
Historical report is rebuilt from business time correctly
17) Future-dated movement must not affect earlier inventory

Setup

Wednesday 12:00: inventory count = 30
Thursday 10:00: invoice adds 50
Inventory comparison is for Wednesday

Expected

Wednesday inventory ignores the Thursday movement
Difference is based only on movements up to Wednesday
18) Cached live stock and reconstructed stock should match after all movements are applied

Setup

Create several invoices, orders, write-offs, and one inventory correction
Recompute stock from ledger

Expected

Reconstructed ledger balance equals ingredient_stock.quantity
If not equal, the test should fail and flag reconciliation mismatch