import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import Sidebar from "@/components/Sidebar";
import { User, Camera } from "lucide-react";

const Profile = () => {
  const [profile, setProfile] = useState({
    username: 'teekk',
    displayname: 'TeeKMUTT',
    age: 21,
    gender: 'male',
    bio: 'สายโซเชียล ชอบเล่นเกมทีม!',
    games: ['Valorant', 'Dota 2'],
    interests: ['Co-op', 'Strategy'],
    discordurl: 'https://discord.gg/teekk',
    facebookurl: 'https://facebook.com/teekk',
    lineurl: 'https://line.me/ti/p/teekk',
    otherurl: 'https://twitch.tv/teekk',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
  });

  const [isEditing, setIsEditing] = useState(false);

  const games = [
    { id: 'valorant', name: 'Valorant' },
    { id: 'dota2', name: 'Dota 2' },
    { id: 'lol', name: 'League of Legends' },
    { id: 'pubg', name: 'PUBG' },
    { id: 'apex', name: 'Apex Legends' },
    { id: 'overwatch', name: 'Overwatch 2' },
    { id: 'cs2', name: 'Counter-Strike 2' },
    { id: 'fortnite', name: 'Fortnite' },
    { id: 'minecraft', name: 'Minecraft' },
    { id: 'rov', name: 'ROV' }
  ];

  const interestsList = [
    { id: 'co-op', name: 'Co-op' },
    { id: 'competitive', name: 'Competitive' },
    { id: 'strategy', name: 'Strategy' },
    { id: 'casual', name: 'Casual' },
    { id: 'rpg', name: 'RPG' },
    { id: 'fps', name: 'FPS' }
  ];

  const handleGameToggle = (gameId: string) => {
    const gameName = games.find(g => g.id === gameId)?.name || gameId;
    setProfile(prev => ({
      ...prev,
      games: prev.games.includes(gameName)
        ? prev.games.filter(name => name !== gameName)
        : [...prev.games, gameName]
    }));
  };

  const handleInterestToggle = (interestId: string) => {
    const interestName = interestsList.find(i => i.id === interestId)?.name || interestId;
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(interestName)
        ? prev.interests.filter(name => name !== interestName)
        : [...prev.interests, interestName]
    }));
  };

  const handleSave = () => {
    console.log('Profile saved:', profile);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-orange-900 via-red-900 to-orange-800">
      <Sidebar />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                <User />
                โปรไฟล์ของฉัน
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {profile.avatar ? (
                      <img src={profile.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      profile.displayname.charAt(0).toUpperCase()
                    )}
                  </div>
                  {isEditing && (
                    <Button
                      size="sm"
                      className="absolute -bottom-2 -right-2 bg-orange-500 hover:bg-orange-600 rounded-full w-8 h-8 p-0"
                    >
                      <Camera size={16} />
                    </Button>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-white">{profile.displayname}</h3>
              </div>

              {/* Profile Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username" className="text-white">ชื่อผู้ใช้</Label>
                    <Input
                      id="username"
                      value={profile.username}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                      disabled={!isEditing}
                      className="bg-gray-800 border-gray-600 text-white disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <Label htmlFor="displayname" className="text-white">ชื่อที่แสดง</Label>
                    <Input
                      id="displayname"
                      value={profile.displayname}
                      onChange={(e) => setProfile({ ...profile, displayname: e.target.value })}
                      disabled={!isEditing}
                      className="bg-gray-800 border-gray-600 text-white disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="age" className="text-white">อายุ</Label>
                    <Input
                      id="age"
                      type="number"
                      min="1"
                      max="99"
                      value={profile.age}
                      onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) })}
                      disabled={!isEditing}
                      className="bg-gray-800 border-gray-600 text-white disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <Label className="text-white">เพศ</Label>
                    <Select
                      value={profile.gender}
                      onValueChange={(value) => setProfile({ ...profile, gender: value })}
                      disabled={!isEditing}
                    >
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
                </div>

                <div>
                  <Label htmlFor="bio" className="text-white">แนะนำตัว</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    disabled={!isEditing}
                    className="bg-gray-800 border-gray-600 text-white disabled:opacity-60"
                    rows={3}
                  />
                </div>

                <div>
                  <Label className="text-white mb-3 block">เกมที่ชื่นชอบ</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {games.map((game) => (
                      <div key={game.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={game.id}
                          checked={profile.games.includes(game.name)}
                          onCheckedChange={() => handleGameToggle(game.id)}
                          disabled={!isEditing}
                          className="border-gray-400"
                        />
                        <Label
                          htmlFor={game.id}
                          className="text-white text-sm cursor-pointer"
                        >
                          {game.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-white mb-3 block">ความสนใจ</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {interestsList.map((interest) => (
                      <div key={interest.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={interest.id}
                          checked={profile.interests.includes(interest.name)}
                          onCheckedChange={() => handleInterestToggle(interest.id)}
                          disabled={!isEditing}
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

                {/* Social Links */}
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="discordurl" className="text-white">Discord URL</Label>
                    <Input
                      id="discordurl"
                      value={profile.discordurl}
                      onChange={(e) => setProfile({ ...profile, discordurl: e.target.value })}
                      disabled={!isEditing}
                      className="bg-gray-800 border-gray-600 text-white disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <Label htmlFor="facebookurl" className="text-white">Facebook URL</Label>
                    <Input
                      id="facebookurl"
                      value={profile.facebookurl}
                      onChange={(e) => setProfile({ ...profile, facebookurl: e.target.value })}
                      disabled={!isEditing}
                      className="bg-gray-800 border-gray-600 text-white disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <Label htmlFor="lineurl" className="text-white">Line URL</Label>
                    <Input
                      id="lineurl"
                      value={profile.lineurl}
                      onChange={(e) => setProfile({ ...profile, lineurl: e.target.value })}
                      disabled={!isEditing}
                      className="bg-gray-800 border-gray-600 text-white disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <Label htmlFor="otherurl" className="text-white">Other URL</Label>
                    <Input
                      id="otherurl"
                      value={profile.otherurl}
                      onChange={(e) => setProfile({ ...profile, otherurl: e.target.value })}
                      disabled={!isEditing}
                      className="bg-gray-800 border-gray-600 text-white disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {isEditing ? (
                  <>
                    <Button
                      onClick={handleSave}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    >
                      บันทึก
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 border-gray-400 text-white hover:bg-gray-700"
                    >
                      ยกเลิก
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                  >
                    แก้ไขโปรไฟล์
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
