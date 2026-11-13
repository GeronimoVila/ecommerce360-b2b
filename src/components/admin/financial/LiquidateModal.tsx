import React, { useState } from 'react';
import { X, CheckCircle2, Receipt } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm font-sans">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#5B50D6] flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Liquidar Comisiones</h3>
          </div>
          <button 
            onClick={onClose} 
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Monto Neto a Transferir
            </p>
            <p className="text-3xl font-extrabold text-[#5B50D6] font-mono mb-2">
              ${totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="text-sm text-slate-600 bg-white border border-slate-200 py-1.5 px-3 rounded-lg inline-block shadow-sm">
              Destinatario: <span className="font-bold text-slate-900">{sellerId}</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Referencia Bancaria / Transacción *
            </label>
            <input
              type="text"
              required
              className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] shadow-sm font-mono placeholder:font-sans transition-colors"
              placeholder="Ej. TXN-998877"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-slate-400 mt-1.5">
              Ingresa el código de comprobante generado por el banco para futuras auditorías.
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !transactionRef.trim()}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#1A1D27] rounded-xl hover:bg-slate-800 disabled:opacity-50 shadow-sm transition-all"
            >
              {isLoading ? (
                'Procesando...'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Confirmar Pago
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};