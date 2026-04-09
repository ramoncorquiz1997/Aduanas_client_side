"use client";

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileStack,
  BarChart3,
  FolderOpen,
  Settings,
  User,
  ShieldCheck,
  LogOut,
  ChevronDown,
  ChevronRight,
  Anchor,
  X,
  Menu,
  Users,
} from 'lucide-react';

const NAV_ITEMS_CLIENT = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { key: 'pedimentos', label: 'Repositorio de Pedimentos', href: '/dashboard/pedimentos', icon: FileStack },
  { key: 'reportes', label: 'Reportes', href: '/dashboard/reportes', icon: BarChart3 },
  { key: 'archivos', label: 'Mis Archivos', href: '/dashboard/archivos', icon: FolderOpen },
  {
    key: 'configuracion',
    label: 'Configuración',
    icon: Settings,
    children: [
      { key: 'perfil', label: 'Perfil', href: '/dashboard/configuracion/perfil', icon: User },
      { key: 'seguridad', label: 'Seguridad', href: '/dashboard/configuracion/seguridad', icon: ShieldCheck },
    ],
  },
];

const NAV_ITEMS_FF = [
  { key: 'mis-clientes', label: 'Mis Clientes', href: '/dashboard/mis-clientes', icon: Users, exact: true },
  {
    key: 'configuracion',
    label: 'Configuración',
    icon: Settings,
    children: [
      { key: 'perfil', label: 'Perfil', href: '/dashboard/configuracion/perfil', icon: User },
      { key: 'seguridad', label: 'Seguridad', href: '/dashboard/configuracion/seguridad', icon: ShieldCheck },
    ],
  },
];

function NavLink({ item, pathname, onClick }) {
  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
  return (
    <a
      href={item.href}
      onClick={(e) => { e.preventDefault(); onClick(item.href); }}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
        isActive
          ? 'bg-[#3D6332] text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-[#212121]'
      }`}
    >
      <item.icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
      <span>{item.label}</span>
    </a>
  );
}

function NavGroup({ item, pathname, onNavigate }) {
  const isChildActive = item.children?.some((c) => pathname.startsWith(c.href));
  const [open, setOpen] = useState(isChildActive);

  useEffect(() => { if (isChildActive) setOpen(true); }, [isChildActive]);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
          isChildActive ? 'text-[#3D6332]' : 'text-slate-600 hover:bg-slate-100 hover:text-[#212121]'
        }`}
      >
        <item.icon size={16} className={isChildActive ? 'text-[#3D6332]' : 'text-slate-400'} />
        <span className="flex-1 text-left">{item.label}</span>
        {open ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
      </button>
      {open && (
        <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-slate-200 pl-3">
          {item.children.map((child) => {
            const isActive = pathname.startsWith(child.href);
            return (
              <a
                key={child.key}
                href={child.href}
                onClick={(e) => { e.preventDefault(); onNavigate(child.href); }}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-[#3D6332] text-white'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-[#212121]'
                }`}
              >
                <child.icon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{child.label}</span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navItems, setNavItems] = useState(NAV_ITEMS_CLIENT);

  useEffect(() => {
    const session = localStorage.getItem('user_session');
    if (session) {
      try {
        const u = JSON.parse(session);
        setUser(u);
        setNavItems(u.role === 'freight_forwarder' ? NAV_ITEMS_FF : NAV_ITEMS_CLIENT);
      } catch { }
    }
  }, []);

  const handleLogout = () => { localStorage.removeItem('user_session'); router.push('/'); };
  const handleNavigate = (href) => { setMobileOpen(false); router.push(href); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-200">
        <div className="w-9 h-9 rounded-xl bg-[#3D6332] flex items-center justify-center shadow-sm">
          <Anchor size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-black text-[#212121] tracking-tight uppercase italic">
            Aduan<span className="text-[#3D6332]">ex</span>
          </p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Portal Logístico</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) =>
          item.children ? (
            <NavGroup key={item.key} item={item} pathname={pathname} onNavigate={handleNavigate} />
          ) : (
            <NavLink key={item.key} item={item} pathname={pathname} onClick={handleNavigate} />
          )
        )}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-200 space-y-1">
        {user && (
          <div className="px-3 py-2.5 mb-2 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Sesión activa</p>
            <p className="text-sm font-semibold text-[#212121] truncate">{user.name}</p>
            <p className="text-xs text-slate-400 font-mono">{user.rfc}</p>
            {user.role === 'freight_forwarder' && (
              <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-widest bg-[#3D6332]/10 text-[#3D6332] px-2 py-0.5 rounded-full">
                Freight Forwarder
              </span>
            )}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut size={16} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-slate-200 text-slate-500 shadow-sm"
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside className={`lg:hidden fixed top-0 left-0 h-full w-64 z-50 bg-white border-r border-slate-200 transform transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-md text-slate-400 hover:text-slate-600">
          <X size={16} />
        </button>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 h-screen sticky top-0 bg-white border-r border-slate-200">
        <SidebarContent />
      </aside>
    </>
  );
}
