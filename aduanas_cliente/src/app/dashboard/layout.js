import Sidebar from '../../components/Sidebar';

export const metadata = {
  title: 'Aduanex | Dashboard',
};

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50 text-[#212121]">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
