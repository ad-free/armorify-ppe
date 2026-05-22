// src/pages/public/HomePage.tsx — Optimized Premium Layout
import React from 'react';
import { SeoHead } from '@/components/common/SeoHead';
import { HeroSlider } from '@/components/home/HeroSlider';
import { TrustBar } from '@/components/home/TrustBar';
import { FlashSaleRow } from '@/components/home/FlashSaleRow';
import { CategoryFloor } from '@/components/home/CategoryFloor';
import { TabbedCategorySection } from '@/components/home/TabbedCategorySection';
import { LatestBlogSection } from '@/components/home/LatestBlogSection';
import { BrandSection } from '@/components/home/BrandSection';
import { useProducts, useActiveFlashSale, useCategories } from '@/hooks/useCatalog';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const MidBanner: React.FC<{
  bg: string; image: string; title: string; sub: string; to: string; btnColor: string; eyebrow?: string;
}> = ({ bg, image, title, sub, to, btnColor, eyebrow = 'Bộ Sưu Tập' }) => (
  <Link
    to={to}
    className="relative rounded-[2.5rem] overflow-hidden group flex items-center px-8 md:px-12 py-12 min-h-[280px] transition-all duration-700 hover:-translate-y-2 hover:shadow-2xl active:scale-[0.98]"
    style={{ background: bg }}
  >
    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-700" />
    <div className="flex-1 z-10 relative">
      <p className="text-white/90 text-[11px] font-black uppercase tracking-[0.3em] mb-4 drop-shadow-md">{eyebrow}</p>
      <h3 className="text-white font-black text-3xl md:text-4xl leading-[1.2] mb-4 whitespace-pre-line tracking-tight drop-shadow-md">{title}</h3>
      <p className="text-white/90 text-sm mb-8 font-medium max-w-[260px] leading-relaxed drop-shadow-sm">{sub}</p>
      <span className={`inline-flex items-center gap-2 text-white font-black text-xs px-8 py-3.5 rounded-xl transition-all shadow-lg ${btnColor}`}>
        XEM NGAY <ChevronRight size={16} strokeWidth={3} />
      </span>
    </div>
    <div className="absolute right-[-5%] bottom-[-10%] w-[55%] h-[120%] flex items-center justify-center select-none pointer-events-none group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-700">
      {image.startsWith('http') || image.startsWith('/') ? (
        <img src={image} alt="Banner" className="w-full h-full object-contain drop-shadow-2xl filter contrast-125" />
      ) : (
        <div className="text-[160px] opacity-20 filter blur-[2px]">{image}</div>
      )}
    </div>
  </Link>
);

const HomePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();
  
  const shoesCategoryId = categories?.find(c => c.slug === 'giay-bao-ho')?.id;
  const helmetCategoryId = categories?.find(c => c.slug === 'mu-bao-ho')?.id;

  const { data: shoesData, isLoading: shoesLoading } = useProducts(
    { category_id: shoesCategoryId, limit: 8 },
    { enabled: !!shoesCategoryId }
  );
  
  const { data: helmetData, isLoading: helmetLoading } = useProducts(
    { category_id: helmetCategoryId, limit: 8 },
    { enabled: !!helmetCategoryId }
  );
  
  const { data: activeFlash, isLoading: flashLoading } = useActiveFlashSale();

  const handleFlashEnd = () => {
    queryClient.invalidateQueries({ queryKey: ['active-flash-sale'] });
  };

  return (
    <div className="bg-[#f4f7f7]">
      <SeoHead
        title="NBE Hoang Duy | Bảo Hộ Lao Động Cao Cấp & Chính Hãng"
        description="Đại lý phân phối thiết bị bảo hộ lao động hàng đầu Việt Nam. Giày bảo hộ, mũ bảo hiểm, quần áo chống hóa chất chuẩn quốc tế."
      />

      {/* ① Hero Slider (Full Impact) */}
      <div className="bg-white">
        <HeroSlider />
      </div>

      {/* ② Trust Bar (Assurance) */}
      <TrustBar />

      {/* ③ Flash Sale Section (Urgency) */}
      {activeFlash && (
        <div className="bg-white py-12 border-y border-gray-100 animate-in fade-in duration-700">
          <div className="container mx-auto">
            <FlashSaleRow
              products={activeFlash.products || []}
              loading={flashLoading}
              targetDate={activeFlash.end_at}
              title={activeFlash.name}
              onEnd={handleFlashEnd}
            />
          </div>
        </div>
      )}

      {/* ⑤ Mid Promo Banners — 2 column (Curated Content) */}
      <div className="container mx-auto py-20 px-4 md:px-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <MidBanner
            bg="linear-gradient(135deg, #059669 0%, #064e3b 100%)"
            image="https://res.cloudinary.com/dpvjfqm1u/image/upload/v1738734612/3m-respirator_yxg00w.png"
            eyebrow="Phân Phối Chính Hãng"
            title={`Giải Pháp An Toàn\nTừ Hãng 3M`}
            sub="Trang bị mặt nạ phòng độc và thiết bị bảo hộ tiên tiến nhất hiện nay."
            to="/categories"
            btnColor="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20"
          />
          <MidBanner
            bg="linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)"
            image="https://res.cloudinary.com/dpvjfqm1u/image/upload/v1738734612/safety-helmet_j55w0j.png"
            eyebrow="Tiêu Chuẩn Châu Âu"
            title={`Mũ Bảo Hộ\nChống Va Đập`}
            sub="Vỏ nhựa ABS chịu lực cao, thiết kế tối ưu cho mọi công trình và điều kiện khắc nghiệt."
            to="/categories/mu-bao-ho"
            btnColor="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
          />
        </div>
      </div>

      {/* ⑥ Category Floor 1 (Featured Category) */}
      <div className="bg-white py-20">
        <div className="container mx-auto">
          <CategoryFloor
            title="Giày & Ủng Bảo Hộ"
            subtitle="An toàn trên từng bước chân với công nghệ đế Kevlar chống đinh tuyệt đối"
            bannerImage="/shoes_banner.png"
            categorySlug="giay-bao-ho"
            products={shoesData?.items || []}
            loading={shoesLoading}
          />
        </div>
      </div>

      {/* ⑦ Category Floor 2 (Secondary Category) */}
      <div className="bg-[#f4f7f7] py-20">
        <div className="container mx-auto">
          <CategoryFloor
            title="Mũ Bảo Hộ Chuyên Dụng"
            subtitle="Kết hợp kính che mặt và tai chống ồn - giải pháp bảo vệ toàn diện"
            bannerImage="/helmet_banner.png"
            categorySlug="mu-bao-ho"
            products={helmetData?.items || []}
            loading={helmetLoading}
          />
        </div>
      </div>

      {/* ⑧ Tabbed Category Floor (All Other Categories) */}
      <TabbedCategorySection excludeSlugs={['giay-bao-ho', 'mu-bao-ho']} />

      {/* ⑨ Knowledge Section (Value Content) */}
      <LatestBlogSection />

      {/* ⑩ Partnership Section (Authority) */}
      <BrandSection />
    </div>
  );
};

export default HomePage;

