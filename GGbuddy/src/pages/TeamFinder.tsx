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
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL_SOCKET = import.meta.env.VITE_API_BASE_URL_SOCKET;

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
  const Gender = localStorage.getItem('gender');
  const [ImageSrc, setImageSrc] = useState();
  const navigate = useNavigate();

  const games = [
    { id: 'valorant', name: 'Valorant', icon: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Valorant_logo_-_pink_color_version.svg' },
    { id: 'lol', name: 'League of Legends', icon: 'https://static.tildacdn.com/tild6363-3366-4131-b062-323333633239/600px-League_of_Lege.png' },
    { id: 'dota2', name: 'Dota 2', icon: 'https://www.waca.or.jp/en/wp-content/uploads/2021/02/dota-2-2.png' },
    { id: 'pubg', name: 'PUBG', icon: 'https://cdn2.steamgriddb.com/icon/64c2d22899f32ccd5b3d9fca3ff04c9c/32/256x256.png' },
    { id: 'apex', name: 'Apex Legends', icon: 'https://purepng.com/public/uploads/large/apex-legends-icon-xhl.png' },
    { id: 'cs2', name: 'Counter Strike 2', icon: 'https://portal.buff.game/static/b80d2ca8d74377ef1d4a34ac59cc3497/dacb9/the-confusion-about-cs2s-new-log.jpg' },
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
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/profile?identifier=${Inidentifier}`,
          {
            headers: {
              Authorization: `Bearer ${token}`, 
              "Content-Type": "application/json",
            },
            withCredentials: true,
          }
        );
  
        const profileData = res.data;
        setFilters((prev) => ({
          ...prev,
          interests: profileData.interests || [],
        }));
        setImageSrc(profileData.img);
  
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
    
    ws.current = new WebSocket(`${API_BASE_URL_SOCKET}/ws-match?username=${username}`);

    ws.current.onopen = () => {
      console.log("WebSocket connected");
      const game = games.find(g => g.id === selectedGame);
    
      const payload = {
        username: username,
        interests: filters.interests,
        gender: Gender,
        preferred_gender: filters.preferred_gender,
        preferred_game: game.name,
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
    fetch(`${API_BASE_URL}/matching/delete?username=${username}`, {
      method: 'DELETE', 
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: 'include', 
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to delete matching criteria');
      }
      return response.text();
    })
    .then(() => {
      setIsMatching(false);
      setCountdown(300);
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    })
    .catch(error => {
      console.error(error);
    });
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
                    <div className="flex justify-center items-center mb-4 h-20">
                      <img
                        src={game.icon}
                        alt={game.name}
                        className="w-24 h-24 object-contain"
                      />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{game.name}</h3>
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
                      เลือกเกมนี้
                    </Button>
                  </CardContent>

                </Card>
              ))}
            </div>
          ) : isMatching ? (
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
                          <SelectItem value="lgbtq+" className="text-white">LQBTQ+</SelectItem>
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
