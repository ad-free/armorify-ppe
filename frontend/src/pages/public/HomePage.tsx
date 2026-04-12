// src/pages/public/HomePage.tsx
import React from 'react';
import { SeoHead } from '@/components/common/SeoHead';
import { HeroSlider } from '@/components/home/HeroSlider';
import { TrustBar } from '@/components/home/TrustBar';
import { CategoryFloor } from '@/components/home/CategoryFloor';
import { useProducts } from '@/hooks/useCatalog';

const HomePage: React.FC = () => {
  // In a real production app, we would query by specific category_id
  // Here we use mock limit queries mapped to standard API endpoints as placeholders
  const { data: shoesData, isLoading: shoesLoading } = useProducts({ limit: 8 });
  const { data: helmetData, isLoading: helmetLoading } = useProducts({ limit: 8, skip: 8 });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <SeoHead
        title="NBE Hoang Duy | Bảo Hộ Lao Động Chính Hãng"
        description="Đại lý thiết bị bảo hộ lao động lớn nhất Việt Nam. Cung cấp giày bảo hộ, mũ an toàn, dây đai với giá sỉ tốt nhất thị trường."
      />

      {/* 1. Dynamic Hero Slider block */}
      <HeroSlider />

      {/* 2. Trust factors */}
      <TrustBar />

      <div className="container mx-auto px-4 max-w-7xl pt-12 pb-6">
        <div className="bg-gradient-to-r from-primary to-emerald-400 rounded-2xl p-6 text-white shadow-soft flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black mb-1">🔥 ƯU ĐÃI THÁNG 4</h2>
            <p className="font-medium text-emerald-50">Nhập mã NBEHOANGDUY26 để giảm 10% khi mua tại Website</p>
          </div>
          <button className="bg-white text-primary font-bold px-6 py-2 rounded-lg hover:bg-gray-100 transition shadow">
            Sao chép mã
          </button>
        </div>
      </div>

      {/* 3. Category Floors (Garan Architecture) */}
      <CategoryFloor
        title="TẦNG 1. GIÀY VÀ ỦNG BẢO HỘ"
        subtitle="Hơn 500+ mẫu giày siêu nhẹ, chống đập, chống đinh"
        bannerImage="/shoes_banner.png"
        categorySlug="giay-bao-ho"
        products={shoesData?.items || []}
        loading={shoesLoading}
      />

      <CategoryFloor
        title="TẦNG 2. MŨ BẢO HỘ LAO ĐỘNG"
        subtitle="Đạt chuẩn kiểm định chất lượng châu Âu"
        bannerImage="/helmet_banner.png"
        categorySlug="mu-bao-ho"
        products={helmetData?.items || []}
        loading={helmetLoading}
      />
    </div>
  );
};

export default HomePage;
