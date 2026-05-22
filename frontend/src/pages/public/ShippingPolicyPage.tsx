import React, { useState, useEffect } from 'react';
import { Truck, Clock, ShieldCheck, MapPin, Phone, HelpCircle, ChevronRight, FileText, BadgeHelp } from 'lucide-react';
import { SeoHead } from '@/components/common/SeoHead';
import { Breadcrumb } from '@/components/common/Breadcrumb';

export const ShippingPolicyPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('pham-vi');

  const sections = [
    { id: 'pham-vi', label: '1. Phạm vi & Thời gian' },
    { id: 'cuoc-phi', label: '2. Cước phí vận chuyển' },
    { id: 'dong-kiem', label: '3. Quy cách đóng gói & Đồng kiểm' },
    { id: 'su-co', label: '4. Theo dõi & Sự cố vận chuyển' }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 120,
        behavior: 'smooth'
      });
      setActiveSection(id);
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-24">
      <SeoHead
        title="Chính Sách Giao Hàng - NBE Hoang Duy"
        description="Tìm hiểu quy trình vận chuyển, thời gian bàn giao, chính sách đồng kiểm và cước phí giao hàng tại NBE Hoang Duy."
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
                { label: 'Chính sách' },
                { label: 'Chính sách giao hàng' }
              ]}
            />
            <div className="mt-6 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-primary/10 text-primary uppercase tracking-widest border border-primary/20">
                  <Truck size={12} className="text-primary" /> Vận chuyển hỏa tốc toàn quốc
                </span>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase leading-none">
                  Chính Sách Vận Chuyển & Giao Hàng
                </h1>
                <p className="text-slate-400 max-w-2xl text-xs md:text-sm font-semibold leading-relaxed">
                  Cam kết đóng gói an toàn, bàn giao nhanh chóng, hỗ trợ kiểm hàng trực tiếp nhằm đảm bảo lợi ích tốt nhất cho quý doanh nghiệp và đối tác đại lý.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Layout Grid */}
      <div className="container mx-auto px-6 max-w-7xl mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Quick Navigation Index */}
          <aside className="lg:col-span-4 sticky top-28 hidden lg:block">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <FileText size={18} className="text-primary" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Mục lục chính sách</h3>
              </div>
              <nav className="flex flex-col gap-2">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => scrollToSection(s.id)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wide transition-all text-left ${
                      activeSection === s.id
                        ? 'bg-primary/10 text-primary border border-primary/20 pl-6'
                        : 'text-slate-500 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <span>{s.label}</span>
                    <ChevronRight size={14} className={activeSection === s.id ? 'opacity-100' : 'opacity-0'} />
                  </button>
                ))}
              </nav>
              
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-150 space-y-3">
                <div className="flex items-center gap-2">
                  <BadgeHelp size={16} className="text-slate-500" />
                  <span className="text-[11px] font-black uppercase text-slate-800 tracking-wider">Cần hỗ trợ gấp?</span>
                </div>
                <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                  Đội ngũ chăm sóc khách hàng của NBE Hoang Duy luôn trực tuyến phục vụ bạn.
                </p>
                <a
                  href="tel:0372371668"
                  className="flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors active:scale-95"
                >
                  <Phone size={14} /> 0372.371.668
                </a>
              </div>
            </div>
          </aside>

          {/* Right Column: Policy Content Details */}
          <main className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-md space-y-12">
              
              {/* Section 1 */}
              <section id="pham-vi" className="space-y-6 scroll-mt-28">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                    <MapPin size={18} />
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">1. Phạm vi & Thời gian vận chuyển</h2>
                </div>
                <div className="text-slate-600 text-sm leading-relaxed space-y-4 font-semibold">
                  <p>
                    NBE Hoang Duy liên kết cùng các đơn vị giao nhận uy tín hàng đầu như Viettel Post, Giao Hàng Tiết Kiệm (GHTK) và các nhà xe chất lượng cao để giao nhận thiết bị bảo hộ lao động trên toàn lãnh thổ Việt Nam.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-2">
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest block">Hỏa tốc TP.HCM</span>
                      <h4 className="text-sm font-black text-slate-850">2 giờ - 4 giờ</h4>
                      <p className="text-xs text-slate-500 font-medium">Áp dụng giao nhanh nội thành các mặt hàng có sẵn tại kho.</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-2">
                      <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest block">Các tỉnh lân cận</span>
                      <h4 className="text-sm font-black text-slate-850">24 giờ - 48 giờ</h4>
                      <p className="text-xs text-slate-500 font-medium">Bàn giao nhanh khu vực Đông Nam Bộ & Đồng bằng Sông Cửu Long.</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-2">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">Miền Trung & Bắc</span>
                      <h4 className="text-sm font-black text-slate-850">2 - 4 ngày</h4>
                      <p className="text-xs text-slate-500 font-medium">Giao hàng tận nơi qua dịch vụ bưu cục tiết kiệm hoặc chuyển phát nhanh.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 2 */}
              <section id="cuoc-phi" className="space-y-6 scroll-mt-28 border-t border-slate-100 pt-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                    <Truck size={18} />
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">2. Cước phí vận chuyển</h2>
                </div>
                <div className="text-slate-600 text-sm leading-relaxed space-y-4 font-semibold">
                  <p>
                    Nhằm hỗ trợ tối đa chi phí hoạt động cho quý doanh nghiệp, NBE Hoang Duy áp dụng chính sách cước phí vận chuyển vô cùng hấp dẫn và rõ ràng:
                  </p>
                  <ul className="space-y-3.5 pl-2">
                    <li className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      </div>
                      <div>
                        <strong className="text-slate-900 font-black">Miễn phí vận chuyển (Free Ship):</strong> Áp dụng cho mọi đơn hàng bán lẻ trị giá từ <span className="text-primary font-black">500.000đ trở lên</span> trên phạm vi toàn quốc. Đồng thời miễn phí giao hàng cho các đơn hàng sỉ hoặc dự án B2B ký kết hợp đồng đại lý dài hạn.
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                      </div>
                      <div>
                        <strong className="text-slate-900 font-black">Đơn hàng dưới 500.000đ:</strong> Đồng giá (Flat rate) chỉ <span className="text-slate-900 font-black">30.000đ</span> cho một lần giao hàng đến mọi tỉnh thành. Quý khách không cần trả thêm bất kỳ phụ phí xăng dầu hay đường bộ nào khác.
                      </div>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 3 */}
              <section id="dong-kiem" className="space-y-6 scroll-mt-28 border-t border-slate-100 pt-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                    <ShieldCheck size={18} />
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">3. Quy cách đóng gói & Đồng kiểm</h2>
                </div>
                <div className="text-slate-600 text-sm leading-relaxed space-y-4 font-semibold">
                  <p>
                    Thiết bị bảo hộ đóng vai trò then chốt bảo vệ tính mạng con người, do đó chúng tôi cực kỳ chú trọng quy cách đóng gói và bảo quản sản phẩm:
                  </p>
                  
                  <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 space-y-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary" /> Tiêu chuẩn đóng gói công nghiệp
                    </h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed pl-4">
                      Sản phẩm được đặt trong thùng carton chịu lực tốt, bọc màng co chống thấm nước và quấn băng keo niêm phong thương hiệu **NBE Hoang Duy** để tránh tối đa tình trạng tráo hàng hoặc thất thoát hàng hóa trên đường vận chuyển.
                    </p>
                    
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 pt-2">
                      <span className="w-2 h-2 rounded-full bg-primary" /> Chính sách đồng kiểm hàng hóa
                    </h4>
                    <p className="text-xs text-slate-550 leading-relaxed pl-4">
                      Khi nhận hàng, quý khách **hoàn toàn có quyền mở thùng đồng kiểm** trực tiếp cùng nhân viên giao nhận. Quý khách vui lòng kiểm tra đúng số lượng, mẫu mã sản phẩm và giấy tờ CO/CQ chứng nhận đi kèm. Nếu phát hiện thiếu hụt hoặc móp méo, quý khách có quyền từ chối nhận hàng và gọi ngay Hotline để được đổi mới.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 4 */}
              <section id="su-co" className="space-y-6 scroll-mt-28 border-t border-slate-100 pt-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <Clock size={18} />
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">4. Theo dõi & Xử lý sự cố vận chuyển</h2>
                </div>
                <div className="text-slate-600 text-sm leading-relaxed space-y-4 font-semibold">
                  <p>
                    Để chủ động quản lý hành trình và ứng phó với các trường hợp khách quan, NBE Hoang Duy thiết lập quy chế theo sát đơn hàng vô cùng chi tiết:
                  </p>
                  <ul className="space-y-3.5 pl-2">
                    <li className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      </div>
                      <div>
                        <strong className="text-slate-900 font-black">Cập nhật mã vận đơn:</strong> Ngay sau khi hàng được gửi đi, hệ thống sẽ tự động gửi Email hoặc tin nhắn SMS chứa mã vận đơn và liên kết tra cứu hành trình trực tiếp đến khách hàng.
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-red-50 border border-red-150 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      </div>
                      <div>
                        <strong className="text-slate-900 font-black">Cam kết bồi thường 100%:</strong> Trong trường hợp bất khả kháng phát sinh từ lỗi vận chuyển (hất lạc hàng hóa, sản phẩm bị nứt vỡ do đè ép), NBE Hoang Duy cam kết chịu trách nhiệm hoàn toàn, tiến hành giao bù hoặc hoàn tiền 100% cho khách hàng trong vòng 24 giờ.
                      </div>
                    </li>
                  </ul>
                </div>
              </section>

            </div>

            {/* Bottom CTA Card */}
            <div className="bg-slate-950 rounded-[2.5rem] text-white p-8 md:p-12 relative overflow-hidden border border-slate-900 space-y-6 shadow-md text-center">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(13,148,136,0.15),transparent)] pointer-events-none" />
              <HelpCircle size={36} className="text-primary mx-auto" />
              <h3 className="text-xl font-black uppercase tracking-tight">Câu hỏi về vận chuyển & thanh toán?</h3>
              <p className="text-slate-400 max-w-md mx-auto text-xs font-medium leading-relaxed">
                Chúng tôi còn hỗ trợ các dịch vụ gửi xe chành, xuất hóa đơn đỏ VAT và thanh toán công nợ linh hoạt cho các dự án công trình.
              </p>
              <div className="flex flex-wrap justify-center gap-4 relative z-10 pt-2">
                <a
                  href="/contact"
                  className="h-11 px-8 bg-primary hover:bg-primary/95 text-slate-950 font-black rounded-xl flex items-center justify-center text-xs uppercase tracking-widest shadow-md transition-all active:scale-95"
                >
                  Liên hệ bộ phận giao nhận
                </a>
              </div>
            </div>

          </main>

        </div>
      </div>

    </div>
  );
};

export default ShippingPolicyPage;
