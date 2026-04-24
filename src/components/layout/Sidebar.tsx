import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  Users,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Store,
  Package,
  ShoppingCart,
  DollarSign,
  UserCog,
  FileBarChart,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';


const navSections = [
  {
    label: 'Main',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
      { icon: FileText, label: 'Invoices', path: '/invoices' },
      { icon: CreditCard, label: 'Payments', path: '/payments' },
      { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    ],
  },
  {
    label: 'ERP',
    items: [
      { icon: Users, label: 'Clients', path: '/clients' },
      { icon: Store, label: 'Vendors', path: '/vendors' },
      { icon: ShoppingCart, label: 'Purchase Orders', path: '/purchase-orders' },
      { icon: DollarSign, label: 'Expenses', path: '/expenses' },
      { icon: UserCog, label: 'Employees', path: '/employees' },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { icon: Package, label: 'Products & Stock', path: '/inventory' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { icon: FileBarChart, label: 'Reports', path: '/reports' },
      { icon: Settings, label: 'Settings', path: '/settings' },
    ],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="h-16 border-b border-sidebar-border" />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-4">
          {navSections.map((section, sIdx) => (
            <div key={section.label}>
              {sIdx > 0 && <Separator className="mb-3 bg-sidebar-border" />}
              {!collapsed && (
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                        collapsed && 'justify-center px-2',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-primary'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )
                    }
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse Button */}
        <div className="border-t border-sidebar-border p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
