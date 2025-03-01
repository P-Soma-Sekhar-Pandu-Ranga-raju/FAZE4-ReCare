import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ActivitySquare, LogOut, User, Settings, FileText, Upload, LayoutDashboard } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-cyan-50">
      <header className="sticky top-0 z-50 w-full border-b border-blue-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <ActivitySquare className="h-6 w-6 text-blue-500" />
              <span className="font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                ReCare
              </span>
            </Link>
            <nav className="hidden md:flex items-center ml-8 space-x-6">
              <Link 
                to="/dashboard" 
                className="text-sm font-medium text-slate-700 hover:text-blue-700"
              >
                Dashboard
              </Link>
              <Link 
                to="/upload" 
                className="text-sm font-medium text-slate-700 hover:text-blue-700"
              >
                Upload
              </Link>
              <Link 
                to="/results" 
                className="text-sm font-medium text-slate-700 hover:text-blue-700"
              >
                Results
              </Link>
            </nav>
          </div>
          <div className="relative">
            <button
              className="flex items-center space-x-2 rounded-full border border-blue-100 bg-white p-1.5 hover:bg-blue-50"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            >
              <div className="h-7 w-7 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center text-white text-xs font-medium">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            </button>
            
            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md border border-blue-100 bg-white py-1 shadow-lg">
                <div className="border-b border-blue-100 px-4 py-2">
                  <p className="text-sm font-medium text-slate-900">
                    {user?.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {user?.email}
                  </p>
                </div>
                <Link
                  to="/profile"
                  className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-blue-50"
                  onClick={() => setProfileMenuOpen(false)}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-blue-50"
                  onClick={() => setProfileMenuOpen(false)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
                <button
                  className="flex w-full items-center px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <div className="flex flex-1">
        <aside className="hidden md:flex w-64 flex-col border-r border-blue-100 bg-white">
          <div className="flex flex-col gap-1 p-4">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700"
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </Link>
            <Link
              to="/upload"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700"
            >
              <Upload className="h-5 w-5" />
              Upload Documents
            </Link>
            <Link
              to="/results"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700"
            >
              <FileText className="h-5 w-5" />
              View Results
            </Link>
          </div>
        </aside>
        
        <main className="flex-1">
          {children}
        </main>
      </div>
      
      <footer className="border-t border-blue-100 bg-white py-4">
        <div className="container mx-auto px-4 text-center text-sm text-slate-500">
          © 2024 ReCare. All rights reserved.
        </div>
      </footer>
    </div>
  );
}