// src/pages/public/AboutPage.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Award, Users, TrendingUp, CheckCircle, Phone, Mail } from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
};

const AboutPage: React.FC = () => {
  const stats = [
    { value: '10+', label: 'Năm Kinh Nghiệm', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
    { value: '500+', label: 'Sản Phẩm Chính Hãng', icon: Shield, color: 'text-primary', bg: 'bg-primary/10' },
    { value: '50K+', label: 'Khách Hàng Hài Lòng', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
    { value: '30+', label: 'Thương Hiệu Đối Tác', icon: Award, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  const values = [
    { title: 'Hàng Chính Hãng', desc: 'Cam kết 100% sản phẩm có nguồn gốc rõ ràng, nhập khẩu từ các thương hiệu uy tín toàn cầu như 3M, Honeywell, DuPont.' },
    { title: 'Giá Cả Minh Bạch', desc: 'Không phụ phí ẩn. Giá niêm yết chính xác, khuyến mãi thực tế và chính sách giá tốt cho đại lý.' },
    { title: 'Hỗ Trợ Tận Tâm', desc: 'Đội ngũ tư vấn am hiểu chuyên sâu về bảo hộ lao động, sẵn sàng hỗ trợ 24/7 qua hotline, Zalo, email.' },
    { title: 'Giao Hàng Nhanh', desc: 'Xử lý đơn trong ngày, giao hàng toàn quốc. Miễn phí vận chuyển cho đơn từ 500.000đ.' },
  ];

  const team = [
    { name: 'Nguyễn Hoàng Duy', role: 'Founder & CEO', avatar: 'HD' },
    { name: 'Trần Minh Khoa', role: 'Trưởng Phòng Kinh Doanh', avatar: 'MK' },
    { name: 'Lê Thị Hoa', role: 'Chuyên Gia Tư Vấn', avatar: 'TH' },
  ];

  return (
    <div className="bg-white font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-emerald-600 py-24 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
          <motion.span
            {...fadeUp}
            className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6"
          >
            📖 Câu Chuyện Của Chúng Tôi
          </motion.span>
          <motion.h1 {...fadeUp} transition={{ delay: 0.1, duration: 0.6 }} className="text-4xl sm:text-5xl font-black mb-6 leading-tight">
            Bảo Vệ Người Lao Động Việt Nam
          </motion.h1>
          <motion.p {...fadeUp} transition={{ delay: 0.2, duration: 0.6 }} className="text-lg text-white/80 leading-relaxed max-w-2xl mx-auto">
            Từ năm 2014, Armorify đã không ngừng cung cấp các giải pháp bảo hộ lao động chất lượng cao, giúp hàng ngàn doanh nghiệp và người lao động an toàn hơn mỗi ngày.
          </motion.p>
        </div>
      </section>

      {/* Stats Row */}
      <section className="container mx-auto px-4 max-w-6xl -mt-10 relative z-10 mb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center hover:shadow-xl transition-shadow"
              >
                <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4`}>
                  <Icon size={22} strokeWidth={2.5} />
                </div>
                <div className="text-3xl font-black text-gray-900 mb-1">{stat.value}</div>
                <div className="text-xs font-semibold text-gray-500">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Mission Section */}
      <section className="container mx-auto px-4 max-w-6xl mb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div {...fadeUp}>
            <span className="text-xs font-extrabold text-primary uppercase tracking-widest mb-3 block">Sứ Mệnh</span>
            <h2 className="text-3xl font-black text-gray-900 mb-5 leading-tight">Tại Sao Chúng Tôi Tồn Tại?</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Armorify ra đời với một sứ mệnh đơn giản nhưng quan trọng: đưa các sản phẩm bảo hộ lao động chính hãng, chất lượng cao đến tay người lao động Việt Nam với mức giá hợp lý nhất.
            </p>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Chúng tôi tin rằng mọi người lao động đều xứng đáng được bảo vệ bởi những thiết bị tốt nhất. Đó là lý do chúng tôi hợp tác trực tiếp với các thương hiệu hàng đầu thế giới như 3M, Honeywell, DuPont.
            </p>
            <div className="space-y-3">
              {['Nhập khẩu chính hãng, giấy tờ đầy đủ', 'Kiểm định chất lượng trước khi giao hàng', 'Bảo hành theo nhà sản xuất', 'Đổi trả miễn phí 30 ngày'].map((t, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle size={18} className="text-primary flex-shrink-0" />
                  <span className="text-sm font-semibold text-gray-700">{t}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl overflow-hidden bg-gradient-to-br from-primary/10 to-emerald-50 h-80 flex items-center justify-center border border-primary/10"
          >
            <div className="text-center p-8">
              <div className="text-7xl mb-4">🏭</div>
              <p className="font-bold text-gray-700">Kho hàng chính hãng</p>
              <p className="text-sm text-gray-500 mt-1">TP. Hồ Chí Minh, Việt Nam</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50/60 py-20 mb-0">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="text-xs font-extrabold text-primary uppercase tracking-widest mb-3 block">Giá Trị Cốt Lõi</span>
            <h2 className="text-3xl font-black text-gray-900">Chúng Tôi Cam Kết Điều Gì?</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
                  <CheckCircle size={20} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="container mx-auto px-4 max-w-6xl py-20">
        <motion.div {...fadeUp} className="text-center mb-12">
          <span className="text-xs font-extrabold text-primary uppercase tracking-widest mb-3 block">Đội Ngũ</span>
          <h2 className="text-3xl font-black text-gray-900">Những Người Đồng Hành</h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
          {team.map((member, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center group"
            >
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-white text-2xl font-black mx-auto mb-4 shadow-lg group-hover:shadow-primary/30 transition-shadow">
                {member.avatar}
              </div>
              <h3 className="font-bold text-gray-900">{member.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-gradient-to-br from-primary to-emerald-600 py-16">
        <div className="container mx-auto px-4 max-w-3xl text-center text-white">
          <h2 className="text-3xl font-black mb-4">Muốn Hợp Tác Cùng Chúng Tôi?</h2>
          <p className="text-white/80 mb-8">Liên hệ ngay để nhận tư vấn miễn phí và báo giá ưu đãi cho doanh nghiệp của bạn.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="tel:0372371668" className="flex items-center gap-2 bg-white text-primary font-bold px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors">
              <Phone size={18} /> Gọi Ngay
            </a>
            <a href="mailto:info@armorify.vn" className="flex items-center gap-2 bg-white/20 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/30 transition-colors backdrop-blur-sm">
              <Mail size={18} /> Gửi Email
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
