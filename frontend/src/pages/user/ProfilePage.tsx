// src/pages/user/ProfilePage.tsx - FastKart User Dashboard style
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authToast } from '@/lib/toast';

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={36} className="text-gray-400" />
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
    logout();
    navigate('/');
    authToast.logoutSuccess();
  };

  const menuItems = [
    { id: 'dashboard', label: 'Tổng Quan', icon: ShoppingBag },
    { id: 'orders', label: t('profile.tabOrders'), icon: Package },
    { id: 'wishlist', label: 'Yêu Thích', icon: Heart },
    { id: 'info', label: t('profile.tabInfo'), icon: User },
    { id: 'addresses', label: t('profile.tabAddresses'), icon: MapPin },
    { id: 'notifications', label: 'Thông Báo', icon: Bell },
    { id: 'security', label: t('profile.tabSecurity'), icon: Shield },
  ];

  const orderStatuses = [
    { label: 'Tất Cả', count: 12, color: 'text-gray-600', bg: 'bg-gray-100' },
    { label: 'Đang Xử Lý', count: 2, color: 'text-amber-600', bg: 'bg-amber-100', icon: Clock },
    { label: 'Đang Giao', count: 1, color: 'text-blue-600', bg: 'bg-blue-100', icon: Truck },
    { label: 'Hoàn Thành', count: 8, color: 'text-emerald-600', bg: 'bg-emerald-100', icon: CheckCircle },
    { label: 'Đã Hủy', count: 1, color: 'text-rose-600', bg: 'bg-rose-100', icon: XCircle },
  ];

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
          {/* Avatar */}
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
            <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-100 transition-colors">
              <Edit2 size={16} /> Chỉnh sửa
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-4">
              <nav className="p-3 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group text-sm ${
                        isActive
                          ? 'bg-primary/10 text-primary font-bold'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-semibold'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-primary' : 'text-gray-400 group-hover:text-primary'} />
                        <span>{item.label}</span>
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

                {/* Dashboard Overview */}
                {activeTab === 'dashboard' && (
                  <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label: 'Tổng Đơn', value: '12', icon: ShoppingBag, bg: 'bg-blue-50', color: 'text-blue-500' },
                        { label: 'Đang Giao', value: '1', icon: Truck, bg: 'bg-amber-50', color: 'text-amber-500' },
                        { label: 'Yêu Thích', value: '5', icon: Heart, bg: 'bg-rose-50', color: 'text-rose-500' },
                        { label: 'Điểm Tích', value: '320', icon: Star, bg: 'bg-purple-50', color: 'text-purple-500' },
                      ].map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
                              <Icon size={20} strokeWidth={2} />
                            </div>
                            <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                            <p className="text-xs font-semibold text-gray-500 mt-0.5">{stat.label}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Order Status Quick Nav */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900">Đơn Hàng Của Tôi</h3>
                        <button onClick={() => setActiveTab('orders')} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                          Xem tất cả <ChevronRight size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-gray-50">
                        {orderStatuses.map((status, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveTab('orders')}
                            className={`flex flex-col items-center py-5 px-3 hover:bg-gray-50/50 transition-colors`}
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
                        <User size={28} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 mb-1">{user.firstname} {user.lastname}</h3>
                        <p className="text-sm text-gray-500 truncate">{user.email || 'Chưa cập nhật email'}</p>
                        <p className="text-sm text-gray-500">{user.phone}</p>
                      </div>
                      <button onClick={() => setActiveTab('info')} className="px-4 py-2 text-xs font-bold text-primary border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors flex-shrink-0">
                        Sửa
                      </button>
                    </div>
                  </div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50">
                      <h3 className="font-bold text-gray-900">Lịch Sử Đơn Hàng</h3>
                    </div>
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package size={28} className="text-gray-300" />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-1">{t('profile.noOrdersTitle')}</h3>
                      <p className="text-sm text-gray-500 mb-6">{t('profile.noOrdersDesc')}</p>
                      <Link to="/categories" className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors text-sm">
                        Mua Sắm Ngay <ChevronRight size={16} />
                      </Link>
                    </div>
                  </div>
                )}

                {/* Wishlist Tab */}
                {activeTab === 'wishlist' && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50">
                      <h3 className="font-bold text-gray-900">Sản Phẩm Yêu Thích</h3>
                    </div>
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
                  </div>
                )}

                {/* Info Tab */}
                {activeTab === 'info' && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-gray-900">Thông Tin Cá Nhân</h3>
                      <button className="flex items-center gap-1.5 text-sm text-primary font-bold hover:underline">
                        <Edit2 size={14} /> Chỉnh sửa
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {[
                        { label: 'Họ và tên', value: `${user.firstname} ${user.lastname}`, icon: User },
                        { label: 'Số điện thoại', value: user.phone, icon: Phone },
                        { label: 'Email', value: user.email || 'Chưa cập nhật', icon: Mail },
                        { label: 'Ngày tham gia', value: 'Tháng 4, 2026', icon: Calendar },
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

                {/* Addresses Tab */}
                {activeTab === 'addresses' && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">{t('profile.securityTitle')}</h3>
                    <div className="space-y-3">
                      {[
                        { icon: Shield, label: t('profile.changePassword'), desc: t('profile.changePasswordDesc') },
                        { icon: Bell, label: t('profile.notificationSettings'), desc: t('profile.notificationSettingsDesc') },
                      ].map((item, i) => {
                        const Icon = item.icon;
                        return (
                          <button key={i} className="w-full p-4 rounded-xl border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors group">
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

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
    </div>
  );
};

export default ProfilePage;
