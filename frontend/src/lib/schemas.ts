import { z } from 'zod';

export const reviewSchema = z.object({
  author_name: z.string().optional(),
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

export const checkoutSchema = z.object({
  customer_name: z.string().trim().min(1, 'Vui lòng nhập họ tên').max(128, 'Tối đa 128 ký tự'),
  contact_phone: z.string().trim().min(6, 'Số điện thoại không hợp lệ').max(32, 'Số điện thoại tối đa 32 ký tự').regex(/^\+?[0-9][0-9 .()-]*$/, 'Số điện thoại không hợp lệ'),
  email: z.string().trim().max(254, 'Email tối đa 254 ký tự').refine((value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), 'Email không hợp lệ'),
  province: z.string().trim().min(1, 'Vui lòng nhập tỉnh / thành phố').max(128, 'Tối đa 128 ký tự'),
  district: z.string().trim().min(1, 'Vui lòng nhập quận / huyện').max(128, 'Tối đa 128 ký tự'),
  ward: z.string().trim().min(1, 'Vui lòng nhập phường / xã').max(128, 'Tối đa 128 ký tự'),
  address: z.string().trim().min(1, 'Vui lòng nhập số nhà và tên đường').max(512, 'Địa chỉ tối đa 512 ký tự'),
  delivery_note: z.string().trim().max(1000, 'Ghi chú tối đa 1000 ký tự'),
});
