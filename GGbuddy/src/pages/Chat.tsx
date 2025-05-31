import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/Sidebar";
import { MessageSquare, Send, Users } from "lucide-react";

interface Message {
  id?: number;
  sender_id: string;
  content: string;
  timestamp?: string;
  isUserMessage?: boolean;
}

interface Team {
  id: number;
  name: string;
  game: string;
  members: string[];
  lastMessage?: string;
  unread?: number;
  messages?: Message[];
  created_at?: string;
}

interface Profile {
  img?: string;
  display_name?: string;
  age?: number;
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
  { id: '1', name: 'Valorant', icon: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Valorant_logo_-_pink_color_version.svg'},
  { id: '2', name: 'League of Legends', icon: 'https://static.tildacdn.com/tild6363-3366-4131-b062-323333633239/600px-League_of_Lege.png'},
  { id: '3', name: 'Dota 2', icon: 'https://www.waca.or.jp/en/wp-content/uploads/2021/02/dota-2-2.png'},
  { id: '4', name: 'PUBG', icon: 'https://cdn2.steamgriddb.com/icon/64c2d22899f32ccd5b3d9fca3ff04c9c/32/256x256.png'},
  { id: '5', name: 'Apex Legends', icon: 'https://www.pngall.com/wp-content/uploads/13/Apex-Legends-Logo-PNG-Images.png'},
  { id: '6', name: 'Counter Strike 2', icon: 'https://img.icons8.com/?size=512&id=x2J66ADPo3VZ&format=png'}
];

const Chat = () => {
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const username = localStorage.getItem("username") || "guest";
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [memberProfiles, setMemberProfiles] = useState<{ [key: string]: Profile }>({});
  const [popupProfile, setPopupProfile] = useState(null);
  const closePopup = () => setPopupProfile(null);
  const [showConfirmBlock, setShowConfirmBlock] = useState(false);

  const handleViewProfile = async (username: string) => {
    if (!memberProfiles[username]) {
      try {
        const res = await fetch(`http://localhost:3000/profile?identifier=${username}`);
        const data = await res.json();
        setMemberProfiles(prev => ({ ...prev, [username]: data }));
        setPopupProfile(data);
      } catch (err) {
        console.error("Error fetching new profile:", err);
        alert("เกิดข้อผิดพลาดในการโหลดโปรไฟล์");
      }
    } else {
      setPopupProfile(memberProfiles[username]);
    }
  };
  

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      setTimeout(() => {
        scrollAreaRef.current!.scrollTop = scrollAreaRef.current!.scrollHeight;
      }, 100);
    }
  };

  useEffect(() => {
    fetch(`http://localhost:3000/api/chats?user=${username}`)
      .then((res) => res.json())
      .then((data: Team[]) => {
        const sortedTeams = data.sort(
          (a, b) =>
            new Date(b.created_at || "").getTime() -
            new Date(a.created_at || "").getTime()
        );
        setTeams(sortedTeams);
        if (sortedTeams.length > 0) {
          setSelectedTeam(sortedTeams[0].id);
        }
      })
      .catch((err) => console.error("Error fetching chats:", err));
  }, [username]);

  useEffect(() => {
    if (selectedTeam === null) return;

    fetch(`http://localhost:3000/messages?group_id=${selectedTeam}`)
      .then((res) => res.json())
      .then(async (messages: Message[]) => {
        setTeams((prevTeams) =>
          prevTeams.map((team) =>
            team.id === selectedTeam ? { ...team, messages } : team
          )
        );
      
        const uniqueSenderIds = Array.from(new Set(messages.map(m => m.sender_id)));
      
        const profilePromises = uniqueSenderIds.map(id =>
          fetch(`http://localhost:3000/profile?identifier=${id}`)
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
      })

    const socket = new WebSocket(
      `ws://localhost:3000/ws?username=${username}&group_id=${selectedTeam}`
    );

    socket.onopen = () => console.log("Connected to WebSocket");
    socket.onmessage = async (event) => {
      const receivedMessage = JSON.parse(event.data);
    
      if (!memberProfiles[receivedMessage.username]) {
        try {
          const res = await fetch(`http://localhost:3000/profile?identifier=${receivedMessage.username}`);
          const data = await res.json();
          setMemberProfiles(prev => ({ ...prev, [receivedMessage.username]: data }));
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
                    sender_id: receivedMessage.username,
                    content: receivedMessage.content,
                    isUserMessage: receivedMessage.username === username,
                    timestamp: new Date().toISOString(),
                  },
                ],
                lastMessage: receivedMessage.message,
              }
            : team
        )
      );
      scrollToBottom();
    };
    socket.onclose = () => console.log("Disconnected from WebSocket");
    socket.onerror = (error) => console.error("WebSocket error:", error);

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [selectedTeam, username]);

  async function blockUser(
    blockedUsername: string,
    blockerUsername: string,
    blockedDisplayName?: string
  ): Promise<void> {
    try {
      const response = await fetch(`http://localhost:3000/block/${blockedUsername}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
  
      alert('บล็อคผู้ใช้เรียบร้อยแล้ว');
    } catch (error) {
      alert('ไม่สามารถบล็อคผู้ใช้ได้: ' + (error.message || error));
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

  const selectedTeamData = teams.find((team) => team.id === selectedTeam);

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950">
      <Sidebar />

      <main className="flex-1 flex overflow-hidden ml-0 lg:ml-16 z-20">
        {/* Sidebar: Teams */}
        <div className="w-80 bg-gray-800/90 backdrop-blur-lg border-r border-gray-700 flex flex-col">
          <div className="p-5 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
              <MessageSquare size={24} />
              ทีมของฉัน
            </h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
            {teams.map((team) => {
              const gameNameFromTeam = team.name.split("-")[0]?.trim();
              const matchedGame = games.find(g => g.name === gameNameFromTeam);

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
                        src={matchedGame?.icon || "/default-icon.png"}
                        alt="Game Icon"
                        className="w-12 h-12 rounded-md object-cover"
                      />

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-100 text-sm truncate max-w-[70%]">
                            {team.name}
                          </h3>
                          {team.unread && team.unread > 0 && (
                            <Badge className="bg-gray-400 text-gray-900 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
                              {team.unread}
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-400 text-xs mb-1 truncate">{team.game}</p>
                        {/* <p
                          className="text-gray-300 text-xs truncate"
                          title={team.lastMessage || ""}
                        >
                          {team.lastMessage || "ยังไม่มีข้อความ"}
                        </p> */}
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

              <ScrollArea
                ref={scrollAreaRef}
                className="flex-1 p-6 space-y-4 overflow-y-auto pb-0 max-h-[80vh]" 
                style={{
                  scrollbarWidth: 'none',       
                  msOverflowStyle: 'none'       
                }}
              >
                {selectedTeamData.messages && selectedTeamData.messages.length > 0 ? (
                  selectedTeamData.messages.map((message, index) => {
                    const isMyMessage = message.sender_id === username;
                    const profile = memberProfiles[message.sender_id];

                    return (
                      <div
                        key={index}
                        className={`flex items-center px-4 my-2 ${
                          isMyMessage ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!isMyMessage && (
                          <img
                            src={profile?.img}
                            alt={profile?.display_name || "Unknown"}
                            className="w-12 h-12 rounded-full border-2 border-gray-700 mr-2"
                            title={profile?.display_name || "Unknown"}
                            onClick={() => setPopupProfile(profile)}
                          />
                        )}

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
                            <p className="text-sm leading-relaxed select-text">{message.content}</p>
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

              </ScrollArea>

            {/* ช่องส่งข้อความ fixed bottom */}
            <form
              onSubmit={handleSendMessage}
              className="fixed bottom-0 left-0 right-0 p-4 border-t border-gray-700 flex items-center gap-2 bg-gray-900/90 z-50"
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
                type="submit"
                disabled={!newMessage.trim()}
                variant="secondary"
                className="p-2"
              >
                <Send size={20} />
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
            {/* Background overlay */}
            <div
              className="fixed inset-0 bg-black bg-opacity-60 z-40"
              onClick={closePopup}
            ></div>

            {/* Popup container */}
            <div className="fixed z-50 top-1/2 left-1/2 w-96 max-w-full bg-gray-900 rounded-xl shadow-2xl transform -translate-x-1/2 -translate-y-1/2 p-6 text-white font-sans">
              {/* Close button */}
              <button
                onClick={closePopup}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition text-2xl font-bold"
                aria-label="Close popup"
              >
                &times;
              </button>

              {/* Profile header */}
              <div className="flex items-center space-x-6 mb-5">
                <img
                  src={popupProfile.img}
                  alt={popupProfile.display_name || "Unknown"}
                  className="w-28 h-28 rounded-full border-4 border-gray-700 object-cover"
                />
                <div>
                  <h2 className="text-3xl font-semibold leading-tight">
                    {popupProfile.display_name || "Unknown"}
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">{popupProfile.username}</p>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-y-3 gap-x-6 mb-5 text-gray-300">
                <div>
                  <h3 className="font-semibold text-gray-400 text-sm uppercase mb-1">อายุ</h3>
                  <p>{popupProfile.age ?? "-"}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-400 text-sm uppercase mb-1">เพศ</h3>
                  <p>{popupProfile.gender || "-"}</p>
                </div>
                <div className="col-span-2">
                  <h3 className="font-semibold text-gray-400 text-sm uppercase mb-1">Bio</h3>
                  <p className="break-words">{popupProfile.bio || "-"}</p>
                </div>
              </div>

              {/* Games */}
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

              {/* Social links */}
              <div className="flex flex-wrap gap-3 justify-center mb-6">
                {popupProfile.discord_url && (
                  <a
                    href={popupProfile.discord_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-full text-white text-sm font-medium hover:bg-indigo-700 transition"
                  >
                    {/* Discord icon SVG */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20 0H4C1.8 0 0 1.8 0 4v16c0 2.2 1.8 4 4 4h12l-1.1-3.4 2.7 2.7 3.4-3.4-2.7-2.7L24 20V4c0-2.2-1.8-4-4-4z" />
                    </svg>
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
                    {/* Facebook icon SVG */}
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
                    {/* Line icon SVG (simple chat bubble) */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M4 2a2 2 0 0 0-2 2v16l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4z" />
                    </svg>
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
                    {/* Link icon SVG */}
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

              {/* Block button */}
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

      </main>
    </div>
  );
};

export default Chat;