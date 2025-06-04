import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [sockets, setSockets] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const API_BASE_URL_SOCKET = import.meta.env.VITE_API_BASE_URL_SOCKET;

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname !== "/chat") {
      localStorage.setItem("selectedTeam", null);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!username || !token) return;
  
    fetch(`${API_BASE_URL}/blocked-list/${username}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        const blockedUsernames = data.map(entry => entry.BlockedUsername);
        setBlockedUsers(blockedUsernames);
      })
      .catch(err => console.error("โหลดข้อมูลผู้ใช้ที่ถูกบล็อกล้มเหลว", err));
  }, [username]);  

  useEffect(() => {
    if (!username || !token) return;
  
    let wsList = [];
  
    const connectSockets = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/chats?user=${username}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
  
        const chatGroups = await res.json();
  
        chatGroups.forEach((group) => {
          const ws = new WebSocket(`${API_BASE_URL_SOCKET}/ws?username=${username}&group_id=${group.id}`);
  
          ws.onopen = () => {
            console.log(`Connected to WebSocket for group ${group.name}`);
          };
  
          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              const selectedTeam = localStorage.getItem("selectedTeam");
              if (data.group_id && data.content && data.sender_id !== username && data.group_id !== selectedTeam && !blockedUsers.includes(data.sender_id)) {
                const audio = new Audio("/level-up-191997.mp3");
                audio.play();
  
                toast.custom((t) => (
                  <div
                    className="bg-white border shadow-lg rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-all w-[300px]"
                    onClick={() => {
                      toast.dismiss(t.id);
                      localStorage.setItem("selectedTeam", data.group_id);
                      navigate("/chat");
                      window.location.reload();
                    }}
                  >
                    <div className="font-semibold text-sm text-gray-800">
                      ข้อความใหม่จาก <span className="text-blue-600">{data.sender_id}</span> ใน {group.name}
                    </div>
                    <div className="text-gray-600 text-sm mt-1">{data.content}</div>
                  </div>
                ), { 
                  duration: 3000,
                  position: "top-right"
                });
              }
            } catch (err) {
              console.error("Error parsing notification message", err);
            }
          };
  
          ws.onerror = (err) => {
            console.error(`WebSocket error for group ${group.name}`, err);
          };
  
          ws.onclose = () => {
            console.log(`WebSocket disconnected for group ${group.name}`);
          };
  
          wsList.push(ws);
        });
  
        setSockets(wsList);
      } catch (err) {
        console.error("Error fetching chat groups or connecting to WebSockets", err);
      }
    };
  
    connectSockets();
  
    return () => {
      wsList.forEach(ws => ws.close());
      wsList = [];
    };
  }, [username, token]);  

  return (
    <NotificationContext.Provider value={{}}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
