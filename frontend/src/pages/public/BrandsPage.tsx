// src/pages/public/BrandsPage.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { SeoHead } from '@/components/common/SeoHead';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { useBrands } from '@/hooks/useCatalog';
import { getMediaUrl } from '@/lib/api';
import { Award, Globe, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const BrandsPage: React.FC = () => {
  const { t } = useTranslation();
  const { data: brandsData, isLoading: brandsLoading } = useBrands();
  const brands = brandsData?.items?.filter((b) => b.is_active !== false) || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-[#f8fafc] min-h-screen pb-24"
    >
      <SeoHead
        title={t('brandsPage.seoTitle')}
        description={t('brandsPage.seoDescription')}
      />

      {/* Hero Header Area */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 text-white overflow-hidden py-16 md:py-24">
        {/* Subtle decorative background patterns */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-primary rounded-full blur-[180px] opacity-10 pointer-events-none" />
        
        <div className="container mx-auto px-6 max-w-7xl relative z-10 text-center lg:text-left">
          <div className="mb-6 flex justify-center lg:justify-start">
            <Breadcrumb
              items={[
                { label: t('productDetail.breadcrumbHome'), href: '/' },
                { label: t('brandsPage.breadcrumb') }
              ]}
            />
          </div>

          <div className="max-w-3xl">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-white/10 backdrop-blur-md text-primary tracking-widest uppercase border border-white/5 mb-6"
            >
              <ShieldCheck size={14} className="fill-primary text-slate-900" /> {t('brandsPage.badge')}
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-tight"
            >
              {t('brandsPage.titlePrefix')} <span className="text-primary">{t('brandsPage.titleHighlight')}</span>
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-slate-300 text-base md:text-lg leading-relaxed font-medium"
            >
              {t('brandsPage.subtitle')}
            </motion.p>
          </div>
        </div>
      </div>

      {/* Brand Grid Section */}
      <div className="container mx-auto px-6 max-w-7xl py-16">
        {brandsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm min-h-[300px] animate-pulse flex flex-col justify-between"
              >
                <div className="w-24 h-24 bg-slate-100 rounded-[1.5rem] mb-6" />
                <div className="space-y-3">
                  <div className="h-6 bg-slate-100 rounded w-1/3" />
                  <div className="h-4 bg-slate-100 rounded w-1/4" />
                  <div className="h-12 bg-slate-100 rounded w-full" />
                </div>
                <div className="h-10 bg-slate-100 rounded w-1/2 mt-6" />
              </div>
            ))}
          </div>
        ) : brands.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-slate-200 rounded-[2.5rem] bg-white shadow-sm flex flex-col items-center px-6">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 text-slate-400">
              <Award size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">{t('brandsPage.emptyTitle')}</h3>
            <p className="text-slate-500 font-medium max-w-md text-sm leading-relaxed">
              {t('brandsPage.emptySubtitle')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {brands.map((brand, idx) => {
              return (
                <motion.div
                  key={brand.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                  className="group bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-500 flex flex-col justify-between relative overflow-hidden"
                >
                  {/* Subtle color glow on card hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  <div>
                    {/* Brand Logo inside premium white wrapper */}
                    <div className="w-24 h-24 rounded-[1.5rem] border border-slate-100 bg-white shadow-sm p-4 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-500 overflow-hidden relative">
                      {brand.logo_url ? (
                        <img
                          src={getMediaUrl(brand.logo_url)}
                          alt={brand.name}
                          className="max-w-full max-h-full object-contain filter contrast-125 group-hover:brightness-105 transition-all"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        style={{ display: brand.logo_url ? 'none' : 'flex' }}
                        className="w-full h-full bg-primary/5 rounded-[1rem] items-center justify-center text-primary font-black text-2xl uppercase"
                      >
                        {brand.name.substring(0, 2)}
                      </div>
                    </div>

                    {/* Brand Identity */}
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2 group-hover:text-primary transition-colors">
                      {brand.name}
                    </h3>

                    {brand.country_of_origin && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold tracking-wider uppercase mb-4">
                        <Globe size={14} className="text-primary" />
                        <span>{t('brandsPage.origin')} <strong className="text-slate-600 font-black">{brand.country_of_origin}</strong></span>
                      </div>
                    )}

                    {brand.description && (
                      <p className="text-slate-500 text-sm leading-relaxed font-medium line-clamp-3 mb-6">
                        {brand.description}
                      </p>
                    )}
                  </div>

                  {/* Call to Action Button */}
                  <div className="pt-4 border-t border-slate-50 mt-6">
                    <Link
                      to={`/brand/${brand.slug}`}
                      className="inline-flex items-center gap-2 text-xs font-black tracking-widest text-slate-900 group-hover:text-primary uppercase transition-colors"
                    >
                      {t('brandsPage.explore')}
                      <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform duration-300 stroke-[3]" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default BrandsPage;
