import { ShieldCheck, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  canConfirm: boolean;
  isConfirmed: boolean;
  onConfirm: () => void;
}

export function OperationalConfirmationPanel({ canConfirm, isConfirmed, onConfirm }: Props) {
  if (isConfirmed) {
    return (
      <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-xl shadow-sm text-emerald-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-start gap-3">
          <div className="bg-emerald-500/10 p-2 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h4 className="font-semibold text-sm tracking-tight text-emerald-900">Operación confirmada</h4>
            <p className="text-xs mt-1 text-emerald-700/80">La cotización se ha movido a Ganadas exitosamente.</p>
            <div className="mt-3 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-200/50 text-emerald-700">
              Modo Mock Activo
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!canConfirm) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="bg-slate-200 p-2 rounded-lg">
            <AlertCircle className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h4 className="font-medium text-sm text-slate-700 tracking-tight">Acción bloqueada</h4>
            <p className="text-xs mt-1">Creá primero una reserva mock para habilitar la confirmación operativa.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50/30 border border-indigo-100 rounded-xl shadow-sm space-y-3">
      <div className="flex items-start gap-3">
        <div className="bg-indigo-500/10 p-2 rounded-lg">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h4 className="font-semibold text-sm text-indigo-900 tracking-tight">Confirmación operativa</h4>
          <p className="text-xs text-indigo-700/80 mt-1">Moverá la cotización a Ganadas. Esta acción confirma la disponibilidad.</p>
        </div>
      </div>
      
      <button 
        onClick={onConfirm}
        className={cn(
          "w-full mt-2 group relative overflow-hidden",
          "bg-indigo-600 text-white text-xs font-semibold py-2.5 px-4 rounded-lg shadow-sm",
          "hover:bg-indigo-700 hover:shadow transition-all duration-200 active:scale-[0.98]"
        )}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          Confirmar operación (Mock)
        </span>
        <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
      </button>
    </div>
  );
}
