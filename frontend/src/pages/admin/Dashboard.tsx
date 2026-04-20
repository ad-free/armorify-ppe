import React from 'react';
import {
  ShoppingBag,
  BarChart3,
  TrendingUp,
  AlertCircle,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Users
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';

const Dashboard: React.FC = () => {
  // FastKart style stats with growth metrics
  const stats = [
    { 
      label: 'Tổng Doanh Thu', 
      value: '45.2M', 
      icon: TrendingUp, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-50',
      trend: '+12.5%', 
      isUp: true
    },
    { 
      label: 'Đơn Hàng Mới', 
      value: '128', 
      icon: ShoppingBag, 
      color: 'text-blue-500', 
      bg: 'bg-blue-50',
      trend: '+5.2%', 
      isUp: true
    },
    { 
      label: 'Khách Hàng', 
      value: '1,240', 
      icon: Users, 
      color: 'text-purple-500', 
      bg: 'bg-purple-50',
      trend: '+2.1%', 
      isUp: true
    },
    { 
      label: 'Sắp Hết Hàng', 
      value: '15', 
      icon: AlertCircle, 
      color: 'text-rose-500', 
      bg: 'bg-rose-50',
      trend: '-1.5%', 
      isUp: false
    },
  ];

  return (
    <AdminLayout title="Tổng Quan Hệ Thống" subtitle="Xin chào! Dưới đây là tình hình hoạt động hôm nay.">
      {/* Stats Grid - FastKart Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start mb-6">
                <div className={`${stat.bg} ${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm`}>
                  <Icon size={28} strokeWidth={2.5} />
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full ${stat.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {stat.isUp ? <ArrowUpRight size={14} strokeWidth={3} /> : <ArrowDownRight size={14} strokeWidth={3} />}
                  {stat.trend}
                </div>
              </div>
              <h3 className="text-[13px] font-black text-gray-400 uppercase tracking-widest mb-2">{stat.label}</h3>
              <p className="text-3xl font-black text-gray-900 tracking-tight">{stat.value}</p>
              
              {/* Subtle background decoration */}
              <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                 <Icon size={120} strokeWidth={1} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Section: Chart & Orders split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        
        {/* Chart Column (2/3 width) */}
        <div className="xl:col-span-2 bg-white rounded-[2rem] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center">
            <h3 className="font-black text-gray-900 text-lg">Biểu đồ doanh thu</h3>
            <button className="text-gray-300 hover:text-gray-600 p-2"><MoreVertical size={20} /></button>
          </div>
          <div className="p-10 h-[400px] flex flex-col items-center justify-center text-gray-300 bg-gray-50/20">
            <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
               <BarChart3 size={40} className="opacity-40 text-primary" />
            </div>
            <p className="font-black text-sm uppercase tracking-widest">Đang thu thập dữ liệu</p>
            <p className="text-xs font-bold text-gray-400 mt-2">Biểu đồ sẽ hiển thị khi có ít nhất 7 ngày giao dịch.</p>
          </div>
        </div>

        {/* Recent Orders Column (1/3 width) */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-white">
            <h3 className="font-black text-gray-900 text-lg">Giao dịch gần đây</h3>
            <button className="text-xs font-black text-primary px-4 py-2 bg-primary/5 rounded-xl hover:bg-primary hover:text-white transition-all uppercase tracking-tighter">
               Xem tất cả
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {[1, 2, 3, 4, 5].map((_, i) => (
              <div key={i} className="px-8 py-5 border-b border-gray-50 hover:bg-gray-50/50 transition-colors flex items-center justify-between group cursor-pointer">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center font-black text-gray-400 text-xs border border-gray-100 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-all">
                    OR
                  </div>
                  <div>
                    <p className="text-[15px] font-black text-gray-900 group-hover:text-primary transition-colors">Mã ĐH: #ORD-{i}0{i + 8}2</p>
                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-tighter">18/04/2024 • 14:30</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[15px] font-black text-emerald-600">+{(1250000 * (i + 1)).toLocaleString()}đ</p>
                  <p className="text-[10px] font-black text-amber-500 mt-1 uppercase tracking-[0.1em] px-2 py-0.5 bg-amber-50 rounded-lg inline-block">Đang giao</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </AdminLayout>
  );
};

export default Dashboard;
