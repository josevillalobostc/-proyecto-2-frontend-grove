import { useNavigate } from 'react-router-dom';
import { Network } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-grove-dark flex flex-col items-center justify-center gap-6 text-center p-8">
      <div className="w-16 h-16 rounded-2xl bg-grove-green/10 border border-grove-green/20 flex items-center justify-center">
        <Network className="w-8 h-8 text-grove-green" />
      </div>
      <div>
        <h1 className="text-6xl font-bold text-white mb-2">404</h1>
        <p className="text-gray-400">This node doesn't exist in the graph.</p>
      </div>
      <button
        onClick={() => navigate('/graph')}
        className="grove-btn-primary"
      >
        Back to Graph
      </button>
    </div>
  );
}
