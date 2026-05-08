import React from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://buildestate.vercel.app';

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
  const currentUrl = `${SITE_URL}${location.pathname}`;

  const schemas: Record<string, object> = {
    website: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'BuildEstate',
      url: SITE_URL,
      description: 'AI-powered luxury real estate platform for finding your perfect property in India.',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/properties?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    organization: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'BuildEstate',
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      sameAs: [
        'https://github.com/AAYUSH412/Real-Estate-Website',
        'https://linkedin.com/in/AAYUSH412',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: ['English', 'Hindi'],
      },
    },
    property: {
      '@context': 'https://schema.org',
      '@type': 'RealEstateListing',
      name: data?.title || 'Property Listing',
      description: data?.description || 'Property details',
      url: currentUrl,
      datePosted: data?.createdAt || new Date().toISOString(),
      image: data?.image || `${SITE_URL}/og-image.png`,
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
