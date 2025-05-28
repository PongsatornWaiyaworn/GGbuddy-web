import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Users, MessageSquare, User, Settings, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { icon: Home, label: "หน้าแรก", path: "/" },
    { icon: Users, label: "หาเพื่อน", path: "/team-finder" },
    { icon: MessageSquare, label: "แชท", path: "/chat" },
    { icon: User, label: "โปรไฟล์", path: "/profile" },
    { icon: Settings, label: "ตั้งค่า", path: "/settings" },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className={cn(
      "bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 flex flex-col shadow-2xl",
      isCollapsed ? "w-16" : "w-64"
    )}>
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
            {isCollapsed ? <Menu size={20} /> : <X size={20} />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              className={cn(
                "w-full justify-start text-left hover:bg-gray-700 transition-colors",
                isActive && "bg-gradient-to-r from-orange-500/20 to-red-600/20 border-r-2 border-orange-500",
                isCollapsed ? "px-2" : "px-3"
              )}
              onClick={() => handleNavigation(item.path)}
              title={isCollapsed ? item.label : undefined}
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
          <div className="text-center">
            <p className="text-sm text-gray-400">GGbuddy v1.2</p>
            <p className="text-xs text-gray-500">หาเพื่อนเล่นเกมกันเลยยย!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;