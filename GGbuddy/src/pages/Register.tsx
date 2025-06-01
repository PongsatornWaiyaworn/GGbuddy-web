import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Camera } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import Cropper from 'react-easy-crop'
import getCroppedImg from '../lib/cropImage' 
import { Slider } from '@/components/ui/slider' 
import AWS from "aws-sdk";
import axios from 'axios';
import { toast } from "@/components/ui/use-toast";

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

const Register = () => {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [step, setStep] = useState(1); // 1: form, 2: OTP, 3: profile
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [isEditing, setIsEditing] = useState(true);
  const [showCropper, setShowCropper] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [profile, setProfile] = useState({
    img: 'https://ggbuddy.s3.ap-southeast-2.amazonaws.com/example.png',
    username: '',
    displayname: '',
    age: 18,
    gender: 'all', // 'all' | 'male' | 'female'
    bio: '',
    discord_url: '',
    facebook_url: '',
    line_url: '',
    other_url: '',
    games: [] as string[],
    interests: [] as string[],
  });
  
  const navigate = useNavigate();

  function stripBase64Header(base64String: string): string {
    const parts = base64String.split(',');
    return parts.length > 1 ? parts[1] : base64String;
  }
  
  function generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const extension = originalName.substring(originalName.lastIndexOf('.') + 1);
    return `user123_${timestamp}.${extension}`;
  }
  
  async function uploadProfileImage(base64Image: string, filename: string = "profile.jpg") {
    const uniqueFilename = generateUniqueFilename(filename);
    const cleanBase64 = stripBase64Header(base64Image);
  
    const payload = {
      filename: uniqueFilename,
      data: cleanBase64,
    };
  
    console.log(payload);
  
    const response = await axios.post("http://localhost:3000/upload-s3", payload, {
      headers: { "Content-Type": "application/json" },
    });
  
    return response.data.url;
  }  
  
  const handleCreate = async () => {
    try {
      let imgUrl = profile.img;
  
      if (profile.img.startsWith("data:image")) {
        imgUrl = await uploadProfileImage(profile.img);
      }
  
      const payload = {
        user: {
          username: profile.username,
          email: formData.email,
          password: formData.password,
        },
        profile: {
          display_name: profile.displayname,
          age: profile.age,
          gender: profile.gender,
          discord_url: profile.discord_url,
          facebook_url: profile.facebook_url,
          line_url: profile.line_url,
          other_url: profile.other_url,
          bio: profile.bio,
          interests: profile.interests,
          games: profile.games,
          img: imgUrl,
        },
      };
      console.log(payload);
  
      await axios.post("http://localhost:3000/register", payload);
      toast({
        title: "สร้างบัญชีสำเร็จ",
        description: "คุณสามารถเข้าสู่ระบบได้แล้ว",
      });
    } catch (error) {
      console.error("Upload/Register Error", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้างบัญชีได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    }
  };
  
  const sendOtpToBackend = async () => {
    try {
      const res = await fetch("http://127.0.0.1:3000/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
  
      if (!res.ok) throw new Error("Failed to send OTP");
  
      toast({
        title: "ส่งรหัส OTP สำเร็จ",
        description: `เราได้ส่งรหัส OTP ไปยังอีเมล ${formData.email}`,
      });
      return true;
    } catch (error) {
      toast({
        title: "ส่งรหัส OTP ไม่สำเร็จ",
        description: "กรุณาลองใหม่อีกครั้งภายหลัง",
        variant: "destructive",
      });
      return false;
    }
  };  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "รหัสผ่านไม่ตรงกัน",
        description: "กรุณาตรวจสอบให้แน่ใจว่ารหัสผ่านและยืนยันรหัสผ่านตรงกัน",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    const otpSent = await sendOtpToBackend();
    if (otpSent) {
      setStep(2);
      setTimeLeft(300);
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
  
    if (timeLeft === 0 && timerRef.current) {
      clearInterval(timerRef.current);
      toast({
        title: "หมดเวลายืนยัน OTP",
        description: "กรุณาขอรหัส OTP ใหม่อีกครั้ง",
        variant: "destructive",
      });
      setStep(1);
      setOtp('');
    }
  
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [step, timeLeft]);
  
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://127.0.0.1:3000/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code: otp })
      });
  
      if (!res.ok) {
        toast({
          title: "OTP ไม่ถูกต้อง",
          description: "กรุณาตรวจสอบรหัส OTP ที่กรอก",
          variant: "destructive",
        });
        return;
      }
  
      setStep(3);
      setIsEditing(true);
  
      if (timerRef.current) clearInterval(timerRef.current);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถยืนยัน OTP ได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    }
  };
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return m + ':' + s;
  };  

  const handleGameToggle = (id: string) => {
    const gameName = games.find(g => g.id === id)?.name;
    if (!gameName) return;

    setProfile(prev => {
      const hasGame = prev.games.includes(gameName);
      const newGames = hasGame
        ? prev.games.filter(g => g !== gameName)
        : [...prev.games, gameName];
      return { ...prev, games: newGames };
    });
  };

  const handleInterestToggle = (id: string) => {
    const interestName = interestsList.find(i => i.id === id)?.name;
    if (!interestName) return;

    setProfile(prev => {
      const hasInterest = prev.interests.includes(interestName);
      const newInterests = hasInterest
        ? prev.interests.filter(i => i !== interestName)
        : [...prev.interests, interestName];
      return { ...prev, interests: newInterests };
    });
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-6">
      <Card className="w-full max-w-full sm:max-w-2xl md:max-w-4xl bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <img
              src="/public/LOGO GGbuddy.png"
              alt="GGbuddy Logo"
              className="h-16 mx-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <CardTitle className="text-2xl font-bold text-white flex items-center gap-2 justify-center">
            <UserPlus />
            {step === 1 ? 'สมัครสมาชิก' : step === 2 ? 'ยืนยัน OTP' : 'สร้างโปรไฟล์'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <Label htmlFor="email" className="text-white">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-gray-800 border-gray-600 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-white">รหัสผ่าน</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-gray-800 border-gray-600 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-white">ยืนยันรหัสผ่าน</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="bg-gray-800 border-gray-600 text-white"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                    กำลังส่งOTP...
                  </div>
                ) : (
                  "สมัครสมาชิก"
                )}
              </Button>
              <div className="mt-6 text-center">
                <Link 
                  to="/login" 
                  className="text-orange-400 hover:text-orange-300 underline text-sm"
                >
                  กลับไปหน้าเข้าสู่ระบบ
                </Link>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleOtpSubmit} className="space-y-4 text-white">
              <p>กรุณาใส่รหัส OTP ที่ส่งไปยังอีเมลของคุณ</p>
              <Input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                required
              />
              <div className="flex justify-between items-center">
                <span>เวลาที่เหลือ: {formatTime(timeLeft)}</span>
                <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700" type="submit">ยืนยัน OTP</Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <main className="flex-1 overflow-auto px-4 sm:px-6 py-6">
              <div className="max-w-6xl mx-auto min-w-full sm:min-w-[480px] md:min-w-[600px] lg:min-w-[720px]">
                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Profile Image Section */}
                    <div className="flex flex-col items-center space-y-4">
                      <div className="relative">
                        <div className="w-24 h-24 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                          {profile.img ? (
                            <img
                              src={profile.img}
                              alt="img"
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            profile.displayname.charAt(0).toUpperCase()
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
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.addEventListener("load", () => {
                                setImageSrc(reader.result as string);
                                setShowCropper(true);
                              });
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </div>
                      <h3 className="text-xl font-semibold text-white">{profile.displayname}</h3>
                    </div>

                    {/* Profile Form */}
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="username" className="text-white">ชื่อผู้ใช้</Label>
                          <Input
                            id="username"
                            value={profile.username}
                            onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                            disabled={!isEditing}
                            className="bg-gray-800 border-gray-600 text-white disabled:opacity-60"
                            required
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
                            min={0}
                            max={150}
                            value={profile.age}
                            onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
                            disabled={!isEditing}
                            className="bg-gray-800 border-gray-600 text-white disabled:opacity-60"
                          />
                        </div>

                        <div>
                          <Label className="text-white">เพศ</Label>
                          <Select
                            value={profile.gender}
                            onValueChange={(val) => setProfile({ ...profile, gender: val })}
                            disabled={!isEditing}
                          >
                            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                              <SelectValue placeholder="เลือกเพศ" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-600">
                            <SelectItem value="None" className="text-white">ไม่ระบุ</SelectItem>
                            <SelectItem value="male" className="text-white">ชาย</SelectItem>
                            <SelectItem value="female" className="text-white">หญิง</SelectItem>
                            <SelectItem value="LGBTQ+" className="text-white">LGBTQ+</SelectItem>
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
                                onCheckedChange={() => isEditing && handleGameToggle(game.id)}
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
                                checked={profile.interests.includes(interest.name)}
                                onCheckedChange={() => isEditing && handleInterestToggle(interest.id)}
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

                      <Button type="submit" className="w-full mt-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700" disabled={!isEditing} onClick={handleCreate}>
                        สร้างเลย!
                      </Button>
                    </form>
                  </CardContent>

                </Card>
              </div>
            </main>
          )}

        </CardContent>
        <CardContent className="text-center">
          {step !== 1 && (
            <Link
              to="/login"
              className="text-xs text-white underline underline-offset-4"
            >
              กลับไปหน้าเข้าสู่ระบบ
            </Link>
          )}
        </CardContent>
      </Card>

      {showCropper && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-[9999] flex items-center justify-center px-4">
          <div className="relative w-[90vw] max-w-3xl aspect-square bg-white rounded-lg overflow-hidden">
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
            <div className="absolute bottom-2 left-0 right-0 flex justify-between px-4">
              <Button
                onClick={async () => {
                  const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
                  setProfile(prev => ({ ...prev, img: croppedImage }));
                  setShowCropper(false);
                }}
              >
                ยืนยัน
              </Button>
              <Button variant="ghost" onClick={() => setShowCropper(false)}>
                ยกเลิก
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;