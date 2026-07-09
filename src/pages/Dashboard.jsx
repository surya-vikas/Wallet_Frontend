import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategories, updateCategory, deleteCategory } from '../api/categories';
import { globalSearch } from '../api/search';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { toast } from '../components/ui/Toast';
import CategoryCard from '../components/categories/CategoryCard';
import DocumentCard from '../components/documents/DocumentCard';
import { Search, Plus, Folder, FileText, CreditCard, Car, Hash, Shield, Home, Activity, Landmark, Award, Receipt, File, LogOut, AlertTriangle } from 'lucide-react';
import NotificationBell from '../components/notifications/NotificationBell';
import SOSCountdown from '../components/sos/SOSCountdown';
import { sendSOS } from '../api/sos';
import { collectSOSContext } from '../utils/sos';

const categoryIcons = {
  Aadhaar: CreditCard,
  PAN: FileText,
  RC: Car,
  License: Hash,
  Insurance: Shield,
  Passport: File,
  Property: Home,
  Medical: Activity,
  Bank: Landmark,
  Certificates: Award,
  Tax: Receipt,
  Bills: Receipt,
};

const categoryColors = {
  Aadhaar: 'bg-orange-100 text-orange-600',
  PAN: 'bg-blue-100 text-blue-600',
  RC: 'bg-emerald-100 text-emerald-600',
  License: 'bg-cyan-100 text-cyan-600',
  Insurance: 'bg-purple-100 text-purple-600',
  Passport: 'bg-indigo-100 text-indigo-600',
  Property: 'bg-rose-100 text-rose-600',
  Medical: 'bg-red-100 text-red-600',
  Bank: 'bg-yellow-100 text-yellow-600',
  Certificates: 'bg-violet-100 text-violet-600',
  Tax: 'bg-slate-100 text-slate-600',
  Bills: 'bg-teal-100 text-teal-600',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [categories, setCategories] = useState([]);
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [showSOS, setShowSOS] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await getCategories();
        setCategories(data.data);
      } catch {
        toast('Failed to load categories', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults(null);
      return;
    }
    let cancelled = false;
    const search = async () => {
      setSearching(true);
      try {
        const { data } = await globalSearch(debouncedQuery);
        if (!cancelled) setSearchResults(data.data);
      } catch {
        // silent
      } finally {
        if (!cancelled) setSearching(false);
      }
    };
    search();
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  const getIcon = useCallback((name) => {
    const Icon = categoryIcons[name];
    return Icon ? <Icon size={28} /> : <Folder size={28} />;
  }, []);

  const getColor = useCallback((name) => categoryColors[name] || 'bg-slate-100 text-slate-600', []);

  const hasSearchResults = searchResults && (searchResults.categories.length > 0 || searchResults.documents.length > 0);

  const syncCategory = (updatedCategory) => {
    setCategories((prev) =>
      prev.map((cat) => (cat._id === updatedCategory._id ? { ...cat, ...updatedCategory } : cat))
    );
    setSearchResults((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        categories: prev.categories.map((cat) =>
          cat._id === updatedCategory._id ? { ...cat, ...updatedCategory } : cat
        ),
      };
    });
  };

  const removeCategory = (categoryId) => {
    setCategories((prev) => prev.filter((cat) => cat._id !== categoryId));
    setSearchResults((prev) => {
      if (!prev) return prev;
      return { ...prev, categories: prev.categories.filter((cat) => cat._id !== categoryId) };
    });
  };

  const openEditCategory = (category) => {
    setEditingCategory(category);
    setEditName(category.name || '');
  };

  const closeEditCategory = () => {
    if (savingCategory) return;
    setEditingCategory(null);
    setEditName('');
    setShowDeleteConfirm(false);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!editingCategory) return;
    const trimmedName = editName.trim();
    if (!trimmedName) {
      toast('Category name is required', 'error');
      return;
    }
    setSavingCategory(true);
    try {
      const payload = { name: trimmedName };
      const { data } = await updateCategory(editingCategory._id, payload);
      syncCategory(data.data);
      toast('Category updated', 'success');
      closeEditCategory();
    } catch (err) {
      toast(err.response?.data?.error?.message || 'Failed to update category', 'error');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!editingCategory) return;
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCategory = async () => {
    if (!editingCategory) return;
    setSavingCategory(true);
    try {
      await deleteCategory(editingCategory._id);
      removeCategory(editingCategory._id);
      toast('Category deleted', 'success');
      closeEditCategory();
    } catch (err) {
      toast(err.response?.data?.error?.message || 'Failed to delete category', 'error');
    } finally {
      setSavingCategory(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="min-h-screen" />;

  return (
    <div className="page-shell">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-[#4f46e5]">Thipirishetty&apos;s Vault</h1>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <button
            onClick={() => setShowSOS(true)}
            className="p-2 rounded-full active:bg-red-50 dark:active:bg-[#1c2430] text-slate-400 dark:text-slate-300 hover:text-red-500 transition-colors"
            aria-label="SOS"
          >
            <AlertTriangle size={20} />
          </button>
          <button
            onClick={logout}
            className="p-2.5 rounded-full active:bg-slate-100 dark:active:bg-[#1c2430] text-slate-400 dark:text-slate-300 hover:text-red-500 transition-colors"
            aria-label="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="card-flat mb-4 p-3">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search categories and documents..."
            className="input-field pl-11"
          />
        </div>
      </div>

      {searching && (
        <div className="flex justify-center py-4">
          <div className="animate-spin h-5 w-5 border-2 border-[#4f46e5] border-t-transparent rounded-full" />
        </div>
      )}

      {!debouncedQuery.trim() && (
        <section className="space-y-3">
          {categories.length === 0 ? (
            <div className="page-card">
              <EmptyState
                icon={Folder}
                title="No categories yet"
                message="Create your first category to start organizing documents."
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <CategoryCard
                  key={cat._id}
                  category={cat}
                  onClick={() => navigate(`/categories/${cat._id}`)}
                  onEdit={openEditCategory}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {searchResults && debouncedQuery.trim() && (
        <div className="space-y-5">
          {!hasSearchResults && !searching && (
            <div className="page-card">
              <EmptyState
                icon={FileText}
                title="No results found"
                message={`No matches for "${debouncedQuery}"`}
              />
            </div>
          )}

          {searchResults.categories.length > 0 && (
            <section className="space-y-2">
              <div className="space-y-2">
                {searchResults.categories.map((cat) => (
                  <CategoryCard
                    key={cat._id}
                    category={cat}
                    onClick={() => navigate(`/categories/${cat._id}`)}
                    onEdit={openEditCategory}
                  />
                ))}
              </div>
            </section>
          )}

          {searchResults.documents.length > 0 && (
            <section className="space-y-2">
              <h2 className="section-label">Documents ({searchResults.documents.length})</h2>
              <div className="space-y-2">
                {searchResults.documents.map((doc) => (
                  <DocumentCard
                    key={doc._id}
                    doc={doc}
                    onClick={() => navigate(`/documents/${doc._id}`)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <button
        onClick={() => navigate('/categories/add')}
        className="fab"
        aria-label="Add category"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      {showSOS && (
        <SOSCountdown
          onComplete={async () => {
            try {
              const { device, location } = await collectSOSContext();
              await sendSOS(device, location);
              toast('Emergency alert sent', 'success');
            } catch (err) {
              toast(err.response?.data?.error?.message || 'Failed', 'error');
            }
            setShowSOS(false);
          }}
          onCancel={() => setShowSOS(false)}
        />
      )}

      <Modal open={!!editingCategory} onClose={closeEditCategory} title="Edit Category">
        {editingCategory && (
          <form onSubmit={handleSaveCategory} className="flex flex-col gap-4">
            <div>
              <label className="text-sm text-slate-500 mb-1.5 block font-medium">Category Name *</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="input-field"
                maxLength={64}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-1 gap-3 pt-2">
              <Button type="submit" loading={savingCategory}>Save Changes</Button>
              <Button type="button" variant="danger" onClick={handleDeleteCategory}>Delete Category</Button>
              <Button type="button" variant="secondary" onClick={closeEditCategory}>Cancel</Button>
            </div>
          </form>
        )}
      </Modal>

      {showDeleteConfirm && editingCategory && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-black/45 animate-fade-in px-6 pt-24 sm:items-center sm:pt-0"
          onClick={() => !savingCategory && setShowDeleteConfirm(false)}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} className="text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 text-center mb-2">Delete Category?</h2>
            <p className="text-sm text-slate-500 text-center mb-6">
              This will permanently delete &ldquo;{editingCategory.name}&rdquo;. If there are documents inside it, the backend may block the deletion.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={savingCategory}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-semibold text-sm active:bg-slate-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCategory}
                disabled={savingCategory}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold text-sm active:bg-red-600 disabled:opacity-50"
              >
                {savingCategory ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
