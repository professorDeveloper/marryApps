ALTER TABLE shifts DROP CONSTRAINT IF EXISTS shifts_role_check;

ALTER TABLE shifts
ADD CONSTRAINT shifts_role_check
CHECK (role IN ('admin', 'user', 'superadmin', 'kitchen', 'waiter', 'manager'));

ALTER TABLE public.shifts DROP CONSTRAINT IF EXISTS shifts_role_check;

ALTER TABLE public.shifts
ADD CONSTRAINT shifts_role_check
CHECK (role IN ('admin', 'user', 'superadmin', 'kitchen', 'waiter', 'manager'));