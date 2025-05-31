import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Sidebar from "@/components/Sidebar";
import { Users, Filter } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const TeamFinder = () => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    interests: [] as string[],
    preferred_gender: 'all',
    preferred_game: '',
    group_size: '2',
    mode: 'all'
  });

  const [isMatching, setIsMatching] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 นาที = 300 วินาที
  const ws = useRef<WebSocket | null>(null);
  const username = localStorage.getItem('username');
  const Inidentifier = localStorage.getItem('identifier');
  const [ImageSrc, setImageSrc] = useState();
  const navigate = useNavigate();

  const games = [
    { id: '1', name: 'Valorant', icon: '🔫'},
    { id: '2', name: 'League of Legends', icon: '⚔️'},
    { id: '3', name: 'Dota 2', icon: '🛡️'},
    { id: '4', name: 'PUBG', icon: '🪂'},
    { id: '5', name: 'Apex Legends', icon: '🎯'},
    { id: '6', name: 'Counter-Strike 2', icon: '💣'}
  ];

  const interestOptions = [
    { id: 'relax', name: 'เล่นผ่อนคลาย' },
    { id: 'make-friends', name: 'หาเพื่อนเล่น' },
    { id: 'casual-fun', name: 'เล่นเพลินๆ' },
    { id: 'teamwork', name: 'เน้นเล่นเป็นทีม' },
    { id: 'hangout', name: 'แฮงก์เอาต์ในเกม' },
    { id: 'exploration', name: 'ชอบผจญภัย' },
    { id: 'creative', name: 'ชอบสร้างสรรค์' },
    { id: 'story-driven', name: 'อินกับเนื้อเรื่อง' },
    { id: 'competition', name: 'ท้าทายตัวเอง' },
    { id: 'events', name: 'ช่วยกันทำภารกิจ' }
  ];

  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/profile?identifier=${Inidentifier}`);
        const profileData = res.data;
        setFilters((prev) => ({
          ...prev,
          interests: profileData.interests || [],
        }));
        setImageSrc(profileData.img)

      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    if (Inidentifier) {
      fetchProfile();
    }
  }, [Inidentifier]);

  const handleValueChange = (value: string) => {
    if (value === 'custom') {
      setIsCustom(true);
      setFilters(prev => ({ ...prev, group_size: '' }));
    } else {
      setIsCustom(false);
      setCustomValue('');
      setFilters(prev => ({ ...prev, group_size: value }));
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*$/.test(val) && (val === '' || (parseInt(val) > 0 && parseInt(val) <= 100))) {
      setCustomValue(val);
      setFilters(prev => ({ ...prev, group_size: val }));
    }
  };

  const handleInterestToggle = (interestId: string) => {
    setFilters(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }));
  };

  const startMatching = () => {
    if (!selectedGame) return;
    setIsMatching(true);
    setCountdown(300);
    
    if (!username) {
      console.error('No username found in localStorage');
      return;
    }
    
    ws.current = new WebSocket(`ws://localhost:3000/ws-match?username=${username}`);

    ws.current.onopen = () => {
      console.log("WebSocket connected");
    
      const payload = {
        username: username,
        interests: filters.interests,
        preferred_gender: filters.preferred_gender,
        preferred_game: selectedGame,
        group_size: parseInt(filters.group_size),
        mode: filters.mode
      };
    
      ws.current?.send(JSON.stringify(payload));
    };
    
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("WebSocket message:", data);

      if (data.message === "Match found and group created" && data.group_id) {
        stopMatching();
        setIsMatching(false);
        setCountdown(300);
        navigate('/chat');
      }
    };    

    ws.current.onclose = () => {
      console.log("WebSocket disconnected");
      stopMatching();
    };

    ws.current.onerror = (err) => {
      console.error("WebSocket error:", err);
      stopMatching();
    };
  };

  const stopMatching = () => {
    fetch(`http://localhost:3000/matching/delete?username=${username}`, {
      method: 'DELETE'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to delete matching criteria');
      }
      return response.text();
    })
    setIsMatching(false);
    setCountdown(300);
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
  };

  // นับเวลาถอยหลัง
  useEffect(() => {
    if (!isMatching) return;

    if (countdown <= 0) {
      alert("จับคู่ไม่สำเร็จภายใน 5 นาที");
      stopMatching();
      return;
    }

    const timer = setInterval(() => {
      setCountdown(c => c - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isMatching, countdown]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleFindTeam = () => {
    startMatching();
  };

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      <Sidebar />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Users />
              หาเพื่อนเล่นเกม
            </h1>
            <p className="text-gray-300">เลือกเกมที่คุณต้องการหาเพื่อนเล่น</p>
          </div>

          {!selectedGame ? (
            /* Game Selection */
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game) => (
                <Card
                  key={game.id}
                  className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:scale-105"
                  onClick={() => setSelectedGame(game.id)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="text-5xl mb-4">{game.icon}</div>
                    <h3 className="text-xl font-semibold text-white mb-2">{game.name}</h3>
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
                      เลือกเกมนี้
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : isMatching ? (
            /* หน้าจอรอจับคู่ */
            <div className="flex flex-col items-center justify-center h-120 text-white space-y-6">
              <div className="relative flex items-center justify-center">
                <div className="loader ease-linear rounded-full border-12 border-t-12 border-gray-200 h-40 w-40 absolute animate-spin"></div>

                <img
                  src={ImageSrc}
                  alt="Profile"
                  className="rounded-full h-32 w-32 object-cover"
                />
              </div>

              <div className="text-xl font-semibold">กำลังค้นหาเพื่อนเล่น...</div>
              <div className="text-lg font-mono">{formatTime(countdown)}</div>

              <Button
                variant="destructive"
                onClick={stopMatching}
                className="bg-red-600 hover:bg-red-700"
              >
                ยกเลิกการค้นหา
              </Button>
            </div>

          ) : (
            /* Filters and Find Team */
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedGame(null)}
                    className="border-white text-black hover:bg-white hover:text-orange-900"
                  >
                      ย้อนกลับ
                  </Button>
                  <h2 className="text-2xl font-bold text-white">
                    หาเพื่อน {games.find(g => g.id === selectedGame)?.name}
                  </h2>
                </div>
              </div>

              {/* Filters */}
              <Card className="bg-white/10 backdrop-blur-lg border-white/20 mb-6">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Filter size={20} />
                    ตัวกรอง
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Interests */}
                  <div>
                    <Label className="text-white text-sm mb-3 block">ความสนใจ</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {interestOptions.map((interest) => (
                        <div key={interest.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={interest.id}
                            checked={filters.interests.includes(interest.name)}
                            onCheckedChange={() => handleInterestToggle(interest.name)}
                            className="border-gray-400"
                          />
                          <Label
                            htmlFor={interest.id}
                            className="text-white text-sm cursor-pointer"
                          >
                            {interest.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Preferred Gender */}
                    <div>
                      <label className="text-white text-sm mb-2 block">เพศที่ต้องการ</label>
                      <Select value={filters.preferred_gender} onValueChange={(value) => setFilters({...filters, preferred_gender: value})}>
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="all" className="text-white">ทุกเพศ</SelectItem>
                          <SelectItem value="male" className="text-white">ชาย</SelectItem>
                          <SelectItem value="female" className="text-white">หญิง</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Preferred Game */}
                    <div>
                      <label className="text-white text-sm mb-2 block">โหมดที่ต้องการ</label>
                      <Select value={filters.mode} onValueChange={(value) => setFilters({...filters, mode: value})}>
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                          <SelectValue placeholder="เลือกโหมด" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="all" className="text-white">อะไรก็ได้</SelectItem>
                          <SelectItem value="ranking" className="text-white">Ranking</SelectItem>
                          <SelectItem value="normal" className="text-white">ธรรมดา</SelectItem>
                          <SelectItem value="active" className="text-white">โหมดพิเศษ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Group Size */}
                    <div>
                      <label className="text-white text-sm mb-2 block">ขนาดกลุ่ม</label>
                      <Select value={isCustom ? "custom" : filters.group_size} onValueChange={handleValueChange}>
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                          <SelectValue placeholder="ขนาดกลุ่ม" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="2" className="text-white">2 คน</SelectItem>
                          <SelectItem value="3" className="text-white">3 คน</SelectItem>
                          <SelectItem value="4" className="text-white">4 คน</SelectItem>
                          <SelectItem value="5" className="text-white">5 คน</SelectItem>
                          <SelectItem value="custom" className="text-white">ระบุเอง</SelectItem>
                        </SelectContent>
                      </Select>
                      {isCustom && (
                        <input
                          type="number"
                          min={1}
                          placeholder="ระบุจำนวนคน"
                          value={customValue}
                          onChange={handleCustomInputChange}
                          className="mt-2 px-2 py-1 rounded bg-gray-700 text-white w-full"
                        />
                      )}
                    </div>

                  </div>

                  {/* Find Team Button */}
                  <div className="pt-4">
                    <Button 
                      onClick={handleFindTeam}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-lg py-3"
                    >
                      ยืนยันและค้นหาเพื่อนเล่น
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <style >{`
        .loader {
          border: 5px solid #ccc;         
          border-top-color: #4ade80;       
          border-radius: 50%;              
          width: 128px;                    
          height: 128px;                  
          animation: spin 1s linear infinite; 
          margin: auto;                   
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

    </div>
  );
};

export default TeamFinder;
