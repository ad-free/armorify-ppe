// src/pages/public/HomePage.tsx — Optimized Premium Layout
import React from 'react';
import { SeoHead } from '@/components/common/SeoHead';
import { HeroSlider } from '@/components/home/HeroSlider';
import { TrustBar } from '@/components/home/TrustBar';
import { FlashSaleRow } from '@/components/home/FlashSaleRow';
import { CategoryFloor } from '@/components/home/CategoryFloor';
import { LatestBlogSection } from '@/components/home/LatestBlogSection';
import { BrandSection } from '@/components/home/BrandSection';
import { useProducts } from '@/hooks/useCatalog';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const MidBanner: React.FC<{
  bg: string; emoji: string; title: string; sub: string; to: string; btnColor: string;
}> = ({ bg, emoji, title, sub, to, btnColor }) => (
  <Link
    to={to}
    className="relative rounded-[3rem] overflow-hidden group flex items-center px-12 py-12 min-h-[200px] transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl active:scale-[0.98]"
    style={{ background: bg }}
  >
    <div className="flex-1 z-10 relative">
      <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Ưu đãi độc quyền</p>
      <h3 className="text-white font-black text-3xl leading-tight mb-4 whitespace-pre-line tracking-tight">{title}</h3>
      <p className="text-white/70 text-sm mb-8 font-medium max-w-[240px] leading-relaxed">{sub}</p>
      <span className={`inline-flex items-center gap-3 text-white font-black text-xs px-8 py-3.5 rounded-2xl transition-all shadow-xl ${btnColor}`}>
        Xem ngay <ChevronRight size={16} strokeWidth={3} />
      </span>
    </div>
    <div className="absolute right-[-20px] bottom-[-20px] flex items-center opacity-10 text-[220px] leading-none select-none pointer-events-none group-hover:opacity-20 transition-all group-hover:scale-110 group-hover:rotate-12 duration-700">
      {emoji}
    </div>
  </Link>
);

const HomePage: React.FC = () => {
  const { data: shoesData, isLoading: shoesLoading } = useProducts({ limit: 8 });
  const { data: helmetData, isLoading: helmetLoading } = useProducts({ limit: 8, skip: 8 });
  const { data: flashData, isLoading: flashLoading } = useProducts({ limit: 5, skip: 5 });

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
      <div className="bg-white py-12 border-y border-gray-100">
        <div className="container mx-auto">
          <FlashSaleRow products={flashData?.items || []} loading={flashLoading} />
        </div>
      </div>

      {/* ⑤ Mid Promo Banners — 2 column (Curated Content) */}
      <div className="container mx-auto py-20 px-4 md:px-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <MidBanner
            bg="linear-gradient(135deg, #0da487 0%, #007d64 100%)"
            emoji="🔖"
            title={`Săn Deal Hãng 3M
Giảm Tới 30%`}
            sub="Trọn bộ trang bị phòng sạch và chống độc tiên tiến nhất 2026."
            to="/sale"
            btnColor="bg-white/20 hover:bg-white/30 backdrop-blur-md"
          />
          <MidBanner
            bg="linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%)"
            emoji="⛑️"
            title={`Mũ Bảo Hộ
Chuẩn EU`}
            sub="Vỏ nhựa ABS chịu lực cao, siêu bền bỉ trong mọi điều kiện thời tiết."
            to="/categories/mu-bao-ho"
            btnColor="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
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

      {/* ⑧ Knowledge Section (Value Content) */}
      <LatestBlogSection />

      {/* ⑨ Partnership Section (Authority) */}
      <BrandSection />

      {/* ⑩ Newsletter / CTA (Community) */}
      <div className="bg-gray-900 py-24 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute -top-48 -left-48 w-[600px] h-[600px] bg-primary rounded-full blur-[180px]" />
          <div className="absolute -bottom-48 -right-48 w-[600px] h-[600px] bg-secondary rounded-full blur-[180px]" />
        </div>
        <div className="container mx-auto text-center text-white relative z-10 px-6">
          <span className="text-primary font-black text-[11px] tracking-[0.4em] uppercase mb-4 block">Subscribe</span>
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">Gia Nhập Cộng Đồng NBE Hoang Duy</h2>
          <p className="text-gray-400 mb-12 text-base md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            Nhận mã giảm giá <span className="text-primary font-black">20%</span> cho đơn hàng đầu tiên và cẩm nang an toàn lao động miễn phí.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 max-w-2xl mx-auto bg-white/5 p-3 rounded-[3rem] border border-white/10 backdrop-blur-2xl shadow-2xl">
            <input
              type="email"
              placeholder="Nhập địa chỉ email của bạn..."
              className="flex-1 px-10 py-5 rounded-full bg-transparent text-white placeholder-gray-500 font-bold focus:outline-none text-lg"
            />
            <button className="px-12 py-5 bg-primary text-white font-black rounded-full hover:bg-primary/90 transition-all hover:shadow-2xl hover:shadow-primary/40 whitespace-nowrap active:scale-95 text-sm uppercase tracking-widest">
              Đăng Ký Ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

