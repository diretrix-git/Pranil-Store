import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axiosInstance";
import { formatRs } from "../../utils/formatCurrency";

const Spinner = () => (
  <div className="flex justify-center py-16">
    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function InvoicePage() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: order, isLoading } = useQuery({
    queryKey: ["invoice", orderId],
    queryFn: async () => {
      const res = await api.get(`/orders/${orderId}/invoice`);
      return res.data.data?.order ?? res.data.order ?? res.data;
    },
  });

  if (isLoading) return <Spinner />;
  if (!order)
    return (
      <p className="text-center py-16 text-gray-500">Invoice not found.</p>
    );

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
        {/* Header */}
        <div className="flex justify-between items-start mb-8 border-b border-gray-300 pb-6">
          <div>
            <h2 className="text-2xl font-black text-violet-700">MarketHub</h2>
            <p className="text-sm text-gray-500 mt-1">B2B Marketplace</p>
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
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Bill To
          </h3>
          <p className="font-semibold">{buyer.name}</p>
          {buyer.phone && (
            <p className="text-sm text-gray-600">{buyer.phone}</p>
          )}
          {buyer.email && (
            <p className="text-sm text-gray-600">{buyer.email}</p>
          )}
          {buyer.address?.street && (
            <p className="text-sm text-gray-600">
              {[buyer.address.street, buyer.address.city, buyer.address.state, buyer.address.zip]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
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
                <td className="py-2 text-center text-gray-600">{item.unit ?? "—"}</td>
                <td className="py-2 text-center">{item.quantity}</td>
                <td className="py-2 text-right">{formatRs(item.price)}</td>
                <td className="py-2 text-right">{formatRs(Number(item.price) * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatRs(order.subtotal ?? order.totalAmount)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between py-1 text-green-700">
                <span>Discount</span>
                <span>-{formatRs(order.discountAmount)}</span>
              </div>
            )}
            {order.taxAmount > 0 && (
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Tax</span>
                <span>{formatRs(order.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-t-2 border-gray-300 font-bold text-base mt-1">
              <span>Total</span>
              <span>{formatRs(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</h3>
            <p className="text-sm text-gray-600">{order.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="no-print mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back
          </button>
          {user?.role === "admin" && (
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors"
            >
              Print Invoice
            </button>
          )}
        </div>
      </div>
    </>
  );
}
