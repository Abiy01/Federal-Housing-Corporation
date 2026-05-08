import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { useAuth } from '../contexts/AuthContext';
import { paymentsAPI, transactionsAPI } from '../services/api';
import { formatPrice } from '../utils/formatPrice';

type TxStatus = 'pending' | 'approved' | 'rejected';
type TxType = 'rent' | 'buy';

interface PopulatedProperty {
  _id: string;
  title: string;
  location: string;
  price?: number;
  status?: string;
  availability?: string;
  image?: string[];
}

interface TransactionRequestRow {
  _id: string;
  requestType: TxType;
  status: TxStatus;
  transactionValue?: number | null;
  message?: string;
  decisionNote?: string;
  decidedAt?: string | null;
  createdAt: string;
  property?: PopulatedProperty | null;
}

type PaymentStatus = 'pending' | 'successful' | 'failed';
type PaymentMethod = 'telebirr' | 'cbebirr' | 'cbe';

interface PaymentRow {
  _id: string;
  transaction?: { _id: string } | null;
  method: PaymentMethod;
  amount: number;
  reference: string;
  receiptUrl?: string;
  contractUrl?: string;
  note?: string;
  status: PaymentStatus;
  paidAt?: string;
  createdAt: string;
}

type ModalStep = 'method' | 'details' | 'success';

const STATUS_STYLES: Record<TxStatus, string> = {
  pending: 'bg-amber-50 text-amber-800 border border-amber-200',
  approved: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  rejected: 'bg-red-50 text-red-800 border border-red-200',
};

const TYPE_LABEL: Record<TxType, string> = {
  rent: 'Rent',
  buy: 'Buy',
};

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const METHOD_META: Record<
  PaymentMethod,
  {
    title: string;
    description: string;
    subDescription: string;
    accent: string;
    iconBg: string;
    icon: string;
    shortCode: string;
    inputLabel: string;
    inputPlaceholder: string;
  }
> = {
  telebirr: {
    title: 'Telebirr',
    description: 'Mobile wallet · Ethio Telecom',
    subDescription: 'Mobile wallet payment',
    accent: 'border-[#0EA5E9] bg-[#E6F6FD]',
    iconBg: 'bg-[#0284C7]',
    icon: 'smartphone',
    shortCode: 'tb',
    inputLabel: 'Telebirr Phone Number',
    inputPlaceholder: '+251 9XX XX XX XX',
  },
  cbebirr: {
    title: 'CBE Birr',
    description: 'Bank wallet · Commercial Bank of Ethiopia',
    subDescription: 'Bank wallet payment',
    accent: 'border-[#DC2626] bg-[#FCEDED]',
    iconBg: 'bg-[#B91C1C]',
    icon: 'account_balance',
    shortCode: 'CBE',
    inputLabel: 'CBE Account Number',
    inputPlaceholder: '1000 XXXX XXXX',
  },
  cbe: {
    title: 'CBE',
    description: 'Commercial Bank of Ethiopia',
    subDescription: 'Direct CBE payment',
    accent: 'border-[#7C3AED] bg-[#F3E8FF]',
    iconBg: 'bg-[#6D28D9]',
    icon: 'credit_card',
    shortCode: 'CBE',
    inputLabel: 'CBE Reference Number',
    inputPlaceholder: 'CBE-XXXXXXXX',
  },
};

const MyTransactionRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useAuth();

  const [requests, setRequests] = useState<TransactionRequestRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [payingFor, setPayingFor] = useState<TransactionRequestRow | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('telebirr');
  const [modalStep, setModalStep] = useState<ModalStep>('method');
  const [telebirrPhone, setTelebirrPhone] = useState('');
  const [cbebirrAccount, setCbebirrAccount] = useState('');
  const [walletPin, setWalletPin] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [modalReceipt, setModalReceipt] = useState<PaymentRow | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast.error('Please sign in to view your transaction requests.');
      navigate('/signin', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const fetchData = useCallback(async () => {
    setFetchLoading(true);
    try {
      const [requestsRes, paymentsRes] = await Promise.all([
        transactionsAPI.getMyRequests(),
        paymentsAPI.getMyPayments(),
      ]);
      setRequests(requestsRes.data?.requests ?? []);
      setPayments(paymentsRes.data?.payments ?? []);
    } catch {
      toast.error('Failed to load transaction requests/payments.');
    } finally {
      setFetchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated, fetchData]);

  const latestPaymentByTransaction = payments.reduce<Record<string, PaymentRow>>((acc, p) => {
    const txId = p.transaction?._id;
    if (!txId) return acc;
    const prev = acc[txId];
    if (!prev || new Date(p.createdAt).getTime() > new Date(prev.createdAt).getTime()) {
      acc[txId] = p;
    }
    return acc;
  }, {});

  const openPayModal = (row: TransactionRequestRow) => {
    setPayingFor(row);
    setPaymentMethod('telebirr');
    setModalStep('method');
    setTelebirrPhone('');
    setCbebirrAccount('');
    setWalletPin('');
    setModalReceipt(null);
  };

  const closePayModal = () => {
    if (submittingPayment) return;
    setPayingFor(null);
  };

  const getTransactionAmount = (row: TransactionRequestRow) =>
    typeof row.transactionValue === 'number'
      ? row.transactionValue
      : typeof row.property?.price === 'number'
        ? row.property.price
        : 0;

  const getTransactionPurpose = (row: TransactionRequestRow) => {
    const purpose = row.requestType === 'rent' ? 'Monthly Rent' : 'Property Purchase';
    const propertyRef = row.property?._id
      ? `APN-${row.property._id.slice(-3).toUpperCase()} / LSE-${row._id.slice(-4).toUpperCase()}`
      : `TX-${row._id.slice(-6).toUpperCase()}`;
    return `${purpose} — ${propertyRef}`;
  };

  const printReceipt = () => {
    if (!payingFor || !modalReceipt) return;
    const payer = user?.name?.trim() || 'User';
    const fieldLabel = modalReceipt.method === 'telebirr' ? 'Phone' : 'Account';
    const fieldValue = modalReceipt.reference || '—';
    const amount = formatPrice(modalReceipt.amount || getTransactionAmount(payingFor));
    const purpose = getTransactionPurpose(payingFor);
    const date = new Date(modalReceipt.paidAt || modalReceipt.createdAt).toLocaleString();
    const txCode = `${modalReceipt.method === 'telebirr' ? 'TB' : 'CBE'}-${modalReceipt._id
      .slice(-4)
      .toUpperCase()}`;

    const receiptWindow = window.open('', '_blank', 'width=820,height=720');
    if (!receiptWindow) return;
    receiptWindow.document.write(`
      <html>
      <head>
        <title>Payment Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #1a1a1a; }
          .card { border: 1px solid #d8d8d6; padding: 20px; }
          h1 { margin: 0 0 16px; font-size: 22px; }
          .row { display: flex; justify-content: space-between; margin: 10px 0; }
          .label { color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
          .value { font-size: 18px; }
          .sep { border-top: 1px dashed #ccc; margin: 16px 0; }
        </style>
      </head>
      <body>
        <h1>Payment Confirmed</h1>
        <div class="card">
          <div class="row"><div><div class="label">Method</div><div class="value">${modalReceipt.method.toUpperCase()}</div></div><div><div class="label">Status</div><div class="value">SUCCESS</div></div></div>
          <div class="sep"></div>
          <div class="row"><div><div class="label">Transaction ID</div><div>${txCode}</div></div><div><div class="label">Date</div><div>${date}</div></div></div>
          <div class="row"><div><div class="label">${fieldLabel}</div><div>${fieldValue}</div></div><div><div class="label">Payer</div><div>${payer}</div></div></div>
          <div class="row"><div><div class="label">Purpose</div><div>${purpose}</div></div></div>
          <div class="sep"></div>
          <div class="row"><div class="label">Amount Paid</div><div class="value">${amount}</div></div>
        </div>
      </body>
      </html>
    `);
    receiptWindow.document.close();
    receiptWindow.focus();
    receiptWindow.print();
  };

  const submitPayment = async () => {
    toast.error('Use the property page request flow to submit payment receipt and a clear scanned contract.');
  };

  if (isLoading || fetchLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F4]">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-16">
          <div className="h-10 w-72 bg-[#E6E0DA] rounded animate-pulse mb-10" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-[#E6E0DA] rounded-2xl p-5">
                <div className="h-4 bg-[#E6E0DA] rounded animate-pulse w-2/3 mb-4" />
                <div className="h-3 bg-[#E6E0DA] rounded animate-pulse w-1/2" />
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!requests.length) {
    return (
      <div className="min-h-screen bg-[#FAF8F4]">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-24 text-center">
          <div className="w-20 h-20 bg-[#F3EDE8] rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="font-material-icons text-[#D4755B] text-4xl">receipt_long</span>
          </div>
          <h1 className="font-fraunces text-3xl font-bold text-[#221410] mb-3">No transaction requests yet</h1>
          <p className="font-manrope text-[#6B7280] mb-8">
            When you request to rent or buy a property, it will show up here. Browse listings and submit a request from a
            property page.
          </p>
          <Link
            to="/properties"
            className="inline-block bg-[#D4755B] text-white font-manrope font-semibold px-8 py-3 rounded-xl hover:bg-[#B86851] transition-colors"
          >
            Browse properties
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <header className="mb-10">
          <h1 className="font-fraunces text-4xl font-bold text-[#221410]">My transaction requests</h1>
          <p className="font-manrope text-[#6B7280] mt-1">
            {requests.length === 1 ? '1 request' : `${requests.length} requests`}
          </p>
        </header>

        <ul className="space-y-6">
          {requests.map((row) => {
            const prop = row.property;
            const img = prop?.image?.[0];
            const propertyId = prop?._id;

            return (
              <li key={row._id} className="bg-white border border-[#E6E0DA] rounded-2xl overflow-hidden shadow-sm">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-44 h-44 sm:h-auto shrink-0 bg-[#F3EDE8]">
                    {img ? (
                      <img src={img} alt="" className="w-full h-full object-cover min-h-[11rem]" />
                    ) : (
                      <div className="w-full h-full min-h-[11rem] flex items-center justify-center text-[#9CA3AF]">
                        <span className="font-material-icons text-5xl">image</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span
                        className={`font-manrope text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded-lg ${STATUS_STYLES[row.status]}`}
                      >
                        {row.status}
                      </span>
                      <span className="font-manrope text-xs font-semibold text-[#6B7280] bg-[#F3EDE8] px-2 py-1 rounded-lg">
                        {TYPE_LABEL[row.requestType]}
                      </span>
                    </div>
                    {prop && propertyId && prop.status === 'active' ? (
                      <Link
                        to={`/property/${propertyId}`}
                        className="font-fraunces text-xl font-semibold text-[#221410] hover:text-[#D4755B] transition-colors line-clamp-2"
                      >
                        {prop.title}
                      </Link>
                    ) : (
                      <p className="font-fraunces text-xl font-semibold text-[#374151]">{prop?.title || 'Property unavailable'}</p>
                    )}
                    {prop?.location && (
                      <p className="font-manrope text-sm text-[#6B7280] mt-1">{prop.location}</p>
                    )}
                    {typeof prop?.price === 'number' && (
                      <p className="font-manrope text-[#221410] font-semibold mt-2">{formatPrice(prop.price)}</p>
                    )}
                    <p className="font-manrope text-xs text-[#9CA3AF] mt-3">
                      Requested on {formatDate(row.createdAt)}
                      {row.status !== 'pending' && row.decidedAt && (
                        <>
                          {' · '}Updated {formatDate(row.decidedAt)}
                        </>
                      )}
                    </p>
                    {row.message && (
                      <p className="font-manrope text-sm text-[#4B5563] mt-3 border-t border-[#F3EDE8] pt-3">
                        <span className="text-[#6B7280]">Your message:</span> {row.message}
                      </p>
                    )}
                    {row.status === 'rejected' && row.decisionNote && (
                      <p className="font-manrope text-sm text-red-800 mt-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                        {row.decisionNote}
                      </p>
                    )}
                    {latestPaymentByTransaction[row._id] && (
                      <div className="mt-4 border-t border-[#F3EDE8] pt-3">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-manrope text-xs text-[#6B7280]">Payment:</span>
                          <span
                            className={`px-2 py-1 rounded-md text-xs font-semibold ${
                              latestPaymentByTransaction[row._id].status === 'successful'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : latestPaymentByTransaction[row._id].status === 'failed'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {latestPaymentByTransaction[row._id].status === 'pending'
                              ? 'PENDING REVIEW'
                              : latestPaymentByTransaction[row._id].status.toUpperCase()}
                          </span>
                        </div>
                        <p className="font-manrope text-sm text-[#4B5563]">
                          Paid via{' '}
                          {latestPaymentByTransaction[row._id].method === 'telebirr'
                            ? 'CBE Telebirr'
                            : latestPaymentByTransaction[row._id].method === 'cbebirr'
                              ? 'CBE Birr'
                              : 'CBE'}{' '}
                          · Ref {latestPaymentByTransaction[row._id].reference}
                        </p>
                        {latestPaymentByTransaction[row._id].receiptUrl && (
                          <a
                            href={latestPaymentByTransaction[row._id].receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex mt-2 text-sm text-[#D4755B] hover:text-[#B86851] font-manrope font-semibold"
                          >
                            View uploaded receipt
                          </a>
                        )}
                        {latestPaymentByTransaction[row._id].contractUrl && (
                          <a
                            href={latestPaymentByTransaction[row._id].contractUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex mt-2 ml-4 text-sm text-[#D4755B] hover:text-[#B86851] font-manrope font-semibold"
                          >
                            View uploaded contract
                          </a>
                        )}
                        {latestPaymentByTransaction[row._id].status === 'failed' &&
                          latestPaymentByTransaction[row._id].note && (
                            <p className="font-manrope text-sm text-red-700 mt-2">
                              Rejection note: {latestPaymentByTransaction[row._id].note}
                            </p>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

      </div>

      {payingFor && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            onClick={closePayModal}
            aria-label="Close payment modal"
          />
          <div className="relative w-full max-w-[560px] bg-[#F3F3F2] border border-[#D8D8D6] shadow-sm">
            <button
              type="button"
              onClick={closePayModal}
              className="absolute right-4 top-4 text-[#6B6B6B] hover:text-[#2E2E2E]"
              aria-label="Close payment modal"
            >
              <span className="font-material-icons">close</span>
            </button>

            <div className="px-6 py-5 border-b border-[#D8D8D6] bg-[#F7F7F6]">
              <p className="font-manrope text-[12px] tracking-[0.12em] uppercase text-[#5B6068] font-semibold">
                Form P-3 · Payment Authorization
              </p>
              <h3 className="font-manrope text-4xl leading-tight text-[#151515]">Mobile Payment</h3>
            </div>

            <div className="px-6 py-5 border-b border-[#D8D8D6]">
              <p className="font-manrope text-[12px] tracking-[0.14em] uppercase text-[#6D6D6C] font-semibold">
                Amount Due
              </p>
              <p className="font-space-mono text-5xl leading-none text-[#151515] mt-1">
                {formatPrice(getTransactionAmount(payingFor))}
              </p>
              <p className="font-manrope text-xl text-[#6B6B6B] mt-2">
                {getTransactionPurpose(payingFor)}
              </p>
            </div>

            <div className="px-6 py-5">
              {modalStep === 'method' && (
                <>
                  <p className="font-manrope text-[12px] tracking-[0.14em] uppercase text-[#6D6D6C] font-semibold mb-4">
                    Select Payment Method
                  </p>
                  <div className="space-y-3">
                    {(Object.keys(METHOD_META) as PaymentMethod[]).map((method) => {
                      const meta = METHOD_META[method];
                      const selected = paymentMethod === method;
                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => {
                            setPaymentMethod(method);
                            setModalStep('details');
                          }}
                          className={`w-full border px-4 py-3 flex items-center justify-between text-left transition-colors ${
                            selected ? meta.accent : 'bg-white border-[#D8D8D6] hover:border-[#D4755B]'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 ${meta.iconBg} text-white flex items-center justify-center text-sm font-bold uppercase`}>
                              {meta.shortCode}
                            </div>
                            <div>
                              <p className="font-manrope text-3xl text-[#151515] leading-tight">{meta.title}</p>
                              <p className="font-manrope text-sm text-[#5D6168]">{meta.description}</p>
                            </div>
                          </div>
                          <span className="font-material-icons text-[#6D6D6C]">{meta.icon}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {modalStep === 'details' && (
                <>
                  <div className={`border px-4 py-3 flex items-center justify-between ${METHOD_META[paymentMethod].accent}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${METHOD_META[paymentMethod].iconBg} text-white flex items-center justify-center text-sm font-bold uppercase`}>
                        {METHOD_META[paymentMethod].shortCode}
                      </div>
                      <div>
                        <p className="font-manrope text-3xl text-[#151515] leading-tight">{METHOD_META[paymentMethod].title}</p>
                        <p className="font-manrope text-sm text-[#5D6168]">{METHOD_META[paymentMethod].subDescription}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalStep('method')}
                      className="font-manrope text-[12px] tracking-[0.14em] uppercase font-semibold text-[#5B6068]"
                    >
                      Change
                    </button>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block font-manrope text-[12px] tracking-[0.14em] uppercase text-[#6D6D6C] font-semibold mb-2">
                        {METHOD_META[paymentMethod].inputLabel}
                      </label>
                      <input
                        value={paymentMethod === 'telebirr' ? telebirrPhone : cbebirrAccount}
                        onChange={(e) =>
                          paymentMethod === 'telebirr'
                            ? setTelebirrPhone(e.target.value)
                            : setCbebirrAccount(e.target.value)
                        }
                        placeholder={METHOD_META[paymentMethod].inputPlaceholder}
                        className="w-full border border-[#CBCBC8] bg-[#ECECEB] px-4 py-3 font-manrope text-xl text-[#2C2C2C] placeholder:text-[#8A8A88]"
                      />
                    </div>

                    <div>
                      <label className="block font-manrope text-[12px] tracking-[0.14em] uppercase text-[#6D6D6C] font-semibold mb-2">
                        Wallet PIN
                      </label>
                      <input
                        type="password"
                        value={walletPin}
                        onChange={(e) => setWalletPin(e.target.value)}
                        placeholder="••••"
                        className="w-full border border-[#CBCBC8] bg-[#ECECEB] px-4 py-3 font-manrope text-xl text-[#2C2C2C] placeholder:text-[#8A8A88]"
                      />
                    </div>

                    <div className="border border-[#DBDBD9] bg-[#ECECEA] px-4 py-4 flex items-start gap-3">
                      <span className="font-material-icons text-[#188851] text-[18px] mt-0.5">verified_user</span>
                      <p className="font-manrope text-sm text-[#555555] leading-relaxed">
                        This is a simulated transaction. No funds will be moved and no real wallet credentials are stored.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {modalStep === 'success' && modalReceipt && (
                <div>
                  <div className="flex flex-col items-center text-center mb-5">
                    <div className="w-16 h-16 rounded-full border-2 border-emerald-700 bg-emerald-100 flex items-center justify-center mb-3">
                      <span className="font-material-icons text-emerald-700 text-3xl">check</span>
                    </div>
                    <h4 className="font-manrope text-4xl text-[#151515] leading-tight">Payment Successful</h4>
                    <p className="font-manrope text-[#6B6B6B] mt-1">Receipt has been logged to the registry.</p>
                  </div>

                  <div className="border border-[#D8D8D6] bg-[#F1F1F0] p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 ${METHOD_META[modalReceipt.method].iconBg} text-white flex items-center justify-center text-sm font-bold uppercase`}>
                          {METHOD_META[modalReceipt.method].shortCode}
                        </div>
                        <div>
                          <p className="font-manrope text-xs tracking-[0.14em] uppercase text-[#6A6A68] font-semibold">
                            Payment Receipt
                          </p>
                          <p className="font-manrope text-3xl text-[#151515] leading-tight">{METHOD_META[modalReceipt.method].title}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 border border-emerald-300 bg-emerald-100 text-emerald-800 font-manrope text-xs tracking-[0.12em] uppercase font-semibold">
                        ✓ Success
                      </span>
                    </div>

                    <div className="border-t border-dashed border-[#CFCFCD] my-4" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                      <div>
                        <p className="font-manrope text-xs tracking-[0.14em] uppercase text-[#6A6A68] font-semibold">Transaction ID</p>
                        <p className="font-manrope text-xl text-[#2B2B2B]">
                          {(modalReceipt.method === 'telebirr' ? 'TB' : 'CBE')}-{modalReceipt._id.slice(-4).toUpperCase()}
                        </p>
                      </div>
                      <div>
                        <p className="font-manrope text-xs tracking-[0.14em] uppercase text-[#6A6A68] font-semibold">Date</p>
                        <p className="font-manrope text-xl text-[#2B2B2B]">
                          {new Date(modalReceipt.paidAt || modalReceipt.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="font-manrope text-xs tracking-[0.14em] uppercase text-[#6A6A68] font-semibold">
                          {modalReceipt.method === 'telebirr' ? 'Phone' : 'Account'}
                        </p>
                        <p className="font-manrope text-xl text-[#2B2B2B]">{modalReceipt.reference}</p>
                      </div>
                      <div>
                        <p className="font-manrope text-xs tracking-[0.14em] uppercase text-[#6A6A68] font-semibold">Payer</p>
                        <p className="font-manrope text-xl text-[#2B2B2B]">{user?.name?.trim() || 'User'}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="font-manrope text-xs tracking-[0.14em] uppercase text-[#6A6A68] font-semibold">Purpose</p>
                        <p className="font-manrope text-xl text-[#2B2B2B]">{getTransactionPurpose(payingFor)}</p>
                      </div>
                    </div>

                    <div className="border-t border-dashed border-[#CFCFCD] my-4" />
                    <div className="flex items-end justify-between">
                      <p className="font-manrope text-xs tracking-[0.14em] uppercase text-[#6A6A68] font-semibold">Amount Paid</p>
                      <p className="font-space-mono text-4xl text-[#151515]">
                        {formatPrice(modalReceipt.amount || getTransactionAmount(payingFor))}
                      </p>
                    </div>
                    <p className="text-center mt-6 font-manrope text-[11px] tracking-[0.18em] uppercase text-[#7B7B78]">
                      Dept. of Housing · Official Digital Receipt
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-[#D8D8D6] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closePayModal}
                  className="px-5 py-2.5 text-sm font-manrope font-semibold text-[#2F2F2F] border border-[#CFCFCB] bg-[#EFEFEB] uppercase tracking-[0.1em]"
                >
                  {modalStep === 'success' ? 'Close' : 'Cancel'}
                </button>
                {modalStep === 'details' && (
                  <button
                    type="button"
                    onClick={submitPayment}
                    disabled={submittingPayment}
                    className="px-5 py-2.5 text-sm font-manrope font-semibold text-white bg-[#151515] uppercase tracking-[0.1em] disabled:opacity-60"
                  >
                    {submittingPayment ? 'Processing...' : 'Confirm Payment'}
                  </button>
                )}
                {modalStep === 'success' && (
                  <>
                    <button
                      type="button"
                      onClick={closePayModal}
                      className="px-5 py-2.5 text-sm font-manrope font-semibold text-[#2F2F2F] border border-[#CFCFCB] bg-[#EFEFEB] uppercase tracking-[0.1em]"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={printReceipt}
                      className="px-5 py-2.5 text-sm font-manrope font-semibold text-white bg-[#151515] uppercase tracking-[0.1em] inline-flex items-center gap-2"
                    >
                      <span className="font-material-icons text-base">receipt_long</span>
                      Print Receipt
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default MyTransactionRequestsPage;
