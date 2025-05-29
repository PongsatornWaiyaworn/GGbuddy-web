import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Sidebar from "@/components/Sidebar";
import { Users, Filter } from "lucide-react";

const TeamFinder = () => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    interests: [] as string[],
    preferred_gender: 'all',
    preferred_game: '',
    group_size: 'all'
  });

  const games = [
    { id: '1', name: 'Valorant', icon: '🔫'},
    { id: '2', name: 'League of Legends', icon: '⚔️'},
    { id: '3', name: 'Dota 2', icon: '🛡️'},
    { id: '4', name: 'PUBG', icon: '🪂'},
    { id: '5', name: 'Apex Legends', icon: '🎯'},
    { id: '6', name: 'Counter-Strike 2', icon: '💣'}
  ];

  const interestOptions = [
    { id: '1', name: 'เล่นชิวๆ' },
    { id: '2', name: 'จริงจัง' },
    { id: '3', name: 'แข่งขัน' },
  ];

  const handleInterestToggle = (interestId: string) => {
    setFilters(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }));
  };

  const handleFindTeam = () => {
    console.log('Finding team:', filters);
    // Placeholder for search logic
    alert('กำลังค้นหา... (placeholder)');
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
          ) : (
            /* Filters and Find Team */
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  {/* <Button
                    variant="outline"
                    onClick={() => setSelectedGame(null)}
                    className="border-white text-black hover:bg-white hover:text-orange-900"
                  >
                    ← กลับ
                  </Button> */}
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
                            checked={filters.interests.includes(interest.id)}
                            onCheckedChange={() => handleInterestToggle(interest.id)}
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
                      <label className="text-white text-sm mb-2 block">เกมที่ต้องการ</label>
                      <Select value={filters.preferred_game} onValueChange={(value) => setFilters({...filters, preferred_game: value})}>
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                          <SelectValue placeholder="เลือกเกม" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          {games.map((game) => (
                            <SelectItem key={game.id} value={game.id} className="text-white">
                              {game.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Group Size */}
                    <div>
                      <label className="text-white text-sm mb-2 block">ขนาดกลุ่ม</label>
                      <Select value={filters.group_size} onValueChange={(value) => setFilters({...filters, group_size: value})}>
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="all" className="text-white">ทุกขนาด</SelectItem>
                          <SelectItem value="2" className="text-white">2 คน</SelectItem>
                          <SelectItem value="3" className="text-white">3 คน</SelectItem>
                          <SelectItem value="4" className="text-white">4 คน</SelectItem>
                          <SelectItem value="5" className="text-white">5 คน</SelectItem>
                          <SelectItem value="5+" className="text-white">5+ คน</SelectItem>
                        </SelectContent>
                      </Select>
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
    </div>
  );
};

export default TeamFinder;
