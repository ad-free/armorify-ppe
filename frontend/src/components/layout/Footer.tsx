import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Youtube, Instagram, MapPin, Mail, Phone, Zap, Shield, Truck, RotateCcw, Headphones } from 'lucide-react';
import { useTranslation } from 'react-i18next';
export const Footer: React.FC = () => {
  const { t } = useTranslation();
  const benefits = [
    {
      icon: Shield,
      title: t('footer.benefits.qualityTitle'),
      desc: t('footer.benefits.qualityDesc'),
      color: 'from-emerald-500/20 to-teal-500/5',
      iconColor: 'text-emerald-400'
    },
    {
      icon: Truck,
      title: t('footer.benefits.shippingTitle'),
      desc: t('footer.benefits.shippingDesc'),
      color: 'from-primary/20 to-yellow-500/5',
      iconColor: 'text-primary'
    },
    {
      icon: RotateCcw,
      title: t('footer.benefits.returnTitle'),
      desc: t('footer.benefits.returnDesc'),
      color: 'from-blue-500/20 to-indigo-500/5',
      iconColor: 'text-blue-400'
    },
    {
      icon: Headphones,
      title: t('footer.benefits.supportTitle'),
      desc: t('footer.benefits.supportDesc'),
      color: 'from-purple-500/20 to-pink-500/5',
      iconColor: 'text-purple-400'
    }
  ];

  return (
    <footer className="bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-slate-300 font-sans border-t border-slate-800/80 relative overflow-hidden">
      {/* Decorative Blur Ambient Lights (spots matching the Category page Hero) */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary rounded-full blur-[140px] -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-500 rounded-full blur-[140px] translate-x-1/3 translate-y-1/3" />
      </div>

      {/* Geometric plus/dotted grid pattern matching the All Products page */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} 
      />

      {/* 1. Benefits Top Bar */}
      <div className="border-b border-white/[0.05] bg-white/[0.01] backdrop-blur-md relative z-10">
        <div className="container mx-auto px-6 py-12 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <div
                  key={i}
                  className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 flex items-start gap-4 hover:bg-white/[0.04] hover:border-primary/20 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-all duration-300 group"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${b.color} flex items-center justify-center shrink-0 border border-white/[0.05] transition-transform duration-300 group-hover:scale-105`}>
                    <Icon size={20} className={b.iconColor} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider mb-1">{b.title}</h4>
                    <p className="text-xs text-slate-400 font-semibold leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Main Footer Link Grid */}
      <div className="container mx-auto px-6 pt-20 pb-16 max-w-7xl relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        
        {/* Column 1: Brand Info */}
        <div className="space-y-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-primary text-slate-950 flex items-center justify-center rounded-2xl font-black text-xl shadow-md transition-transform duration-500 group-hover:rotate-12">
              <Zap size={22} className="fill-slate-950" />
            </div>
            <span className="text-2xl font-black text-white tracking-tighter uppercase">
              NBE Hoang Duy<span className="text-primary">.</span>
            </span>
          </Link>
          <p className="text-xs text-slate-400 leading-relaxed font-semibold">
            {t('footer.description')}
          </p>
          
          <div className="flex gap-3 pt-2">
            {[
              { href: '#', bg: 'bg-white/[0.02] hover:bg-[#3b5998] border-white/[0.05] text-slate-400 hover:text-white', icon: Facebook },
              { href: '#', bg: 'bg-white/[0.02] hover:bg-[#ff0000] border-white/[0.05] text-slate-400 hover:text-white', icon: Youtube },
              { href: '#', bg: 'bg-white/[0.02] hover:bg-[#e4405f] border-white/[0.05] text-slate-400 hover:text-white', icon: Instagram },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <a
                  key={i}
                  href={s.href}
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all hover:-translate-y-1 shadow-sm ${s.bg}`}
                >
                  <Icon size={16} />
                </a>
              );
            })}
          </div>
        </div>

        {/* Column 2: Catalog Links */}
        <div className="lg:pl-10">
          <h3 className="font-black text-white text-xs mb-8 tracking-[0.2em] uppercase border-l-2 border-primary pl-3">{t('footer.linksProducts')}</h3>
          <ul className="space-y-4">
            {[
              { to: '/categories', label: t('footer.allProducts') },
              { to: '/categories/giay-bao-ho', label: t('footer.shoes') },
              { to: '/categories/mu-bao-ho', label: t('footer.helmets') },
              { to: '/video', label: t('footer.videos') },
              { to: '/blog', label: t('footer.blog') },
            ].map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="text-xs text-slate-300 hover:text-primary transition-all duration-300 font-black uppercase tracking-wider flex items-center gap-2 group hover:translate-x-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white/[0.08] group-hover:bg-primary transition-colors" />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Corporate & Policies */}
        <div>
          <h3 className="font-black text-white text-xs mb-8 tracking-[0.2em] uppercase border-l-2 border-primary pl-3">{t('footer.linksPolicies')}</h3>
          <ul className="space-y-4">
            {[
              { to: '/about', label: t('footer.about') },
              { to: '/contact', label: t('footer.contact') },
              { to: '/policy/shipping', label: t('footer.shippingPolicy') },
              { to: '/policy/returns', label: t('footer.returnPolicy') },
              { to: '/dealer', label: t('footer.dealer') },
            ].map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="text-xs text-slate-300 hover:text-primary transition-all duration-300 font-black uppercase tracking-wider flex items-center gap-2 group hover:translate-x-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white/[0.08] group-hover:bg-primary transition-colors" />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: Contact Hub */}
        <div className="space-y-6">
          <h3 className="font-black text-white text-xs mb-4 tracking-[0.2em] uppercase border-l-2 border-primary pl-3">{t('footer.linksSupport')}</h3>
          <ul className="space-y-4">
            <li className="flex gap-4 items-start">
              <div className="w-9 h-9 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center justify-center text-slate-400 shrink-0 shadow-sm">
                <MapPin size={16} />
              </div>
              <span className="text-xs text-slate-400 font-semibold leading-relaxed">
                {t('footer.address')}
              </span>
            </li>
            <li className="flex gap-4 items-center">
              <div className="w-9 h-9 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center justify-center text-slate-400 shrink-0 shadow-sm">
                <Phone size={14} />
              </div>
              <a
                href="tel:0372371668"
                className="text-sm font-black text-white hover:text-primary transition-colors leading-none tracking-tight"
              >
                0372.371.668
              </a>
            </li>
            <li className="flex gap-4 items-center">
              <div className="w-9 h-9 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center justify-center text-slate-400 shrink-0 shadow-sm">
                <Mail size={14} />
              </div>
              <a
                href="mailto:info@nbehoangduy.vn"
                className="text-xs text-slate-300 font-semibold hover:text-primary transition-colors leading-none"
              >
                info@nbehoangduy.vn
              </a>
            </li>
          </ul>
        </div>

      </div>

      {/* 3. Bottom Bar */}
      <div className="border-t border-white/[0.05] bg-black/40 relative z-10">
        <div className="container mx-auto px-6 py-8 max-w-7xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <p className="text-[10px] font-black text-slate-400 tracking-wider uppercase">
              {t('footer.copyright')}
            </p>
            <p className="text-[9px] text-slate-500 font-bold leading-normal">
              {t('footer.license')}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex items-center gap-4 text-[10px] text-slate-400 font-black uppercase tracking-widest">
              <Link to="/policy/privacy" className="hover:text-primary transition-colors">{t('footer.privacy')}</Link>
              <span className="w-1 h-1 rounded-full bg-white/[0.08]" />
              <Link to="/policy/terms" className="hover:text-primary transition-colors">{t('footer.terms')}</Link>
            </div>
            
            {/* SVG Inline Payment Trust Badges */}
            <div className="flex items-center gap-3 opacity-40 hover:opacity-60 transition-opacity select-none text-slate-400">
              {/* Visa Badge */}
              <svg className="h-4 w-auto" fill="currentColor" viewBox="0 0 24 15" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.158.46l-1.393 8.356H6.551L7.944.46h2.214zm4.498 3.518c-.02-.857-.866-1.503-2.095-1.554-1.284-.05-2.528.275-3.084.536l-.37-.2.344-2.022c.57-.222 1.956-.466 3.197-.438 2.502.057 4.148 1.155 4.132 3.176-.017 2.115-3.328 2.457-3.308 3.52.015.795.897 1.149 1.77 1.155.975.006 1.847-.282 2.378-.507l.363.192-.358 2.138c-.628.243-1.637.49-2.906.49-2.585 0-4.24-1.222-4.221-3.238.02-2.186 3.324-2.613 3.301-3.585zm7.394 4.838l1.314-8.356h2.09l-1.314 8.356h-2.09zm-8.874 0H11.08L9.04.46H11.2l2.096 8.356zm10.741 0l-.822-4.145c-.328-1.597-1.464-2.316-2.96-2.316h-3.41L17.47.46h2.214l1.392 8.356h2.09z" />
              </svg>
              {/* Mastercard Badge */}
              <svg className="h-5 w-auto" fill="currentColor" viewBox="0 0 24 15" xmlns="http://www.w3.org/2000/svg">
                <circle cx="7" cy="7.5" r="7" className="text-red-500 fill-current" />
                <circle cx="17" cy="7.5" r="7" className="text-amber-500 fill-current" />
                <path d="M12 7.5a6.96 6.96 0 011.667-4.524 6.96 6.96 0 00-3.334 0A6.96 6.96 0 0112 7.5zm0 0a6.96 6.96 0 001.667 4.524 6.96 6.96 0 01-3.334 0A6.96 6.96 0 0012 7.5z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

    </footer>
  );
};
