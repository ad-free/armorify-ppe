import React from 'react';
import {
  ShoppingBag,
  BarChart3,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';

const Dashboard: React.FC = () => {
  const stats = [
    { label: 'Tổng đơn hàng', value: '128', icon: ShoppingBag, color: 'bg-blue-500' },
    { label: 'Doanh thu tháng', value: '45.2M', icon: TrendingUp, color: 'bg-green-500' },
    { label: 'Khách hàng mới', value: '12', icon: AlertCircle, color: 'bg-purple-500' },
    { label: 'Sản phẩm hết hàng', value: '3', icon: AlertCircle, color: 'bg-red-500' },
  ];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Quản trị hệ thống</h1>
        <p className="text-gray-500">Tổng quan về hoạt động kinh doanh của Armorify</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 flex items-center gap-4 transition-all hover:shadow-soft">
              <div className={`${stat.color} p-3 rounded-xl text-white`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-black text-gray-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gray-50/50 p-8 rounded-2xl border border-gray-100 min-h-[300px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-900">Đơn hàng gần đây</h3>
          <button className="text-sm text-primary font-bold hover:underline">Xem tất cả</button>
        </div>

        <div className="flex flex-col items-center justify-center h-[200px] text-gray-400">
          <BarChart3 size={48} className="mb-4 opacity-20" />
          <p className="font-medium text-sm">Biểu đồ phân tích sẽ hiển thị tại đây</p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
