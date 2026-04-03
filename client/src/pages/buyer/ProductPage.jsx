import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Navbar from '../../components/Navbar';
import api from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';

const Spinner = () => (
  <div className="flex justify-center py-16">
    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function ProductPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [addedMsg, setAddedMsg] = useState('');

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await api.get(`/products/${id}`);
      return res.data.product ?? res.data;
    },
  });

  const addToCart = useMutation({
    mutationFn: () => api.post('/cart/add', { productId: id, quantity: qty }),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      setAddedMsg('Added to cart!');
      setTimeout(() => setAddedMsg(''), 2000);
    },
  });

  if (isLoading) return <><Navbar /><Spinner /></>;
  if (error || !product) return <><Navbar /><p className="text-center py-16 text-gray-500">Product not found.</p></>;

  const images = product.images?.length ? product.images : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
              {images[activeImg] ? (
                <img src={images[activeImg]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`w-14 h-14 rounded border-2 overflow-hidden ${i === activeImg ? 'border-blue-500' : 'border-gray-200'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <p className="text-sm text-gray-500 mb-1">{product.category}</p>
            {product.store?.name && (
              <p className="text-sm text-blue-600 mb-3">Sold by: {product.store.name}</p>
            )}
            <p className="text-3xl font-bold text-gray-900 mb-2">${Number(product.price).toFixed(2)}</p>
            {product.compareAtPrice > product.price && (
              <p className="text-sm text-gray-400 line-through mb-2">${Number(product.compareAtPrice).toFixed(2)}</p>
            )}
            <p className="text-sm text-gray-600 mb-1">Stock: {product.stock} {product.unit && `(${product.unit})`}</p>
            {product.description && (
              <p className="text-gray-600 text-sm mt-4 leading-relaxed">{product.description}</p>
            )}

            {user?.role === 'buyer' && (
              <div className="mt-6 flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={product.stock}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="w-16 border border-gray-300 rounded-md px-2 py-2 text-sm text-center"
                />
                <button
                  onClick={() => addToCart.mutate()}
                  disabled={addToCart.isPending || product.stock === 0}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {addToCart.isPending ? 'Adding...' : 'Add to Cart'}
                </button>
                {addedMsg && <span className="text-green-600 text-sm">{addedMsg}</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
