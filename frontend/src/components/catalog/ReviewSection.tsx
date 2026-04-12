// src/components/catalog/ReviewSection.tsx
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
      onError: () => {
        toast.error("Đã xảy ra lỗi. Vui lòng thử lại.");
      }
    });
  };

  const displayAvg = ratingAvg ? Number(ratingAvg).toFixed(1) : '0.0';

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Đánh giá sản phẩm</h2>
      
      {/* Summary */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 bg-gray-50 p-6 rounded-lg mb-8">
        <div className="flex flex-col items-center">
          <span className="text-4xl font-bold">{displayAvg}</span>
          <StarRating value={Number(ratingAvg || 0)} size="md" />
          <span className="text-sm text-muted-foreground mt-1">{ratingCount} đánh giá</span>
        </div>
        <div className="flex-1 w-full flex justify-end">
          <button
            onClick={() => setFormOpen(!formOpen)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium"
          >
            Viết đánh giá
          </button>
        </div>
      </div>

      {/* Form */}
      <AnimatePresence>
        {formOpen && (
          <motion.div
            layout
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-8"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white border rounded-lg p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên của bạn</label>
                <input
                  {...register('author_name')}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="Nhập tên của bạn"
                />
                {errors.author_name && <span className="text-red-500 text-xs">{errors.author_name.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Đánh giá</label>
                <StarRating
                  value={ratingValue}
                  interactive
                  onChange={(v) => setValue('rating', v)}
                  size="lg"
                />
                {errors.rating && <span className="text-red-500 text-xs">{errors.rating.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nội dung (tùy chọn)</label>
                <textarea
                  {...register('body')}
                  className="w-full border rounded-md px-3 py-2 h-24"
                  placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này"
                />
                {errors.body && <span className="text-red-500 text-xs">{errors.body.message}</span>}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2 rounded-md border"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium disabled:opacity-50"
                >
                  {isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review List */}
      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Đang tải đánh giá...</div>
      ) : data?.items.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">Chưa có đánh giá nào cho sản phẩm này.</div>
      ) : (
        <div className="flex flex-col gap-6">
          {data?.items.map((review) => (
            <div key={review.id} className="border-b pb-6">
              <div className="flex items-center gap-2 mb-2">
                <StarRating value={review.rating} size="sm" />
                <span className="font-medium flex-1">{review.author_name}</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString('vi-VN')}
                </span>
              </div>
              {review.body && <p className="text-gray-700">{review.body}</p>}
            </div>
          ))}

          {data && data.total > limit && (
            <PaginationControls
              skip={skip}
              limit={limit}
              total={data.total}
              onPageChange={setSkip}
            />
          )}
        </div>
      )}
    </div>
  );
};
