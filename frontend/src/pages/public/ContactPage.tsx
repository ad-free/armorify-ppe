// src/pages/public/ContactPage.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, User, MessageSquare, Award, ArrowRight, ShieldCheck } from 'lucide-react';
import { SeoHead } from '@/components/common/SeoHead';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import toast from 'react-hot-toast';

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
    toast.success("Cảm ơn bạn đã gửi tin nhắn! Đội ngũ tư vấn sẽ phản hồi trong vòng 30 phút.");
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Địa Chỉ Văn Phòng',
      lines: ['123 Đường Điện Biên Phủ, P.15', 'Quận Bình Thạnh, TP. Hồ Chí Minh'],
      color: 'text-blue-500',
      bg: 'bg-blue-50',
      actionLabel: 'Chỉ đường Google Maps',
      actionUrl: 'https://maps.google.com/?q=123+Điện+Biên+Phủ+Bình+Thạnh+Hồ+Chí+Minh'
    },
    {
      icon: Phone,
      title: 'Hotline Hỗ Trợ',
      lines: ['0372.371.668 (Zalo / Viber)', '1900 1234 (Tổng đài 24/7)'],
      color: 'text-primary',
      bg: 'bg-primary/10',
      actionLabel: 'Gọi ngay cho chúng tôi',
      actionUrl: 'tel:0372371668'
    },
    {
      icon: Mail,
      title: 'Hòm Thư Điện Tử',
      lines: ['info@armorify.vn', 'sales@armorify.vn'],
      color: 'text-purple-500',
      bg: 'bg-purple-50',
      actionLabel: 'Gửi email trực tiếp',
      actionUrl: 'mailto:info@armorify.vn'
    },
    {
      icon: Clock,
      title: 'Thời Gian Làm Việc',
      lines: ['Thứ 2 – Thứ 7: 8:00 – 17:30', 'Chủ nhật: 8:00 – 12:00'],
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      actionLabel: 'Yêu cầu tư vấn ngoài giờ',
      actionUrl: '#contact-form'
    },
  ];

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-24">
      <SeoHead
        title="Liên Hệ NBE Hoang Duy - Tư Vấn Thiết Bị Bảo Hộ Lao Động Cao Cấp"
        description="Có câu hỏi hoặc cần hỗ trợ về thiết bị bảo hộ lao động? Hãy liên hệ ngay với NBE Hoang Duy. Chúng tôi phản hồi trong vòng 30 phút!"
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
                { label: 'Liên hệ' }
              ]}
            />
            <div className="mt-6 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="space-y-4">
                <motion.span 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-primary/10 text-primary uppercase tracking-widest border border-primary/20"
                >
                  <ShieldCheck size={12} className="fill-primary text-slate-950" /> Kết nối nhanh chóng
                </motion.span>
                <motion.h1 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase leading-none"
                >
                  Chúng Tôi Luôn Lắng Nghe Bạn
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-slate-400 max-w-2xl text-xs md:text-sm font-semibold leading-relaxed"
                >
                  Hãy liên hệ với đội ngũ chuyên gia an toàn lao động của NBE Hoang Duy để được hỗ trợ, báo giá hoặc tư vấn giải pháp thiết bị toàn diện nhất.
                </motion.p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-7xl mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Left Column: Contact Cards - 5 cols */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-black text-primary uppercase tracking-widest">THÔNG TIN LIÊN HỆ</span>
              <h2 className="text-2xl font-black text-slate-900 uppercase">Văn phòng đại diện</h2>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">
                Quý khách có thể ghé thăm trực tiếp văn phòng hoặc liên hệ trực tuyến qua các kênh chính thức của chúng tôi.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {contactInfo.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex gap-4 p-6 bg-white rounded-3xl border border-slate-100 hover:border-primary/20 hover:shadow-md transition-all group"
                  >
                    <div className={`${item.bg} ${item.color} w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105`}>
                      <Icon size={20} strokeWidth={2.5} />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">{item.title}</h4>
                      {item.lines.map((line, j) => (
                        <p key={j} className="text-sm font-semibold text-slate-500 leading-snug">{line}</p>
                      ))}
                      <a 
                        href={item.actionUrl}
                        className="inline-flex items-center gap-1 text-[11px] font-black text-primary uppercase tracking-wider group/link mt-1 hover:text-primary/80 transition-colors"
                      >
                        {item.actionLabel} <ArrowRight size={12} className="group-hover/link:translate-x-0.5 transition-transform" />
                      </a>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Premium Google Maps iframe embed */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 h-64 relative group">
              <iframe 
                title="Bản đồ NBE Hoang Duy"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.281898516709!2d106.70295807609657!3d10.793540989356263!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317528b6aed04ad1%3A0xe6759cfa58c4f227!2zMTIzIMSQaeG7h24gQmnDqm4gUGjhu6csIFBoxrDhu51uZyAxNSwgQsOsbmggVGjhuqFuaCwgVGjDoG5oIHBo4buRIEjhu5MgQ2jDrSBNaW5oLCBWaeG7h3QgTmFt!5e0!3m2!1svi!2s!4v1715900000000!5m2!1svi!2s" 
                className="w-full h-full border-0 grayscale hover:grayscale-0 transition-all duration-700"
                allowFullScreen={false} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 text-white px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs font-black uppercase tracking-wider backdrop-blur-sm shadow-lg pointer-events-none group-hover:opacity-0 transition-opacity">
                <span>📍 Trụ sở chính</span>
                <span className="text-[10px] text-primary">Xem bản đồ lớn</span>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form - 7 cols */}
          <div id="contact-form" className="lg:col-span-7">
            <motion.div
              {...fadeUp}
              className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm p-8 md:p-12 space-y-8"
            >
              <AnimatePresence mode="wait">
                {sent ? (
                  <motion.div
                    key="success"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="text-center py-16 space-y-6"
                  >
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm border border-emerald-100">
                      <CheckCircle size={40} className="fill-emerald-50" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-900 uppercase">Gửi thông tin thành công!</h3>
                      <p className="text-slate-500 font-medium max-w-md mx-auto text-sm leading-relaxed">
                        Cảm ơn bạn đã quan tâm đến dịch vụ của NBE Hoang Duy. Chuyên viên tư vấn của chúng tôi sẽ chủ động liên hệ lại trong vòng 30 phút.
                      </p>
                    </div>
                    <button
                      onClick={() => { setSent(false); setForm({ name: '', phone: '', email: '', subject: '', message: '' }); }}
                      className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-2xl transition-all uppercase tracking-widest shadow-md"
                    >
                      Gửi tin nhắn khác
                    </button>
                  </motion.div>
                ) : (
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <span className="text-xs font-black text-primary uppercase tracking-widest">ĐỂ LẠI LỜI NHẮN</span>
                      <h2 className="text-2xl font-black text-slate-900 uppercase">Gửi Yêu Cầu Hỗ Trợ</h2>
                      <p className="text-slate-500 font-medium text-sm leading-relaxed">
                        Hãy điền đầy đủ các trường thông tin bên dưới, chúng tôi cam kết bảo mật thông tin tuyệt đối.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Họ và tên *</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                              <User size={16} />
                            </span>
                            <input
                              required
                              value={form.name}
                              onChange={e => setForm({ ...form, name: e.target.value })}
                              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold transition-all bg-slate-50/50 text-slate-800 placeholder-slate-400"
                              placeholder="Nguyễn Văn A"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Số điện thoại *</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                              <Phone size={16} />
                            </span>
                            <input
                              required
                              type="tel"
                              value={form.phone}
                              onChange={e => setForm({ ...form, phone: e.target.value })}
                              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold transition-all bg-slate-50/50 text-slate-800 placeholder-slate-400"
                              placeholder="0372.371.668"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Địa chỉ Email</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <Mail size={16} />
                          </span>
                          <input
                            type="email"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold transition-all bg-slate-50/50 text-slate-800 placeholder-slate-400"
                            placeholder="email@example.com"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Chủ đề cần tư vấn *</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <Award size={16} />
                          </span>
                          <select
                            required
                            value={form.subject}
                            onChange={e => setForm({ ...form, subject: e.target.value })}
                            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold transition-all bg-slate-50/50 text-slate-800 appearance-none cursor-pointer"
                          >
                            <option value="">Chọn chủ đề tư vấn...</option>
                            <option>Tư vấn báo giá sản phẩm sỉ / lẻ</option>
                            <option>Báo giá doanh nghiệp B2B</option>
                            <option>Hợp tác đại lý phân phối</option>
                            <option>Yêu cầu dịch vụ hậu mãi / Bảo hành</option>
                            <option>Khác</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Nội dung chi tiết *</label>
                        <div className="relative">
                          <span className="absolute left-4 top-4 text-slate-400">
                            <MessageSquare size={16} />
                          </span>
                          <textarea
                            required
                            rows={5}
                            value={form.message}
                            onChange={e => setForm({ ...form, message: e.target.value })}
                            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold transition-all bg-slate-50/50 text-slate-800 resize-none placeholder-slate-400"
                            placeholder="Mô tả chi tiết nhu cầu hoặc thắc mắc của bạn để chúng tôi phục vụ tốt nhất..."
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full h-14 flex items-center justify-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl transition-all shadow-md active:scale-[0.98] uppercase tracking-widest text-xs"
                      >
                        <Send size={14} />
                        Gửi Yêu Cầu Tư Vấn Ngay
                      </button>
                    </form>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ContactPage;

