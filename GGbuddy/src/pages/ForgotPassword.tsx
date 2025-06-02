import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Key, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch(`${API_BASE_URL}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setEmail(data.email)
        setStep(2);
        setTimeLeft(300); // 5 mins
        toast({
          title: "OTP Sent",
          description: `เราได้ส่งรหัส OTP ไปยัง ${data.email}`,
        });
      } else {
        setErrorMessage(data.message || "เกิดข้อผิดพลาดในการส่ง OTP");
      }
    } catch (err) {
      setErrorMessage("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep(3);
        toast({
          title: "OTP Verified",
          description: "คุณสามารถตั้งรหัสผ่านใหม่ได้แล้ว",
        });
      } else {
        setErrorMessage(data.message || "OTP ไม่ถูกต้อง");
      }
    } catch (err) {
      setErrorMessage("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (newPassword !== confirmPassword) {
      setErrorMessage('รหัสผ่านไม่ตรงกัน');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, new_password: newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Password Updated",
          description: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว",
        });
        navigate('/login');
      } else {
        setErrorMessage(data.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้");
      }
    } catch (err) {
      setErrorMessage("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-6">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <img 
              src="/public/LOGO GGbuddy.png" 
              alt="GGbuddy Logo" 
              className="h-16 mx-auto"
              onError={(e) => e.currentTarget.style.display = 'none'}
            />
          </div>
          <CardTitle className="text-2xl font-bold text-white flex items-center gap-2 justify-center">
            {step === 1 ? <Mail /> : <Key />}
            {step === 1 ? 'ลืมรหัสผ่าน' : step === 2 ? 'ยืนยัน OTP' : 'ตั้งรหัสผ่านใหม่'}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* Step 1 */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-white">อีเมล หรือ ชื่อผู้ใช้</Label>
                <Input
                  id="text"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  required
                />
                <p className="text-gray-400 text-sm mt-1">กรอกอีเมลหรือชื่อผู้ใช้ที่ใช้สมัครสมาชิก</p>
              </div>
              {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-red-600"
                disabled={isLoading}
              >
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />กำลังส่ง...</> : 'ส่ง OTP'}
              </Button>
            </form>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-white">เราได้ส่งรหัส OTP ไปยังอีเมล <span className="text-orange-400">{email}</span></p>
              <div>
                <Label htmlFor="otp" className="text-white">รหัส OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="bg-gray-800 border-gray-600 text-white text-center text-lg tracking-widest"
                  required
                />
                <p className={`text-sm mt-1 ${timeLeft < 60 ? 'text-red-400' : 'text-gray-400'}`}>
                  เวลาที่เหลือ: {formatTime(timeLeft)}
                </p>
              </div>
              {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-black border-gray-600"
                  onClick={() => setStep(1)}
                >
                  เปลี่ยน
                </Button>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600"
                  disabled={isLoading || timeLeft <= 0}
                >
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />ตรวจสอบ...</> : 'ยืนยัน OTP'}
                </Button>
              </div>
            </form>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <Label htmlFor="newPassword" className="text-white">รหัสผ่านใหม่</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="กรอกรหัสผ่านใหม่"
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="text-white">ยืนยันรหัสผ่านใหม่</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  required
                />
              </div>
              {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-red-600"
                disabled={isLoading}
              >
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />กำลังบันทึก...</> : 'เปลี่ยนรหัสผ่าน'}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-orange-400 hover:text-orange-300 underline text-sm">
              กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;