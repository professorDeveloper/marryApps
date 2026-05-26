export interface SalesReport {
  id: string;
  title: string;
  author: string;
  authorAvatar?: string;
  coverUrl?: string;
  createdAt: string;
  summary: string;
  status?: 'pending' | 'completed' | 'cancelled';
  totalAmount?: number;
}

export interface SalesReportFilters {
  date_from: string;
  date_to: string;
  status: string;
  author: string;
  q: string;
  limit: number;
  offset: number;
}
