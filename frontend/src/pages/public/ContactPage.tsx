// src/pages/public/ContactPage.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
};

const ContactPage: React.FC = () => {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Địa Chỉ',
      lines: ['123 Đường Điện Biên Phủ, P.15', 'Quận Bình Thạnh, TP.HCM'],
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      icon: Phone,
      title: 'Điện Thoại',
      lines: ['0372.371.668 (Zalo/Call)', '1900 1234 (Hotline)'],
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      icon: Mail,
      title: 'Email',
      lines: ['info@armorify.vn', 'sales@armorify.vn'],
      color: 'text-purple-500',
      bg: 'bg-purple-50',
    },
    {
      icon: Clock,
      title: 'Giờ Làm Việc',
      lines: ['Thứ 2 – Thứ 7: 8:00 – 17:30', 'Chủ nhật: 8:00 – 12:00'],
      color: 'text-amber-500',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="bg-white font-sans">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-700 py-16 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10" />
        <div className="relative z-10">
          <motion.span {...fadeUp} className="inline-block bg-white/10 text-white/80 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4">
            📞 Liên Hệ
          </motion.span>
          <motion.h1 {...fadeUp} transition={{ delay: 0.1 }} className="text-4xl font-black mb-3">
            Chúng Tôi Luôn Lắng Nghe Bạn
          </motion.h1>
          <motion.p {...fadeUp} transition={{ delay: 0.2 }} className="text-slate-300 max-w-xl mx-auto">
            Có câu hỏi hoặc cần tư vấn? Hãy liên hệ với đội ngũ của chúng tôi — phản hồi trong vòng 30 phút!
          </motion.p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Left: Contact Info */}
          <div className="space-y-5">
            {contactInfo.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-primary/20 hover:bg-white hover:shadow-sm transition-all"
                >
                  <div className={`${item.bg} ${item.color} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <p className="font-extrabold text-gray-900 text-sm mb-1">{item.title}</p>
                    {item.lines.map((line, j) => (
                      <p key={j} className="text-sm text-gray-500">{line}</p>
                    ))}
                  </div>
                </motion.div>
              );
            })}

            {/* Map Placeholder */}
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl h-44 flex items-center justify-center text-gray-500 text-sm font-semibold border border-gray-200 overflow-hidden">
              <div className="text-center">
                <MapPin size={32} className="mx-auto mb-2 text-gray-400" />
                <span>Google Maps Embed</span>
              </div>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="lg:col-span-2">
            <motion.div
              {...fadeUp}
              className="bg-white border border-gray-100 rounded-3xl shadow-sm p-8"
            >
              {sent ? (
                <div className="text-center py-12">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.4 }}
                  >
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle size={40} className="text-emerald-500" />
                    </div>
                  </motion.div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Gửi Thành Công!</h3>
                  <p className="text-gray-500 mb-6">Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi trong vòng 30 phút.</p>
                  <button
                    onClick={() => { setSent(false); setForm({ name: '', phone: '', email: '', subject: '', message: '' }); }}
                    className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors"
                  >
                    Gửi Tin Nhắn Khác
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-black text-gray-900 mb-2">Gửi Tin Nhắn</h2>
                  <p className="text-gray-500 text-sm mb-8">Điền thông tin bên dưới và chúng tôi sẽ liên hệ lại sớm nhất có thể.</p>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Họ và tên *</label>
                        <input
                          required
                          value={form.name}
                          onChange={e => setForm({ ...form, name: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-all bg-gray-50/50"
                          placeholder="Nguyễn Văn A"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Số Điện Thoại *</label>
                        <input
                          required
                          type="tel"
                          value={form.phone}
                          onChange={e => setForm({ ...form, phone: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-all bg-gray-50/50"
                          placeholder="0372 371 668"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-all bg-gray-50/50"
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Chủ đề *</label>
                      <select
                        required
                        value={form.subject}
                        onChange={e => setForm({ ...form, subject: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-all bg-gray-50/50"
                      >
                        <option value="">Chọn chủ đề...</option>
                        <option>Tư vấn sản phẩm</option>
                        <option>Báo giá doanh nghiệp</option>
                        <option>Đăng ký đại lý</option>
                        <option>Khiếu nại / Hỗ trợ</option>
                        <option>Khác</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Nội dung *</label>
                      <textarea
                        required
                        rows={5}
                        value={form.message}
                        onChange={e => setForm({ ...form, message: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-all bg-gray-50/50 resize-none"
                        placeholder="Nhập nội dung cần hỗ trợ..."
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2.5 py-4 bg-primary text-white font-extrabold rounded-xl hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 text-sm"
                    >
                      <Send size={18} />
                      Gửi Tin Nhắn Ngay
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
