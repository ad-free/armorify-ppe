// src/pages/public/DealerPage.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { CheckCircle2, Handshake, TrendingUp, Truck } from 'lucide-react';
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
      // Repurposing guest orders endpoint or quotes as per instructions
      await POST('/api/v1/orders/guest', {
        type: 'dealer_inquiry',
        ...values,
      });
      toast.success("Thông tin đã được gửi. Chúng tôi sẽ liên hệ với bạn trong 24 giờ!");
      reset();
    } catch (err) {
      toast.error("Đã xảy ra lỗi, vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    {
      icon: <TrendingUp className="w-6 h-6 text-primary" />,
      title: "Chiết khấu hấp dẫn",
      desc: "Chính sách giá đại lý cạnh tranh, lợi nhuận cao."
    },
    {
      icon: <CheckCircle2 className="w-6 h-6 text-primary" />,
      title: "Sản phẩm chính hãng",
      desc: "100% sản phẩm có đầy đủ giấy tờ kiểm định."
    },
    {
      icon: <Truck className="w-6 h-6 text-primary" />,
      title: "Hỗ trợ vận chuyển",
      desc: "Chính sách ưu đãi phí ship cho đơn hàng sỉ."
    },
    {
      icon: <Handshake className="w-6 h-6 text-primary" />,
      title: "Hỗ trợ marketing",
      desc: "Cung cấp hình ảnh, tài liệu và tư vấn bán hàng."
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container mx-auto px-4 py-8 max-w-5xl"
    >
      <SeoHead
        title="Tuyển Đại Lý Bảo Hộ Lao Động"
        description="Trở thành đối tác lớn của NBE Hoang Duy với chiết khấu hấp dẫn, kho hàng đa dạng và hỗ trợ tận tâm."
      />

      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Tuyển đại lý' }
        ]}
      />

      {/* Hero Section */}
      <div className="bg-primary/5 rounded-2xl p-8 md:p-12 mb-12 mt-4 text-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-4">Trở thành đại lý NBE Hoang Duy</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Cơ hội hợp tác kinh doanh thiết bị bảo hộ lao động chính hãng với chính sách đại lý linh hoạt và lợi nhuận cao nhất thị trường.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Benefits */}
        <div>
          <h2 className="text-2xl font-bold mb-8">Quyền lợi đại lý</h2>
          <div className="space-y-6">
            {benefits.map((b, i) => (
              <div key={i} className="flex gap-4 p-4 border rounded-lg hover:border-primary transition-colors bg-white">
                <div className="bg-primary/10 p-3 rounded-full h-fit">
                  {b.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{b.title}</h3>
                  <p className="text-gray-600">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white border rounded-xl p-6 md:p-8 shadow-sm h-fit">
          <h2 className="text-2xl font-bold mb-2">Đăng ký tư vấn đại lý</h2>
          <p className="text-gray-500 mb-6 text-sm">Điền thông tin và chúng tôi sẽ gọi lại cho bạn.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tên công ty / Cửa hàng <span className="text-red-500">*</span></label>
              <input
                {...register('company_name')}
                className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                placeholder="Ví dụ: Công ty TNHH Bảo Hộ ABC"
              />
              {errors.company_name && <p className="text-red-500 text-xs mt-1">{errors.company_name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Số điện thoại <span className="text-red-500">*</span></label>
              <input
                {...register('phone')}
                className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                placeholder="0987654321"
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email (tùy chọn)</label>
              <input
                {...register('email')}
                className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                placeholder="email@company.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nội dung yêu cầu <span className="text-red-500">*</span></label>
              <textarea
                {...register('message')}
                className="w-full border rounded-md px-3 py-2 h-24 focus:ring-2 focus:ring-primary/50 outline-none"
                placeholder="Nhập mặt hàng bạn quan tâm, khu vực bạn muốn bán..."
              />
              {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground py-3 rounded-md font-bold mt-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Đang gửi thông tin...' : 'GỬI YÊU CẦU NGAY'}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default DealerPage;
