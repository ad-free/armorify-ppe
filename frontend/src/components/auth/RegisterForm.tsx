// src/components/auth/RegisterForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { registerSchema } from '@/lib/schemas';
import { useRegister } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterForm: React.FC = () => {
  const { mutate: registerUser, isPending } = useRegister();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = (values: RegisterFormValues) => {
    registerUser(values, {
      onSuccess: () => {
        toast.success('Đăng ký thành công!');
        navigate('/');
      },
      onError: () => {
        toast.error('Có lỗi xảy ra hoặc số điện thoại đã tồn tại.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full max-w-sm mx-auto p-6 bg-white border rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold text-center mb-6">Đăng Ký</h2>
      
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Họ</label>
          <input
            {...register('lastname')}
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
            placeholder="Nguyễn"
          />
          {errors.lastname && <p className="text-red-500 text-xs mt-1">{errors.lastname.message}</p>}
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Tên</label>
          <input
            {...register('firstname')}
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
            placeholder="Văn A"
          />
          {errors.firstname && <p className="text-red-500 text-xs mt-1">{errors.firstname.message}</p>}
        </div>
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
        <label className="block text-sm font-medium mb-1">Email <span className="text-red-500">*</span></label>
        <input
          type="email"
          {...register('email')}
          className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
          placeholder="email@example.com"
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Mật khẩu <span className="text-red-500">*</span></label>
        <input
          type="password"
          {...register('password')}
          className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
          placeholder="******"
        />
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-primary text-primary-foreground py-2 mt-4 rounded-md font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Đang xử lý...' : 'ĐĂNG KÝ'}
      </button>

      <div className="text-center text-sm text-gray-500 mt-4">
        Đã có tài khoản? <a href="/login" className="text-primary hover:underline">Đăng nhập</a>
      </div>
    </form>
  );
};
