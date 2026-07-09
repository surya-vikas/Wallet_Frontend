export default function Card({ children, className = '', onClick, ...props }) {
  return (
    <div
      className={`card ${onClick ? 'active:scale-[0.98] cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(e); } : undefined}
      {...props}
    >
      {children}
    </div>
  );
}
