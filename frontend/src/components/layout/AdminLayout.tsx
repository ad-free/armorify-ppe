import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Package, 
  Users, 
  ShoppingBag, 
  FileText, 
  Grid, 
  MapPin,
  ChevronRight,
  Shield,
  LogOut
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const ADMIN_MENU = [
  { id: 'dashboard', label: 'Tổng quan', icon: BarChart3, path: '/admin' },
  { id: 'product', label: 'Sản phẩm', icon: Package, path: '/admin/manage/product' },
  { id: 'catalog', label: 'Danh mục', icon: Grid, path: '/admin/manage/catalog' },
  { id: 'order', label: 'Đơn hàng', icon: ShoppingBag, path: '/admin/manage/order' },
  { id: 'user', label: 'Người dùng', icon: Users, path: '/admin/manage/user' },
  { id: 'blog', label: 'Bài viết', icon: FileText, path: '/admin/manage/blog' },
  { id: 'branch', label: 'Chi nhánh', icon: MapPin, path: '/admin/manage/branch' },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { entityId } = useParams<{ entityId: string }>();

  const activeId = entityId || (location.pathname === '/admin' ? 'dashboard' : '');

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl min-h-screen">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-72 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden sticky top-8">
            <div className="p-6 border-b border-gray-50 flex flex-col items-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
                <Shield size={32} />
              </div>
              <h2 className="font-bold text-gray-900 text-lg">Armorify Admin</h2>
              <p className="text-sm text-gray-500">System Management</p>
            </div>
            
            <nav className="p-2 space-y-1">
              {ADMIN_MENU.map((item) => {
                const Icon = item.icon;
                const isActive = activeId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-primary text-white shadow-md shadow-primary/20' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} />
                      <span className="font-semibold text-sm">{item.label}</span>
                    </div>
                    <ChevronRight size={14} className={isActive ? 'text-white/80' : 'text-gray-300'} />
                  </button>
                );
              })}
              
              <div className="pt-4 mt-4 border-t border-gray-50">
                <button
                  onClick={() => navigate('/')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors font-semibold text-sm"
                >
                  <LogOut size={18} />
                  Thoát Admin
                </button>
              </div>
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-8 min-h-[600px] animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
