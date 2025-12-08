'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Payment {
  id: string;
  paymentNo: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  receivedAt: string;
  receipt?: Receipt;
}

interface Receipt {
  id: string;
  receiptNo: string;
  amount: number;
  issuedAt: string;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  paidAmount?: number;
  status: string;
  notes?: string;
  dueDate?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; firstName: string; lastName: string; email?: string; phone?: string };
  serviceRequest?: { id: string; requestNo: string; title: string };
  items?: InvoiceItem[];
  payments?: Payment[];
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMethod: 'CASH',
    reference: '',
    notes: '',
  });
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    fetchInvoice();
  }, [params.id]);

  async function fetchInvoice() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:4001/api/v1/invoices/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setInvoice(data.data);
        // Set default payment amount to remaining balance
        const paid = data.data.paidAmount || 0;
        const remaining = (data.data.total || 0) - paid;
        setPaymentData(prev => ({ ...prev, amount: remaining > 0 ? remaining : 0 }));
      }
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateStatus(newStatus: string) {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:4001/api/v1/invoices/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();

      if (data.success) {
        setInvoice(data.data);
      }
    } catch (error) {
      console.error('Failed to update invoice:', error);
    } finally {
      setIsUpdating(false);
    }
  }

  async function recordPayment() {
    setPaymentError('');
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:4001/api/v1/invoices/${params.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: paymentData.amount,
          paymentMethod: paymentData.paymentMethod,
          reference: paymentData.reference || undefined,
          notes: paymentData.notes || undefined,
        }),
      });
      const data = await response.json();

      if (data.success) {
        setShowPaymentModal(false);
        fetchInvoice(); // Refresh to get updated invoice with new payment
      } else {
        setPaymentError(data.error?.message || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Failed to record payment:', error);
      setPaymentError('Failed to record payment');
    } finally {
      setIsUpdating(false);
    }
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SENT: 'bg-blue-100 text-blue-800',
      PARTIAL: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  function formatCurrency(amount: number | undefined) {
    return new Intl.NumberFormat('en-BH', {
      style: 'currency',
      currency: 'BHD',
    }).format(amount || 0);
  }

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center">Loading...</div>;
  }

  if (!invoice) {
    return <div className="flex h-64 items-center justify-center">Invoice not found</div>;
  }

  const paidAmount = invoice.paidAmount || 0;
  const remainingAmount = invoice.total - paidAmount;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
            ← Back
          </button>
          <h1 className="text-2xl font-bold">{invoice.invoiceNo}</h1>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(invoice.status)}`}>
            {invoice.status}
          </span>
        </div>
        <div className="flex gap-2">
          {invoice.status === 'DRAFT' && (
            <Button onClick={() => updateStatus('SENT')} disabled={isUpdating}>
              Send Invoice
            </Button>
          )}
          {['SENT', 'PARTIAL'].includes(invoice.status) && (
            <Button onClick={() => setShowPaymentModal(true)} disabled={isUpdating}>
              Record Payment
            </Button>
          )}
          {!['PAID', 'CANCELLED'].includes(invoice.status) && (
            <Button variant="outline" onClick={() => updateStatus('CANCELLED')} disabled={isUpdating}>
              Cancel
            </Button>
          )}
          <Button variant="outline">Print</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Info */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex justify-between">
              <div>
                <h2 className="text-xl font-bold text-primary">INVOICE</h2>
                <p className="text-gray-500">{invoice.invoiceNo}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Issue Date</p>
                <p className="font-medium">{new Date(invoice.createdAt).toLocaleDateString()}</p>
                {invoice.dueDate && (
                  <>
                    <p className="mt-2 text-sm text-gray-500">Due Date</p>
                    <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                  </>
                )}
              </div>
            </div>

            {/* Bill To */}
            <div className="mb-6 border-t pt-4">
              <p className="text-sm text-gray-500">Bill To</p>
              {invoice.customer ? (
                <div>
                  <Link href={`/customers/${invoice.customer.id}`} className="font-medium text-primary hover:underline">
                    {invoice.customer.firstName} {invoice.customer.lastName}
                  </Link>
                  {invoice.customer.email && <p className="text-gray-600">{invoice.customer.email}</p>}
                  {invoice.customer.phone && <p className="text-gray-600">{invoice.customer.phone}</p>}
                </div>
              ) : (
                <p className="text-gray-500">-</p>
              )}
            </div>

            {/* Related Request */}
            {invoice.serviceRequest && (
              <div className="mb-6 border-t pt-4">
                <p className="text-sm text-gray-500">Related Service Request</p>
                <Link href={`/requests/${invoice.serviceRequest.id}`} className="text-primary hover:underline">
                  {invoice.serviceRequest.requestNo} - {invoice.serviceRequest.title}
                </Link>
              </div>
            )}

            {/* Items */}
            <div className="border-t pt-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-gray-500">
                    <th className="pb-3 font-medium">Description</th>
                    <th className="pb-3 font-medium text-right">Qty</th>
                    <th className="pb-3 font-medium text-right">Unit Price</th>
                    <th className="pb-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-3">{item.description}</td>
                        <td className="py-3 text-right">{item.quantity}</td>
                        <td className="py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-3 text-right">{formatCurrency(item.total)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-3" colSpan={4}>
                        <p className="text-gray-500">Service charges</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Totals */}
              <div className="mt-4 space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">VAT (5%)</span>
                    <span>{formatCurrency(invoice.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
                {paidAmount > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Paid</span>
                      <span>-{formatCurrency(paidAmount)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-red-600">
                      <span>Balance Due</span>
                      <span>{formatCurrency(remainingAmount)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mt-6 border-t pt-4">
                <p className="text-sm text-gray-500">Notes</p>
                <p className="whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Info */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold">Payment Status</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-xl font-bold">{formatCurrency(invoice.total)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount Paid</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(paidAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Balance Due</p>
                <p className={`text-2xl font-bold ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(remainingAmount)}
                </p>
              </div>
              {invoice.paidAt && (
                <div>
                  <p className="text-sm text-gray-500">Fully Paid On</p>
                  <p className="font-medium">{new Date(invoice.paidAt).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold">Actions</h3>
            <div className="space-y-2">
              <Button className="w-full" variant="outline">
                Download PDF
              </Button>
              <Button className="w-full" variant="outline">
                Send to Customer
              </Button>
              {['SENT', 'PARTIAL'].includes(invoice.status) && (
                <Button className="w-full" onClick={() => setShowPaymentModal(true)}>
                  Record Payment
                </Button>
              )}
            </div>
          </div>

          {/* Payment History */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold">Payment History</h3>
              <div className="space-y-4">
                {invoice.payments.map((payment) => (
                  <div key={payment.id} className="border-b pb-4 last:border-0">
                    <div className="flex justify-between">
                      <span className="font-medium">{payment.paymentNo}</span>
                      <span className="font-bold text-green-600">{formatCurrency(payment.amount)}</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {payment.paymentMethod === 'BENEFIT_PAY' ? 'Benefit Pay' : payment.paymentMethod.replace('_', ' ')} • {new Date(payment.receivedAt).toLocaleDateString()}
                    </p>
                    {payment.reference && (
                      <p className="text-sm text-gray-500">Ref: {payment.reference}</p>
                    )}
                    {payment.receipt && (
                      <div className="mt-2 p-2 bg-green-50 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm text-green-700 font-medium">
                            Receipt: {payment.receipt.receiptNo}
                          </span>
                        </div>
                        <button
                          onClick={() => window.print()}
                          className="text-xs text-green-600 hover:underline"
                        >
                          Print
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold">History</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <div className="h-full w-0.5 bg-gray-200"></div>
                </div>
                <div>
                  <p className="font-medium">Invoice Created</p>
                  <p className="text-sm text-gray-500">{new Date(invoice.createdAt).toLocaleString()}</p>
                </div>
              </div>
              {invoice.paidAt && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  </div>
                  <div>
                    <p className="font-medium">Fully Paid</p>
                    <p className="text-sm text-gray-500">{new Date(invoice.paidAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold">Record Payment</h2>

            {paymentError && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-600">{paymentError}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-2 block font-medium">Amount *</label>
                <input
                  type="number"
                  step="0.001"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Remaining balance: {formatCurrency(remainingAmount)}
                </p>
              </div>

              <div>
                <label className="mb-2 block font-medium">Payment Method *</label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                  className="w-full rounded-lg border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="BENEFIT_PAY">Benefit Pay</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="ONLINE">Online</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block font-medium">Reference</label>
                <input
                  type="text"
                  value={paymentData.reference}
                  onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                  placeholder="Transaction/Cheque number"
                  className="w-full rounded-lg border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">Notes</label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowPaymentModal(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={recordPayment}
                disabled={isUpdating || paymentData.amount <= 0}
              >
                {isUpdating ? 'Recording...' : 'Record Payment'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
