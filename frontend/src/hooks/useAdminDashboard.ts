import { useQuery } from '@tanstack/react-query';
import { getDashboardData } from '@/api/admin/dashboard';

export const useAdminDashboard = () => {
  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: getDashboardData,
    staleTime: 5 * 60_000, // 5 minutes
  });
};
