import { GET } from '@/lib/api';
import type { DashboardData } from '@/types/api';

export const getDashboardData = () =>
  GET<DashboardData>('/admin/dashboard/');
