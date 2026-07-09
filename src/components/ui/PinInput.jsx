import { useState, useRef, useEffect } from 'react';

export default function PinInput({ length = 4, onComplete, disabled, error }) {
  const [digits, setDigits] = useState(Array(length).fill(''));
  const [focusedIdx, setFocusedIdx] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (idx, value) => {
    if (!/^\d?$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[idx] = value;
    setDigits(newDigits);
    if (value && idx < length - 1) {
      inputRefs.current[idx + 1]?.focus();
      setFocusedIdx(idx + 1);
    }
    if (newDigits.every((d) => d !== '') && value) {
      onComplete?.(newDigits.join(''));
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      const newDigits = [...digits];
      newDigits[idx - 1] = '';
      setDigits(newDigits);
      inputRefs.current[idx - 1]?.focus();
      setFocusedIdx(idx - 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted.length !== length) return;
    const newDigits = pasted.split('');
    setDigits(newDigits);
    inputRefs.current[length - 1]?.focus();
    onComplete?.(pasted);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-3">
        {digits.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => (inputRefs.current[idx] = el)}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onFocus={() => setFocusedIdx(idx)}
            onPaste={idx === 0 ? handlePaste : undefined}
            disabled={disabled}
            className={`w-12 h-14 text-center text-xl font-bold rounded-2xl border-2 transition-all duration-150 bg-white/85 dark:bg-[#121821] ${
              digit ? 'border-[#4f46e5] text-[#4f46e5] dark:text-[#c7c5ff]' : 'border-slate-200 text-slate-800 dark:border-[#232b38] dark:text-slate-100'
            } ${
              focusedIdx === idx ? 'ring-2 ring-[#4f46e5]/15 border-[#4f46e5]' : ''
            } ${error ? 'border-red-400' : ''} disabled:opacity-50`}
            aria-label={`PIN digit ${idx + 1}`}
          />
        ))}
      </div>
      {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
    </div>
  );
}
