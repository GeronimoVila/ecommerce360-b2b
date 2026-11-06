import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (transactionRef: string) => Promise<void>;
  sellerId: string;
  totalAmount: number;
}

export const LiquidateModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, sellerId, totalAmount }) => {
  const [transactionRef, setTransactionRef] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionRef.trim()) return;
    
    setIsLoading(true);
    try {
      await onConfirm(transactionRef);
      setTransactionRef('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-xl font-bold mb-4">Liquidar Comisiones</h2>
        <p className="text-sm text-gray-600 mb-4">
          Vas a registrar el pago de <strong>${totalAmount.toFixed(2)}</strong> al vendedor <br/>
          <span className="text-xs font-mono">{sellerId}</span>
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Referencia Bancaria / Transacción
            </label>
            <input
              type="text"
              required
              className="w-full border border-gray-300 p-2 rounded focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej. TXN-998877"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !transactionRef.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Procesando...' : 'Confirmar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};