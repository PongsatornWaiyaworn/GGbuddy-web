import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  members: number;
  lastMessage?: string;
  unread?: number;
  messages?: Message[];
  created_at?: string;
}

const Chat = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [username] = useState("user02");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      setTimeout(() => {
        scrollAreaRef.current!.scrollTop = scrollAreaRef.current!.scrollHeight;
      }, 100);
    }
  };

  useEffect(() => {
    // Fetch teams (chats) from API
    fetch(`http://localhost:8080/api/chats?user=${username}`)
      .then((res) => res.json())
      .then((data) => {
        const sortedTeams = data.sort((a: Team, b: Team) => 
          new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
        
        setTeams(sortedTeams);
        
        if (sortedTeams.length > 0) {
          setSelectedTeam(sortedTeams[0].id);
        }
      })
      .catch((err) => console.error("Error fetching chats:", err));
  }, [username]);

  useEffect(() => {
    if (selectedTeam) {
      // Fetch messages for selected team
      fetch(`http://localhost:8080/messages?group_id=${selectedTeam}`)
        .then((res) => res.json())
        .then((messages) => {
          setTeams(prevTeams => 
            prevTeams.map(team => 
              team.id === selectedTeam 
                ? { ...team, messages } 
                : team
            )
          );
          scrollToBottom();
        })
        .catch((err) => console.error("Error fetching messages:", err));

      // Setup WebSocket connection
      const socket = new WebSocket(`ws://localhost:8080/ws?username=${username}&group_id=${selectedTeam}`);

      socket.onopen = () => console.log("Connected to WebSocket");

      socket.onmessage = (event) => {
        const receivedMessage = JSON.parse(event.data);
        
        setTeams(prevTeams => 
          prevTeams.map(team => 
            team.id === receivedMessage.group_id
              ? {
                  ...team,
                  messages: [
                    ...(team.messages || []),
                    { 
                      sender_id: receivedMessage.username, 
                      content: receivedMessage.message,
                      isUserMessage: receivedMessage.username === username
                    }
                  ],
                  lastMessage: receivedMessage.message
                }
              : team
          )
        );
        
        scrollToBottom();
      };

      socket.onclose = () => console.log("Disconnected from WebSocket");
      socket.onerror = (error) => console.error("WebSocket error:", error);

      setWs(socket);
      return () => socket.close();
    }
  }, [selectedTeam, username]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && selectedTeam && ws && ws.readyState === WebSocket.OPEN) {
      const messageData = {
        group_id: selectedTeam,
        sender_id: username,
        content: newMessage.trim(),
        type: "message"
      };

      ws.send(JSON.stringify(messageData));

      // Update local state optimistically
      setTeams(prevTeams => 
        prevTeams.map(team => 
          team.id === selectedTeam
            ? {
                ...team,
                messages: [
                  ...(team.messages || []),
                  { 
                    sender_id: username, 
                    content: newMessage.trim(),
                    isUserMessage: true,
                    timestamp: new Date().toISOString()
                  }
                ],
                lastMessage: newMessage.trim()
              }
            : team
        )
      );

      setNewMessage('');
      scrollToBottom();
    }
  };

  const formatShortDateThai = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).replace(" ", "");
  };

  const selectedTeamData = teams.find(team => team.id === selectedTeam);

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-700 via-gray-700 to-gray-700">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden flex">
        {/* Teams List */}
        <div className="w-80 bg-gray-900/80 backdrop-blur-lg border-r border-gray-700/50 flex flex-col">
          <div className="p-4 border-b border-gray-800/50">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MessageSquare />
              ทีมของฉัน
            </h2>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {teams.map((team) => (
                <Card
                  key={team.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedTeam === team.id
                      ? 'bg-gradient-to-r from-gray-600/30 to-gray-800/30 border-gray-500/50'
                      : 'bg-gray-950/50 hover:bg-gray-900/60 border-gray-800/30'
                  }`}
                  onClick={() => setSelectedTeam(team.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-white text-sm">{team.name}</h3>
                      {team.unread && team.unread > 0 && (
                        <Badge className="bg-orange-500 text-white h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {team.unread}
                        </Badge>
                      )}
                    </div>
                    <p className="text-orange-300 text-xs mb-1">{team.game}</p>
                    <p className="text-orange-200 text-xs truncate">{team.lastMessage || "No messages yet"}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Users size={12} className="text-orange-300" />
                      <span className="text-orange-300 text-xs">{team.members} สมาชิก</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedTeamData ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-orange-950/80 backdrop-blur-lg border-b border-orange-800/50">
                <h2 className="text-xl font-bold text-white">{selectedTeamData.name}</h2>
                <p className="text-orange-200 text-sm">{selectedTeamData.game} • {selectedTeamData.members} สมาชิก</p>
              </div>

              {/* Messages */}
              <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
                <div className="space-y-4">
                  {selectedTeamData.messages?.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.isUserMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.isUserMessage
                            ? 'bg-gradient-to-r from-orange-500 to-orange-700 text-white'
                            : 'bg-orange-950/70 text-white border border-orange-800/50'
                        }`}
                      >
                        {!message.isUserMessage && (
                          <p className="text-xs font-semibold mb-1 text-orange-300">{message.sender_id}</p>
                        )}
                        <p className="text-sm">{message.content}</p>
                        {message.timestamp && (
                          <p className={`text-xs mt-1 ${message.isUserMessage ? 'text-orange-200' : 'text-orange-300/80'}`}>
                            {formatShortDateThai(message.timestamp)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 bg-orange-950/80 backdrop-blur-lg border-t border-orange-800/50">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="พิมพ์ข้อความ..."
                    className="flex-1 bg-orange-900/50 border-orange-800/50 text-white placeholder-orange-300/70"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  >
                    <Send size={16} />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare size={64} className="text-orange-300/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">เลือกทีมเพื่อเริ่มแชท</h3>
                <p className="text-orange-200/70">เลือกทีมจากรายการทางซ้ายเพื่อเริ่มสนทนา</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Chat;