import React, { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { MessageSquare, Star } from 'lucide-react';
import { PaginationControls } from '../common/PaginationControls';
import { Button, FeedbackState, Skeleton } from '@/components/ui/Primitives';
import { useProductReviews, useSubmitReview } from '@/hooks/useCatalog';
import { reviewSchema } from '@/lib/schemas';
import { useAuthStore } from '@/store/authStore';

interface Props {
  productId: string;
  ratingAvg: string | null;
  ratingCount: number;
}

type ReviewFormValues = z.infer<typeof reviewSchema>;

export const ReviewSection: React.FC<Props> = ({ productId, ratingAvg, ratingCount }) => {
  const id = useId();
  const [skip, setSkip] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const limit = 10;
  const { data, isLoading, isError, isFetching, refetch } = useProductReviews(productId, skip, limit);
  const { mutate, isPending } = useSubmitReview(productId);
  const { user, accessToken } = useAuthStore();
  const isAuthenticated = !!accessToken;
  const { register, handleSubmit, reset, setError, clearErrors, formState: { errors } } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 5, body: '' },
  });

  const onSubmit = (values: ReviewFormValues) => {
    clearErrors('root');
    mutate(values, {
      onSuccess: () => {
        toast.success('Đánh giá đang chờ duyệt — cảm ơn bạn!');
        setFormOpen(false);
        reset();
      },
      onError: (err: unknown) => {
        const errorResponse = err as { response?: { data?: { detail?: unknown } } };
        const detail = errorResponse.response?.data?.detail;
        const message = typeof detail === 'string' ? detail : 'Không thể gửi đánh giá. Vui lòng thử lại.';
        setError('root.server', { message });
        toast.error(message);
      },
    });
  };

  const hasReviews = !isLoading && !isError && !!data && data.total > 0 && data.items.length > 0;
  const rawDistribution = data?.extra?.distribution;
  const distribution = rawDistribution && typeof rawDistribution === 'object' && !Array.isArray(rawDistribution)
    ? rawDistribution as Record<string, unknown>
    : null;
  const stars = [5, 4, 3, 2, 1];
  const hasDistribution = hasReviews && !!distribution && stars.every((star) => {
    const count = distribution[String(star)];
    return typeof count === 'number' && Number.isInteger(count) && count >= 0;
  }) && stars.reduce((total, star) => total + (distribution[String(star)] as number), 0) === data.total;
  const propAverage = ratingAvg === null ? NaN : Number(ratingAvg);
  const average = hasDistribution
    ? stars.reduce((total, star) => total + star * (distribution![String(star)] as number), 0) / data!.total
    : hasReviews && ratingCount === data.total && Number.isFinite(propAverage) && propAverage >= 1 && propAverage <= 5
      ? propAverage
      : null;

  return (
    <section aria-labelledby={`${id}-heading`} className="mt-8 min-w-0 rounded-lg border border-border bg-surface p-4 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 id={`${id}-heading`} className="section-heading">Đánh giá sản phẩm</h2>
        {hasReviews && <span className="text-sm text-muted-foreground">{data.total} đánh giá</span>}
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <aside className="min-w-0 space-y-6">
          {hasReviews && average !== null && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">{average.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground">/ 5 · {data.total} đánh giá</span>
              </div>
              {hasDistribution && (
                <ul aria-label="Phân bố đánh giá" className="space-y-3">
                  {stars.map((star) => {
                    const count = distribution![String(star)] as number;
                    return (
                      <li key={star} className="flex items-center gap-3 text-sm">
                        <span className="shrink-0 text-muted-foreground">{star} sao</span>
                        <div aria-hidden="true" className="h-2 min-w-0 flex-1 overflow-hidden rounded-sm bg-muted">
                          <div className="h-full bg-primary" style={{ width: `${count / data.total * 100}%` }} />
                        </div>
                        <span className="min-w-6 text-right tabular-nums text-foreground">
                          <span className="sr-only">{star} sao: </span>{count}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          <div className="rounded-md border border-border bg-background p-4">
            <h3 className="mb-2 text-base font-semibold text-foreground">Chia sẻ trải nghiệm</h3>
            <p className="mb-4 text-sm leading-6 text-muted-foreground">Đánh giá của bạn giúp khách hàng khác lựa chọn sản phẩm phù hợp.</p>
            {isAuthenticated ? (
              <Button
                variant="secondary"
                className="w-full"
                disabled={isPending}
                aria-expanded={formOpen}
                aria-controls={`${id}-form`}
                onClick={() => setFormOpen(!formOpen)}
              >
                <MessageSquare size={16} aria-hidden="true" />
                {formOpen ? 'Đóng biểu mẫu' : 'Viết đánh giá'}
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Vui lòng đăng nhập để gửi đánh giá.</p>
                <Link to="/login" className="btn btn-secondary w-full">Đăng nhập</Link>
              </div>
            )}
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          {formOpen && isAuthenticated && (
            <form id={`${id}-form`} onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 rounded-md border border-border bg-background p-4 sm:p-6">
              <div>
                <h3 className="text-base font-semibold text-foreground">Viết đánh giá</h3>
                <p className="mt-1 break-words text-sm text-muted-foreground">{user?.firstname} {user?.lastname} · Đánh giá sẽ hiển thị sau khi được duyệt.</p>
              </div>
              <div>
                <label htmlFor={`${id}-rating`} className="field-label">Chất lượng sản phẩm</label>
                <select
                  id={`${id}-rating`}
                  {...register('rating', { valueAsNumber: true })}
                  className="field"
                  disabled={isPending}
                  aria-invalid={!!errors.rating}
                  aria-describedby={errors.rating ? `${id}-rating-error` : undefined}
                >
                  {stars.map((star) => <option key={star} value={star}>{star} sao</option>)}
                </select>
                {errors.rating && <p id={`${id}-rating-error`} className="field-error">{errors.rating.message}</p>}
              </div>
              <div>
                <label htmlFor={`${id}-body`} className="field-label">Nội dung đánh giá (tùy chọn)</label>
                <textarea
                  id={`${id}-body`}
                  {...register('body')}
                  className="field min-h-32 resize-y"
                  rows={4}
                  maxLength={1000}
                  disabled={isPending}
                  placeholder="Chia sẻ trải nghiệm sử dụng sản phẩm..."
                  aria-invalid={!!errors.body}
                  aria-describedby={`${id}-body-hint${errors.body ? ` ${id}-body-error` : ''}`}
                />
                <p id={`${id}-body-hint`} className="mt-1 text-xs text-muted-foreground">Tối đa 1.000 ký tự.</p>
                {errors.body && <p id={`${id}-body-error`} className="field-error">{errors.body.message}</p>}
              </div>
              {errors.root?.server && <p role="alert" className="field-error">{errors.root.server.message}</p>}
              <div className="flex flex-wrap justify-end gap-3">
                <Button type="submit" loading={isPending} className="w-full sm:w-auto">
                  {isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
                </Button>
              </div>
            </form>
          )}

          {isLoading ? (
            <div role="status" aria-label="Đang tải đánh giá" className="space-y-4">
              <p className="text-sm text-muted-foreground">Đang tải đánh giá...</p>
              {[0, 1, 2].map((index) => (
                <div key={index} className="space-y-3 rounded-md border border-border p-4">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : isError || !data ? (
            <FeedbackState variant="error" title="Không thể tải đánh giá" description="Vui lòng thử lại để xem đánh giá của sản phẩm.">
              <Button variant="secondary" disabled={isFetching} onClick={() => void refetch()}>
                {isFetching ? 'Đang thử lại...' : 'Thử lại'}
              </Button>
            </FeedbackState>
          ) : data.items.length === 0 ? (
            <FeedbackState
              title={data.total > 0 ? 'Không có đánh giá ở trang này' : 'Chưa có đánh giá'}
              description={data.total > 0 ? 'Trở về trang đầu để xem các đánh giá hiện có.' : 'Hãy chia sẻ trải nghiệm thực tế của bạn về sản phẩm.'}
            >
              {skip > 0 && <Button variant="secondary" onClick={() => setSkip(0)}>Về trang đầu</Button>}
            </FeedbackState>
          ) : (
            <div className="space-y-4">
              <ul className="divide-y divide-border">
                {data.items.map((review) => (
                  <li key={review.id} className="min-w-0 py-4 first:pt-0">
                    <article className="space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="break-words text-sm font-semibold text-foreground">{review.author_name}</h3>
                          <time dateTime={review.created_at} className="mt-1 block text-xs text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </time>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-foreground" aria-label={`Đánh giá ${review.rating} trên 5 sao`}>
                          <Star size={16} className="text-primary" aria-hidden="true" />
                          {review.rating}/5
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
                        {review.body || 'Người dùng không để lại bình luận.'}
                      </p>
                    </article>
                  </li>
                ))}
              </ul>
              {data.total > limit && <PaginationControls skip={skip} limit={limit} total={data.total} onPageChange={setSkip} />}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
