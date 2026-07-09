import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
        <FileQuestion size={40} className="text-slate-400" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Page Not Found</h1>
      <p className="text-slate-400 text-sm mb-8 max-w-xs">
        The page you're looking for doesn't exist.
      </p>
      <Button onClick={() => navigate('/')}>Go Home</Button>
    </div>
  );
}
