import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShoppingBag,
  Search,
  SlidersHorizontal,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Mail,
  Phone,
  FileCode,
  DollarSign,
  ArrowRight,
  Send,
  Eye,
  FileText,
  X,
  Save,
  Check,
  User,
  Calendar,
} from 'lucide-react';
import { StoreOrder } from '../../types';
import { storeDataService } from '../../services/storeDataService';
import { SEO } from '../../components/common/SEO';
import { getWhatsAppDeliveryUrl } from '../../services/storeDelivery';
import { useSettings } from '../../contexts/SettingsContext';

export const AdminStorePaymentReviewsPage: React.FC = () => {
  const { settings } = useSettings();
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionPending, setIsActionPending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'PAYMENT_REVIEW' | 'ALL' | 'PAID' | 'REJECTED'>('PAYMENT_REVIEW');

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      if (filterStatus === 'PAYMENT_REVIEW') {
        const data = await storeDataService.getAdminPaymentReviews();
        setOrders(data);
      } else if (filterStatus === 'ALL') {
        const data = await storeDataService.getAdminOrders();
        setOrders(data);
      } else {
        const data = await storeDataService.getAdminOrders({ status: filterStatus });
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to load payment reviews:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [filterStatus]);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  // Handle Approve
  const handleApprove = async (order: StoreOrder) => {
    if (!confirm(`Are you sure you want to approve payment for order ${order.order_number}? This will mark it PAID and unlock customer download entitlements.`)) {
      return;
    }
    setIsActionPending(true);
    try {
      const res = await storeDataService.reviewOrder({
        orderId: order.id,
        action: 'APPROVE_PAYMENT',
      });
      if (res.success) {
        showFeedback('success', `Payment for order ${order.order_number} approved successfully.`);
        await loadReviews();
      } else {
        showFeedback('error', res.error || 'Failed to approve payment.');
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'Error executing approval.');
    } finally {
      setIsActionPending(false);
    }
  };

  // Handle Reject Submit
  const handleRejectSubmit = async () => {
    if (!selectedOrder || !rejectionReason.trim()) return;
    setIsActionPending(true);
    try {
      const res = await storeDataService.reviewOrder({
        orderId: selectedOrder.id,
        action: 'REJECT_PAYMENT',
        reason: rejectionReason.trim(),
      });
      if (res.success) {
        showFeedback('success', `Order ${selectedOrder.order_number} rejected.`);
        setRejectModalOpen(false);
        setSelectedOrder(null);
        setRejectionReason('');
        await loadReviews();
      } else {
        showFeedback('error', res.error || 'Failed to reject payment.');
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'Error rejecting payment.');
    } finally {
      setIsActionPending(false);
    }
  };

  // Handle Add Note Submit
  const handleNoteSubmit = async () => {
    if (!selectedOrder || !adminNote.trim()) return;
    setIsActionPending(true);
    try {
      const res = await storeDataService.reviewOrder({
        orderId: selectedOrder.id,
        action: 'ADD_NOTE',
        adminNotes: adminNote.trim(),
      });
      if (res.success) {
        showFeedback('success', 'Admin note saved.');
        setNoteModalOpen(false);
        setSelectedOrder(null);
        setAdminNote('');
        await loadReviews();
      } else {
        showFeedback('error', res.error || 'Failed to save note.');
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'Error saving note.');
    } finally {
      setIsActionPending(false);
    }
  };

  // Handle Mark Delivered Submit
  const handleDeliverySubmit = async () => {
    if (!selectedOrder) return;
    setIsActionPending(true);
    try {
      const res = await storeDataService.reviewOrder({
        orderId: selectedOrder.id,
        action: 'MARK_DELIVERED',
        deliveryNotes: deliveryNotes.trim(),
      });
      if (res.success) {
        showFeedback('success', `Order ${selectedOrder.order_number} marked as DELIVERED.`);
        setDeliveryModalOpen(false);
        setSelectedOrder(null);
        setDeliveryNotes('');
        await loadReviews();
      } else {
        showFeedback('error', res.error || 'Failed to update delivery status.');
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'Error updating delivery.');
    } finally {
      setIsActionPending(false);
    }
  };

  // WhatsApp helper
  const openWhatsApp = async (order: StoreOrder) => {
    const phone = (order.customer_phone || '').replace(/[^0-9]/g, '');
    if (!phone) {
      alert('No customer phone number registered for this order.');
      return;
    }
    const product = order.items?.[0]?.product;
    const url = getWhatsAppDeliveryUrl(phone, order, product, settings.whatsapp);
    window.open(url, '_blank');
    
    // Log audit trail
    try {
      await storeDataService.reviewOrder({
        orderId: order.id,
        action: 'LOG_WHATSAPP_SENT',
      });
    } catch (e) {
      // Non-blocking
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      o.order_number.toLowerCase().includes(q) ||
      (o.customer_email && o.customer_email.toLowerCase().includes(q)) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
      (o.customer_phone && o.customer_phone.includes(q)) ||
      (o.payments?.[0]?.gateway_order_id && o.payments[0].gateway_order_id.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <SEO title="Store Payment Reviews | VyapaarPro Admin" description="Manual verification and approval queue for digital store orders." />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
              Verification Engine
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">Manual Review Architecture</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1 flex items-center space-x-2">
            <ShieldCheck className="w-7 h-7 text-amber-400" />
            <span>Store Payment Reviews</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authoritatively verify and approve customer payments before unlocking digital downloads or delivering files.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadReviews}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
          <Link
            to="/admin/store/orders"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center space-x-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-violet-400" />
            <span>All Store Orders</span>
          </Link>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between transition-all ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterStatus('PAYMENT_REVIEW')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              filterStatus === 'PAYMENT_REVIEW'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Awaiting Review ({orders.filter((o) => o.status === 'PAYMENT_REVIEW').length})
          </button>
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              filterStatus === 'ALL'
                ? 'bg-violet-600 text-white font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            All Orders
          </button>
          <button
            onClick={() => setFilterStatus('PAID')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              filterStatus === 'PAID'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Approved / Paid
          </button>
          <button
            onClick={() => setFilterStatus('REJECTED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              filterStatus === 'REJECTED'
                ? 'bg-rose-600 text-white font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Rejected
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, customer, phone..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"
          />
        </div>
      </div>

      {/* Review Cards / Queue List */}
      {isLoading ? (
        <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading payment review queue...</p>
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const priceRupees = Math.round(order.total_paise / 100);
            const latestPayment = order.payments?.[0];
            const gatewayOrderId = latestPayment?.gateway_order_id;
            const transactionId = latestPayment?.gateway_payment_id;
            const utr = latestPayment?.raw_reference_metadata?.utr || latestPayment?.gateway_reference;
            const senderName = latestPayment?.raw_reference_metadata?.sender_name;
            const isUnderReview = order.status === 'PAYMENT_REVIEW';

            return (
              <div
                key={order.id}
                className={`bg-slate-900 border rounded-3xl p-6 transition space-y-5 ${
                  isUnderReview
                    ? 'border-amber-500/30 bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Top Row: Order ID, Status, Created Date */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-base font-black text-white">{order.order_number}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        order.status === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : order.status === 'PAYMENT_REVIEW'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : order.status === 'REJECTED'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {order.status === 'PAYMENT_REVIEW' ? 'UNDER REVIEW' : order.status}
                    </span>

                    <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/admin/store/orders/${order.id}`}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-violet-400" />
                      <span>Full Inspection</span>
                    </Link>
                  </div>
                </div>

                {/* Grid Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                  {/* Column 1: Customer Details */}
                  <div className="space-y-1.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Customer Contact
                    </span>
                    <p className="text-white font-bold flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.customer_name || 'Guest / Anonymous'}</span>
                    </p>
                    <p className="text-slate-300 flex items-center space-x-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.customer_email || 'No email provided'}</span>
                    </p>
                    {order.customer_phone ? (
                      <p className="text-emerald-400 flex items-center space-x-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{order.customer_phone}</span>
                      </p>
                    ) : (
                      <p className="text-slate-500 text-[11px]">No phone number recorded</p>
                    )}
                  </div>

                    {/* Column 2: Product & Financials */}
                  <div className="space-y-1.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Ordered Digital Product
                    </span>
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item) => {
                        const p = item.product;
                        return (
                          <div key={item.id} className="space-y-1">
                            <p className="text-white font-semibold flex items-center space-x-1">
                              <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              <span className="truncate">{item.product_name_snapshot}</span>
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              ID: {item.product_id || 'N/A'} • Qty: {item.quantity}
                            </p>

                            {/* Delivery Deliverables Indicators */}
                            {p && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {(p.product_file_path || p.file_name) && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                    📁 File: {p.file_name || 'Attached'}
                                  </span>
                                )}
                                {p.access_link && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                    🔗 Link
                                  </span>
                                )}
                                {p.license_key && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                    🔑 License
                                  </span>
                                )}
                                {p.instructions && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                                    📋 Instructions
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-white font-semibold">Digital Product</p>
                    )}
                    <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                      <span className="text-slate-400">Expected Total:</span>
                      <span className="text-sm font-black text-amber-400">₹{priceRupees.toLocaleString('en-IN')} INR</span>
                    </div>
                  </div>

                  {/* Column 3: FamGateway Payment Data */}
                  <div className="space-y-1.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      FamGateway Metadata
                    </span>
                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Gateway Order:</span>
                        <span className="text-indigo-300 font-bold">{gatewayOrderId || 'Pending'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Txn / Ref ID:</span>
                        <span className="text-slate-200">{transactionId || '—'}</span>
                      </div>
                      {utr && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Bank UTR:</span>
                          <span className="text-emerald-400 font-bold">{utr}</span>
                        </div>
                      )}
                      {senderName && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Payer Name:</span>
                          <span className="text-slate-300">{senderName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes & Reason Displays */}
                {order.payment_rejection_reason && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                    <span className="font-bold block text-[11px] uppercase tracking-wider mb-0.5">Rejection Reason:</span>
                    {order.payment_rejection_reason}
                  </div>
                )}

                {order.admin_notes && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                    <span className="font-bold block text-[11px] uppercase tracking-wider text-violet-400 mb-0.5">
                      Internal Admin Note:
                    </span>
                    {order.admin_notes}
                  </div>
                )}

                {order.delivery_notes && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                    <span className="font-bold block text-[11px] uppercase tracking-wider text-emerald-400 mb-0.5">
                      Delivery Note / Fulfillment Log:
                    </span>
                    {order.delivery_notes}
                  </div>
                )}

                {/* Action Bar */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
                  <div className="flex items-center space-x-2">
                    {order.customer_phone && (
                      <button
                        onClick={() => openWhatsApp(order)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Send WhatsApp</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setAdminNote(order.admin_notes || '');
                        setNoteModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Add Note</span>
                    </button>

                    {order.status === 'PAID' && (
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setDeliveryNotes(order.delivery_notes || '');
                          setDeliveryModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Mark Delivered</span>
                      </button>
                    )}
                  </div>

                  {/* Primary Review Decisions */}
                  <div className="flex items-center space-x-3">
                    {order.status !== 'REJECTED' && (
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setRejectionReason('');
                          setRejectModalOpen(true);
                        }}
                        disabled={isActionPending}
                        className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject Payment</span>
                      </button>
                    )}

                    {order.status !== 'PAID' && order.status !== 'DELIVERED' && (
                      <button
                        onClick={() => handleApprove(order)}
                        disabled={isActionPending}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve Payment</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-16 text-center bg-slate-900/50 border border-slate-800 rounded-3xl space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">Review Queue Clean</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            There are currently no store orders awaiting manual payment verification. Newly completed checkouts will automatically appear here for review.
          </p>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-rose-400" />
                <span>Reject Order Payment</span>
              </h3>
              <button onClick={() => setRejectModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              State the reason for rejecting payment on order <span className="font-mono text-white">{selectedOrder.order_number}</span>. This reason will be logged and visible in order records.
            </p>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. UTR mismatch, payment cancelled by user, uncredited amount..."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={!rejectionReason.trim() || isActionPending}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTE MODAL */}
      {noteModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-violet-400" />
                <span>Add Internal Admin Note</span>
              </h3>
              <button onClick={() => setNoteModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              rows={4}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Add audit or follow-up note for order..."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setNoteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleNoteSubmit}
                disabled={!adminNote.trim() || isActionPending}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition disabled:opacity-50"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELIVERY MODAL */}
      {deliveryModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Send className="w-5 h-5 text-emerald-400" />
                <span>Mark Order as Delivered</span>
              </h3>
              <button onClick={() => setDeliveryModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Provide delivery details (e.g. download link sent via WhatsApp, email confirmation dispatch, etc.):
            </p>

            <textarea
              rows={3}
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="e.g. Delivered zip archive and license key via WhatsApp to client."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeliveryModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeliverySubmit}
                disabled={isActionPending}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition disabled:opacity-50"
              >
                Confirm Delivery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
