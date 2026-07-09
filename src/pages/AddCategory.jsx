import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCategory } from '../api/categories';
import Button from '../components/ui/Button';
import { toast } from '../components/ui/Toast';
import { ArrowLeft, FolderPlus } from 'lucide-react';

export default function AddCategory() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createCategory({ name: name.trim() });
      toast('Category created', 'success');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to create category';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full active:bg-slate-100 dark:active:bg-[#1c2430] text-slate-500 dark:text-slate-300" aria-label="Back">
          <ArrowLeft size={22} />
        </button>
        <div>
          <p className="section-label">Categories</p>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Add Category</h1>
        </div>
      </div>

      <div className="hero-panel mb-4 text-center">
        <div className="mx-auto w-20 h-20 rounded-3xl bg-white/80 dark:bg-[#111821] ring-1 ring-slate-200/80 dark:ring-[#232b38] flex items-center justify-center mb-4">
          <FolderPlus size={36} className="text-[#4f46e5]" />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">Create a clean bucket for one document type or family member.</p>
      </div>

      <form onSubmit={handleSubmit} className="page-card space-y-4">
        <div>
          <label className="section-label mb-2 block">Category name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            placeholder="e.g. Aadhaar, PAN, Passport"
            className="input-field"
            maxLength={64}
            autoFocus
          />
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </div>
        <Button type="submit" loading={loading} disabled={!name.trim()}>
          Create Category
        </Button>
      </form>
    </div>
  );
}
