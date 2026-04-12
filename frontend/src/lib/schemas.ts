import { z } from 'zod';

export const reviewSchema = z.object({
  author_name: z.string().min(2, 'Nhập tên của bạn'),
  rating: z.number().min(1, 'Chọn số sao').max(5),
  body: z.string().max(1000).optional()
});

export const dealerInquirySchema = z.object({
  company_name: z.string().min(2, 'Nhập tên công ty'),
  phone: z.string().min(10, 'Số điện thoại không hợp lệ').max(11),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  message: z.string().min(10, 'Nhập nội dung ít nhất 10 ký tự')
});

export const blogSearchSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().min(1).default(1)
});

export const loginSchema = z.object({
  phone: z.string().min(10, 'Số điện thoại không hợp lệ').max(11),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
});

export const registerSchema = z.object({
  firstname: z.string().min(2, 'Nhập tên của bạn'),
  lastname: z.string().min(2, 'Nhập họ của bạn'),
  phone: z.string().min(10, 'Số điện thoại không hợp lệ').max(11),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
});

export const trackOrderSchema = z.object({
  order_code: z.string().min(5, 'Mã đơn hàng không hợp lệ'),
  contact_phone: z.string().min(6, 'Số điện thoại không hợp lệ')
});

export const guestOrderSchema = z.object({
  contact_phone: z.string().min(10, 'Số điện thoại không hợp lệ').max(11)
});
