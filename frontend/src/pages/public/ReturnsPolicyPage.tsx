import React, { useState, useEffect } from 'react';
import { ShieldAlert, RotateCcw, ShieldCheck, Wrench, Phone, HelpCircle, ChevronRight, FileText, BadgeHelp } from 'lucide-react';
import { SeoHead } from '@/components/common/SeoHead';
import { Breadcrumb } from '@/components/common/Breadcrumb';

export const ReturnsPolicyPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('dieu-kien');

  const sections = [
    { id: 'dieu-kien', label: '1. Điều kiện đổi trả' },
    { id: 'quy-trinh', label: '2. Quy trình đổi trả' },
    { id: 'bao-hanh', label: '3. Chính sách bảo hành' },
    { id: 'hoan-tien', label: '4. Phương thức hoàn tiền' }
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
        title="Đổi Trả & Bảo Hành - NBE Hoang Duy"
        description="Tìm hiểu quy chế đổi trả hàng trong 7 ngày, quy trình hoàn tiền nhanh chóng và chính sách bảo hành chính hãng thiết bị bảo hộ lao động tại NBE Hoang Duy."
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
                { label: 'Đổi trả & Bảo hành' }
              ]}
            />
            <div className="mt-6 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-primary/10 text-primary uppercase tracking-widest border border-primary/20">
                  <RotateCcw size={12} className="text-primary" /> Bảo vệ lợi ích tối đa
                </span>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase leading-none">
                  Chính Sách Đổi Trả & Bảo Hành
                </h1>
                <p className="text-slate-400 max-w-2xl text-xs md:text-sm font-semibold leading-relaxed">
                  Hỗ trợ đổi trả miễn phí trong 7 ngày đối với lỗi nhà sản xuất và cam kết bảo hành chính hãng lên tới 12 tháng cho toàn bộ trang thiết bị bảo hộ.
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
                  <span className="text-[11px] font-black uppercase text-slate-800 tracking-wider">Cần phản hồi bảo hành?</span>
                </div>
                <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                  Chúng tôi xử lý mọi khiếu nại bảo hành cực kỳ nhanh chóng và thấu hiểu.
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
              <section id="dieu-kien" className="space-y-6 scroll-mt-28">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                    <ShieldAlert size={18} />
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">1. Điều kiện đổi trả sản phẩm</h2>
                </div>
                <div className="text-slate-600 text-sm leading-relaxed space-y-4 font-semibold">
                  <p>
                    Để đảm bảo tính công bằng và sự an tâm tối đa của quý khách, NBE Hoang Duy áp dụng chính sách đổi trả linh hoạt trong vòng **7 ngày** kể từ thời điểm nhận hàng thành công.
                  </p>
                  
                  <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 space-y-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal-500" /> Các trường hợp được đổi trả miễn phí
                    </h4>
                    <ul className="text-xs text-slate-500 font-medium leading-relaxed list-disc list-inside space-y-2 pl-2">
                      <li>Sản phẩm phát sinh lỗi kỹ thuật do nhà sản xuất (bong đế giày bảo hộ, lỗi may lệch cúc áo, nứt kính bảo hộ...).</li>
                      <li>Sản phẩm giao bị thiếu số lượng hoặc giao sai mã màu, sai size so với đơn hàng đã thanh toán.</li>
                      <li>Sản phẩm bị trầy xước, dập nát nghiêm trọng trong quá trình vận chuyển của bên thứ ba.</li>
                    </ul>

                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 pt-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" /> Các trường hợp không áp dụng đổi trả
                    </h4>
                    <ul className="text-xs text-slate-500 font-medium leading-relaxed list-disc list-inside space-y-2 pl-2">
                      <li>Sản phẩm đã qua sử dụng thực tế tại công trường (dính bùn đất, dầu mỡ, cọ rách vỏ bên ngoài).</li>
                      <li>Sản phẩm bị mất nhãn mác niêm phong gốc của thương hiệu hoặc vỏ hộp đã bị xé nát nghiêm trọng.</li>
                      <li>Khách hàng bảo quản sai hướng dẫn của nhà sản xuất (để thiết bị ẩm mốc, cháy xém do nhiệt độ cao...).</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Section 2 */}
              <section id="quy-trinh" className="space-y-6 scroll-mt-28 border-t border-slate-100 pt-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                    <RotateCcw size={18} />
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">2. Quy trình đổi trả nhanh chóng</h2>
                </div>
                <div className="text-slate-600 text-sm leading-relaxed space-y-4 font-semibold">
                  <p>
                    Quy trình xử lý đổi trả tại NBE Hoang Duy được thiết kế tối giản, hỗ trợ thu hồi tận nhà khách hàng:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-2">
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest block">Bước 1: Tiếp nhận</span>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        Gọi ngay Hotline/Zalo **0372.371.668** và cung cấp hình ảnh hoặc video ngắn phản ánh lỗi sản phẩm.
                      </p>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-2">
                      <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest block">Bước 2: Thu hồi tận nơi</span>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        Bưu tá bưu cục liên kết sẽ đến nhận lại hàng hoàn trả tại địa chỉ của quý khách hoàn toàn **miễn phí cước**.
                      </p>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-2">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">Bước 3: Bàn giao hàng mới</span>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        Sau khi nhận hàng cũ và xác nhận lỗi, chúng tôi sẽ lập tức gửi bù sản phẩm mới trong vòng 2 - 3 ngày.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 3 */}
              <section id="bao-hanh" className="space-y-6 scroll-mt-28 border-t border-slate-100 pt-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                    <ShieldCheck size={18} />
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">3. Thời gian & Phạm vi bảo hành chính hãng</h2>
                </div>
                <div className="text-slate-600 text-sm leading-relaxed space-y-4 font-semibold">
                  <p>
                    Toàn bộ sản phẩm phân phối bởi NBE Hoang Duy đều đi kèm thẻ bảo hành hoặc tem kiểm định chính hãng, áp dụng thời gian bảo hành tương ứng theo từng dòng sản phẩm:
                  </p>
                  
                  <div className="overflow-x-auto rounded-2xl border border-slate-150">
                    <table className="min-w-full divide-y divide-slate-150 bg-white text-xs text-left">
                      <thead className="bg-slate-50 font-black text-slate-700 uppercase tracking-wider">
                        <tr>
                          <th className="px-5 py-4">Nhóm Sản Phẩm</th>
                          <th className="px-5 py-4">Thời Gian Bảo Hành</th>
                          <th className="px-5 py-4">Chi Tiết Bảo Hành</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-500">
                        <tr>
                          <td className="px-5 py-4 font-black text-slate-800">Giày & Ủng Bảo Hộ</td>
                          <td className="px-5 py-4 text-teal-600 font-black">6 Tháng</td>
                          <td className="px-5 py-4">Bảo hành bung keo đế, nứt nanh đế, đứt chỉ các đường may chịu lực chính.</td>
                        </tr>
                        <tr>
                          <td className="px-5 py-4 font-black text-slate-800">Mũ Bảo Hộ Chuyên Dụng</td>
                          <td className="px-5 py-4 text-teal-600 font-black">12 Tháng</td>
                          <td className="px-5 py-4">Bảo hành kết cấu cơ học vỏ mũ ABS, núm vặn điều chỉnh vòng đầu.</td>
                        </tr>
                        <tr>
                          <td className="px-5 py-4 font-black text-slate-800">Quần Áo Chống Hóa Chất</td>
                          <td className="px-5 py-4 text-blue-600 font-black">1 Đổi 1</td>
                          <td className="px-5 py-4">Cam kết 1 đổi 1 ngay khi khui hộp nếu đường may dán băng keo bị hở chống thấm.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* Section 4 */}
              <section id="hoan-tien" className="space-y-6 scroll-mt-28 border-t border-slate-100 pt-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <Wrench size={18} />
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">4. Phương thức & Thời gian hoàn tiền</h2>
                </div>
                <div className="text-slate-600 text-sm leading-relaxed space-y-4 font-semibold">
                  <p>
                    Trong trường hợp sản phẩm đổi mới bị cháy hàng hoặc nhà máy ngưng sản xuất, NBE Hoang Duy sẽ áp dụng chính sách hoàn trả ngân sách linh hoạt:
                  </p>
                  <ul className="space-y-3.5 pl-2">
                    <li className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      </div>
                      <div>
                        <strong className="text-slate-900 font-black">Hoàn trả ngân sách 100%:</strong> Quý khách sẽ nhận lại toàn bộ khoản chi trả ban đầu (bao gồm cả thuế VAT và phí vận chuyển đi kèm nếu có).
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      </div>
                      <div>
                        <strong className="text-slate-900 font-black">Chuyển khoản siêu tốc:</strong> Tiền hoàn trả sẽ được chuyển khoản trực tiếp qua tài khoản ngân hàng chính chủ của quý khách trong vòng tối đa **48 giờ** làm việc sau khi hai bên hoàn thành thủ tục ký nhận thu hồi.
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
              <h3 className="text-xl font-black uppercase tracking-tight">Cần kích hoạt bảo hành điện tử?</h3>
              <p className="text-slate-400 max-w-md mx-auto text-xs font-medium leading-relaxed">
                Chúng tôi cung cấp hệ thống kiểm tra số lô bảo hành trực tuyến tiện lợi cho mọi sản phẩm thuộc phân khúc cao cấp.
              </p>
              <div className="flex flex-wrap justify-center gap-4 relative z-10 pt-2">
                <a
                  href="/contact"
                  className="h-11 px-8 bg-primary hover:bg-primary/95 text-slate-950 font-black rounded-xl flex items-center justify-center text-xs uppercase tracking-widest shadow-md transition-all active:scale-95"
                >
                  Yêu cầu xử lý kỹ thuật
                </a>
              </div>
            </div>

          </main>

        </div>
      </div>

    </div>
  );
};

export default ReturnsPolicyPage;
