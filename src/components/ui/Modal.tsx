import { X } from 'lucide-react';
import { type ReactNode } from 'react';

interface ModalProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
}

export default function Modal({ title, children, onClose, footer }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-grove-surface border border-grove-border rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-grove-border">
          <h2 className="text-white font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-grove-border transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="p-4">{children}</div>
        {footer && <div className="p-4 border-t border-grove-border flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
