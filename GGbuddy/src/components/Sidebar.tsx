import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  MessageSquare,
  User,
  Settings,
  ChevronLeft,
  Menu,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "../AuthContext";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
  };

  const handleLogoutConfirm = () => {
    logout();
    localStorage.removeItem("token");
    navigate("/");
    setShowLogoutConfirm(false);
  };

  return (
    <div
      className={cn(
        "bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 flex flex-col shadow-2xl",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
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

      {/* Navigation */}
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
                disabled ? "opacity-50 cursor-not-allowed hover:bg-transparent" : ""
              )}
              onClick={() => handleNavigation(item.path)}
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
            <>
              <Button
                variant="ghost"
                className="w-full justify-center text-left hover:bg-red-700 text-red-400 border border-red-400"
                onClick={() => setShowLogoutConfirm(true)}
              >
                <LogOut size={20} className="mr-2" />
                ออกจากระบบ
              </Button>

              {/* ยืนยันการ logout */}
              {showLogoutConfirm && (
                <div className="mt-4 p-3 rounded bg-gray-700 text-sm space-y-2">
                  <p>คุณต้องการออกจากระบบจริงหรือไม่?</p>
                  <div className="flex justify-end space-x-2">
                    <Button
                      size="sm"
                      className="bg-red-500 hover:bg-red-600 text-white"
                      onClick={handleLogoutConfirm}
                    >
                      ใช่, ออกเลย
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowLogoutConfirm(false)}
                    >
                      ยกเลิก
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;