'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui';

interface Payment {
  id: string;
  paymentNo: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  receivedAt: string;
  invoice: {
    id: string;
    invoiceNo: string;
    customer?: {
      id: string;
      firstName: string;
      lastName: string;
      orgName?: string;
    };
  };
}

interface DailyReport {
  date: string;
  totalCollected: number;
  totalPayments: number;
  byMethod: Array<{ method: string; amount: number; count: number }>;
  payments: Payment[];
}

interface Collector {
  id: string;
  name: string;
}

export default function DailyReportPage() {
  const router = useRouter();
  const [report, setReport] = useState<DailyReport | null>(null);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCollector, setSelectedCollector] = useState('');

  useEffect(() => {
    fetchCollectors();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [selectedDate, selectedCollector]);

  async function fetchCollectors() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:4001/api/v1/collections/collectors', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCollectors(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch collectors:', error);
    }
  }

  async function fetchReport() {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({ date: selectedDate });
      if (selectedCollector) params.append('receivedBy', selectedCollector);

      const response = await fetch(`http://localhost:4001/api/v1/collections/daily-report?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setReport(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function formatCurrency(amount: number | undefined) {
    return new Intl.NumberFormat('en-BH', {
      style: 'currency',
      currency: 'BHD',
    }).format(amount || 0);
  }

  function getMethodLabel(method: string) {
    const labels: Record<string, string> = {
      CASH: 'Cash',
      CARD: 'Card',
      BANK_TRANSFER: 'Bank Transfer',
      CHEQUE: 'Cheque',
      ONLINE: 'Online',
    };
    return labels[method] || method;
  }

  function getMethodColor(method: string) {
    const colors: Record<string, string> = {
      CASH: 'bg-green-100 text-green-800',
      CARD: 'bg-blue-100 text-blue-800',
      BANK_TRANSFER: 'bg-purple-100 text-purple-800',
      CHEQUE: 'bg-yellow-100 text-yellow-800',
      ONLINE: 'bg-indigo-100 text-indigo-800',
    };
    return colors[method] || 'bg-gray-100 text-gray-800';
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="print:p-0">
      <div className="mb-8 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
            ← Back
          </button>
          <h1 className="text-2xl font-bold">Daily Collection Report</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            Print Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm print:hidden">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="mb-1 block text-sm text-gray-500">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-500">Collector</label>
            <select
              value={selectedCollector}
              onChange={(e) => setSelectedCollector(e.target.value)}
              className="rounded-lg border px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Collectors</option>
              {collectors.map((collector) => (
                <option key={collector.id} value={collector.id}>
                  {collector.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : report ? (
        <div className="space-y-6">
          {/* Report Header - Print Friendly */}
          <div className="rounded-xl bg-white p-6 shadow-sm print:shadow-none print:border">
            <div className="mb-6 text-center print:mb-4">
              <h2 className="text-xl font-bold">Daily Collection Report</h2>
              <p className="text-gray-500">
                {new Date(report.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            {/* Summary */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
              <div className="rounded-lg bg-green-50 p-4 text-center print:border">
                <p className="text-sm text-gray-500">Total Collected</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(report.totalCollected)}</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-4 text-center print:border">
                <p className="text-sm text-gray-500">Total Payments</p>
                <p className="text-2xl font-bold text-blue-600">{report.totalPayments}</p>
              </div>
              {report.byMethod.slice(0, 2).map((method) => (
                <div key={method.method} className="rounded-lg bg-gray-50 p-4 text-center print:border">
                  <p className="text-sm text-gray-500">{getMethodLabel(method.method)}</p>
                  <p className="text-2xl font-bold">{formatCurrency(method.amount)}</p>
                  <p className="text-xs text-gray-400">{method.count} payments</p>
                </div>
              ))}
            </div>

            {/* By Method Breakdown */}
            {report.byMethod.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 font-semibold">Collection by Method</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm text-gray-500">
                        <th className="pb-2 font-medium">Payment Method</th>
                        <th className="pb-2 font-medium text-right">Count</th>
                        <th className="pb-2 font-medium text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.byMethod.map((method) => (
                        <tr key={method.method} className="border-b">
                          <td className="py-2">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${getMethodColor(
                                method.method
                              )}`}
                            >
                              {getMethodLabel(method.method)}
                            </span>
                          </td>
                          <td className="py-2 text-right">{method.count}</td>
                          <td className="py-2 text-right font-medium">{formatCurrency(method.amount)}</td>
                        </tr>
                      ))}
                      <tr className="font-bold">
                        <td className="py-2">Total</td>
                        <td className="py-2 text-right">{report.totalPayments}</td>
                        <td className="py-2 text-right">{formatCurrency(report.totalCollected)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Payment Details */}
            {report.payments.length > 0 && (
              <div>
                <h3 className="mb-3 font-semibold">Payment Details</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="pb-2 font-medium">#</th>
                        <th className="pb-2 font-medium">Payment No</th>
                        <th className="pb-2 font-medium">Time</th>
                        <th className="pb-2 font-medium">Customer</th>
                        <th className="pb-2 font-medium">Invoice</th>
                        <th className="pb-2 font-medium">Method</th>
                        <th className="pb-2 font-medium">Reference</th>
                        <th className="pb-2 font-medium text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.payments.map((payment, index) => (
                        <tr key={payment.id} className="border-b">
                          <td className="py-2">{index + 1}</td>
                          <td className="py-2 font-medium">{payment.paymentNo}</td>
                          <td className="py-2">
                            {new Date(payment.receivedAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-2">
                            {payment.invoice.customer
                              ? payment.invoice.customer.orgName ||
                                `${payment.invoice.customer.firstName} ${payment.invoice.customer.lastName}`
                              : '-'}
                          </td>
                          <td className="py-2">
                            <Link
                              href={`/invoices/${payment.invoice.id}`}
                              className="text-primary hover:underline print:text-black print:no-underline"
                            >
                              {payment.invoice.invoiceNo}
                            </Link>
                          </td>
                          <td className="py-2">{getMethodLabel(payment.paymentMethod)}</td>
                          <td className="py-2">{payment.reference || '-'}</td>
                          <td className="py-2 text-right font-medium">{formatCurrency(payment.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-bold">
                        <td colSpan={7} className="py-2 text-right">
                          Grand Total:
                        </td>
                        <td className="py-2 text-right">{formatCurrency(report.totalCollected)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {report.payments.length === 0 && (
              <div className="py-8 text-center text-gray-500">
                No collections recorded for this date.
              </div>
            )}
          </div>

          {/* Print Footer */}
          <div className="hidden print:block text-center text-sm text-gray-500 mt-8">
            <p>Generated on {new Date().toLocaleString()}</p>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-gray-500">Failed to load report</div>
      )}
    </div>
  );
}
