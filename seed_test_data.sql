-- Seed data for testing - Run this in your tenant schema

-- Ingredient Groups (3)
INSERT INTO ingredient_groups (id, name, color_code) VALUES
  (gen_random_uuid(), 'Vegetables', '#FF5733'),
  (gen_random_uuid(), 'Dairy', '#33FF57'),
  (gen_random_uuid(), 'Spices', '#3357FF')
ON CONFLICT DO NOTHING;

-- Ingredients (3)
INSERT INTO ingredients (id, name, group_id, measurement, color_code) VALUES
  (gen_random_uuid(), 'Tomato', (SELECT id FROM ingredient_groups WHERE name='Vegetables' LIMIT 1), 'kg', '#FF6347'),
  (gen_random_uuid(), 'Milk', (SELECT id FROM ingredient_groups WHERE name='Dairy' LIMIT 1), 'l', '#FFFFFF'),
  (gen_random_uuid(), 'Cumin', (SELECT id FROM ingredient_groups WHERE name='Spices' LIMIT 1), 'kg', '#8B4513')
ON CONFLICT DO NOTHING;

-- Categories (3)
INSERT INTO categories (id, name, color_code) VALUES
  (gen_random_uuid(), 'Main Courses', '#FF5733'),
  (gen_random_uuid(), 'Appetizers', '#33FF57'),
  (gen_random_uuid(), 'Desserts', '#3357FF')
ON CONFLICT DO NOTHING;

-- Departments (3)
INSERT INTO departments (id, name, color_code) VALUES
  (gen_random_uuid(), 'Kitchen', '#FF5733'),
  (gen_random_uuid(), 'Pastry', '#33FF57'),
  (gen_random_uuid(), 'Bar', '#3357FF')
ON CONFLICT DO NOTHING;

-- Goods (3)
INSERT INTO goods (id, name, price, category_id, department_id) VALUES
  (gen_random_uuid(), 'Margherita Pizza', '8.50', (SELECT id FROM categories WHERE name='Main Courses' LIMIT 1), (SELECT id FROM departments WHERE name='Kitchen' LIMIT 1)),
  (gen_random_uuid(), 'Caesar Salad', '6.50', (SELECT id FROM categories WHERE name='Appetizers' LIMIT 1), (SELECT id FROM departments WHERE name='Kitchen' LIMIT 1)),
  (gen_random_uuid(), 'Chocolate Cake', '5.00', (SELECT id FROM categories WHERE name='Desserts' LIMIT 1), (SELECT id FROM departments WHERE name='Pastry' LIMIT 1))
ON CONFLICT DO NOTHING;

-- Compounds (3)
INSERT INTO compounds (id, name) VALUES
  (gen_random_uuid(), 'Pizza Base'),
  (gen_random_uuid(), 'Caesar Dressing'),
  (gen_random_uuid(), 'Chocolate Ganache')
ON CONFLICT DO NOTHING;

-- Invoices (3)
INSERT INTO invoices (id, supplier_name, total_amount, status, date) VALUES
  (gen_random_uuid(), 'Fresh Produce Co', '150.00', 'received', NOW()),
  (gen_random_uuid(), 'Dairy Supplies Ltd', '200.00', 'arrived', NOW()),
  (gen_random_uuid(), 'Spice House', '75.50', 'pending', NOW())
ON CONFLICT DO NOTHING;

-- Invoice Details (link ingredients to invoices with prices)
INSERT INTO invoice_detailed (id, invoice_id, ingredient_id, quantity, price_per_unit) VALUES
  (gen_random_uuid(), (SELECT id FROM invoices WHERE supplier_name='Fresh Produce Co' LIMIT 1), (SELECT id FROM ingredients WHERE name='Tomato' LIMIT 1), 100, '1.50'),
  (gen_random_uuid(), (SELECT id FROM invoices WHERE supplier_name='Dairy Supplies Ltd' LIMIT 1), (SELECT id FROM ingredients WHERE name='Milk' LIMIT 1), 50, '4.00'),
  (gen_random_uuid(), (SELECT id FROM invoices WHERE supplier_name='Spice House' LIMIT 1), (SELECT id FROM ingredients WHERE name='Cumin' LIMIT 1), 10, '7.55')
ON CONFLICT DO NOTHING;

-- Calculations (3) - linking goods to ingredients
INSERT INTO calculation (id, good_id, ingredient_id, quantity, measurement_unit, price_per_unit, total_cost) VALUES
  (gen_random_uuid(), (SELECT id FROM goods WHERE name='Margherita Pizza' LIMIT 1), (SELECT id FROM ingredients WHERE name='Tomato' LIMIT 1), '0.300', 'kg', '1.50', '0.45'),
  (gen_random_uuid(), (SELECT id FROM goods WHERE name='Caesar Salad' LIMIT 1), (SELECT id FROM ingredients WHERE name='Milk' LIMIT 1), '0.2', 'l', '4.00', '0.80'),
  (gen_random_uuid(), (SELECT id FROM goods WHERE name='Chocolate Cake' LIMIT 1), (SELECT id FROM ingredients WHERE name='Cumin' LIMIT 1), '0.05', 'kg', '7.55', '0.38')
ON CONFLICT DO NOTHING;

SELECT 'Seed data inserted successfully!' as message;
