import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import Sidebar from "@/components/Sidebar";
import { User, Camera } from "lucide-react";
import axios from "axios";
import Cropper from "react-easy-crop";
import getCroppedImg from '../lib/cropImage' 
import { toast } from "@/components/ui/use-toast";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface ProfileData {
  username: string;
  display_name: string;
  age: number;
  gender: string;
  bio: string;
  games: string[];
  interests: string[];
  discord_url: string;
  facebook_url: string;
  line_url: string;
  other_url: string;
  img: string;
}

const Profile = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');
  const loggedInidentifier = localStorage.getItem('identifier');

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [showFullImage, setShowFullImage] = useState(false);

  const games = [
    { id: 'valorant', name: 'Valorant', icon: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Valorant_logo_-_pink_color_version.svg' },
    { id: 'lol', name: 'League of Legends', icon: 'https://static.tildacdn.com/tild6363-3366-4131-b062-323333633239/600px-League_of_Lege.png' },
    { id: 'dota2', name: 'Dota 2', icon: 'https://www.waca.or.jp/en/wp-content/uploads/2021/02/dota-2-2.png' },
    { id: 'pubg', name: 'PUBG', icon: 'https://cdn2.steamgriddb.com/icon/64c2d22899f32ccd5b3d9fca3ff04c9c/32/256x256.png' },
    { id: 'apex', name: 'Apex Legends', icon: 'https://purepng.com/public/uploads/large/apex-legends-icon-xhl.png' },
    { id: 'cs2', name: 'Counter Strike 2', icon: 'https://img.icons8.com/?size=512&id=x2J66ADPo3VZ&format=png' },
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

  const interestsList = [
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

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token || !loggedInidentifier) {
        console.error('Missing token or identifier');
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${API_BASE_URL}/profile?identifier=${loggedInidentifier}`, {
          headers: {
            Authorization: `Bearer ${token}`, 
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });

        setProfile(res.data);
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  function stripBase64Header(base64String: string): string {
    const parts = base64String.split(',');
    return parts.length > 1 ? parts[1] : base64String;
  }
  
  function generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const extension = originalName.substring(originalName.lastIndexOf('.') + 1);
    return `user_${timestamp}.${extension}`;
  }
  
  async function uploadProfileImage(base64Image: string, filename: string = "profile.jpg") {
    const uniqueFilename = generateUniqueFilename(filename);
    const cleanBase64 = stripBase64Header(base64Image);
  
    const payload = {
      filename: uniqueFilename,
      data: cleanBase64,
    };
  
    const response = await axios.post(`${API_BASE_URL}/upload-s3`, payload, {
      headers: {
        Authorization: `Bearer ${token}`, 
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });
  
    return response.data.url;
  }  

  const handleGameToggle = (gameId: string) => {
    const gameName = games.find(g => g.id === gameId)?.name || gameId;
    setProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        games: prev.games.includes(gameName)
          ? prev.games.filter(name => name !== gameName)
          : [...prev.games, gameName]
      };
    });
  };

  const handleInterestToggle = (interestId: string) => {
    const interestName = interestsList.find(i => i.id === interestId)?.name || interestId;
    setProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        interests: prev.interests.includes(interestName)
          ? prev.interests.filter(name => name !== interestName)
          : [...prev.interests, interestName]
      };
    });
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      await axios.put(`${API_BASE_URL}/profile`, profile, {
        headers: {
          Authorization: `Bearer ${token}`, 
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
      toast({
        title: "อัปเดตข้อมูลสำเร็จ",
        description: "ข้อมูลโปรไฟล์ของคุณได้รับการอัปเดตเรียบร้อยแล้ว",

      });
      
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      <Sidebar />
      
      <main className="flex-1 overflow-auto p-6">
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-6">
        <Card className="w-full max-w-full sm:max-w-2xl md:max-w-4xl bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <User />
              โปรไฟล์ของฉัน
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* img Section */}
            <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div
                className={`w-24 h-24 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white text-3xl font-bold overflow-hidden ${
                  isEditing ? 'cursor-pointer' : ''
                }`}
                onClick={() => {
                  if (isEditing) inputFileRef.current?.click();
                }}
              >
                {profile?.img ? (
                  <img
                    src={profile.img}
                    alt="img"
                    className="w-full h-full rounded-full object-cover transition duration-200 transform hover:scale-105 hover:brightness-90 cursor-pointer"
                    onClick={() => setShowFullImage(true)}
                  />
                ) : (
                  <span>
                    {profile?.display_name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                )}
              </div>

              {isEditing && (
                <Button
                  size="sm"
                  className="absolute -bottom-2 -right-2 bg-orange-500 hover:bg-orange-600 rounded-full w-8 h-8 p-0"
                  onClick={() => inputFileRef.current?.click()}
                >
                  <Camera size={16} />
                </Button>
              )}

              <input
                type="file"
                accept="image/*"
                ref={inputFileRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      setImageSrc(reader.result as string);
                      setShowCropper(true);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="hidden"
              />
            </div>

              <h3 className="text-xl font-semibold text-white">
                {profile?.display_name || "ไม่ระบุชื่อ"}
              </h3>
            </div>

            {/* Profile Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username" className="text-white">ชื่อผู้ใช้</Label>
                  <Input
                    id="username"
                    value={profile?.username || ""}
                    onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                    disabled={true}
                    className="bg-gray-800 border-gray-600 text-white disabled:opacity-60"
                  />
                </div>

                <div>
                  <Label htmlFor="display_name" className="text-white">ชื่อที่แสดง</Label>
                  <Input
                    id="display_name"
                    value={profile?.display_name || ""}
                    onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
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
                    value={profile?.age ?? ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        age: e.target.value ? parseInt(e.target.value) : 0,
                      })
                    }
                    disabled={!isEditing}
                    className="bg-gray-800 border-gray-600 text-white disabled:opacity-60"
                  />
                </div>

                <div>
                  <Label className="text-white">เพศ</Label>
                  <Select
                    value={profile?.gender || ""}
                    onValueChange={(value) => setProfile({ ...profile, gender: value })}
                    disabled={!isEditing}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="เลือกเพศ" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600 text-white">
                      <SelectItem value="None">ไม่ระบุ</SelectItem>
                      <SelectItem value="male">ชาย</SelectItem>
                      <SelectItem value="female">หญิง</SelectItem>
                      <SelectItem value="LGBTQ+">LGBTQ+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

              </div>

              <div>
                <Label htmlFor="bio" className="text-white">แนะนำตัว</Label>
                <Textarea
                  id="bio"
                  value={profile?.bio || ""}
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
                        checked={(profile?.games || []).includes(game.name)}
                        onCheckedChange={() => handleGameToggle(game.id)}
                        disabled={!isEditing}
                        className="border-gray-400"
                      />
                      <Label htmlFor={game.id} className="text-white text-sm cursor-pointer">
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
                        checked={(profile?.interests || []).includes(interest.name)}
                        onCheckedChange={() => handleInterestToggle(interest.id)}
                        disabled={!isEditing}
                        className="border-gray-400"
                      />
                      <Label htmlFor={interest.id} className="text-white text-sm cursor-pointer">
                        {interest.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

          {/* Social Links */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="discord_url" className="text-white">Discord URL</Label>
              <Input
                id="discord_url"
                value={profile?.discord_url || ""}
                onChange={(e) => setProfile({ ...profile, discord_url: e.target.value })}
                disabled={!isEditing}
                className="bg-gray-800 border-gray-600 text-white disabled:opacity-60"
              />
            </div>

            <div>
              <Label htmlFor="facebook_url" className="text-white">Facebook URL</Label>
              <Input
                id="facebook_url"
                value={profile?.facebook_url || ""}
                onChange={(e) => setProfile({ ...profile, facebook_url: e.target.value })}
                disabled={!isEditing}
                className="bg-gray-800 border-gray-600 text-white disabled:opacity-60"
              />
            </div>

            <div>
              <Label htmlFor="line_url" className="text-white">Line URL</Label>
              <Input
                id="line_url"
                value={profile?.line_url || ""}
                onChange={(e) => setProfile({ ...profile, line_url: e.target.value })}
                disabled={!isEditing}
                className="bg-gray-800 border-gray-600 text-white disabled:opacity-60"
              />
            </div>

            <div>
              <Label htmlFor="other_url" className="text-white">Other URL</Label>
              <Input
                id="other_url"
                value={profile?.other_url || ""}
                onChange={(e) => setProfile({ ...profile, other_url: e.target.value })}
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
                      className="flex-1 bg-red-600 border border-red-800 text-white hover:bg-red-700 transition-colors duration-200 rounded-md"
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
        {showCropper && (
            <div className="fixed inset-0 bg-black bg-opacity-80 z-[9999] flex items-center justify-center px-4">
              <div className="relative w-[90vw] max-w-3xl aspect-square bg-white rounded-lg overflow-hidden">
              <div className="absolute inset-0">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, croppedAreaPixels) => {
                    setCroppedAreaPixels(croppedAreaPixels);
                  }}
                />
              </div>
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 z-10">
                <Button
                  className="bg-white text-black hover:bg-gray-200"
                  onClick={async () => {
                    try {
                      const croppedImage = await getCroppedImg(
                        imageSrc,
                        croppedAreaPixels
                      );
                      const uploadedUrl = await uploadProfileImage(croppedImage, "profile.jpg");
                      setProfile((prev) => (prev ? { ...prev, img: uploadedUrl } : prev));
                      setShowCropper(false);
                    } catch (err) {
                      console.error("Error cropping image:", err);
                    }
                  }}
                >
                  ยืนยัน
                </Button>
                <Button variant="ghost" className="text-white" onClick={() => setShowCropper(false)}>
                  ยกเลิก
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {showFullImage && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center z-[999]"
              onClick={() => setShowFullImage(false)}
            >
              <img
                src={profile.img}
                alt="Full Profile"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </>
        )}

      </main>
    </div>
  );
};

export default Profile;
