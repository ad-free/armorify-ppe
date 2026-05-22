// src/pages/public/AboutPage.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Award, Users, TrendingUp, CheckCircle, Phone, Sparkles, ShieldCheck, ArrowRight, Building } from 'lucide-react';
import { SeoHead } from '@/components/common/SeoHead';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { Link } from 'react-router-dom';

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
    { 
      title: 'Hàng Chính Hãng 100%', 
      desc: 'Cam kết nguồn gốc rõ ràng, đầy đủ giấy tờ CO/CQ kiểm định từ các tập đoàn bảo hộ hàng đầu thế giới như 3M, Honeywell, DuPont.',
      color: 'bg-blue-50 text-blue-600 border-blue-100/50'
    },
    { 
      title: 'Giá Cả Minh Bạch', 
      desc: 'Chiết khấu hấp dẫn cho khách hàng đại lý và dự án B2B. Cam kết bình ổn giá, mang lại hiệu quả chi phí tối ưu nhất.',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100/50'
    },
    { 
      title: 'Hỗ Trợ Kỹ Thuật 24/7', 
      desc: 'Đội ngũ kỹ sư am hiểu sâu sắc tiêu chuẩn an toàn lao động (OSHA, EN, TCVN) hỗ trợ tư vấn chọn lựa thiết bị tối ưu nhất.',
      color: 'bg-purple-50 text-purple-600 border-purple-100/50'
    },
    { 
      title: 'Vận Chuyển Hỏa Tốc', 
      desc: 'Kho vận hiện đại xử lý đơn ngay trong ngày, giao hàng hỏa tốc toàn quốc để kịp tiến độ sản xuất và thi công của doanh nghiệp.',
      color: 'bg-amber-50 text-amber-600 border-amber-100/50'
    },
  ];

  const team = [
    { name: 'Nguyễn Hoàng Duy', role: 'Founder & CEO', avatar: 'HD', grad: 'from-primary to-teal-600' },
    { name: 'Trần Minh Khoa', role: 'Trưởng Phòng Dự Án B2B', avatar: 'MK', grad: 'from-blue-600 to-indigo-600' },
    { name: 'Lê Thị Hoa', role: 'Chuyên Gia Tư Vấn OSHA', avatar: 'LH', grad: 'from-purple-600 to-pink-600' },
  ];

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-24">
      <SeoHead
        title="Giới Thiệu NBE Hoang Duy - Giải Pháp Bảo Hộ Lao Động Hàng Đầu"
        description="Tìm hiểu về NBE Hoang Duy, hành trình hơn 10 năm kiến tạo giải pháp bảo vệ người lao động Việt Nam bằng những thiết bị chính hãng tiêu chuẩn quốc tế."
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
                { label: 'Giới thiệu' }
              ]}
            />
            <div className="mt-6 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="space-y-4">
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-primary/10 text-primary uppercase tracking-widest border border-primary/20"
                >
                  <Sparkles size={12} className="fill-primary text-slate-950" /> Hành trình kiến tạo an toàn
                </motion.span>
                <motion.h1 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase leading-none"
                >
                  Bảo Vệ Người Lao Động Việt Nam
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-slate-400 max-w-2xl text-xs md:text-sm font-semibold leading-relaxed"
                >
                  Từ năm 2014, NBE Hoang Duy đã không ngừng cung cấp các giải pháp bảo hộ lao động chất lượng cao, giúp hàng ngàn doanh nghiệp và triệu người lao động an tâm hơn mỗi ngày.
                </motion.p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <section className="container mx-auto px-6 max-w-7xl -mt-12 relative z-10 mb-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="bg-white rounded-3xl shadow-md border border-slate-100 p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all group"
              >
                <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm transition-transform duration-300 group-hover:scale-105`}>
                  <Icon size={20} strokeWidth={2.5} />
                </div>
                <div className="text-3xl font-black text-slate-900 mb-1 tracking-tight">{stat.value}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Mission Section */}
      <section className="container mx-auto px-6 max-w-7xl mb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <motion.div {...fadeUp} className="lg:col-span-6 space-y-6">
            <span className="text-xs font-black text-primary uppercase tracking-widest block">SỨ MỆNH & TẦM NHÌN</span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight uppercase">Tại Sao Chúng Tôi Tồn Tại?</h2>
            
            <p className="text-slate-500 font-medium text-sm leading-relaxed">
              NBE Hoang Duy ra đời với một sứ mệnh duy nhất: đưa các sản phẩm bảo hộ lao động chính hãng, chất lượng cao nhất đến tay các doanh nghiệp và người lao động Việt Nam với mức chi phí tối ưu.
            </p>
            <p className="text-slate-500 font-medium text-sm leading-relaxed">
              Chúng tôi tin rằng mọi người lao động đều có quyền được bảo vệ bởi những thiết bị tốt nhất. Do đó, chúng tôi hợp tác trực tiếp cùng các tập đoàn hàng đầu toàn cầu để cung cấp những giải pháp an toàn đạt chuẩn EN, OSHA, ANSI.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              {[
                'Nhập khẩu chính hãng 100%',
                'Kiểm định an toàn nghiêm ngặt',
                'Đổi trả linh hoạt trong 7 ngày',
                'Tư vấn kỹ thuật chuyên sâu'
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                    <CheckCircle size={12} className="text-emerald-600 fill-emerald-50" />
                  </div>
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wide">{t}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Premium Illustration Badge Container - 6 cols */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="lg:col-span-6 rounded-[2.5rem] bg-slate-950 p-8 text-white relative overflow-hidden border border-slate-900 h-96 flex flex-col justify-between group shadow-xl"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(13,148,136,0.1),transparent)] pointer-events-none" />
            <div className="absolute top-8 right-8 text-primary/20 group-hover:text-primary/30 transition-colors">
              <Building size={120} strokeWidth={1} />
            </div>

            <div className="space-y-2 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <ShieldCheck size={24} className="fill-primary text-slate-950" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight pt-3">Hoang Duy Safety</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hơn 10 năm bảo vệ hàng triệu người lao động</p>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-3xl p-6 relative z-10">
              <p className="text-xs font-semibold text-slate-350 leading-relaxed">
                "Chúng tôi cam kết không chỉ cung cấp sản phẩm bảo hộ, mà còn mang lại sự an tâm tuyệt đối cho doanh nghiệp để tập trung kiến tạo các giá trị bền vững."
              </p>
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-800">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-[10px]">
                  CEO
                </div>
                <div>
                  <h5 className="text-[11px] font-black uppercase tracking-wide">Nguyễn Hoàng Duy</h5>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Founder & CEO</p>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Core Values Section */}
      <section className="bg-slate-50 border-y border-slate-100 py-24 mb-24">
        <div className="container mx-auto px-6 max-w-7xl space-y-16">
          <motion.div {...fadeUp} className="text-center space-y-3">
            <span className="text-xs font-black text-primary uppercase tracking-widest block">GIÁ TRỊ CỐT LÕI</span>
            <h2 className="text-3xl font-black text-slate-900 uppercase">Chúng Tôi Cam Kết Điều Gì?</h2>
            <p className="text-slate-500 font-medium max-w-md mx-auto text-sm leading-relaxed">
              Những tiêu chí bất di bất dịch giúp NBE Hoang Duy duy trì lòng tin từ khách hàng và đối tác trong suốt chặng đường đã qua.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-3xl p-6 border border-slate-150 shadow-sm hover:shadow-md hover:-translate-y-1.5 transition-all group"
              >
                <div className={`w-12 h-12 ${v.color} rounded-2xl flex items-center justify-center mb-6 shadow-sm border`}>
                  <CheckCircle size={20} strokeWidth={2.5} />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-2.5">{v.title}</h3>
                <p className="text-xs font-semibold text-slate-500 leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="container mx-auto px-6 max-w-7xl mb-24 space-y-16">
        <motion.div {...fadeUp} className="text-center space-y-3">
          <span className="text-xs font-black text-primary uppercase tracking-widest block">ĐỘI NGŨ ĐỒNG HÀNH</span>
          <h2 className="text-3xl font-black text-slate-900 uppercase">Những Chuyên Gia Phục Vụ</h2>
          <p className="text-slate-500 font-medium max-w-md mx-auto text-sm leading-relaxed">
            Đội ngũ quản lý và tư vấn viên giàu kinh nghiệm, tận tụy, cam kết nâng tầm chuẩn mực an toàn cho bạn.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {team.map((member, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="bg-white rounded-3xl border border-slate-100 p-8 text-center hover:shadow-md hover:-translate-y-1 transition-all group"
            >
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${member.grad} flex items-center justify-center text-white text-2xl font-black mx-auto mb-6 shadow-md transition-transform duration-300 group-hover:scale-105`}>
                {member.avatar}
              </div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">{member.name}</h4>
              <p className="text-xs font-bold text-slate-450 uppercase tracking-widest mt-1.5">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="container mx-auto px-6 max-w-7xl">
        <div className="bg-slate-950 rounded-[3rem] text-white p-8 md:p-16 relative overflow-hidden border border-slate-900 text-center space-y-6 shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(13,148,136,0.15),transparent)] pointer-events-none" />
          
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">Muốn Hợp Tác Cùng Chúng Tôi?</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm font-medium leading-relaxed">
            NBE Hoang Duy luôn chào đón các đối tác đại lý phân phối, dự án mua sỉ B2B và các nhà cung cấp uy tín trên toàn quốc.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 pt-4 relative z-10">
            <Link 
              to="/contact" 
              className="h-12 px-8 bg-primary hover:bg-primary/95 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest shadow-md transition-all active:scale-95"
            >
              <Phone size={14} /> Liên hệ ngay
            </Link>
            <Link 
              to="/dealer" 
              className="h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest border border-slate-800 transition-all active:scale-95"
            >
              Trở thành đại lý <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
