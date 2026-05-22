// src/pages/ProfilePage.tsx
import React, { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User as UserIcon,
  Package,
  MapPin,
  Shield,
  ChevronRight,
  Calendar,
  Phone,
  Mail,
  Edit2,
  Heart,
  Bell,
  LogOut,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Star,
  Eye,
  Trash2,
  Lock,
} from 'lucide-react';
import { useUpdateMe, useChangePassword } from '@/hooks/useAuth';
import { useMyOrders } from '@/hooks/useOrder';
import { useWishlistStore } from '@/store/wishlistStore';
import { formatCurrency } from '@/lib/currency';
import { authToast } from '@/lib/toast';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { getMediaUrl } from '@/lib/api';

const ORDER_STATUS_CONFIG = {
  pending: { label: 'Chờ xử lý', color: 'bg-amber-500', icon: Clock, bg: 'bg-amber-50', text: 'text-amber-600', desc: 'Đơn hàng của bạn đang được hệ thống tiếp nhận.' },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-500', icon: CheckCircle, bg: 'bg-blue-50', text: 'text-blue-600', desc: 'Đơn hàng đã được xác nhận và đang chuẩn bị hàng.' },
  shipping: { label: 'Đang giao', color: 'bg-indigo-500', icon: Truck, bg: 'bg-indigo-50', text: 'text-indigo-600', desc: 'Sản phẩm đang trên đường đến với bạn.' },
  delivered: { label: 'Đã giao', color: 'bg-emerald-500', icon: Package, bg: 'bg-emerald-50', text: 'text-emerald-600', desc: 'Đơn hàng đã được giao thành công.' },
  completed: { label: 'Hoàn thành', color: 'bg-emerald-500', icon: CheckCircle, bg: 'bg-emerald-50', text: 'text-emerald-600', desc: 'Cảm ơn bạn đã tin tưởng Armorify!' },
  cancelled: { label: 'Đã hủy', color: 'bg-rose-500', icon: XCircle, bg: 'bg-rose-50', text: 'text-rose-600', desc: 'Đơn hàng đã bị hủy bỏ.' },
} as const;

const DEFAULT_STATUS_CONFIG = {
  label: 'Không xác định',
  color: 'bg-gray-500',
  icon: Package,
  bg: 'bg-gray-50',
  text: 'text-gray-600',
  desc: '',
};

const getStatusConfig = (status: string) =>
  ORDER_STATUS_CONFIG[status as keyof typeof ORDER_STATUS_CONFIG] ?? DEFAULT_STATUS_CONFIG;

const STATIC_MENU_ITEMS = [
  { id: 'dashboard', labelKey: null, staticLabel: 'Tổng Quan', icon: ShoppingBag },
  { id: 'orders', labelKey: 'profile.tabOrders', staticLabel: null, icon: Package },
  { id: 'wishlist', labelKey: null, staticLabel: 'Yêu Thích', icon: Heart },
  { id: 'info', labelKey: 'profile.tabInfo', staticLabel: null, icon: UserIcon },
  { id: 'addresses', labelKey: 'profile.tabAddresses', staticLabel: null, icon: MapPin },
  { id: 'notifications', labelKey: null, staticLabel: 'Thông Báo', icon: Bell },
  { id: 'security', labelKey: 'profile.tabSecurity', staticLabel: null, icon: Shield },
] as const;

const QUICK_STATS_CONFIG = [
  { key: 'totalOrders', label: 'Tổng Đơn', icon: ShoppingBag, bg: 'bg-blue-50', color: 'text-blue-500' },
  { key: 'processing', label: 'Đang Giao', icon: Truck, bg: 'bg-amber-50', color: 'text-amber-500' },
  { key: 'favoriteCount', label: 'Yêu Thích', icon: Heart, bg: 'bg-rose-50', color: 'text-rose-500' },
  { key: 'points', label: 'Điểm Tích', icon: Star, bg: 'bg-purple-50', color: 'text-purple-500' },
] as const;

const ProfilePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const logoutHandledRef = useRef(false);

  const { data: orders, isLoading: isLoadingOrders } = useMyOrders();
  const { items: wishlistItems, removeItem: removeWishlistItem } = useWishlistStore();
  const updateMe = useUpdateMe();
  const changePassword = useChangePassword();

  const formatMoney = (val: number) =>
    formatCurrency(val, { locale: i18n.language === 'vi' ? 'vi-VN' : 'en-US' });

  const stats = useMemo(() => ({
    totalOrders: orders?.length ?? 0,
    processing: orders?.filter(o => o.status === 'pending' || o.status === 'confirmed').length ?? 0,
    favoriteCount: wishlistItems.length,
    points: '0',
  }), [orders, wishlistItems]);

  const orderStatusesSummary = useMemo(() => {
    if (!orders) return [];
    return [
      { label: 'Tất Cả', count: orders.length, color: 'text-gray-600' },
      { label: 'Chờ xử lý', count: orders.filter(o => o.status === 'pending').length, color: 'text-amber-600', icon: Clock },
      { label: 'Đang giao', count: orders.filter(o => o.status === 'shipping').length, color: 'text-blue-600', icon: Truck },
      { label: 'Hoàn thành', count: orders.filter(o => o.status === 'completed').length, color: 'text-emerald-600', icon: CheckCircle },
      { label: 'Đã hủy', count: orders.filter(o => o.status === 'cancelled').length, color: 'text-rose-600', icon: XCircle },
    ];
  }, [orders]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserIcon size={36} className="text-gray-400" />
          </div>
          <p className="text-gray-600 font-semibold mb-4">{t('profile.loginRequired')}</p>
          <Link to="/login" className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors">
            Đăng Nhập
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    if (logoutHandledRef.current) return;
    logoutHandledRef.current = true;
    logout();
    navigate('/');
    authToast.logoutSuccess();
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen font-sans">
      {/* Profile Banner */}
      <div className="bg-gradient-to-br from-primary via-primary/90 to-emerald-500 h-40 relative">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl -mt-20 pb-16 relative z-10">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-white font-black text-3xl shadow-lg flex-shrink-0 -mt-10 ring-4 ring-white">
            {user.firstname?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-black text-gray-900">{user.firstname} {user.lastname}</h1>
            <p className="text-sm text-gray-500">{user.email || user.phone}</p>
            <div className="flex gap-2 mt-2">
              <span className="text-xs font-bold px-3 py-1 bg-primary/10 text-primary rounded-full">
                {user.role === 'admin' ? '⚡ Admin' : '👤 Member'}
              </span>
              <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full">
                ✅ Đã xác thực
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Edit2 size={16} /> Chỉnh sửa
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-4">
              <nav className="p-3 space-y-1">
                {STATIC_MENU_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const label = item.labelKey ? t(item.labelKey) : item.staticLabel;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group text-sm ${isActive
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-semibold'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          size={18}
                          strokeWidth={isActive ? 2.5 : 2}
                          className={isActive ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}
                        />
                        <span>{label}</span>
                      </div>
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </button>
                  );
                })}
              </nav>
              <div className="px-3 pb-3 border-t border-gray-50 pt-3">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors font-bold text-sm"
                >
                  <LogOut size={18} />
                  Đăng Xuất
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* ── Dashboard ── */}
                {activeTab === 'dashboard' && (
                  <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {QUICK_STATS_CONFIG.map((stat) => {
                        const Icon = stat.icon;
                        // ✅ stats.points adalah string '0', yang lain number
                        const value = stat.key === 'points' ? stats.points : stats[stat.key as keyof typeof stats];
                        return (
                          <div key={stat.key} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
                              <Icon size={20} strokeWidth={2} />
                            </div>
                            <p className="text-2xl font-black text-gray-900">{value}</p>
                            <p className="text-xs font-semibold text-gray-500 mt-0.5">{stat.label}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Order Status Quick Nav */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900">Đơn Hàng Gần Đây</h3>
                        <button
                          onClick={() => setActiveTab('orders')}
                          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          Xem tất cả <ChevronRight size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-gray-50">
                        {orderStatusesSummary.map((status, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveTab('orders')}
                            className="flex flex-col items-center py-5 px-3 hover:bg-gray-50/50 transition-colors"
                          >
                            <span className={`text-2xl font-black mb-1 ${status.color}`}>{status.count}</span>
                            <span className="text-[11px] font-semibold text-gray-500 text-center">{status.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Profile Summary */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-start gap-5">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <UserIcon size={28} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 mb-1">{user.firstname} {user.lastname}</h3>
                        <p className="text-sm text-gray-500 truncate">{user.email || 'Chưa cập nhật email'}</p>
                        <p className="text-sm text-gray-500">{user.phone}</p>
                      </div>
                      <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="px-4 py-2 text-xs font-bold text-primary border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors flex-shrink-0"
                      >
                        Sửa
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Orders ── */}
                {activeTab === 'orders' && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                    <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                      <h3 className="font-bold text-gray-900">Lịch Sử Đơn Hàng</h3>
                      {isLoadingOrders && (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>

                    {!orders || orders.length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Package size={28} className="text-gray-300" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1">{t('profile.noOrdersTitle')}</h3>
                        <p className="text-sm text-gray-500 mb-6">{t('profile.noOrdersDesc')}</p>
                        <Link
                          to="/categories"
                          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors text-sm"
                        >
                          Mua Sắm Ngay <ChevronRight size={16} />
                        </Link>
                      </div>
                    ) : (
                      <div className="p-6 space-y-8">
                        {orders.map((order) => {
                          // ✅ Fix 1: Dùng helper getStatusConfig thay vì tạo object trong map
                          const statusConfig = getStatusConfig(order.status);
                          const StatusIcon = statusConfig.icon;

                          return (
                            <div key={order.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                              {/* Order Header */}
                              <div className="flex items-start gap-4 mb-5">
                                <div className={`w-11 h-11 rounded-xl ${statusConfig.bg} ${statusConfig.text} flex items-center justify-center shrink-0`}>
                                  <StatusIcon size={22} />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-1">
                                    <h4 className="text-base font-black text-gray-900 uppercase tracking-tight">
                                      {statusConfig.label}
                                    </h4>
                                    <span className={`px-3 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider text-white ${statusConfig.color}`}>
                                      {order.status === 'pending' ? 'Pending' : 'Success'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 font-medium leading-relaxed">{statusConfig.desc}</p>
                                </div>
                                <div className="text-right hidden sm:block">
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mã đơn hàng</p>
                                  <p className="text-sm font-bold text-gray-900">#{order.id}</p>
                                </div>
                              </div>

                              {/* Order Content Card */}
                              <div className="bg-gray-50/50 rounded-3xl border border-gray-100 p-5 sm:p-6 space-y-5">
                                {order.items?.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex flex-col sm:flex-row items-center gap-6 pb-5 border-b border-gray-100 last:border-0 last:pb-0"
                                  >
                                    <div className="w-24 h-24 bg-white rounded-2xl p-3 border border-gray-100 shrink-0 flex items-center justify-center shadow-sm">
                                      <img
                                        src={getMediaUrl(item.product?.cover_image_url) || '/placeholder.png'}
                                        alt={item.product?.name}
                                        className="max-w-full max-h-full object-contain"
                                      />
                                    </div>
                                    <div className="flex-1 text-center sm:text-left">
                                      <h5 className="text-base font-black text-gray-900 mb-1 leading-tight line-clamp-2">
                                        {item.product?.name || 'Sản phẩm không còn tồn tại'}
                                      </h5>
                                      <p className="text-xs text-gray-500 font-medium mb-3 line-clamp-1 italic">
                                        {item.product?.description?.replace(/<[^>]*>?/gm, '').slice(0, 80)}...
                                      </p>
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                                        <div>
                                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Giá tiền</p>
                                          <p className="text-sm font-black text-gray-900">{formatMoney(Number(item.unit_price))}</p>
                                        </div>
                                        <div>
                                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Số lượng</p>
                                          <p className="text-sm font-bold text-gray-900">{item.quantity} x sản phẩm</p>
                                        </div>
                                        <div className="hidden sm:block">
                                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Thương hiệu</p>
                                          <p className="text-sm font-bold text-primary">{item.product?.brand?.name || 'Armorify'}</p>
                                        </div>
                                        <div className="hidden sm:block">
                                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Đánh giá</p>
                                          <div className="flex items-center gap-0.5 text-amber-400">
                                            {[...Array(5)].map((_, i) => (
                                              <Star key={i} size={12} fill={i < 4 ? 'currentColor' : 'none'} />
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                {/* Order Footer */}
                                <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 mt-2">
                                  <div className="flex items-center gap-3">
                                    <div className="flex -space-x-2">
                                      {order.items?.slice(0, 3).map((item, idx) => (
                                        <div key={idx} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 overflow-hidden shadow-sm">
                                          <img src={getMediaUrl(item.product?.cover_image_url) || '/placeholder.png'} className="w-full h-full object-cover" />
                                        </div>
                                      ))}
                                      {(order.items?.length || 0) > 3 && (
                                        <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-900 text-[10px] font-bold text-white flex items-center justify-center">
                                          +{(order.items?.length || 0) - 3}
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-[11px] font-bold text-gray-400">
                                      Đã đặt ngày {new Date(order.created_at).toLocaleDateString('vi-VN')}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-6">
                                    <div className="text-right">
                                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Tổng thanh toán</p>
                                      <p className="text-xl font-black text-primary tracking-tight">{formatMoney(Number(order.total_amount))}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Wishlist ── */}
                {activeTab === 'wishlist' && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                    <div className="px-6 py-5 border-b border-gray-50">
                      <h3 className="font-bold text-gray-900">Sản Phẩm Yêu Thích ({wishlistItems.length})</h3>
                    </div>
                    {wishlistItems.length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Heart size={28} className="text-rose-300" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1">Chưa có sản phẩm yêu thích</h3>
                        <p className="text-sm text-gray-500 mb-6">Nhấn trái tim ❤️ trên sản phẩm để lưu vào danh sách yêu thích.</p>
                        <Link to="/categories" className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors text-sm">
                          Khám Phá <ChevronRight size={16} />
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
                        {wishlistItems.map((product) => (
                          <div key={product.id} className="flex gap-4 p-4 rounded-2xl border border-gray-100 hover:border-primary/20 transition-all group bg-gray-50/30">
                            <Link to={`/products/${product.slug}`} className="w-20 h-20 rounded-xl bg-white flex items-center justify-center p-2 flex-shrink-0">
                              <img src={getMediaUrl(product.cover_image_url) || '/placeholder.png'} alt={product.name} className="max-w-full max-h-full object-contain" />
                            </Link>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 text-sm line-clamp-1 mb-1">{product.name}</h4>
                              <p className="text-sm font-black text-primary">{formatMoney(product.price)}</p>
                              <div className="flex items-center gap-3 mt-3">
                                <Link to={`/products/${product.slug}`} className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 hover:text-primary transition-colors">
                                  <Eye size={14} /> Chi tiết
                                </Link>
                                <button
                                  onClick={() => removeWishlistItem(product.id)}
                                  className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-rose-500 transition-colors"
                                >
                                  <Trash2 size={14} /> Xoá
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Info ── */}
                {activeTab === 'info' && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-gray-900">Thông Tin Cá Nhân</h3>
                      <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center gap-1.5 text-sm text-primary font-bold hover:underline"
                      >
                        <Edit2 size={14} /> Chỉnh sửa
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {[
                        { label: 'Họ và tên', value: `${user.firstname} ${user.lastname}`, icon: UserIcon },
                        { label: 'Số điện thoại', value: user.phone, icon: Phone },
                        { label: 'Email', value: user.email || 'Chưa cập nhật', icon: Mail },
                        { label: 'Ngày tham gia', value: user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }) : 'Chưa cập nhật', icon: Calendar },
                      ].map((field, i) => {
                        const Icon = field.icon;
                        return (
                          <div key={i} className="space-y-1">
                            <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">{field.label}</label>
                            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                              <Icon size={16} className="text-gray-400 flex-shrink-0" />
                              <span className="text-sm font-medium text-gray-800 truncate">{field.value}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-6 p-5 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <CheckCircle size={20} className="text-emerald-500" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">Tài Khoản Được Bảo Vệ</p>
                        <p className="text-xs text-gray-500 mt-0.5">{t('profile.accountVerifiedDesc')}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Addresses ── */}
                {activeTab === 'addresses' && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                    <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                      <h3 className="font-bold text-gray-900">Sổ Địa Chỉ</h3>
                      <button className="px-4 py-2 bg-primary text-white font-bold text-xs rounded-lg hover:bg-primary/90 transition-colors">
                        + Thêm Địa Chỉ
                      </button>
                    </div>
                    <div className="p-12 text-center">
                      <MapPin size={32} className="mx-auto text-gray-300 mb-4" />
                      <p className="font-semibold text-gray-600">{t('profile.noAddress')}</p>
                    </div>
                  </div>
                )}

                {/* ── Security ── */}
                {activeTab === 'security' && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">{t('profile.securityTitle')}</h3>
                    <div className="space-y-3">
                      {[
                        {
                          id: 'password',
                          icon: Shield,
                          label: t('profile.changePassword'),
                          desc: t('profile.changePasswordDesc'),
                          onClick: () => setIsPasswordModalOpen(true),
                        },
                        {
                          id: 'notif',
                          icon: Bell,
                          label: t('profile.notificationSettings'),
                          desc: t('profile.notificationSettingsDesc'),
                          onClick: () => { },
                        },
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={item.onClick}
                            className="w-full p-4 rounded-xl border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors group"
                          >
                            <div className="flex gap-4 items-center">
                              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                <Icon size={20} />
                              </div>
                              <div className="text-left">
                                <p className="font-bold text-gray-900 text-sm">{item.label}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                              </div>
                            </div>
                            <ChevronRight size={18} className="text-gray-300 group-hover:text-primary transition-colors" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Notifications ── */}
                {activeTab === 'notifications' && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                    <div className="px-6 py-5 border-b border-gray-50">
                      <h3 className="font-bold text-gray-900">Thông Báo</h3>
                    </div>
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell size={28} className="text-blue-300" />
                      </div>
                      <h3 className="font-bold text-gray-900">Không có thông báo mới</h3>
                      <p className="text-sm text-gray-500 mt-1">Bạn đã đọc hết tất cả thông báo.</p>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Edit Profile Modal ── */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-black text-gray-900">Chỉnh Sửa Thông Tin</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <XCircle size={24} />
                </button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const data = Object.fromEntries(formData.entries());
                  try {
                    await updateMe.mutateAsync(data);
                    setIsEditModalOpen(false);
                    toast.success('Đã cập nhật thông tin thành công!');
                  } catch {
                    toast.error('Có lỗi xảy ra khi cập nhật.');
                  }
                }}
                className="p-8 space-y-5"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Họ</label>
                    <input name="lastname" defaultValue={user.lastname} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Tên</label>
                    <input name="firstname" defaultValue={user.firstname} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                  <input name="email" type="email" defaultValue={user.email || ''} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Địa chỉ</label>
                  <input name="address" defaultValue={user.address || ''} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium" />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={updateMe.isPending}
                    className="flex-1 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {updateMe.isPending ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Change Password Modal ── */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                  <Lock size={20} />
                </div>
                <h3 className="text-xl font-black text-gray-900">Đổi Mật Khẩu</h3>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const data = Object.fromEntries(formData.entries());
                  if (data.new_password !== data.confirm_password) {
                    toast.error('Mật khẩu mới không khớp!');
                    return;
                  }
                  try {
                    await changePassword.mutateAsync({
                      current_password: data.current_password as string,
                      new_password: data.new_password as string,
                    });
                    setIsPasswordModalOpen(false);
                    toast.success('Đã đổi mật khẩu thành công!');
                  } catch (err: unknown) {
                    const errorResponse = err as { response?: { data?: { detail?: string } } };
                    toast.error(errorResponse.response?.data?.detail || 'Có lỗi xảy ra.');
                  }
                }}
                className="p-8 space-y-5"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Mật khẩu hiện tại</label>
                  <input name="current_password" type="password" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Mật khẩu mới</label>
                  <input name="new_password" type="password" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Xác nhận mật khẩu mới</label>
                  <input name="confirm_password" type="password" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={changePassword.isPending}
                    className="flex-1 py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors shadow-lg shadow-black/20 disabled:opacity-50"
                  >
                    {changePassword.isPending ? 'Đang xử lý...' : 'Đổi Mật Khẩu'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;
