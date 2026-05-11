import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import SimpleFooter from '../components/common/SimpleFooter';
import LoadingState from '../components/common/LoadingState';
import PropertyBreadcrumb from '../components/property-details/PropertyBreadcrumb';
import PropertyHeroImage from '../components/property-details/PropertyHeroImage';
import PropertyHeader from '../components/property-details/PropertyHeader';
import PropertyAbout from '../components/property-details/PropertyAbout';
import PropertyAmenities from '../components/property-details/PropertyAmenities';
import PropertyLocation from '../components/property-details/PropertyLocation';
import ScheduleViewingCard from '../components/property-details/ScheduleViewingCard';
import { paymentsAPI, propertiesAPI } from '../services/api';
import { useSEO } from '../hooks/useSEO';
import StructuredData from '../components/common/StructuredData';
import { formatPrice } from '../utils/formatPrice';
import { transactionsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface PropertyData {
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
  googleMapLink?: string;
  status?: string;
}

type RequestType = 'rent' | 'buy';
type PaymentMethod = 'telebirr' | 'cbebirr' | 'cbe';

/** Listing types from admin (rent/buy), user listings (For Rent/For Sale), and filters. */
function getAllowedRequestTypes(availability: string | undefined): RequestType[] {
  if (availability == null || availability === '') return ['rent', 'buy'];
  const a = availability.toLowerCase().trim();
  if (a === 'rent' || a.includes('for rent')) return ['rent'];
  if (a === 'buy' || a === 'sale' || a.includes('for sale')) return ['buy'];
  return ['rent', 'buy'];
}

const PropertyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestType, setRequestType] = useState<RequestType>('rent');
  const [requestMessage, setRequestMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('telebirr');
  const [paymentReference, setPaymentReference] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<{
    paymentReference?: string;
    receiptFile?: string;
    contractFile?: string;
  }>({});
  const [paymentMethods, setPaymentMethods] = useState({
    telebirrNumber: '',
    cbebirrNumber: '',
    cbeAccountNumber: '',
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const { isAuthenticated } = useAuth();

  // Dynamic SEO based on loaded property
  useSEO({
    title: property ? `${property.title} - ${property.location}` : 'Property Details',
    description: property
      ? `${property.title} in ${property.location}. ${property.beds} beds, ${property.baths} baths, ${property.sqft} sqft. ${property.type}.`
      : 'View verified property details on the Federal Housing Corporation (FHC) platform.',
  });

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const { data } = await propertiesAPI.getById(id);
        if (data.success && data.property) {
          setProperty(data.property);
        } else {
          setError('Property not found');
        }
      } catch (err: any) {
        console.error('Failed to fetch property:', err);
        setError('Failed to load property details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const { data } = await paymentsAPI.getMethods();
        if (data?.success && data?.methods) {
          setPaymentMethods({
            telebirrNumber: data.methods.telebirrNumber || '',
            cbebirrNumber: data.methods.cbebirrNumber || '',
            cbeAccountNumber: data.methods.cbeAccountNumber || '',
          });
        }
      } catch {
        // Non-fatal: user can still submit if backend fallback values are empty.
      }
    };
    fetchPaymentMethods();
  }, []);

  // Map availability to status
  const getStatus = (availability: string): 'available' | 'sold' | 'pending' => {
    switch (availability?.toLowerCase()) {
      case 'sold': return 'sold';
      case 'pending': return 'pending';
      default: return 'available';
    }
  };

  if (loading) {
    return (
      <div className="bg-white min-h-screen">
        <Navbar />
        <LoadingState message="Loading property details..." />
        <SimpleFooter />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="bg-white min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <span className="material-icons text-5xl text-[#D4755B] mb-4">error_outline</span>
            <p className="font-manrope text-xl text-[#374151] mb-4">{error || 'Property not found'}</p>
            <Link
              to="/properties"
              className="bg-[#D4755B] text-white font-manrope font-bold px-8 py-3 rounded-lg hover:bg-[#B86851] transition-all inline-block"
            >
              Back to Properties
            </Link>
          </div>
        </div>
        <SimpleFooter />
      </div>
    );
  }

  // Extract city from location string (e.g. "Satellite, Ahmedabad, Gujarat" → "Ahmedabad")
  // Indian addresses typically end with state, so use second-to-last part as city
  const cityParts = property.location.split(',').map(s => s.trim());
  const city = cityParts.length >= 3
    ? cityParts[cityParts.length - 2]       // "Area, City, State" → City
    : cityParts.length === 2
      ? cityParts[0]                         // "City, State" → City
      : cityParts[0];                        // "City" → City

  // Parse amenities — handle legacy data where amenities may be a JSON string
  const parseAmenities = (amenities: string[]): string[] => {
    if (!amenities || amenities.length === 0) return [];
    // If single element that looks like a JSON array, parse it
    if (amenities.length === 1 && typeof amenities[0] === 'string' && amenities[0].startsWith('[')) {
      try {
        const parsed = JSON.parse(amenities[0]);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* fall through */ }
    }
    return amenities;
  };

  const isPropertyActive = !property.status || property.status === 'active';
  const allowedRequestTypes = getAllowedRequestTypes(property.availability);
  const canRequestRent = allowedRequestTypes.includes('rent');
  const canRequestBuy = allowedRequestTypes.includes('buy');

  const openRequestModal = (type: RequestType) => {
    setRequestType(type);
    setRequestMessage('');
    setPaymentMethod('telebirr');
    setPaymentReference('');
    setReceiptFile(null);
    setContractFile(null);
    setFormErrors({});
    setIsRequestModalOpen(true);
  };

  const submitTransactionRequest = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to submit a request.');
      return;
    }

    const nextErrors: { paymentReference?: string; receiptFile?: string; contractFile?: string } = {};
    if (!paymentReference.trim()) nextErrors.paymentReference = 'Please enter your payment reference.';
    if (!receiptFile) nextErrors.receiptFile = 'Please upload your payment receipt.';
    if (!contractFile) nextErrors.contractFile = 'Please upload a clear scanned contract photo.';
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error('Please complete all required payment documents.');
      return;
    }

    setSubmittingRequest(true);
    try {
      const paymentForm = new FormData();
      paymentForm.append('propertyId', property._id);
      paymentForm.append('requestType', requestType);
      paymentForm.append('method', paymentMethod);
      paymentForm.append('reference', paymentReference.trim());
      paymentForm.append('receipt', receiptFile);
      paymentForm.append('contract', contractFile);

      const paymentRes = await paymentsAPI.createPayment(paymentForm);
      const paymentId = paymentRes?.data?.payment?._id;
      if (!paymentRes?.data?.success || !paymentId) {
        throw new Error(paymentRes?.data?.message || 'Unable to submit payment proof');
      }

      const { data } = await transactionsAPI.createRequest({
        propertyId: property._id,
        requestType,
        paymentId,
        message: requestMessage.trim(),
      });

      if (!data?.success) {
        throw new Error(data?.message || 'Unable to submit request');
      }

      toast.success(
        requestType === 'rent'
          ? 'Rent request submitted successfully.'
          : 'Buy request submitted successfully.'
      );
      setIsRequestModalOpen(false);
      setRequestMessage('');
      setPaymentReference('');
      setReceiptFile(null);
      setContractFile(null);
      setFormErrors({});
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || 'Failed to submit request.'
      );
    } finally {
      setSubmittingRequest(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Property Structured Data for SEO */}
      <StructuredData
        type="property"
        data={{
          title: property.title,
          description: property.description,
          location: city,
          region: cityParts[cityParts.length - 1] || '',
          price: property.price,
          sqft: property.sqft,
          beds: property.beds,
          baths: property.baths,
          image: property.image?.[0],
        }}
      />

      {/* Navigation */}
      <Navbar />

      {/* Breadcrumb Navigation */}
      <PropertyBreadcrumb
        city={city}
        propertyName={property.title}
      />

      {/* Hero Image */}
      <PropertyHeroImage image={property.image?.[0]} />

      {/* Property Header with Price & Specs */}
      <PropertyHeader
        status={getStatus(property.availability)}
        refNumber={`#${property._id.slice(-8).toUpperCase()}`}
        name={property.title}
        location={property.location}
        price={formatPrice(property.price)}
        beds={property.beds}
        baths={property.baths}
        sqft={property.sqft}
      />

      {/* Main Content Area */}
      <div className="bg-[#F2EFE9] py-12">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-[#E6E0DA] rounded-2xl p-8 shadow-sm">
                {/* About Section */}
                <PropertyAbout description={property.description} />

                {/* Amenities Section */}
                <PropertyAmenities
                  amenities={parseAmenities(property.amenities)}
                />

                {/* Location Section */}
                <PropertyLocation
                  location={property.location}
                  propertyName={property.title}
                  googleMapLink={property.googleMapLink}
                />
              </div>
            </div>

            {/* Right Column - Schedule Viewing Sidebar */}
            <div className="lg:col-span-1">
              {isPropertyActive && (canRequestRent || canRequestBuy) && (
                <div className="bg-white border border-[#E6E0DA] rounded-2xl p-5 shadow-sm mb-4">
                  <h3 className="font-fraunces text-xl text-[#221410] mb-3">Interested in this property?</h3>
                  <p className="font-manrope text-sm text-[#6B7280] mb-4">
                    {canRequestRent && canRequestBuy
                      ? 'Send a formal request to rent or buy. Our team will review your request.'
                      : canRequestRent
                        ? 'This listing is for rent. Send a formal request and our team will review it.'
                        : 'This listing is for sale. Send a formal request and our team will review it.'}
                  </p>
                  <div className="flex flex-col gap-2">
                    {canRequestRent && (
                      <button
                        type="button"
                        onClick={() => openRequestModal('rent')}
                        className="w-full bg-[#D4755B] text-white font-manrope font-semibold py-2.5 rounded-lg hover:bg-[#B86851] transition-colors"
                      >
                        Request to Rent
                      </button>
                    )}
                    {canRequestBuy && (
                      <button
                        type="button"
                        onClick={() => openRequestModal('buy')}
                        className={`w-full font-manrope font-semibold py-2.5 rounded-lg transition-colors ${
                          canRequestRent
                            ? 'border border-[#D4755B] text-[#D4755B] hover:bg-[#D4755B] hover:text-white'
                            : 'bg-[#D4755B] text-white hover:bg-[#B86851]'
                        }`}
                      >
                        Request to Buy
                      </button>
                    )}
                  </div>
                </div>
              )}

              <ScheduleViewingCard
                property={{ name: property.title, id: property._id }}
              />
            </div>
          </div>
        </div>
      </div>

      {isRequestModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/45"
            onClick={() => setIsRequestModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white border border-[#E6E0DA] rounded-2xl shadow-2xl p-6">
            <h3 className="font-fraunces text-2xl text-[#221410] mb-2">
              {requestType === 'rent' ? 'Request to Rent' : 'Request to Buy'}
            </h3>
            <p className="font-manrope text-sm text-[#6B7280] mb-4">
              Property: <span className="text-[#374151] font-medium">{property.title}</span>
            </p>

            {!isAuthenticated ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="font-manrope text-sm text-amber-800 mb-3">
                  Please sign in to continue with this request.
                </p>
                <Link
                  to="/signin"
                  className="inline-block bg-[#D4755B] text-white font-manrope font-semibold px-4 py-2 rounded-lg hover:bg-[#B86851] transition-colors"
                >
                  Sign In
                </Link>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-[#E6E0DA] bg-[#FAF8F4] p-3 mb-4">
                  <p className="font-manrope text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-2">
                    Payment Methods
                  </p>
                  <div className="space-y-1 font-manrope text-sm text-[#374151]">
                    <p>Telebirr Number: <span className="font-semibold">{paymentMethods.telebirrNumber || 'Not set'}</span></p>
                    <p>CBE Birr Number: <span className="font-semibold">{paymentMethods.cbebirrNumber || 'Not set'}</span></p>
                    <p>CBE Account Number: <span className="font-semibold">{paymentMethods.cbeAccountNumber || 'Not set'}</span></p>
                  </div>
                </div>

                <label className="block font-manrope text-sm font-medium text-[#374151] mb-1">
                  Paid Via
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full border border-[#E6E0DA] rounded-lg px-3 py-2.5 font-manrope text-sm text-[#221410] mb-3"
                >
                  <option value="telebirr">Telebirr</option>
                  <option value="cbebirr">CBE Birr</option>
                  <option value="cbe">CBE</option>
                </select>

                <label className="block font-manrope text-sm font-medium text-[#374151] mb-1">
                  Payment Reference
                </label>
                <input
                  value={paymentReference}
                  onChange={(e) => {
                    setPaymentReference(e.target.value);
                    if (formErrors.paymentReference) {
                      setFormErrors((prev) => ({ ...prev, paymentReference: undefined }));
                    }
                  }}
                  placeholder="Enter transaction/reference number"
                  className="w-full border border-[#E6E0DA] rounded-lg px-3 py-2.5 font-manrope text-sm text-[#221410]"
                />
                {formErrors.paymentReference && (
                  <p className="font-manrope text-xs text-red-600 mt-1 mb-3">{formErrors.paymentReference}</p>
                )}

                <label className="block font-manrope text-sm font-medium text-[#374151] mb-1">
                  Upload Receipt
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    setReceiptFile(e.target.files?.[0] || null);
                    if (formErrors.receiptFile) {
                      setFormErrors((prev) => ({ ...prev, receiptFile: undefined }));
                    }
                  }}
                  className="w-full border border-[#E6E0DA] rounded-lg px-3 py-2 font-manrope text-sm text-[#221410] bg-white"
                />
                {formErrors.receiptFile && (
                  <p className="font-manrope text-xs text-red-600 mt-1 mb-3">{formErrors.receiptFile}</p>
                )}

                <label className="block font-manrope text-sm font-medium text-[#374151] mb-1">
                  Upload Signed Contract
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    setContractFile(e.target.files?.[0] || null);
                    if (formErrors.contractFile) {
                      setFormErrors((prev) => ({ ...prev, contractFile: undefined }));
                    }
                  }}
                  className="w-full border border-[#E6E0DA] rounded-lg px-3 py-2 font-manrope text-sm text-[#221410] bg-white"
                />
                <p className="font-manrope text-xs text-[#6B7280] mt-1">
                  Upload a clear scanned contract photo.
                </p>
                {formErrors.contractFile && (
                  <p className="font-manrope text-xs text-red-600 mt-1 mb-3">{formErrors.contractFile}</p>
                )}

                <label className="block font-manrope text-sm font-medium text-[#374151] mb-1">
                  Message (optional)
                </label>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  rows={4}
                  placeholder="Add any details you'd like the admin to know..."
                  className="w-full border border-[#E6E0DA] rounded-lg px-3 py-2.5 font-manrope text-sm text-[#221410] focus:outline-none focus:ring-2 focus:ring-[#D4755B]/30 focus:border-[#D4755B] resize-none"
                />

                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setIsRequestModalOpen(false)}
                    className="px-4 py-2 text-sm font-manrope font-medium text-[#374151] border border-[#E6E0DA] rounded-lg hover:bg-[#F9F7F3] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitTransactionRequest}
                    disabled={submittingRequest}
                    className="px-4 py-2 text-sm font-manrope font-semibold text-white bg-[#D4755B] rounded-lg hover:bg-[#B86851] transition-colors disabled:opacity-60"
                  >
                    {submittingRequest ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Simple Footer */}
      <SimpleFooter />
    </div>
  );
};

export default PropertyDetailsPage;
