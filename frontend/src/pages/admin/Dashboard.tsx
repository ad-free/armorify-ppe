import React, { useMemo } from 'react';
import {
  ShoppingBag,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Calendar,
  CreditCard,
  ChevronRight,
  Package,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { motion } from 'framer-motion';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number | string }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-md border border-gray-100 p-4 rounded-2xl shadow-xl">
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-lg font-black text-gray-900">
          {(payload[0].value || 0).toLocaleString()}đ
        </p>
        <p className="text-xs font-bold text-primary mt-1">
          {payload[1]?.value} Đơn hàng
        </p>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  const { data: dashboard, isLoading, error } = useAdminDashboard();

  const fmtMoney = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toString();
  };

  const stats = useMemo(() => {
    if (!dashboard?.stats) return [];
    const s = dashboard.stats;
    return [
      {
        label: 'Tổng Doanh Thu',
        value: fmtMoney(s.total_revenue),
        subValue: (s.total_revenue || 0).toLocaleString() + 'đ',
        icon: TrendingUp,
        color: 'text-emerald-500',
        bg: 'bg-emerald-50',
        trend: `+${s.revenue_growth || 0}%`,
        isUp: (s.revenue_growth || 0) >= 0
      },
      {
        label: 'Đơn Hàng',
        value: (s.total_orders || 0).toString(),
        subValue: 'Tổng đơn hàng tích lũy',
        icon: ShoppingBag,
        color: 'text-blue-500',
        bg: 'bg-blue-50',
        trend: `+${s.order_growth || 0}%`,
        isUp: (s.order_growth || 0) >= 0
      },
      {
        label: 'Khách Hàng',
        value: (s.total_users || 0).toString(),
        subValue: 'Người dùng hệ thống',
        icon: Users,
        color: 'text-purple-500',
        bg: 'bg-purple-50',
        trend: '+2.1%',
        isUp: true
      },
      {
        label: 'Sắp Hết Hàng',
        value: (s.low_stock_count || 0).toString(),
        subValue: 'Tồn kho dưới 10',
        icon: AlertCircle,
        color: 'text-rose-500',
        bg: 'bg-rose-50',
        trend: s.low_stock_count > 0 ? 'Cần nhập' : 'Ổn định',
        isUp: s.low_stock_count === 0
      },
    ];
  }, [dashboard]);

  if (isLoading) {
    return (
      <AdminLayout title="Đang tải dữ liệu..." subtitle="Vui lòng đợi trong giây lát">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-white rounded-[2rem] animate-pulse" />
          ))}
        </div>
        <div className="h-[500px] bg-white rounded-[2rem] animate-pulse" />
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Lỗi hệ thống" subtitle="Không thể tải dữ liệu Dashboard">
        <div className="bg-rose-50 text-rose-600 p-8 rounded-[2rem] border border-rose-100 font-bold">
          Đã có lỗi xảy ra khi kết nối với máy chủ. Vui lòng thử lại sau.
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Tổng Quan Hệ Thống" subtitle="Xin chào! Dưới đây là tình hình hoạt động mới nhất.">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const isLowStock = stat.label === 'Sắp Hết Hàng';

          const CardContent = (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${isLowStock ? 'cursor-pointer' : ''}`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`${stat.bg} ${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                  <Icon size={28} strokeWidth={2.5} />
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full ${stat.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {stat.isUp ? <ArrowUpRight size={14} strokeWidth={3} /> : <ArrowDownRight size={14} strokeWidth={3} />}
                  {stat.trend}
                </div>
              </div>
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{stat.label}</h3>
              <p className="text-3xl font-black text-gray-900 tracking-tight">{stat.value}</p>
              <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tight">{stat.subValue}</p>

              <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <Icon size={120} strokeWidth={1} />
              </div>
            </motion.div>
          );

          if (isLowStock) {
            return <Link key={index} to="/admin/manage/product?stock=low">{CardContent}</Link>;
          }

          return <React.Fragment key={index}>{CardContent}</React.Fragment>;
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">

        {/* Chart Column */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="xl:col-span-2 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center">
            <div>
              <h3 className="font-black text-gray-900 text-lg">Phân Tích Doanh Thu</h3>
              <p className="text-xs font-bold text-gray-400 mt-0.5 uppercase tracking-tighter">Biểu đồ 30 ngày gần nhất</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                <Calendar size={14} className="text-gray-400" />
                <span className="text-[11px] font-black text-gray-600">THÁNG NÀY</span>
              </div>
            </div>
          </div>
          <div className="p-8 h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dashboard?.revenue_chart || []}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0da487" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#0da487" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  dy={10}
                  tickFormatter={(val) => new Date(val).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  tickFormatter={(val) => fmtMoney(val)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0da487"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="transparent"
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Activity / Orders */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col"
        >
          <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-white sticky top-0 z-10">
            <h3 className="font-black text-gray-900 text-lg">Đơn Hàng Mới</h3>
            <Link to="/admin/manage/order" className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
              <ChevronRight size={20} className="text-gray-400" />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {!dashboard?.recent_orders.length ? (
              <div className="flex flex-col items-center justify-center h-full p-10 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                  <Package size={32} className="text-gray-200" />
                </div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Chưa có giao dịch</p>
              </div>
            ) : (
              dashboard.recent_orders.map((order) => (
                <div key={order.id} className="px-8 py-5 border-b border-gray-50 hover:bg-gray-50/50 transition-colors flex items-center justify-between group cursor-pointer">
                  <div className="flex gap-4 items-center min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-all flex-shrink-0">
                      <CreditCard size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-black text-gray-900 truncate group-hover:text-primary transition-colors">
                        #{order.order_code || (order.id ? order.id.slice(0, 8) : '---')}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-tighter">
                        {new Date(order.created_at).toLocaleDateString('vi-VN')} • {order.customer_name || 'Khách lẻ'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-[14px] font-black text-gray-900">{order.total_amount.toLocaleString()}đ</p>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg mt-1 inline-block ${order.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                      order.status === 'cancelled' ? 'bg-rose-50 text-rose-600' :
                        'bg-amber-50 text-amber-500'
                      }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-6 bg-gray-50/50 border-t border-gray-50">
            <Link to="/admin/manage/order" className="w-full flex items-center justify-center py-4 bg-white border border-gray-200 rounded-2xl text-[11px] font-black text-gray-600 uppercase tracking-widest hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm">
              Quản Lý Đơn Hàng
            </Link>
          </div>
        </motion.div>

      </div>
    </AdminLayout>
  );
};

export default Dashboard;
