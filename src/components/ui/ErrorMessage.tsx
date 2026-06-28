import { AlertTriangle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <AlertTriangle className="w-10 h-10 text-red-400" />
      <p className="text-gray-400 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-2 bg-grove-green/10 border border-grove-green/30 text-grove-green rounded-lg hover:bg-grove-green/20 transition-colors text-sm"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
