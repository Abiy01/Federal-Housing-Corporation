import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { notificationsAPI } from '../../services/api';

interface DropdownItem {
  id: string;
  label: string;
  icon: string;
  to?: string;
  onClick?: () => void;
}

interface ProfileDropdownProps {
  items: DropdownItem[];
  menuWidthClass?: string;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ items, menuWidthClass = 'w-56' }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="w-10 h-10 rounded-full border border-[#E6D5C3] bg-white/90 text-[#374151] hover:text-[#D4755B] hover:border-[#D4755B] transition-colors flex items-center justify-center"
      >
        <span className="font-material-icons text-xl">person</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className={`absolute right-0 mt-2 ${menuWidthClass} bg-white border border-[#E6D5C3] rounded-xl shadow-[0px_10px_30px_rgba(17,24,39,0.12)] overflow-hidden z-20`}
            role="menu"
          >
            {items.map((item, idx) =>
              item.to ? (
                <Link
                  key={item.id}
                  to={item.to}
                  onClick={() => {
                    setIsOpen(false);
                    item.onClick?.();
                  }}
                  className={`w-full text-left px-4 py-3 font-manrope text-sm text-[#374151] hover:bg-[#FAF8F4] hover:text-[#D4755B] transition-colors flex items-center gap-2 ${
                    idx > 0 ? 'border-t border-[#F3EDE8]' : ''
                  }`}
                  role="menuitem"
                >
                  <span className="font-material-icons text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.id}
                  onClick={() => {
                    setIsOpen(false);
                    item.onClick?.();
                  }}
                  className={`w-full text-left px-4 py-3 font-manrope text-sm text-[#374151] hover:bg-[#FAF8F4] hover:text-[#D4755B] transition-colors flex items-center gap-2 ${
                    idx > 0 ? 'border-t border-[#F3EDE8]' : ''
                  }`}
                  role="menuitem"
                >
                  <span className="font-material-icons text-lg">{item.icon}</span>
                  {item.label}
                </button>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [unreadNotifications, setUnreadNotifications] = React.useState(0);

  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 100], [0.8, 0.95]);
  const backdropBlur = useTransform(scrollY, [0, 100], ["blur(8px)", "blur(12px)"]);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMobileMenu();
    navigate('/');
  };
  const isMaintenanceUser = user?.role === 'maintenance';
  const isFinanceUser = user?.role === 'finance';

  React.useEffect(() => {
    if (!isAuthenticated) return;
    notificationsAPI
      .getMyNotifications()
      .then((res) => setUnreadNotifications(res.data?.unreadCount || 0))
      .catch(() => setUnreadNotifications(0));
  }, [isAuthenticated]);

  const userDropdownItems: DropdownItem[] = [
    {
      id: 'notifications',
      label: unreadNotifications > 0 ? `Notifications (${unreadNotifications > 9 ? '9+' : unreadNotifications})` : 'Notifications',
      icon: 'notifications',
      to: '/notifications',
    },
    { id: 'my-leases', label: 'My Rent Leases', icon: 'assignment', to: '/my-rent-leases' },
    { id: 'my-maintenance', label: 'My Maintenance', icon: 'build', to: '/my-maintenance' },
    { id: 'my-transactions', label: 'My Transaction Requests', icon: 'receipt_long', to: '/my-transactions' },
    { id: 'logout', label: 'Logout', icon: 'logout', onClick: handleLogout },
  ];

  const maintenanceDropdownItems: DropdownItem[] = [
    { id: 'maintenance-dashboard', label: 'Maintenance Dashboard', icon: 'build', to: '/maintenance-dashboard' },
    { id: 'logout', label: 'Logout', icon: 'logout', onClick: handleLogout },
  ];
  const financeDropdownItems: DropdownItem[] = [
    { id: 'finance-audits', label: 'Finance Audits', icon: 'policy', to: '/finance-audits' },
    { id: 'logout', label: 'Logout', icon: 'logout', onClick: handleLogout },
  ];
  const mobileUserDropdownItems: DropdownItem[] = [
    {
      id: 'notifications',
      label: unreadNotifications > 0 ? `Notifications (${unreadNotifications > 9 ? '9+' : unreadNotifications})` : 'Notifications',
      icon: 'notifications',
      to: '/notifications',
      onClick: closeMobileMenu,
    },
    { id: 'my-leases', label: 'My Rent Leases', icon: 'assignment', to: '/my-rent-leases', onClick: closeMobileMenu },
    { id: 'my-maintenance', label: 'My Maintenance', icon: 'build', to: '/my-maintenance', onClick: closeMobileMenu },
    {
      id: 'my-transactions',
      label: 'My Transaction Requests',
      icon: 'receipt_long',
      to: '/my-transactions',
      onClick: closeMobileMenu,
    },
    { id: 'logout', label: 'Logout', icon: 'logout', onClick: handleLogout },
  ];
  const mobileMaintenanceDropdownItems: DropdownItem[] = [
    {
      id: 'maintenance-dashboard',
      label: 'Maintenance Dashboard',
      icon: 'build',
      to: '/maintenance-dashboard',
      onClick: closeMobileMenu,
    },
    { id: 'logout', label: 'Logout', icon: 'logout', onClick: handleLogout },
  ];
  const mobileFinanceDropdownItems: DropdownItem[] = [
    {
      id: 'finance-audits',
      label: 'Finance Audits',
      icon: 'policy',
      to: '/finance-audits',
      onClick: closeMobileMenu,
    },
    { id: 'logout', label: 'Logout', icon: 'logout', onClick: handleLogout },
  ];

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/properties', label: 'Properties' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{ backgroundColor: `rgba(255, 255, 255, ${bgOpacity.get()})`, backdropFilter: backdropBlur }}
      className="sticky top-0 z-50 border-b border-[#E6D5C3]"
    >
      <div className="max-w-[1280px] mx-auto px-8 flex items-center justify-between h-20">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3" onClick={closeMobileMenu}>
          <img src="/Logo2.png" alt="FHC" className="h-9 w-auto" />
          <span className="font-fraunces text-2xl font-bold text-[#111827]">FHC</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`font-manrope transition-colors ${
                isActive(link.path)
                  ? 'text-[#D4755B] font-semibold'
                  : 'text-[#374151] hover:text-[#D4755B]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated && user ? (
            <>
              {isMaintenanceUser ? (
                <ProfileDropdown items={maintenanceDropdownItems} />
              ) : isFinanceUser ? (
                <ProfileDropdown items={financeDropdownItems} />
              ) : (
                <ProfileDropdown items={userDropdownItems} />
              )}
            </>
          ) : (
            <>
              <Link
                to="/signin"
                className="font-manrope font-semibold text-[#374151] hover:text-[#D4755B] transition-colors px-4 py-2"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="bg-[#D4755B] text-white font-manrope font-bold px-6 py-2 rounded-lg hover:bg-[#B86851] transition-all hover:shadow-lg"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 text-[#374151] hover:text-[#D4755B] transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span className="font-material-icons text-2xl">
            {isMobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-[#E6D5C3] shadow-lg py-4 px-8 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`font-manrope text-lg py-2 transition-colors ${
                isActive(link.path)
                  ? 'text-[#D4755B] font-semibold'
                  : 'text-[#374151] hover:text-[#D4755B]'
              }`}
              onClick={closeMobileMenu}
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-gray-100 my-2 pt-4 flex flex-col gap-4">
            {isAuthenticated && user ? (
              <>
                <span className="font-manrope text-sm text-[#374151]">
                  Signed in as <span className="font-semibold">{user.name}</span>
                </span>
                {isMaintenanceUser ? (
                  <div className="self-end">
                    <ProfileDropdown items={mobileMaintenanceDropdownItems} menuWidthClass="w-full min-w-[220px]" />
                  </div>
                ) : isFinanceUser ? (
                  <div className="self-end">
                    <ProfileDropdown items={mobileFinanceDropdownItems} menuWidthClass="w-full min-w-[220px]" />
                  </div>
                ) : (
                  <div className="self-end">
                    <ProfileDropdown items={mobileUserDropdownItems} menuWidthClass="w-full min-w-[220px]" />
                  </div>
                )}
              </>
            ) : (
              <>
                <Link
                  to="/signin"
                  className="font-manrope font-semibold text-[#374151] hover:text-[#D4755B] transition-colors py-2"
                  onClick={closeMobileMenu}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="bg-[#D4755B] text-white font-manrope font-bold px-6 py-3 rounded-lg hover:bg-[#B86851] transition-all hover:shadow-lg text-center"
                  onClick={closeMobileMenu}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </motion.nav>
  );
};

export default Navbar;