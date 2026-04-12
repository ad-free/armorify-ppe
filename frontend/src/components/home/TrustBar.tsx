// src/components/home/TrustBar.tsx
import React from 'react';
import { Truck, ShieldCheck, HeadphonesIcon, RotateCcw } from 'lucide-react';

const badges = [
  {
    icon: <Truck className="w-8 h-8 text-primary" strokeWidth={1.5} />,
    title: 'Miễn phí vận chuyển',
    desc: 'Đơn hàng từ 1.000.000đ',
  },
  {
    icon: <ShieldCheck className="w-8 h-8 text-primary" strokeWidth={1.5} />,
    title: 'Cam kết chính hãng',
    desc: 'Bồi thường mặt hàng giả',
  },
  {
    icon: <RotateCcw className="w-8 h-8 text-primary" strokeWidth={1.5} />,
    title: 'Bảo hành uy tín',
    desc: 'Hỗ trợ đổi trả trong 7 ngày',
  },
  {
    icon: <HeadphonesIcon className="w-8 h-8 text-primary" strokeWidth={1.5} />,
    title: 'Tư vấn nhiệt tình',
    desc: 'Hotline 24/7',
  }
];

export const TrustBar: React.FC = () => {
  return (
    <div className="bg-white border-b py-6 md:py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4">
          {badges.map((badge, idx) => (
            <div key={idx} className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 text-center md:text-left group cursor-default">
              <div className="bg-primary/5 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
                {badge.icon}
              </div>
              <div>
                <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors text-sm md:text-base">
                  {badge.title}
                </h4>
                <p className="text-gray-500 text-xs md:text-sm mt-0.5">
                  {badge.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
