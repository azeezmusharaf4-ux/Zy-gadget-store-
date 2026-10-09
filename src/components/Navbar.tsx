import React, { useState } from 'react';
import { ShoppingBag, Search, User as UserIcon, ShieldCheck, Menu, X, Smartphone, PhoneCall } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { StoreSettings } from '../types';

interface NavbarProps {
  settings: StoreSettings;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenAuth: () => void;
  onOpenAccount: () => void;
  onOpenAdmin: () => void;
  onNavigateHome: () => void;
  onScrollToCatalog: () => void;
  onScrollToContact: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  searchQuery,
  onSearchChange,
  onOpenAuth,
  onOpenAccount,
  onOpenAdmin,
  onNavigateHome,
  onScrollToCatalog,
  onScrollToContact,
}) => {
  const { user, isAdmin, isOwner } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => {
                onNavigateHome();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 text-left group focus:outline-none min-w-0"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 flex-shrink-0">
                <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-sm sm:text-lg tracking-tight text-white block leading-tight truncate">
                  {settings.storeName || 'ZY GADGET STORE'}
                </span>
                <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase block truncate">
                  Authentic Electronics
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Search Bar (only for logged-in customers browsing catalogue) */}
          {user ? (
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search phones, brands, accessories, gadgets..."
                  className="w-full bg-slate-800/90 text-base sm:text-sm text-white placeholder-slate-400 rounded-lg pl-10 pr-4 py-2 border border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-1" />
          )}

          {/* Right Navigation & Actions */}
          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => {
                if (user) {
                  setMobileSearchOpen(!mobileSearchOpen);
                } else {
                  onOpenAuth();
                }
              }}
              className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              aria-label={user ? 'Toggle Search' : 'Sign in to search catalogue'}
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              <button
                onClick={onScrollToCatalog}
                className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                Catalogue
              </button>
              <button
                onClick={onScrollToContact}
                className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                Contact
              </button>
            </nav>

            {/* Admin / Owner Button: Desktop only. On mobile it is moved into the three-line hamburger menu */}
            {isAdmin && (
              <button
                onClick={onOpenAdmin}
                className="hidden lg:flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                title={isOwner ? 'Store Owner Dashboard' : 'Store Administrator Dashboard'}
              >
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>Owner Dashboard</span>
              </button>
            )}

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-blue-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-sm animate-pulse">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>

            {/* User Account / Sign In: Desktop only. On mobile it is accessed via the three-line hamburger menu */}
            {user ? (
              <button
                onClick={onOpenAccount}
                className="hidden lg:flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-xs sm:text-sm font-medium"
              >
                <div className="w-7 h-7 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs uppercase">
                  {user.displayName ? user.displayName[0] : (user.email ? user.email[0] : 'U')}
                </div>
                <span className="truncate max-w-[100px]">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="hidden lg:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
              >
                <UserIcon className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Menu Toggle (Three-line Hamburger Menu) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Input Bar */}
        {mobileSearchOpen && (
          <div className="md:hidden py-3 border-t border-slate-800">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search gadgets, brands, phones..."
                className="w-full bg-slate-800 text-base text-white placeholder-slate-400 rounded-lg pl-10 pr-4 py-2.5 border border-slate-700 focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-3 text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900 px-4 py-4 space-y-3 animate-fadeIn">
          {/* Admin Option: Inside three-line hamburger menu for authorized administrators */}
          {isAdmin && (
            <button
              onClick={() => {
                onOpenAdmin();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md transition-colors"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>Admin Dashboard</span>
              </div>
              <span className="text-[10px] bg-blue-800 text-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                {isOwner ? 'Store Owner' : 'Admin'}
              </span>
            </button>
          )}

          <button
            onClick={() => {
              onScrollToCatalog();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Browse Catalogue
          </button>

          <button
            onClick={() => {
              onScrollToContact();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Store Contact & Support
          </button>

          {/* User Account / Orders inside hamburger menu */}
          {user ? (
            <button
              onClick={() => {
                onOpenAccount();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-2.5 border border-slate-800 bg-slate-800/40"
            >
              <div className="w-7 h-7 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                {user.displayName ? user.displayName[0] : (user.email ? user.email[0] : 'U')}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-200 truncate">
                  My Account & Orders
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {user.email}
                </div>
              </div>
            </button>
          ) : (
            <button
              onClick={() => {
                onOpenAuth();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm font-medium text-blue-400 hover:bg-slate-800 rounded-lg flex items-center gap-2"
            >
              <UserIcon className="w-4 h-4" />
              <span>Customer Sign In / Register</span>
            </button>
          )}

          {settings.phone && settings.phone !== 'Update Phone in Admin Settings' && (
            <a
              href={`tel:${settings.phone.replace(/[^0-9+]/g, '')}`}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
              <span>Direct Call: {settings.phone}</span>
            </a>
          )}
        </div>
      )}
    </header>
  );
};
