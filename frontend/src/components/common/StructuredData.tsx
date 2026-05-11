import React from 'react';
import { useLocation } from 'react-router-dom';

const DEFAULT_SITE_URL = 'https://federal-housing-corporation.vercel.app';

function getSiteBaseUrl(): string {
  const fromEnv = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (typeof window !== 'undefined') return window.location.origin;
  return DEFAULT_SITE_URL;
}

interface StructuredDataProps {
  type: 'website' | 'organization' | 'property';
  data?: {
    title?: string;
    description?: string;
    location?: string;
    region?: string;
    price?: number;
    sqft?: number;
    beds?: number;
    baths?: number;
    createdAt?: string;
    image?: string;
  };
}

const StructuredData: React.FC<StructuredDataProps> = ({ type, data }) => {
  const location = useLocation();
  const siteUrl = getSiteBaseUrl();
  const currentUrl = `${siteUrl}${location.pathname}`;

  const schemas: Record<string, object> = {
    website: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Federal Housing Corporation',
      alternateName: 'FHC',
      url: siteUrl,
      description:
        'Official digital platform for verified federal housing listings, rentals, and citizen-facing property services in Ethiopia.',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/properties?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    organization: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Federal Housing Corporation',
      alternateName: 'FHC',
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
      sameAs: [
        'https://github.com/AAYUSH412/Real-Estate-Website',
        'https://linkedin.com/in/AAYUSH412',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: ['English', 'Amharic'],
      },
    },
    property: {
      '@context': 'https://schema.org',
      '@type': 'RealEstateListing',
      name: data?.title || 'Property Listing',
      description: data?.description || 'Property details',
      url: currentUrl,
      datePosted: data?.createdAt || new Date().toISOString(),
      image: data?.image || `${siteUrl}/og-image.png`,
      address: {
        '@type': 'PostalAddress',
        addressLocality: data?.location || 'City',
        addressRegion: data?.region || 'Region',
        addressCountry: 'ET',
      },
      ...(data?.price != null && {
        price: data.price,
        priceCurrency: 'ETB',
      }),
      ...(data?.sqft && {
        floorSize: {
          '@type': 'QuantitativeValue',
          unitText: 'SQFT',
          value: data.sqft,
        },
      }),
      ...(data?.beds && { numberOfRooms: data.beds }),
      ...(data?.baths && { numberOfBathroomsTotal: data.baths }),
    },
  };

  const schemaData = schemas[type] || schemas.website;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
};

export default StructuredData;
