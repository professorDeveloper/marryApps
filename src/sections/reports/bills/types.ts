export interface BillsListFilters {
  start: string;
  end: string;
  bill_status: string[];
  payment_type: string[];
  waiter_id: string;
  hall_id: string[];
  table_id: string;
  status: string;
  q: string;
  limit: number;
  offset: number;
}
