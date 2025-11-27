'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@agentcare/ui';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  totalAmount: number;
  taxAmount?: number;
  discountAmount?: number;
  status: string;
  notes?: string;
  dueDate?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; firstName: string; lastName: string; email?: string; phone?: string };
  serviceRequest?: { id: string; requestNo: string; title: string };
  items?: InvoiceItem[];
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

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
        method: 'PATCH',
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

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      SENT: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center">Loading...</div>;
  }

  if (!invoice) {
    return <div className="flex h-64 items-center justify-center">Invoice not found</div>;
  }

  const subtotal = invoice.items?.reduce((sum, item) => sum + item.amount, 0) || invoice.totalAmount;

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
          {['PENDING', 'SENT'].includes(invoice.status) && (
            <Button onClick={() => updateStatus('PAID')} disabled={isUpdating}>
              Mark as Paid
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
                  <p className="font-medium">{invoice.customer.firstName} {invoice.customer.lastName}</p>
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
                        <td className="py-3 text-right">{formatCurrency(item.amount)}</td>
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
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {invoice.taxAmount && invoice.taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax</span>
                    <span>{formatCurrency(invoice.taxAmount)}</span>
                  </div>
                )}
                {invoice.discountAmount && invoice.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Discount</span>
                    <span>-{formatCurrency(invoice.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(invoice.totalAmount)}</span>
                </div>
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
                <p className="text-sm text-gray-500">Amount Due</p>
                <p className="text-2xl font-bold">
                  {invoice.status === 'PAID' ? formatCurrency(0) : formatCurrency(invoice.totalAmount)}
                </p>
              </div>
              {invoice.paidAt && (
                <div>
                  <p className="text-sm text-gray-500">Paid On</p>
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
              <Button className="w-full" variant="outline">
                Record Payment
              </Button>
            </div>
          </div>

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
                    <p className="font-medium">Payment Received</p>
                    <p className="text-sm text-gray-500">{new Date(invoice.paidAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
