import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Compass, Search, User, LogOut, Shield, Menu, X, PlusCircle, Users, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from './Logo';

export const Header: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Accent Line */}
      <div className="w-full h-1 bg-primary" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Logo & Institutional Identity */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <Logo size={38} useImage={true} />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-primary">
                  NEC <span className="text-slate-800 font-extrabold">SUCCESS STORIES</span>
                </span>
                {isAdmin && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary-soft text-primary rounded border border-purple-200">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-[11px] font-medium text-slate-500 hidden sm:block tracking-wide">
                National Engineering College Alumni Association
              </p>
            </div>
          </Link>

          {/* Center: Institutional Horizontal Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/dashboard"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
                isActive('/dashboard') || isActive('/')
                  ? 'bg-primary-light text-primary font-bold border border-primary/20 shadow-2xs'
                  : 'text-slate-600 hover:text-primary hover:bg-primary-soft'
              }`}
            >
              <Home className={`w-4 h-4 ${isActive('/dashboard') || isActive('/') ? 'text-primary' : 'text-slate-400'}`} />
              <span>Home</span>
            </Link>

            <Link
              to="/members"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
                isActive('/members')
                  ? 'bg-primary-light text-primary font-bold border border-primary/20 shadow-2xs'
                  : 'text-slate-600 hover:text-primary hover:bg-primary-soft'
              }`}
            >
              <Users className={`w-4 h-4 ${isActive('/members') ? 'text-primary' : 'text-slate-400'}`} />
              <span>Directory</span>
            </Link>

            <Link
              to="/explore"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
                isActive('/explore') && !location.search.includes('focus=search')
                  ? 'bg-primary-light text-primary font-bold border border-primary/20 shadow-2xs'
                  : 'text-slate-600 hover:text-primary hover:bg-primary-soft'
              }`}
            >
              <Compass className={`w-4 h-4 ${isActive('/explore') && !location.search.includes('focus=search') ? 'text-primary' : 'text-slate-400'}`} />
              <span>Stories</span>
            </Link>

            <Link
              to="/explore?focus=search"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
                location.search.includes('focus=search')
                  ? 'bg-primary-light text-primary font-bold border border-primary/20 shadow-2xs'
                  : 'text-slate-600 hover:text-primary hover:bg-primary-soft'
              }`}
            >
              <Search className={`w-4 h-4 ${location.search.includes('focus=search') ? 'text-primary' : 'text-slate-400'}`} />
              <span>Search</span>
            </Link>

            {isAuthenticated && (
              <Link
                to="/stories/write"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
                  isActive('/stories/write') || isActive('/write-story')
                    ? 'bg-primary-light text-primary font-bold border border-primary/20 shadow-2xs'
                    : 'text-slate-600 hover:text-primary hover:bg-primary-soft'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-primary" />
                <span>Share Story</span>
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-150 ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-primary text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-primary-light hover:text-primary'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </Link>
            )}
          </nav>

          {/* Right: User Section & Authentication CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer text-left"
                >
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.fullName}
                      className="w-7 h-7 rounded-md object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-md bg-primary text-white flex items-center justify-center text-xs font-bold uppercase shrink-0">
                      {user?.fullName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="min-w-0 pr-1">
                    <p className="text-xs font-bold text-slate-900 truncate max-w-[120px] leading-tight">
                      {user?.fullName}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide leading-tight">
                      {user?.role || 'Member'}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* User Dropdown */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-slate-200 rounded-md shadow-dropdown py-1 z-50 animate-in fade-in duration-100">
                      <div className="px-3 py-2 border-b border-slate-200 bg-slate-50">
                        <p className="text-xs font-bold text-primary truncate">{user?.fullName}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-primary-soft hover:text-primary transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-primary" />
                        <span>My Profile</span>
                      </Link>

                      <Link
                        to="/my-stories"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-primary-soft hover:text-primary transition-colors"
                      >
                        <Compass className="w-3.5 h-3.5 text-primary" />
                        <span>My Stories</span>
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-primary-soft hover:text-primary transition-colors"
                        >
                          <Shield className="w-3.5 h-3.5 text-primary" />
                          <span>Admin Console</span>
                        </Link>
                      )}

                      <div className="border-t border-slate-200 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5 text-red-600" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-primary-soft hover:text-primary hover:border-primary rounded-md transition-all duration-200"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-md shadow-2xs transition-all duration-200"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-md bg-white text-primary border border-slate-200 hover:bg-primary-soft transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-5 space-y-1.5 shadow-sm">
          <Link
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
              isActive('/dashboard') || isActive('/')
                ? 'bg-primary-light text-primary font-bold border border-primary/20'
                : 'text-slate-700 hover:bg-slate-50 hover:text-primary'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
          <Link
            to="/members"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
              isActive('/members')
                ? 'bg-primary-light text-primary font-bold border border-primary/20'
                : 'text-slate-700 hover:bg-slate-50 hover:text-primary'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Alumni Directory</span>
          </Link>
          <Link
            to="/explore"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
              isActive('/explore') && !location.search.includes('focus=search')
                ? 'bg-primary-light text-primary font-bold border border-primary/20'
                : 'text-slate-700 hover:bg-slate-50 hover:text-primary'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Explore Stories</span>
          </Link>
          <Link
            to="/explore?focus=search"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
              location.search.includes('focus=search')
                ? 'bg-primary-light text-primary font-bold border border-primary/20'
                : 'text-slate-700 hover:bg-slate-50 hover:text-primary'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </Link>

          {isAuthenticated && (
            <>
              <Link
                to="/stories/write"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold text-slate-700 hover:bg-primary-soft hover:text-primary transition-colors"
              >
                <PlusCircle className="w-4 h-4 text-primary" />
                <span>Share Story</span>
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                  isActive('/profile')
                    ? 'bg-primary-light text-primary font-bold border border-primary/20'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-primary'
                }`}
              >
                <User className="w-4 h-4" />
                <span>My Profile</span>
              </Link>
            </>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-bold bg-primary text-white shadow-2xs"
            >
              <Shield className="w-4 h-4" />
              <span>Admin Dashboard</span>
            </Link>
          )}

          <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-center px-3 py-2 bg-red-50 text-red-600 font-semibold text-xs rounded-md border border-red-200 hover:bg-red-100 cursor-pointer"
              >
                Sign Out ({user?.fullName})
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-3 py-2 bg-white text-slate-700 font-semibold text-xs rounded-md border border-slate-200 hover:bg-primary-soft hover:text-primary hover:border-primary transition-all duration-200"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-3 py-2 bg-primary text-white font-semibold text-xs rounded-md hover:bg-primary-hover shadow-2xs transition-all duration-200"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
