import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { StarRating } from './StarRating';
import { PaginationControls } from '../common/PaginationControls';
import { useProductReviews, useSubmitReview } from '@/hooks/useCatalog';
import { reviewSchema } from '@/lib/schemas';
import { useAuthStore } from '@/store/authStore';
import { User, MessageSquare, Star } from 'lucide-react';

interface Props {
  productId: string;
  ratingAvg: string | null;
  ratingCount: number;
}

type ReviewFormValues = z.infer<typeof reviewSchema>;

export const ReviewSection: React.FC<Props> = ({ productId, ratingAvg, ratingCount }) => {
  const [skip, setSkip] = useState(0);
  const limit = 10;
  const { data, isLoading } = useProductReviews(productId, skip, limit);
  const { mutate, isPending } = useSubmitReview(productId);
  const { user, accessToken } = useAuthStore();
  const isAuthenticated = !!accessToken;

  const [formOpen, setFormOpen] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 5 },
  });

  const ratingValue = watch('rating');

  const onSubmit = (values: ReviewFormValues) => {
    mutate(values, {
      onSuccess: () => {
        toast.success("Đánh giá đang chờ duyệt — cảm ơn bạn!");
        setFormOpen(false);
        reset();
      },
      onError: (err: unknown) => {
        const errorResponse = err as { response?: { data?: { detail?: string } } };
        const msg = errorResponse.response?.data?.detail || "Đã xảy ra lỗi. Vui lòng thử lại.";
        toast.error(msg);
      }
    });
  };

  // Calculate distribution from backend extra or items
  const distribution = (data?.extra?.distribution ?? { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 }) as Record<string, number>;
  
  // Calculate local stats to be more robust if props are stale
  const localRatingCount = Object.values(distribution).reduce((a, b) => a + Number(b), 0);
  const totalPoints = Object.entries(distribution).reduce((acc, [star, count]) => acc + Number(star) * Number(count), 0);
  const localRatingAvg = localRatingCount > 0 ? totalPoints / localRatingCount : 0;

  const displayAvg = localRatingAvg > 0 ? localRatingAvg.toFixed(2) : (ratingAvg ? Number(ratingAvg).toFixed(2) : '0.00');
  const displayCount = localRatingCount > 0 ? localRatingCount : ratingCount;

  return (
    <div className="mt-16 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left Column: Summary */}
        <div className="lg:w-1/3">
          <div className="sticky top-24">
            <h2 className="text-4xl font-black text-slate-900 mb-2">{displayAvg} <span className="text-amber-400 text-3xl">★</span></h2>
            <p className="text-slate-500 font-medium mb-8">{displayCount} đánh giá tổng quan</p>

            {/* Distribution Bars */}
            <div className="space-y-4 mb-10">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = (distribution[star.toString()] || 0) as number;
                const percentage = displayCount > 0 ? (count / displayCount) * 100 : 0;
                
                const barColor = 
                  star >= 4 ? 'bg-emerald-500' : 
                  star === 3 ? 'bg-amber-400' : 
                  star === 2 ? 'bg-orange-400' : 'bg-rose-500';
                
                return (
                  <div key={star} className="flex items-center gap-4">
                    <div className="flex items-center gap-1 w-8">
                      <span className="text-sm font-bold text-slate-700">{star}</span>
                      <Star className="w-3 h-3 fill-slate-300 text-slate-300" />
                    </div>
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className={`h-full rounded-full ${barColor}`}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-400 w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Write Review Button */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-1">Đánh giá sản phẩm này</h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">Hãy cho những khách hàng khác biết suy nghĩ của bạn về sản phẩm.</p>
              
              {isAuthenticated ? (
                <button
                  onClick={() => setFormOpen(!formOpen)}
                  className="w-full flex items-center justify-center gap-2 bg-white text-slate-900 border border-slate-200 py-3 rounded-xl font-bold text-sm hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  {formOpen ? 'Đóng lại' : 'Viết đánh giá'}
                </button>
              ) : (
                <div className="text-center p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-xs text-amber-700 font-bold mb-2">Vui lòng đăng nhập để gửi đánh giá</p>
                  <button 
                    onClick={() => window.location.href = '/login'}
                    className="text-xs font-black uppercase tracking-widest text-amber-900 underline underline-offset-4"
                  >
                    Đăng nhập ngay
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Reviews & Form */}
        <div className="flex-1">
          {/* Form */}
          <AnimatePresence>
            {formOpen && isAuthenticated && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-12"
              >
                <form onSubmit={handleSubmit(onSubmit)} className="bg-slate-50/50 p-8 rounded-3xl border border-slate-200 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold">
                      {user?.firstname?.[0]}{user?.lastname?.[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{user?.firstname} {user?.lastname}</p>
                      <p className="text-xs text-slate-500">Đang thực hiện đánh giá</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">Chất lượng sản phẩm</label>
                    <StarRating
                      value={ratingValue}
                      interactive
                      onChange={(v) => setValue('rating', v)}
                      size="lg"
                    />
                    {errors.rating && <p className="text-rose-500 text-xs mt-2 font-medium">{errors.rating.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">Nội dung chi tiết (tùy chọn)</label>
                    <textarea
                      {...register('body')}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 h-32 focus:ring-2 focus:ring-slate-900 outline-none transition-all resize-none text-slate-700"
                      placeholder="Sản phẩm này như thế nào? Chất lượng và dịch vụ ra sao?..."
                    />
                    {errors.body && <p className="text-rose-500 text-xs mt-2 font-medium">{errors.body.message}</p>}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-slate-200"
                    >
                      {isPending ? 'Đang gửi...' : 'Gửi đánh giá công khai'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Review List */}
          <div className="space-y-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                <p className="text-slate-400 font-bold text-sm animate-pulse">Đang tải các đánh giá...</p>
              </div>
            ) : data?.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                <Star className="w-12 h-12 text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold text-sm">Chưa có đánh giá nào cho sản phẩm này</p>
                <p className="text-slate-300 text-xs mt-1">Hãy là người đầu tiên trải nghiệm và đánh giá!</p>
              </div>
            ) : (
              <div className="space-y-8">
                {data?.items.map((review) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    key={review.id} 
                    className="flex gap-5 group"
                  >
                    <div className="shrink-0">
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-slate-50 group-hover:border-slate-100 transition-colors bg-slate-50 flex items-center justify-center">
                        {review.author_avatar ? (
                          <img src={review.author_avatar} alt={review.author_name!} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 bg-slate-50/30 group-hover:bg-slate-50/60 p-6 rounded-3xl transition-all border border-slate-100">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                        <h4 className="font-black text-slate-900 text-sm">{review.author_name}</h4>
                        <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-300" />
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                          {new Date(review.created_at).toLocaleDateString('vi-VN', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <div className="sm:ml-auto flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3 h-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-600 leading-relaxed text-sm">
                        {review.body || "Người dùng không để lại bình luận nội dung."}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {data && data.total > limit && (
                  <div className="pt-8 border-t border-slate-100">
                    <PaginationControls
                      skip={skip}
                      limit={limit}
                      total={data.total}
                      onPageChange={setSkip}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
