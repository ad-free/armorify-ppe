import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { 
  User, 
  Package, 
  MapPin, 
  Settings, 
  ChevronRight, 
  Calendar,
  Shield,
  Phone,
  Mail,
  Edit2
} from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('info');

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">{t('profile.loginRequired')}</p>
      </div>
    );
  }

  const menuItems = [
    { id: 'info', label: t('profile.tabInfo'), icon: User },
    { id: 'orders', label: t('profile.tabOrders'), icon: Package },
    { id: 'addresses', label: t('profile.tabAddresses'), icon: MapPin },
    { id: 'security', label: t('profile.tabSecurity'), icon: Shield },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">{t('profile.accountTitle')}</h1>
        <p className="text-gray-500 mt-1">{t('profile.accountSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex flex-col items-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                <User size={40} />
              </div>
              <h2 className="font-bold text-gray-900 text-lg text-center">
                {user.firstname} {user.lastname}
              </h2>
              <p className="text-sm text-gray-500">{user.role === 'admin' ? t('profile.roleAdmin') : t('profile.roleMember')}</p>
            </div>
            <nav className="p-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeTab === item.id 
                      ? 'bg-primary text-white shadow-md shadow-primary/20' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} />
                      <span className="font-semibold text-sm">{item.label}</span>
                    </div>
                    <ChevronRight size={14} className={activeTab === item.id ? 'text-white/80' : 'text-gray-300'} />
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[500px]">
            {activeTab === 'info' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">{t('profile.tabInfo')}</h3>
                  <button className="flex items-center gap-2 text-sm text-primary font-bold hover:underline">
                    <Edit2 size={14} /> {t('profile.edit')}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('profile.labelName')}</label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <User size={18} className="text-gray-400" />
                      <span className="text-gray-700 font-medium">{user.firstname} {user.lastname}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('profile.labelPhone')}</label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <Phone size={18} className="text-gray-400" />
                      <span className="text-gray-700 font-medium">{user.phone}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('profile.labelEmail')}</label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <Mail size={18} className="text-gray-400" />
                      <span className="text-gray-700 font-medium">{user.email || t('profile.emailNotUpdated')}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('profile.labelJoined')}</label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <Calendar size={18} className="text-gray-400" />
                      <span className="text-gray-700 font-medium">{t('profile.joinedDateValue')}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-10 p-6 rounded-2xl bg-primary/5 border border-primary/10">
                  <h4 className="font-bold text-primary mb-2">{t('profile.accountVerifiedTitle')}</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    {t('profile.accountVerifiedDesc')}
                  </p>
                  <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                    <Shield size={16} /> {t('profile.accountProtected')}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 text-center py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                  <Package size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{t('profile.noOrdersTitle')}</h3>
                <p className="text-gray-500 mt-1 max-w-xs mx-auto">
                  {t('profile.noOrdersDesc')}
                </p>
                <button className="mt-6 px-6 py-2 bg-primary text-white rounded-full font-bold hover:bg-primary/90 transition-colors">
                  {t('profile.continueShopping')}
                </button>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">{t('profile.addressBookTitle')}</h3>
                  <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold">
                    {t('profile.addNewAddress')}
                  </button>
                </div>
                
                <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-2xl">
                  <MapPin size={32} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">{t('profile.noAddress')}</p>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-xl font-bold text-gray-900 mb-6">{t('profile.securityTitle')}</h3>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                        <Shield size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{t('profile.changePassword')}</p>
                        <p className="text-xs text-gray-500">{t('profile.changePasswordDesc')}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-300" />
                  </div>

                  <div className="p-4 rounded-xl border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                        <Settings size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{t('profile.notificationSettings')}</p>
                        <p className="text-xs text-gray-500">{t('profile.notificationSettingsDesc')}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-300" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
