import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-16 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3 text-center md:text-left">
            <Logo size={36} useImage={true} />
            <div>
              <p className="text-sm font-bold text-primary tracking-tight">
                NATIONAL ENGINEERING COLLEGE ALUMNI ASSOCIATION
              </p>
              <p className="text-xs text-slate-500 font-normal">
                K.R. Nagar, Kovilpatti - 628503, Tamil Nadu, India
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-semibold text-slate-600">
            <Link to="/dashboard" className="hover:text-primary transition-colors">
              Home
            </Link>
            <span className="text-slate-300">•</span>
            <Link to="/members" className="hover:text-primary transition-colors">
              Alumni Directory
            </Link>
            <span className="text-slate-300">•</span>
            <Link to="/explore" className="hover:text-primary transition-colors">
              Explore Stories
            </Link>
            <span className="text-slate-300">•</span>
            <Link to="/explore?focus=search" className="hover:text-primary transition-colors">
              Search
            </Link>
          </div>
        </div>

        <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} National Engineering College Alumni Portal. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-primary font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              Official Institutional Alumni Network
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
