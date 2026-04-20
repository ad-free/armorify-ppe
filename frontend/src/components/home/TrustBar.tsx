// src/components/home/TrustBar.tsx — FastKart inline trust strip
import React from 'react';
import { Truck, ShieldCheck, HeadphonesIcon, RotateCcw } from 'lucide-react';

const badges = [
  { icon: Truck, title: 'Miễn Phí Vận Chuyển', desc: 'Đơn từ 500.000đ', color: 'text-primary' },
  { icon: ShieldCheck, title: 'Hàng Chính Hãng 100%', desc: 'Cam kết hoàn tiền', color: 'text-blue-500' },
  { icon: RotateCcw, title: 'Đổi Trả 7 Ngày', desc: 'Miễn phí đổi trả', color: 'text-purple-500' },
  { icon: HeadphonesIcon, title: 'Hỗ Trợ 24/7', desc: 'Hotline: 1900 1234', color: 'text-amber-500' },
];

export const TrustBar: React.FC = () => {
  return (
    <div className="bg-white border-y border-gray-100 py-3 mb-2">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 divide-x divide-gray-100 hidden sm:grid">
          {badges.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-4 px-8 py-4 group transition-colors cursor-default border-transparent border hover:bg-[#f3f7f7] rounded-2xl"
              >
                <div className={`${badge.color} flex-shrink-0 bg-white shadow-sm w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon size={28} strokeWidth={1.5} />
                </div>
                <div className="flex flex-col">
                  <h4 className="font-black text-gray-900 text-[15px] leading-tight tracking-tight">{badge.title}</h4>
                  <p className="text-gray-400 text-xs font-bold mt-1 uppercase tracking-tighter">{badge.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

