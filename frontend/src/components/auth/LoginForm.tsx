// src/components/auth/LoginForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { loginSchema } from '@/lib/schemas';
import { useLogin } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginForm: React.FC = () => {
  const { mutate: login, isPending } = useLogin();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = (values: LoginFormValues) => {
    login(values, {
      onSuccess: () => {
        toast.success('Đăng nhập thành công!');
        navigate('/');
      },
      onError: () => {
        toast.error('Số điện thoại hoặc mật khẩu không đúng.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full max-w-sm mx-auto p-6 bg-white border rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold text-center mb-6">Đăng Nhập</h2>
      
      <div>
        <label className="block text-sm font-medium mb-1">Số điện thoại</label>
        <input
          {...register('phone')}
          className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
          placeholder="0987654321"
        />
        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Mật khẩu</label>
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
        {isPending ? 'Đang xử lý...' : 'ĐĂNG NHẬP'}
      </button>

      <div className="text-center text-sm text-gray-500 mt-4">
        Chưa có tài khoản? <a href="/register" className="text-primary hover:underline">Đăng ký ngay</a>
      </div>
    </form>
  );
};
