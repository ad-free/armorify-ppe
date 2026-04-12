// src/components/common/SeoHead.tsx
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface Props {
  title: string;
  description?: string;
  ogImage?: string;
  canonical?: string;
  breadcrumbJsonLd?: object;
}

export const SeoHead: React.FC<Props> = ({
  title,
  description,
  ogImage,
  canonical,
  breadcrumbJsonLd,
}) => {
  const siteName = 'NBE Hoang Duy';
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content="website" />
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta name="robots" content="index,follow" />
      {canonical && <link rel="canonical" href={`https://nbehoangduy.vn${canonical}`} />}
      {breadcrumbJsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbJsonLd)}
        </script>
      )}
    </Helmet>
  );
};
