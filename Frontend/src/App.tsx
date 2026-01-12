import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Contexts
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ChatProvider } from "./contexts/ChatContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { DocumentProvider } from "./contexts/DocumentContext";

// Components
import { ChatContainer } from "./components/Chat/ChatContainer";
import { DocumentManager } from "./components/Document/DocumentManager";
import { NotificationDropdown } from "./components/Notification/NotificationDropdown";

// Icons
import {
  MessageSquare,
  FileText,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Moon,
  Sun,
} from "lucide-react";

// Utils
import { cn } from "./lib/utils";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// ==================== Layout Components ====================

interface SidebarLinkProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
  badge?: number;
  onClick?: () => void;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({
  icon,
  label,
  href,
  isActive,
  badge,
  onClick,
}) => {
  return (
    <a
      href={href}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative",
        isActive
          ? "bg-blue-50 text-blue-700"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
      )}
    >
      <span className={cn(isActive ? "text-blue-600" : "text-gray-500")}>
        {icon}
      </span>
      <span className="font-medium">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[20px] h-5 flex items-center justify-center px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </a>
  );
};

// ==================== Header Component ====================

interface HeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <MessageSquare size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 hidden sm:block">
            CommHub
          </span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
          title={isDarkMode ? "Light mode" : "Dark mode"}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications */}
        <NotificationDropdown />

        {/* User menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm">
                {user?.fullName?.charAt(0) || "U"}
              </div>
            )}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
              {/* User info */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-medium text-gray-900">{user?.fullName}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>

              {/* Menu items */}
              <div className="py-2">
                <a
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  <User size={18} />
                  Profile
                </a>
                <a
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  <Settings size={18} />
                  Settings
                </a>
              </div>

              {/* Logout */}
              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-red-600 hover:bg-red-50"
                >
                  <LogOut size={18} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// ==================== Main Layout ====================

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [activePage, setActivePage] = React.useState<"chat" | "documents">(
    "chat",
  );

  // Close sidebar on mobile when clicking outside
  const handleOverlayClick = () => {
    setIsSidebarOpen(false);
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ChatProvider accessToken={token}>
      <NotificationProvider>
        <DocumentProvider>
          <div className="h-screen flex flex-col bg-gray-100">
            {/* Header */}
            <Header
              onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
              isSidebarOpen={isSidebarOpen}
            />

            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar overlay (mobile) */}
              {isSidebarOpen && (
                <div
                  className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                  onClick={handleOverlayClick}
                />
              )}

              {/* Sidebar */}
              <aside
                className={cn(
                  "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:transform-none",
                  isSidebarOpen
                    ? "translate-x-0"
                    : "-translate-x-full lg:translate-x-0",
                  "pt-16 lg:pt-0", // Account for header on mobile
                )}
              >
                <nav className="h-full flex flex-col p-4">
                  <div className="space-y-1">
                    <SidebarLink
                      icon={<MessageSquare size={20} />}
                      label="Messages"
                      href="/chat"
                      isActive={activePage === "chat"}
                      onClick={() => {
                        setActivePage("chat");
                        setIsSidebarOpen(false);
                      }}
                    />
                    <SidebarLink
                      icon={<FileText size={20} />}
                      label="Documents"
                      href="/documents"
                      isActive={activePage === "documents"}
                      onClick={() => {
                        setActivePage("documents");
                        setIsSidebarOpen(false);
                      }}
                    />
                  </div>

                  <div className="flex-1" />

                  {/* Settings link at bottom */}
                  <div className="border-t border-gray-200 pt-4">
                    <SidebarLink
                      icon={<Settings size={20} />}
                      label="Settings"
                      href="/settings"
                      isActive={false}
                    />
                  </div>
                </nav>
              </aside>

              {/* Main content */}
              <main className="flex-1 overflow-hidden">
                {activePage === "chat" ? (
                  <ChatContainer className="h-full" />
                ) : (
                  <DocumentManager className="h-full" />
                )}
              </main>
            </div>
          </div>
        </DocumentProvider>
      </NotificationProvider>
    </ChatProvider>
  );
};

// ==================== Direct Chat Layout (No Login Required) ====================

const DirectChatLayout: React.FC = () => {
  const { isLoading, token } = useAuth();
  const [activePage, setActivePage] = React.useState<"chat" | "documents">(
    "chat",
  );

  // Wait for auth to complete before rendering
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ChatProvider accessToken={token}>
      <NotificationProvider>
        <DocumentProvider>
          <div className="h-screen flex flex-col bg-gray-50">
            {/* Simple Header */}
            <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <MessageSquare size={18} className="text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">
                  Chat Module
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActivePage("chat")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    activePage === "chat"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100",
                  )}
                >
                  <MessageSquare size={16} className="inline mr-1" />
                  Chat
                </button>
                <button
                  onClick={() => setActivePage("documents")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    activePage === "documents"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100",
                  )}
                >
                  <FileText size={16} className="inline mr-1" />
                  Files
                </button>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden">
              {activePage === "chat" ? (
                <ChatContainer className="h-full" />
              ) : (
                <DocumentManager className="h-full" />
              )}
            </main>
          </div>
        </DocumentProvider>
      </NotificationProvider>
    </ChatProvider>
  );
};

// ==================== App Component (Direct Chat - No Auth Required) ====================

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Direct to chat - no login required */}
            <Route path="/*" element={<DirectChatLayout />} />
          </Routes>
        </Router>

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#fff",
              color: "#374151",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              borderRadius: "0.75rem",
              padding: "0.75rem 1rem",
            },
            success: {
              iconTheme: {
                primary: "#10B981",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#EF4444",
                secondary: "#fff",
              },
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
