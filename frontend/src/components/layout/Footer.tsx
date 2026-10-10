import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const Footer: React.FC = () => {
  const { t } = useTranslation();
  const linkClass = 'flex min-h-11 min-w-11 items-center py-2 text-sm text-muted-foreground hover:text-primary';

  return (
    <footer className="min-w-0 break-words border-t border-border bg-surface text-foreground">
      <div className="container py-10 md:py-12">
        <div className="mb-8">
          <Link to="/" className="inline-flex min-h-11 items-center text-xl font-bold">NBE Hoang Duy</Link>
          <p className="text-body mt-2">Thiết bị bảo hộ lao động cho cá nhân và doanh nghiệp.</p>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <nav aria-labelledby="footer-products" className="min-w-0">
            <h2 id="footer-products" className="mb-3 text-base font-semibold">Sản phẩm</h2>
            <ul>
              <li><Link to="/categories" className={linkClass}>Tất cả sản phẩm</Link></li>
              <li><Link to="/brand" className={linkClass}>Thương hiệu</Link></li>
              <li><Link to="/blog" className={linkClass}>Bài viết</Link></li>
              <li><Link to="/video" className={linkClass}>Video</Link></li>
            </ul>
          </nav>

          <nav aria-labelledby="footer-policies" className="min-w-0">
            <h2 id="footer-policies" className="mb-3 text-base font-semibold">Chính sách</h2>
            <ul>
              <li><Link to="/policy/shipping" className={linkClass}>Chính sách vận chuyển</Link></li>
              <li><Link to="/policy/returns" className={linkClass}>Chính sách đổi trả</Link></li>
            </ul>
          </nav>

          <nav aria-labelledby="footer-contact" className="min-w-0">
            <h2 id="footer-contact" className="mb-3 text-base font-semibold">Liên hệ</h2>
            <address className="not-italic">
              <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{t('footer.address')}</p>
              <ul>
                <li><a href="tel:0372371668" className={linkClass}>0372.371.668</a></li>
                <li><a href="mailto:info@nbehoangduy.vn" className={`${linkClass} [overflow-wrap:anywhere]`}>info@nbehoangduy.vn</a></li>
                <li><Link to="/contact" className={linkClass}>Thông tin liên hệ</Link></li>
              </ul>
            </address>
          </nav>

          <nav aria-labelledby="footer-business" className="min-w-0">
            <h2 id="footer-business" className="mb-3 text-base font-semibold">Mua hàng doanh nghiệp</h2>
            <ul>
              <li><a href={`mailto:info@nbehoangduy.vn?subject=${encodeURIComponent('Yêu cầu báo giá thiết bị bảo hộ')}`} className={linkClass}>Yêu cầu báo giá qua email</a></li>
              <li><Link to="/dealer" className={linkClass}>Thông tin dành cho đại lý</Link></li>
              <li><Link to="/about" className={linkClass}>Về NBE Hoang Duy</Link></li>
            </ul>
          </nav>
        </div>
      </div>
      <div className="border-t border-border">
        <p className="container py-6 text-sm text-muted-foreground">{t('footer.copyright')}</p>
      </div>
    </footer>
  );
};
