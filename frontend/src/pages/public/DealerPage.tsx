// src/pages/public/DealerPage.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Handshake, TrendingUp, Truck, ShieldCheck, Mail, Phone, Building, Info, MessageSquare } from 'lucide-react';
import { SeoHead } from '@/components/common/SeoHead';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { dealerInquirySchema } from '@/lib/schemas';
import { POST } from '@/lib/api';

type DealerFormValues = z.infer<typeof dealerInquirySchema>;

const DealerPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DealerFormValues>({
    resolver: zodResolver(dealerInquirySchema)
  });

  const onSubmit = async (values: DealerFormValues) => {
    setIsSubmitting(true);
    try {
      await POST('/api/v1/orders/guest', {
        type: 'dealer_inquiry',
        ...values,
      });
      toast.success("Thông tin đăng ký đại lý đã được gửi thành công! Chúng tôi sẽ liên hệ trong vòng 24h.");
      reset();
    } catch (err) {
      toast.error("Gửi thông tin thất bại. Vui lòng kiểm tra lại đường truyền.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    {
      icon: <TrendingUp className="w-6 h-6 text-primary" />,
      title: "Chiết khấu cao & Độc quyền",
      desc: "Chính sách giá đại lý chiết khấu cạnh tranh từ gốc, bảo vệ lợi nhuận cao nhất thị trường bảo hộ."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-primary" />,
      title: "100% Chính hãng đạt chuẩn",
      desc: "Cam kết toàn bộ dải sản phẩm có chứng nhận CQ/CO và giấy kiểm định chất lượng quốc tế đầy đủ."
    },
    {
      icon: <Truck className="w-6 h-6 text-primary" />,
      title: "Vận chuyển siêu tốc toàn quốc",
      desc: "Chính sách hỗ trợ vận chuyển linh hoạt, tối ưu chi phí cho các đơn hàng sỉ số lượng lớn."
    },
    {
      icon: <Handshake className="w-6 h-6 text-primary" />,
      title: "Đồng hành Marketing & Đào tạo",
      desc: "Cung cấp trọn bộ tài liệu kỹ thuật, hình ảnh truyền thông và đào tạo tư vấn giải pháp an toàn."
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-[#f8fafc] min-h-screen pb-24"
    >
      <SeoHead
        title="Tuyển Đại Lý Bảo Hộ Lao Động Cao Cấp - NBE Hoang Duy"
        description="Trở thành đối tác lớn của NBE Hoang Duy với chiết khấu hấp dẫn, kho hàng đa dạng và hỗ trợ marketing tận tâm."
      />

      {/* Hero Banner with Embedded Breadcrumb */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden border-b border-slate-800/80">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-500 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          <div className="py-12 md:py-16">
            <Breadcrumb
              variant="dark"
              items={[
                { label: 'Trang chủ', href: '/' },
                { label: 'Tuyển đại lý' }
              ]}
            />
            <div className="mt-6 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="space-y-4">
                <motion.span
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-block text-[11px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary"
                >
                  Hợp Tác Phát Triển Bền Vững
                </motion.span>
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase leading-none"
                >
                  Mở Rộng Kinh Doanh Cùng <span className="text-primary"><br />NBE Hoang Duy</span>
                </motion.h1>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-slate-400 max-w-3xl text-xs md:text-sm font-semibold leading-relaxed"
                >
                  Trở thành đối tác phân phối chính thức các thiết bị bảo hộ lao động cao cấp toàn cầu với chính sách chiết khấu đột phá và hệ thống vận hành chuyên nghiệp.
                </motion.p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-7xl mt-16">
        <div className="grid lg:grid-cols-[1fr_500px] gap-16 items-start">

          {/* Left Column: Benefits & Authority */}
          <div className="space-y-12">
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase">Quyền Lợi & Hỗ Trợ Độc Quyền</h2>
              <div className="h-1.5 w-24 bg-primary rounded-full mb-6" />
              <p className="text-slate-500 font-medium leading-relaxed">
                NBE Hoang Duy xây dựng mối quan hệ cộng sinh cùng các nhà bán lẻ. Chúng tôi trao cho bạn những công cụ, chiết khấu và sản phẩm tốt nhất để củng cố chỗ đứng trên thị trường bảo hộ lao động.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {benefits.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 30, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group"
                >
                  <div className="bg-primary/5 p-4 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-300 mb-6">
                    {b.icon}
                  </div>
                  <h3 className="font-black text-slate-900 text-lg mb-2 group-hover:text-primary transition-colors">{b.title}</h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">{b.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Quote Block */}
            <div className="bg-slate-900 text-white rounded-[2rem] p-8 md:p-10 relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
              <p className="text-slate-300 italic text-base md:text-lg mb-6 leading-relaxed relative z-10">
                &ldquo;Đồng hành cùng NBE Hoang Duy từ những ngày đầu, chúng tôi luôn nhận được sự tin cậy tuyệt đối về chất lượng sản phẩm chuẩn châu Âu cùng tiến độ cấp hàng cực kỳ chuẩn xác, giúp chúng tôi tự tin thắng thầu nhiều công trình lớn.&rdquo;
              </p>
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-black text-primary border border-white/5">
                  TD
                </div>
                <div>
                  <h4 className="font-black text-sm text-white">Ông Nguyễn Thành Danh</h4>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Giám đốc Bảo hộ Trường An (Đại lý cấp 1)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: High-End Contact Form */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-10 shadow-xl relative overflow-hidden"
          >
            {/* Header Form */}
            <div className="mb-8">
              <h2 className="text-2xl font-black text-slate-900 mb-2">Đăng Ký Tư Vấn Đại Lý</h2>
              <p className="text-slate-400 text-sm font-bold flex items-center gap-1.5">
                <Info size={14} className="text-primary" /> Vui lòng điền thông tin, chúng tôi sẽ gọi lại trong 24 giờ.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

              {/* Company Name */}
              <div>
                <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest mb-2.5">
                  <Building size={14} className="text-primary" /> Tên công ty / Cửa hàng <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('company_name')}
                  className="w-full border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-sm bg-slate-50/50"
                  placeholder="Ví dụ: Công ty TNHH Bảo Hộ Hoà Bình"
                />
                {errors.company_name && <p className="text-rose-500 text-xs font-bold mt-1.5">{errors.company_name.message}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest mb-2.5">
                  <Phone size={14} className="text-primary" /> Số điện thoại liên hệ <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('phone')}
                  className="w-full border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-sm bg-slate-50/50"
                  placeholder="Ví dụ: 0909 123 456"
                />
                {errors.phone && <p className="text-rose-500 text-xs font-bold mt-1.5">{errors.phone.message}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest mb-2.5">
                  <Mail size={14} className="text-primary" /> Địa chỉ Email (không bắt buộc)
                </label>
                <input
                  {...register('email')}
                  className="w-full border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-sm bg-slate-50/50"
                  placeholder="email@company.com"
                />
                {errors.email && <p className="text-rose-500 text-xs font-bold mt-1.5">{errors.email.message}</p>}
              </div>

              {/* Message */}
              <div>
                <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest mb-2.5">
                  <MessageSquare size={14} className="text-primary" /> Nội dung đề xuất hợp tác <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('message')}
                  className="w-full border border-slate-200 rounded-2xl px-5 py-4 h-32 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-sm bg-slate-50/50 resize-none"
                  placeholder="Chia sẻ mặt hàng bạn quan tâm, khu vực thị trường bạn muốn mở rộng..."
                />
                {errors.message && <p className="text-rose-500 text-xs font-bold mt-1.5">{errors.message.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/95 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/30 transition-all disabled:opacity-50 hover:shadow-xl hover:shadow-primary/40 active:scale-95 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Đang gửi thông tin...
                  </>
                ) : (
                  'GỬI ĐĂNG KÝ HỢP TÁC NGAY'
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default DealerPage;
