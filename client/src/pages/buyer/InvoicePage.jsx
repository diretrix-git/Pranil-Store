import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axiosInstance';

const Spinner = () => (
  <div className="flex justify-center py-16">
    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function InvoicePage() {
  const { orderId } = useParams();

  const { data: order, isLoading } = useQuery({
    queryKey: ['invoice', orderId],
    queryFn: async () => {
      const res = await api.get(`/orders/${orderId}/invoice`);
      return res.data.order ?? res.data;
    },
  });

  useEffect(() => {
    if (order) {
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [order]);

  if (isLoading) return <Spinner />;
  if (!order) return <p className="text-center py-16 text-gray-500">Invoice not found.</p>;

  const store = order.storeSnapshot ?? {};
  const buyer = order.buyerSnapshot ?? {};
  const items = order.items ?? [];

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>

      <div className="max-w-3xl mx-auto px-6 py-10 bg-white text-gray-900 font-sans">
        {/* Store Header */}
        <div className="flex justify-between items-start mb-8 border-b border-gray-300 pb-6">
          <div>
            {store.logo && (
              <img src={store.logo} alt={store.name} className="h-14 mb-2 object-contain" />
            )}
            <h2 className="text-xl font-bold">{store.name}</h2>
            {store.address && <p className="text-sm text-gray-600">{store.address}</p>}
            {store.phone && <p className="text-sm text-gray-600">{store.phone}</p>}
            {store.email && <p className="text-sm text-gray-600">{store.email}</p>}
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold text-gray-800">INVOICE</h1>
            <p className="text-sm text-gray-600 mt-1">#{order.orderNumber}</p>
            <p className="text-sm text-gray-600">
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Buyer Info */}
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Bill To</h3>
          <p className="font-semibold">{buyer.name}</p>
          {buyer._id && <p className="text-sm text-gray-600">ID: {buyer._id}</p>}
          {buyer.phone && <p className="text-sm text-gray-600">{buyer.phone}</p>}
          {buyer.address && <p className="text-sm text-gray-600">{buyer.address}</p>}
        </div>

        {/* Items Table */}
        <table className="w-full text-sm mb-6 border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-2 font-semibold text-gray-700">Item</th>
              <th className="text-center py-2 font-semibold text-gray-700">Unit</th>
              <th className="text-center py-2 font-semibold text-gray-700">Qty</th>
              <th className="text-right py-2 font-semibold text-gray-700">Unit Price</th>
              <th className="text-right py-2 font-semibold text-gray-700">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2">{item.name}</td>
                <td className="py-2 text-center text-gray-600">{item.unit ?? '—'}</td>
                <td className="py-2 text-center">{item.quantity}</td>
                <td className="py-2 text-right">${Number(item.price).toFixed(2)}</td>
                <td className="py-2 text-right">${(Number(item.price) * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-gray-600">Subtotal</span>
              <span>${Number(order.subtotal ?? order.totalAmount).toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between py-1 text-green-700">
                <span>Discount</span>
                <span>-${Number(order.discountAmount).toFixed(2)}</span>
              </div>
            )}
            {order.taxAmount > 0 && (
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Tax</span>
                <span>${Number(order.taxAmount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-t-2 border-gray-300 font-bold text-base mt-1">
              <span>Total</span>
              <span>${Number(order.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</h3>
            <p className="text-sm text-gray-600">{order.notes}</p>
          </div>
        )}

        {/* Footer */}
        {store.invoiceNote && (
          <div className="border-t border-gray-200 pt-4 text-center text-xs text-gray-500">
            {store.invoiceNote}
          </div>
        )}

        {/* Print button - hidden on print */}
        <div className="no-print mt-8 text-center">
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Print Invoice
          </button>
        </div>
      </div>
    </>
  );
}
