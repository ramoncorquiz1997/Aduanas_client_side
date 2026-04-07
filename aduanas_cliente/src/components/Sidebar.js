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
} from 'lucide-react';

const NAV_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    key: 'pedimentos',
    label: 'Repositorio de Pedimentos',
    href: '/dashboard/pedimentos',
    icon: FileStack,
  },
  {
    key: 'reportes',
    label: 'Reportes',
    href: '/dashboard/reportes',
    icon: BarChart3,
  },
  {
    key: 'archivos',
    label: 'Mis Archivos',
    href: '/dashboard/archivos',
    icon: FolderOpen,
  },
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
  const isActive = item.exact
    ? pathname === item.href
    : pathname.startsWith(item.href);

  return (
    <a
      href={item.href}
      onClick={(e) => {
        e.preventDefault();
        onClick(item.href);
      }}
      className={`
        flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
        ${isActive
          ? 'bg-[#3D6332]/10 text-[#3D6332] border border-[#3D6332]/20'
          : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5 border border-transparent'
        }
      `}
    >
      <item.icon size={16} className={isActive ? 'text-[#3D6332]' : 'text-zinc-500'} />
      <span>{item.label}</span>
    </a>
  );
}

function NavGroup({ item, pathname, onNavigate }) {
  const isChildActive = item.children?.some((c) => pathname.startsWith(c.href));
  const [open, setOpen] = useState(isChildActive);

  useEffect(() => {
    if (isChildActive) setOpen(true);
  }, [isChildActive]);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`
          w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
          ${isChildActive
            ? 'text-[#3D6332]'
            : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
          }
        `}
      >
        <item.icon size={16} className={isChildActive ? 'text-[#3D6332]' : 'text-zinc-500'} />
        <span className="flex-1 text-left">{item.label}</span>
        {open
          ? <ChevronDown size={14} className="text-zinc-600" />
          : <ChevronRight size={14} className="text-zinc-600" />
        }
      </button>
      {open && (
        <div className="ml-4 mt-1 space-y-0.5 border-l border-zinc-800 pl-3">
          {item.children.map((child) => {
            const isActive = pathname.startsWith(child.href);
            return (
              <a
                key={child.key}
                href={child.href}
                onClick={(e) => { e.preventDefault(); onNavigate(child.href); }}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150
                  ${isActive
                    ? 'text-[#3D6332] bg-[#3D6332]/5'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
                  }
                `}
              >
                <child.icon size={14} />
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

  useEffect(() => {
    const session = localStorage.getItem('user_session');
    if (session) {
      try { setUser(JSON.parse(session)); } catch { /* ignore */ }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user_session');
    router.push('/');
  };

  const handleNavigate = (href) => {
    setMobileOpen(false);
    router.push(href);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-zinc-800/60">
        <div className="w-8 h-8 rounded-lg bg-[#3D6332]/15 border border-[#3D6332]/30 flex items-center justify-center">
          <Anchor size={16} className="text-[#3D6332]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white tracking-wide">Aduanex</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) =>
          item.children ? (
            <NavGroup key={item.key} item={item} pathname={pathname} onNavigate={handleNavigate} />
          ) : (
            <NavLink key={item.key} item={item} pathname={pathname} onClick={handleNavigate} />
          )
        )}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-zinc-800/60 space-y-1">
        {user && (
          <div className="px-4 py-2.5 mb-2">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Sesión</p>
            <p className="text-sm font-medium text-zinc-200 truncate">{user.name}</p>
            <p className="text-xs text-zinc-500 font-mono">{user.rfc}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-all border border-transparent hover:border-red-500/20"
        >
          <LogOut size={16} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400"
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`
          lg:hidden fixed top-0 left-0 h-full w-64 z-50 bg-[#0d0d0d] border-r border-zinc-800/60
          transform transition-transform duration-200
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-md text-zinc-500 hover:text-zinc-300"
        >
          <X size={16} />
        </button>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 h-screen sticky top-0 bg-[#0d0d0d] border-r border-zinc-800/60">
        <SidebarContent />
      </aside>
    </>
  );
}
