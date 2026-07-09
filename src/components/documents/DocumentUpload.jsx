export default function DocumentUpload({ onFileSelected }) {
  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) onFileSelected?.(file);
  };

  return (
    <label className="card flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-600 active:bg-slate-700/50 cursor-pointer">
      <div className="w-16 h-16 rounded-full bg-primary-900/50 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <p className="text-white font-medium">Tap to upload</p>
      <p className="text-slate-400 text-sm mt-1">PDF, JPG, PNG (max 15MB)</p>
      <input type="file" accept=".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf" onChange={handleChange} className="hidden" />
    </label>
  );
}
