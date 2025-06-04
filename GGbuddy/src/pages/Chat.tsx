import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/Sidebar";
import { ImageIcon, Menu, MessageSquare, Send, Users } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL_SOCKET = import.meta.env.VITE_API_BASE_URL_SOCKET;

interface Message {
  id?: number;
  sender_id: string;
  content: string;
  timestamp?: string;
  isUserMessage?: boolean;
}

interface Team {
  id: string;
  name: string;
  members: string[];
  lastMessage?: string;
  messages?: Message[];
  created_at?: string;
}

interface Profile {
  img?: string;
  display_name?: string;
  age?: string;
  gender?: string;
  bio?: string;
  games?: string[];
  discord_url?: string;
  facebook_url?: string;
  line_url?: string;
  other_url?: string;
  user_id?: string;
}

const games = [
  { id: 'valorant', name: 'Valorant', icon: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Valorant_logo_-_pink_color_version.svg' },
  { id: 'lol', name: 'League of Legends', icon: 'https://static.tildacdn.com/tild6363-3366-4131-b062-323333633239/600px-League_of_Lege.png' },
  { id: 'dota2', name: 'Dota 2', icon: 'https://www.waca.or.jp/en/wp-content/uploads/2021/02/dota-2-2.png' },
  { id: 'pubg', name: 'PUBG', icon: 'https://cdn2.steamgriddb.com/icon/64c2d22899f32ccd5b3d9fca3ff04c9c/32/256x256.png' },
  { id: 'apex', name: 'Apex Legends', icon: 'https://purepng.com/public/uploads/large/apex-legends-icon-xhl.png' },
  { id: 'cs2', name: 'Counter Strike 2', icon: '/Counter-Strike_2.png' },
  { id: 'overwatch2', name: 'Overwatch 2', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Overwatch_2_logo.svg/2560px-Overwatch_2_logo.svg.png' },
  { id: 'fortnite', name: 'Fortnite', icon: 'https://static.vecteezy.com/system/resources/previews/027/127/477/non_2x/fortnite-logo-fortnite-icon-transparent-free-png.png' },
  { id: 'minecraft', name: 'Minecraft', icon: 'https://www.freeiconspng.com/uploads/minecraft-icon-19.png' },
  { id: 'rov', name: 'ROV', icon: 'https://play-lh.googleusercontent.com/UD3M7vEIbLINyar4sV70Sf8k8jxzYVQKvwKDCeHF5IeVgVfLjB1aivaSV0WdJGyZetw' },
  { id: 'honkai', name: 'Honkai: Star Rail', icon: 'https://cdn2.steamgriddb.com/icon_thumb/e52da5a31de788599378924f0e639557.png' },
  { id: 'freefire', name: 'Free Fire', icon: 'https://upload.wikimedia.org/wikipedia/en/c/c5/Logo_of_Garena_Free_Fire.png' },
  { id: 'waves', name: 'Wuthering Waves', icon: 'https://cdn2.steamgriddb.com/icon_thumb/9d435d2e017f7a7384f4e1c6a6f2d169.png' },
  { id: 'genshin', name: 'Genshin Impact', icon: 'https://cdn2.steamgriddb.com/icon/ffbab8235ddc5c0290ecd6ceccc0a61a.png' },
  { id: 'mlbb', name: 'Mobile Legends: Bang Bang', icon: 'https://upload.wikimedia.org/wikipedia/en/a/a0/Mobile_Legends_Bang_Bang_2025_logo.png' },
  { id: 'codm', name: 'Call of Duty: Mobile', icon: 'https://www.pngarts.com/files/8/Call-of-Duty-Mobile-Logo-PNG-Image.png' },
  { id: 'teamfight', name: 'Teamfight Tactics', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Teamfight_Tactics_logo.svg/2560px-Teamfight_Tactics_logo.svg.png' },
  { id: 'fo4', name: 'FIFA Online 4', icon: 'https://ssl.nexon.com/s2/game/fc/online/common/pc_app_icon.png' }
];   

const Chat = () => {
  const token = localStorage.getItem("token");
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const username = localStorage.getItem("username") || "guest";
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [memberProfiles, setMemberProfiles] = useState<{ [key: string]: Profile }>({});
  const [popupProfile, setPopupProfile] = useState(null);
  const closePopup = () => setPopupProfile(null);
  const storedTeamId = localStorage.getItem("selectedTeam")
  const [showConfirmBlock, setShowConfirmBlock] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const selectedTeamData = teams.find((team) => team.id === selectedTeam);
  const [showFullImage, setShowFullImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showFullImage_message, setShowFullImage_message] = useState(false);
  const [fullImageSrc_message, setFullImageSrc_message] = useState("");

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  function stripBase64Header(base64String: string): string {
    const parts = base64String.split(',');
    return parts.length > 1 ? parts[1] : base64String;
  }
  
  function generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const extension = originalName.substring(originalName.lastIndexOf('.') + 1);
    return `user_${timestamp}.${extension}`;
  }
  
  async function uploadImageToS3(file: File): Promise<string> {
    const reader = new FileReader();
  
    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const cleanBase64 = stripBase64Header(base64);
        const filename = generateUniqueFilename(file.name);
  
        try {
          const response = await axios.post(`${API_BASE_URL}/upload-s3`, {
            filename: filename,
            data: cleanBase64,
          }, {
            headers: {
              Authorization: `Bearer ${token}`, 
              "Content-Type": "application/json",
            },
            withCredentials: true,
          });
  
          resolve(response.data.url); 
        } catch (error) {
          reject(error);
        }
      };
  
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    try {
      const imageUrl = await uploadImageToS3(file); 

      if (selectedTeam !== null && ws && ws.readyState === WebSocket.OPEN) {
        const imageMessage = {
          group_id: selectedTeam,
          sender_id: username,
          content: imageUrl,
          type: "image",
        };
  
        ws.send(JSON.stringify(imageMessage));
  
        setTeams((prevTeams) =>
          prevTeams.map((team) =>
            team.id === selectedTeam
              ? {
                  ...team,
                  messages: [
                    ...(team.messages || []),
                    {
                      sender_id: username,
                      content: imageUrl,
                      isUserMessage: true,
                      timestamp: new Date().toISOString(),
                      type: "image",
                    },
                  ],
                  lastMessage: "[ส่งภาพ]",
                }
              : team
          )
        );
  
        scrollToBottom();
      }
    } catch (err) {
      console.error("Error uploading image:", err);
    }
  };  

  const handleViewProfile = async (username: string) => {
    if (!memberProfiles[username]) {
      try {
        const res = await fetch(`${API_BASE_URL}/profile?identifier=${username}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: 'include', 
        });
  
        if (!res.ok) {
          throw new Error('Failed to fetch profile');
        }
  
        const data = await res.json();
        setMemberProfiles(prev => ({ ...prev, [username]: data }));
        setPopupProfile(data);
      } catch (err) {
        console.error("Error fetching new profile:", err);
        toast({
          description: "เกิดข้อผิดพลาดในการโหลดโปรไฟล์",
        });
      }
    } else {
      setPopupProfile(memberProfiles[username]);
    }
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [selectedTeamData?.messages?.length]);
  
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/chats?user=${username}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch chats");
        return res.json();
      })
      .then((data: Team[]) => {
        const sortedTeams = data.sort(
          (a, b) =>
            new Date(b.created_at || "").getTime() -
            new Date(a.created_at || "").getTime()
        );
        setTeams(sortedTeams);
        if (sortedTeams.length > 0) {
          const matchedTeam = sortedTeams.find(team => team.id === storedTeamId);
          if (matchedTeam) {
            setSelectedTeam(matchedTeam.id);
          } else {
            setSelectedTeam(sortedTeams[0].id); 
          }
        }
          
      })
      .catch((err) => console.error("Error fetching chats:", err));
  }, [username]);
  
  useEffect(() => {
    if (selectedTeam === null) return;
  
    fetch(`${API_BASE_URL}/messages?group_id=${selectedTeam}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: 'include',
    })
      .then((res) => res.json())
      .then(async (messages: Message[]) => {
        setTeams((prevTeams) =>
          prevTeams.map((team) =>
            team.id === selectedTeam ? { ...team, messages } : team
          )
        );
  
        const uniqueSenderIds = Array.from(new Set(messages.map(m => m.sender_id)));
  
        const profilePromises = uniqueSenderIds.map(id =>
          fetch(`${API_BASE_URL}/profile?identifier=${id}`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: 'include',
          })
            .then(res => res.json())
            .then(data => ({ id, data }))
            .catch(() => null)
        );
  
        const profiles = await Promise.all(profilePromises);
        const profileMap: { [key: string]: Profile } = {};
        profiles.forEach(profile => {
          if (profile) {
            profileMap[profile.id] = profile.data;
          }
        });
  
        setMemberProfiles(profileMap);
        scrollToBottom();
      });
  
    const socket = new WebSocket(
      `${API_BASE_URL_SOCKET}/ws?username=${username}&group_id=${selectedTeam}`
    );
  
    socket.onopen = () => console.log("Connected to WebSocket");
  
    socket.onmessage = async (event) => {
      const receivedMessage = JSON.parse(event.data);
  
      if (!memberProfiles[receivedMessage.sender_id]) {
        try {
          const res = await fetch(`${API_BASE_URL}/profile?identifier=${receivedMessage.sender_id}`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: 'include',
          });
          const data = await res.json();
          setMemberProfiles(prev => ({ ...prev, [receivedMessage.sender_id]: data }));
        } catch (err) {
          console.error("Error fetching new profile:", err);
        }
      }
  
      setTeams((prevTeams) =>
        prevTeams.map((team) =>
          team.id === receivedMessage.group_id
            ? {
                ...team,
                messages: [
                  ...(team.messages || []),
                  {
                    sender_id: receivedMessage.sender_id,
                    content: receivedMessage.content,
                    isUserMessage: receivedMessage.sender_id === username,
                    timestamp: new Date().toISOString(),
                  },
                ],
                lastMessage: receivedMessage.message,
              }
            : team
        )
      );
    };
  
    socket.onclose = () => console.log("Disconnected from WebSocket");
    socket.onerror = (error) => console.error("WebSocket error:", error);
  
    setWs(socket);
  
    return () => {
      socket.close();
    };
  }, [selectedTeam, username, token]);  

  async function blockUser(
    blockedUsername: string,
    blockerUsername: string,
    blockedDisplayName?: string
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/block/${blockedUsername}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: 'include', 
        body: JSON.stringify({
          blocker_username: blockerUsername,
          blocked_display_name: blockedDisplayName || '',
        }),
      });
  
      if (!response.ok) {
        const text = await response.text();
        let errorMessage = 'เกิดข้อผิดพลาดในการบล็อคผู้ใช้';
        if (text) {
          try {
            const errorData = JSON.parse(text);
            errorMessage = errorData.message || errorMessage;
          } catch {
            // ไม่ใช่ JSON, ใช้ข้อความดั้งเดิม
          }
        }
        throw new Error(errorMessage);
      }
  
      toast({
        description: "บล็อคผู้ใช้สำเร็จ",
      });
    } catch (error) {
      toast({
        description: "ไม่สามารถบล็อคผู้ใช้ได้",
      });
    }
  }
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      newMessage.trim() &&
      selectedTeam !== null &&
      ws &&
      ws.readyState === WebSocket.OPEN
    ) {
      const messageData = {
        group_id: selectedTeam,
        sender_id: username,
        content: newMessage.trim(),
        type: "message",
      };
  
      ws.send(JSON.stringify(messageData));
  
      setTeams((prevTeams) =>
        prevTeams.map((team) =>
          team.id === selectedTeam
            ? {
                ...team,
                messages: [
                  ...(team.messages || []),
                  {
                    sender_id: username,
                    content: newMessage.trim(),
                    isUserMessage: true,
                    timestamp: new Date().toISOString(),
                  },
                ],
                lastMessage: newMessage.trim(),
              }
            : team
        )
      );
  
      setNewMessage("");
      scrollToBottom();
    }
  };
  
  const formatShortDateThai = (isoString: string) => {
    const date = new Date(isoString);
    return date
      .toLocaleString("th-TH", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(" ", "");
  };

  if (selectedTeam !== null && selectedTeam !== undefined) {
    localStorage.setItem('selectedTeam', selectedTeam.toString());
  }

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950">
      <Sidebar />

      <main className="flex-1 flex overflow-hidden ml-0 lg:ml-16 z-20">
        {/* ปุ่มเปิด/ปิด Sidebar สำหรับมือถือ */}
        {isSidebarOpen ? (
          <div
            className="fixed top-1/2 left-80 transform -translate-y-1/2 lg:hidden z-50"
            style={{ transition: 'left 0.3s ease' }}
          >
            <button
              className="
                bg-gray-800 text-white border border-gray-600
                rounded-r-full rounded-l-none
                h-12
                px-3
                shadow-md
                hover:bg-gray-700 hover:shadow-lg
                focus:outline-none
                transition duration-300 ease-in-out
                select-none
                flex items-center justify-center
              "
              style={{
                width: '36px',
                boxShadow: '2px 0 8px rgba(0,0,0,0.7)',
              }}
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              type="button"
            >
              &lt;
            </button>
          </div>
        ) : (
          <div
            className="fixed top-1/2 left-0 transform -translate-y-1/2 lg:hidden z-50"
            style={{ transition: 'left 0.3s ease' }}
          >
            <button
              className="
                bg-gray-800 text-white border border-gray-600
                rounded-r-full rounded-l-none
                h-12
                px-3
                shadow-md
                hover:bg-gray-700 hover:shadow-lg
                focus:outline-none
                transition duration-300 ease-in-out
                select-none
                flex items-center justify-center
              "
              style={{
                width: '36px',
                boxShadow: '-2px 0 8px rgba(0,0,0,0.7)',
              }}
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              type="button"
            >
              &gt;
            </button>
          </div>
        )}

          <div
            className={`
              h-screen w-80
              bg-gray-800/90 backdrop-blur-lg border-r border-gray-700
              flex flex-col transition-transform duration-300
              fixed z-40 top-0 left-0
              ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
              lg:static lg:translate-x-0 lg:z-auto
            `}
          >
            <div className="p-5 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
                <MessageSquare size={24} />
                ทีมของฉัน
              </h2>
            </div>

            <ScrollArea className="flex-1 overflow-y-auto hide-scrollbar">
              <div className="p-4 space-y-3">
                {teams.map((team) => {
                  const gameNameFromTeam = team.name.split("-")[0]?.trim();
                  const matchedGame = games.find((g) => g.name === gameNameFromTeam);

                  return (
                    <Card
                      key={team.id}
                      className={`w-full cursor-pointer transition-colors duration-200 border ${
                        selectedTeam === team.id
                          ? "bg-gray-700 border-gray-400"
                          : "bg-gray-900/70 hover:bg-gray-800/90 border-gray-700"
                      }`}
                      onClick={() => setSelectedTeam(team.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4 items-center">
                          <img
                            src={matchedGame?.icon || "/LOGO.png"}
                            alt="Game Icon"
                            className="w-12 h-12 rounded-md object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-gray-100 text-sm truncate max-w-[200px]">
                                {team.name}
                              </h3>
                            </div>
                            <div className="flex items-center gap-1 mt-2 text-gray-400 text-xs">
                              <Users size={14} />
                              <span>{team.members.length} คน</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
        </div>

        {/* Chat Content */}
        <div className="flex-1 flex flex-col bg-gray-900/90 backdrop-blur-lg relative max-h-[100vh]"
          style={{
            scrollbarWidth: 'none',       
            msOverflowStyle: 'none'       
          }}
        >
          {selectedTeamData ? (
            <>
              <header className="p-5 border-b border-gray-700">
                <h2 className="text-2xl font-bold text-gray-100">{selectedTeamData.name}</h2>
                <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-300">
                  <p className="text-gray-400 text-sm mt-1">
                    Members:
                  </p>
                  {selectedTeamData.members
                    .filter((username_) => username_ !== username)  
                    .map((username) => (
                      <button
                        key={username}
                        onClick={() => handleViewProfile(username)}
                        className="hover:underline text-blue-400"
                      >
                        @{username}
                      </button>
                    ))}
              </div>
              </header>

              <div
                ref={scrollAreaRef}
                className="flex-1 p-0 space-y-4 overflow-y-auto pb-0 max-h-[100vh]"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {selectedTeamData.messages && selectedTeamData.messages.length > 0 ? (
                  selectedTeamData.messages.map((message, index) => {
                    const isMyMessage = message.sender_id === username;
                    const profile = memberProfiles[message.sender_id];

                    return (
                      <div
                        key={index}
                        className={`flex px-[1vh] my-2 ${
                          isMyMessage ? "justify-end" : "justify-start"
                        }`}
                      > 
                        <div className="pt-4">
                          {!isMyMessage && (
                            <img
                              src={profile?.img || "https://ggbuddy.s3.ap-southeast-2.amazonaws.com/example.png"}
                              alt={profile?.display_name || "Unknown"}
                              className="w-12 h-12 rounded-full border-2 border-gray-700 mr-2 cursor-pointer hover:border-blue-500 hover:scale-105 hover:shadow-lg transition duration-200"
                              title={profile?.display_name || "Unknown"}
                              onClick={() => setPopupProfile(profile)}
                            />                        
                          )}
                        </div>

                        <div className="flex flex-col max-w-[70%]">
                          {!isMyMessage && (
                            <p className="text-xs font-semibold mb-1 text-gray-400 select-text">
                              {profile?.display_name || message.sender_id}
                            </p>
                          )}

                          <div
                            className={`relative p-3 rounded-xl break-words whitespace-pre-wrap shadow-md ${
                              isMyMessage
                                ? "bg-gray-600 text-gray-100 rounded-tr-none"
                                : "bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700"
                            }`}
                          >
                            {message.content.startsWith("https://ggbuddy.s3.ap-southeast-2.amazonaws.com/") ? (
                              <img
                                onClick={() => {
                                  setFullImageSrc_message(message.content);
                                  setShowFullImage_message(true);
                                }}
                                onLoad={scrollToBottom}
                                src={message.content}
                                alt="uploaded"
                                className="max-w-[20vh] max-h-[20vh] w-auto h-auto rounded-lg border border-gray-700 cursor-pointer hover:opacity-90 transition"
                              />
                            ) : (
                              <p className="text-sm leading-relaxed select-text">{message.content}</p>
                            )}

                          </div>

                          {message.timestamp && (
                            <p
                              className={`text-[10px] mt-1 select-text ${
                                isMyMessage ? "text-gray-300 self-end" : "text-gray-400"
                              }`}
                            >
                              {formatShortDateThai(message.timestamp)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-gray-500 mt-4">ยังไม่มีข้อความ</p>
                )}
              </div>

            <form
              onSubmit={handleSendMessage}
              className="bottom-0 left-0 right-0 p-[1vh] border-t border-gray-700 flex items-center gap-2 bg-gray-900/90 z-50"
            >
              <Input
                placeholder="พิมพ์ข้อความ..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="bg-gray-800 text-gray-100 border-gray-700 focus:border-gray-500"
                autoComplete="off"
                spellCheck={false}
              />
              <Button
                type="button"
                onClick={handleImageUploadClick}
                className="p-4 text-gray-100 bg-blue-600 hover:bg-blue-700 rounded"
              >
                <ImageIcon size={22} />
              </Button>

              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                ref={fileInputRef}
                className="hidden"
              />

              <Button
                type="submit"
                disabled={!newMessage.trim()}
                variant="secondary"
                className={`px-6 py-4 text-sm font-medium rounded 
                  ${newMessage.trim() ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-600 text-gray-300 cursor-not-allowed'}
                `}
              >
                <Send size={25} />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            กรุณาเลือกทีมเพื่อเริ่มแชท
          </div>
        )}
      </div>

      {popupProfile && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-60 z-40"
              onClick={closePopup}
            ></div>

            <div className="fixed z-50 top-1/2 left-1/2 w-96 max-w-full bg-gray-900 rounded-xl shadow-2xl transform -translate-x-1/2 -translate-y-1/2 p-6 text-white font-sans">
              <button
                onClick={closePopup}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition text-2xl font-bold"
                aria-label="Close popup"
              >
                &times;
              </button>

              <div className="flex items-center space-x-6 mb-5">
              <img
                src={popupProfile.img}
                alt={popupProfile.display_name || "Unknown"}
                className="w-28 h-28 rounded-full border-4 border-gray-700 object-cover cursor-pointer hover:opacity-80"
                onClick={() => setShowFullImage(true)}
              />

                <div>
                  <h2 className="text-3xl font-semibold leading-tight">
                    {popupProfile.display_name || "Unknown"}
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">{popupProfile.username}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-6 mb-5 text-gray-300">
                <div>
                  <h3 className="font-semibold text-gray-400 text-sm uppercase mb-1">อายุ</h3>
                  <p>{popupProfile.age ?? "-"}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-400 text-sm uppercase mb-1">เพศ</h3>
                  <p>{popupProfile.gender === "male"
                      ? "ชาย"
                      : popupProfile.gender === "female"
                      ? "หญิง"
                      : popupProfile.gender === "LGBTQ+"
                      ? "LGBTQ+"
                      : "-"}</p>
                </div>
                <div className="col-span-2">
                  <h3 className="font-semibold text-gray-400 text-sm uppercase mb-1">Bio</h3>
                  <p className="break-words">{popupProfile.bio || "-"}</p>
                </div>
              </div>

              {popupProfile.games && popupProfile.games.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-400 text-sm uppercase mb-2">เกมที่เล่น</h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 max-h-24 overflow-auto pr-2">
                    {popupProfile.games.map((game, i) => (
                      <li key={i}>{game}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-3 justify-center mb-6">
                {popupProfile.discord_url && (
                  <a
                    href={popupProfile.discord_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-full text-white text-sm font-medium hover:bg-indigo-700 transition"
                  >
                    <img
                    src="https://static-00.iconduck.com/assets.00/discord-icon-1024x724-lsqch8rr.png"
                    alt="Discord Logo"
                    className="h-5 w-5"
                    style={{ objectFit: "contain" }}
                    />
                    Discord
                  </a>
                )}
                {popupProfile.facebook_url && (
                  <a
                    href={popupProfile.facebook_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-full text-white text-sm font-medium hover:bg-blue-700 transition"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M22 12c0-5.5-4.5-10-10-10S2 6.5 2 12c0 4.9 3.6 8.9 8.3 9.8v-6.9H8v-2.9h2.3v-2.2c0-2.3 1.4-3.6 3.5-3.6 1 0 1.9.1 1.9.1v2.1h-1c-1 0-1.3.6-1.3 1.2v1.4h2.4l-.4 2.9h-2v6.9C18.4 20.9 22 16.9 22 12z" />
                    </svg>
                    Facebook
                  </a>
                )}
                {popupProfile.line_url && (
                  <a
                    href={popupProfile.line_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 rounded-full text-white text-sm font-medium hover:bg-green-700 transition"
                  >
                    <img
                      src="https://www.svgrepo.com/show/81685/line-logo.svg"
                      alt="Line Logo"
                      className="h-5 w-5"
                      style={{ objectFit: "contain" }}
                    />
                    LINE
                  </a>
                )}
                {popupProfile.other_url && (
                  <a
                    href={popupProfile.other_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 rounded-full text-white text-sm font-medium hover:bg-gray-700 transition"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M10.59 13.41a2 2 0 0 1 0-2.83l3.54-3.54a2 2 0 0 1 2.83 2.83l-1.47 1.47-1.06-1.06 1.47-1.47a1 1 0 0 0-1.41-1.41l-3.54 3.54a1 1 0 0 0 1.41 1.41l1.06 1.06-1.47 1.47a2 2 0 0 1-2.83 0zM7.05 16.95a2 2 0 0 1 0-2.83l1.47-1.47 1.06 1.06-1.47 1.47a1 1 0 0 0 1.41 1.41l3.54-3.54a1 1 0 0 0-1.41-1.41l-1.06-1.06 1.47-1.47a2 2 0 0 1 2.83 0z" />
                    </svg>
                    Other
                  </a>
                )}
              </div>

              <button
                onClick={() => setShowConfirmBlock(true)}
                className="w-full bg-red-600 hover:bg-red-700 transition rounded-lg py-3 font-semibold text-lg shadow-lg"
              >
                บล็อคผู้ใช้
              </button>
            </div>
          </>
        )}

        {showConfirmBlock && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
            <div className="bg-gray-800 text-white rounded-xl p-6 w-80 shadow-xl">
              <h2 className="text-xl font-semibold mb-4">ยืนยันการบล็อค</h2>
              <p className="mb-6">คุณแน่ใจหรือไม่ว่าต้องการบล็อค <strong>{popupProfile.display_name}</strong>?</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmBlock(false)}
                  className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => {
                    blockUser(popupProfile.username, username, popupProfile.display_name);
                    setShowConfirmBlock(false);
                    closePopup();
                  }}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition"
                >
                  บล็อค
                </button>
              </div>
            </div>
          </div>
        )}

        {showFullImage && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center"
              onClick={() => setShowFullImage(false)}
            >
              <img
                src={popupProfile.img}
                alt="Full Profile"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </>
        )}
        {showFullImage_message && fullImageSrc_message && (
          <div
            className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center"
            onClick={() => setShowFullImage_message(false)}
          >
            <img
              src={fullImageSrc_message}
              alt="Full View"
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          </div>
        )}

      </main>
    </div>
  );
};

export default Chat;