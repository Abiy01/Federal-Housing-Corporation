import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import FilterSidebar from '../components/properties/FilterSidebar';
import PropertiesHeader from '../components/properties/PropertiesHeader';
import PropertiesGrid from '../components/properties/PropertiesGrid';
import LoadingState from '../components/common/LoadingState';
import { propertiesAPI } from '../services/api';
import { useSEO } from '../hooks/useSEO';

export interface Property {
  _id: string;
  title: string;
  location: string;
  price: number;
  image: string[];
  beds: number;
  baths: number;
  sqft: number;
  type: string;
  availability: string;
  description: string;
  amenities: string[];
  phone: string;
}

/** Map listing text to filter ids `buy` | `rent` (matches admin + Add Property + legacy). */
function listingKind(availability: string | undefined): 'buy' | 'rent' | null {
  if (!availability || typeof availability !== 'string') return null;
  const a = availability.toLowerCase().trim();
  if (a === 'rent' || a.includes('for rent')) return 'rent';
  if (a === 'buy' || a === 'sale' || a.includes('for sale')) return 'buy';
  return null;
}

/** Amenities may be a plain array or one JSON-string element (legacy). */
function amenityStrings(amenities: Property['amenities'] | undefined): string[] {
  if (!amenities || !Array.isArray(amenities)) return [];
  if (
    amenities.length === 1 &&
    typeof amenities[0] === 'string' &&
    amenities[0].trim().startsWith('[')
  ) {
    try {
      const parsed = JSON.parse(amenities[0]) as unknown;
      if (Array.isArray(parsed)) return parsed.map((x) => String(x));
    } catch {
      /* fall through */
    }
  }
  return amenities.map((x) => String(x));
}

export type PropertyFilters = {
  location?: string;
  propertyType?: string[];
  availability?: string;
  priceRange?: [number, number];
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
};

const PropertiesPage: React.FC = () => {
  useSEO({
    title: 'Properties - Browse Listings',
    description: 'Browse apartments, houses, villas, and more. Filter by location, price, bedrooms, and amenities.',
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('featured');
  const [filters, setFilters] = useState<PropertyFilters>({});

  // Fetch properties from backend
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await propertiesAPI.getAll();
        if (!data?.success) {
          throw new Error(data?.message || 'Backend returned an unsuccessful response');
        }

        const list = data?.property ?? data?.properties ?? [];
        setProperties(Array.isArray(list) ? list : []);
      } catch (err: any) {
        console.error('Failed to fetch properties:', err);
        const apiMessage =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to load properties. Please try again later.';
        setError(apiMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Apply filters and sorting
  const filteredProperties = useMemo(() => {
    let result = [...properties];

    // Filter by location
    if (filters.location) {
      const q = filters.location.toLowerCase();
      result = result.filter((p) => (p.location || '').toLowerCase().includes(q));
    }

    // Filter by property type (label match or substring, e.g. "Luxury Apartment" vs "Apartment")
    if (filters.propertyType && filters.propertyType.length > 0) {
      result = result.filter((p) => {
        const pt = (p.type || '').toLowerCase().trim();
        return filters.propertyType!.some((t) => {
          const needle = t.toLowerCase().trim();
          return pt === needle || (needle.length >= 3 && pt.includes(needle));
        });
      });
    }

    // Filter by availability (sidebar `buy` | `rent` vs DB `For Sale`, `sale`, etc.)
    if (filters.availability) {
      const want = filters.availability.toLowerCase() as 'buy' | 'rent';
      result = result.filter((p) => listingKind(p.availability) === want);
    }

    // Filter by price range (slider 0–200 × 1M ETB per step; max 200 = no upper cap)
    if (filters.priceRange) {
      const [min, max] = filters.priceRange;
      const minPrice = min * 1_000_000;
      const maxPrice = max * 1_000_000;
      result = result.filter((p) => {
        if (p.price < minPrice) return false;
        if (max >= 200) return true; // 200 = no upper cap
        return p.price <= maxPrice;
      });
    }

    // Filter by bedrooms (>= selected)
    if (filters.bedrooms && filters.bedrooms > 0) {
      result = result.filter(p => p.beds >= filters.bedrooms!);
    }

    // Filter by bathrooms (>= selected)
    if (filters.bathrooms && filters.bathrooms > 0) {
      result = result.filter(p => p.baths >= filters.bathrooms!);
    }

    // Filter by amenities (must have all selected)
    if (filters.amenities && filters.amenities.length > 0) {
      result = result.filter((p) => {
        const list = amenityStrings(p.amenities).map((a) => a.toLowerCase());
        return filters.amenities!.every((filterAmenity) =>
          list.some((a) => a === filterAmenity.toLowerCase())
        );
      });
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'beds':
        result.sort((a, b) => b.beds - a.beds);
        break;
      case 'newest':
        // Assuming there is a date field, if not, use _id roughly? Or skip.
        // User asked for "Newest (by date added, default)". 
        // Component doesn't have date. I will try to sort by _id descending (implicit timestamp in Mongo ObjectId)
        result.sort((a, b) => b._id.localeCompare(a._id));
        break;
      case 'featured':
      default:
        // Featured could be a flag, or just default order.
        break;
    }

    return result;
  }, [properties, filters, sortBy]);

  const handleFilterChange = useCallback((newFilters: PropertyFilters) => {
    setFilters(newFilters);
  }, []);

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
  };

  const handleViewChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Sticky Navigation */}
      <Navbar />

      <div className="flex flex-col lg:flex-row">
        {/* Left Sidebar - Filters */}
        <FilterSidebar onFilterChange={handleFilterChange} />

        {/* Main Content Area */}
        <div className="flex-1">
          {/* Properties Header with Sort and View Controls */}
          <PropertiesHeader
            totalProperties={filteredProperties.length}
            onSortChange={handleSortChange}
            onViewChange={handleViewChange}
          />


          {/* Loading State */}
          {loading && <LoadingState message="Loading properties..." />}

          {/* Error State */}
          {error && !loading && (
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <span className="material-icons text-4xl text-[#D4755B] mb-4">error_outline</span>
                <p className="font-manrope text-[#374151] mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-[#D4755B] text-white font-manrope font-bold px-6 py-2 rounded-lg hover:bg-[#B86851] transition-all"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredProperties.length === 0 && (
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <span className="material-icons text-4xl text-[#9CA3AF] mb-4">search_off</span>
                <p className="font-manrope text-[#374151] mb-2">No properties found</p>
                <p className="font-manrope font-extralight text-sm text-[#6B7280]">Try adjusting your filters</p>
              </div>
            </div>
          )}

          {/* Properties Grid */}
          {!loading && !error && filteredProperties.length > 0 && (
            <PropertiesGrid properties={filteredProperties} viewMode={viewMode} />
          )}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PropertiesPage;
