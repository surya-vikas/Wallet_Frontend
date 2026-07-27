import { Outlet } from 'react-router-dom';

export default function AppShell() {
  return (
    <div className="relative min-h-screen max-w-lg mx-auto overflow-hidden text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <div className="pointer-events-none absolute inset-0 opacity-80 dark:opacity-100">
        <div className="absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[#4f46e5]/10 blur-3xl dark:bg-[#4f46e5]/15" />
        <div className="absolute bottom-32 right-[-6rem] h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-400/10" />
      </div>
      <main className="relative z-10 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
