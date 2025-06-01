import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Home,
  Users,
  MessageSquare,
  User,
  Settings,
  Menu,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "../AuthContext";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuth();

  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        if (!isCollapsed) {
          setIsCollapsed(true);
        }
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCollapsed, isMobileMenuOpen]);

  const menuItems = [
    { icon: Home, label: "หน้าแรก", path: "/" },
    { icon: Users, label: "หาเพื่อน", path: "/team-finder" },
    { icon: MessageSquare, label: "แชท", path: "/chat" },
    { icon: User, label: "โปรไฟล์", path: "/profile" },
    { icon: Settings, label: "ตั้งค่า", path: "/settings" },
  ];

  const handleNavigation = (path: string) => {
    if (!isLoggedIn && path !== "/") return;
    navigate(path);
    setIsCollapsed(true);
  };  

  const confirmLogout = () => {
    logout();
    navigate("/");
    setShowConfirmLogout(false);
  };

  const cancelLogout = () => {
    setShowConfirmLogout(false);
  };

  return (
    <>
      <div className="lg:hidden fixed top-4 left-4 z-[99]">
        <Button
          variant="ghost"
          className="text-white bg-black/50 hover:bg-black"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu size={24} />
        </Button>
      </div>

      <div
        ref={sidebarRef} 
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
        className={cn(
          "fixed top-0 left-0 h-full z-[9999] bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-2xl transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
          "hidden lg:flex flex-col"
        )}
      >
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center space-x-2">
                <img
                  src="/public/LOGO GGbuddy.png"
                  alt="GGbuddy Logo"
                  className="h-8 w-auto"
                />
                <span className="text-lg font-bold">GGbuddy</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-white hover:bg-gray-700"
            >
              {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
            </Button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const disabled = !isLoggedIn && item.path !== "/";

            return (
              <Button
                key={item.path}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left hover:bg-gray-700 transition-colors",
                  isActive &&
                    "bg-gradient-to-r from-orange-500/20 to-red-600/20 border-r-2 border-orange-500",
                  isCollapsed ? "px-2" : "px-3",
                  disabled
                    ? "opacity-50 cursor-not-allowed hover:bg-transparent"
                    : ""
                )}
                onClick={() => handleNavigation(item.path) }
                title={isCollapsed ? item.label : undefined}
                disabled={disabled}
              >
                <Icon size={20} className={cn(isCollapsed ? "mx-auto" : "mr-3")} />
                {!isCollapsed && <span>{item.label}</span>}
              </Button>
            );
          })}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-700">
            <div className="text-center mb-3">
              <p className="text-sm text-gray-400">GGbuddy v1.2</p>
              <p className="text-xs text-gray-500">หาเพื่อนเล่นเกมกันเลยยย!</p>
            </div>
            {isLoggedIn && (
              <Button
                variant="ghost"
                className="w-full justify-center text-left hover:bg-red-700 text-red-400 border border-red-400"
                onClick={() => setShowConfirmLogout(true)}
              >
                <LogOut size={20} className="mr-2" />
                ออกจากระบบ
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[9999] lg:hidden">
          <div
            className="absolute inset-0 bg-black bg-opacity-60"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div
            ref={sidebarRef} // <-- ใส่ ref ที่ mobile sidebar ด้วย
            className="absolute left-0 top-0 bottom-0 w-64 bg-gray-900 shadow-xl p-4"
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-bold text-white">GGbuddy</span>
              <Button
                variant="ghost"
                size="icon"
                className="text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <ChevronLeft />
              </Button>
            </div>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const disabled = !isLoggedIn && item.path !== "/";

              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-left text-white hover:bg-gray-700 transition-colors",
                    isActive && "bg-orange-700",
                    disabled &&
                      "opacity-50 cursor-not-allowed hover:bg-transparent"
                  )}
                  onClick={() => {
                    handleNavigation(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                  disabled={disabled}
                >
                  <Icon size={20} className="mr-3" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
            {isLoggedIn && (
              <div className="mt-6 border-t border-gray-600 pt-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-400 hover:bg-red-700"
                  onClick={() => {
                    setShowConfirmLogout(true);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <LogOut size={20} className="mr-3" />
                  ออกจากระบบ
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {showConfirmLogout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999]">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-gray-900">
            <h2 className="text-lg font-semibold mb-4">ยืนยันการออกจากระบบ</h2>
            <p className="mb-6">คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?</p>
            <div className="flex justify-end gap-3">
              <Button
                onClick={cancelLogout}
                className="bg-gray-300 text-gray-700 hover:bg-gray-400"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={confirmLogout}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                ออกจากระบบ
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;