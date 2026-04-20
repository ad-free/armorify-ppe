// src/components/home/FlashSaleRow.tsx — FastKart green primary style
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, ArrowRight } from 'lucide-react';
import { ProductCard } from '../catalog/ProductCard';
import { Link } from 'react-router-dom';
import type { ProductRead } from '@/types/api';

interface Props {
  products: ProductRead[];
  loading?: boolean;
}

export const FlashSaleRow: React.FC<Props> = ({ products, loading }) => {
  const [timeLeft, setTimeLeft] = useState<{h: number, m: number, s: number}>({ h: 11, m: 59, s: 59 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { h, m, s } = prev;
        s -= 1;
        if (s < 0) { s = 59; m -= 1; }
        if (m < 0) { m = 59; h -= 1; }
        if (h < 0) { h = 23; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <section className="py-6 my-4">
      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-6">
          {/* Title block */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center">
              <Zap className="fill-destructive text-destructive" size={26} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 leading-none tracking-tight">Deal Chớp Nhoáng</h2>
              <p className="text-sm text-gray-400 font-bold mt-1.5 uppercase tracking-wider">Ưu đãi kết thúc sau:</p>
            </div>
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 font-black text-lg">
              {[
                { val: pad(timeLeft.h), label: 'H' },
                { val: pad(timeLeft.m), label: 'M' },
                { val: pad(timeLeft.s), label: 'S' }
              ].map((unit, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="bg-destructive text-white px-3 py-2 rounded-xl min-w-[44px] text-center shadow-lg shadow-destructive/20 scale-105">
                    {unit.val}
                  </div>
                  {i < 2 && <span className="text-destructive animate-pulse">:</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <Link
          to="/sale"
          className="group flex items-center gap-2 text-gray-900 font-black text-sm hover:text-primary transition-colors"
        >
          XEM TẤT CẢ <ArrowRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Border-top accent FastKart style */}
      <div className="h-0.5 w-full bg-gray-100 rounded-full mb-8 relative">
          <div className="absolute top-0 left-0 h-full w-32 bg-destructive rounded-full" />
      </div>

      {/* Products */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {loading && Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-gray-100 animate-pulse rounded-2xl h-72" />
        ))}
        {!loading && products.slice(0, 5).map((product, idx) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.08 }}
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
        {!loading && products.length === 0 && (
          <div className="col-span-full text-center text-gray-400 py-10 text-sm">
            Chưa có sản phẩm khuyến mãi hôm nay.
          </div>
        )}
      </div>
    </section>
  );
};
