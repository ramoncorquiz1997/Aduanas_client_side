import Sidebar from '../../components/Sidebar';

export const metadata = {
  title: 'Aduanex | Dashboard',
};

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
