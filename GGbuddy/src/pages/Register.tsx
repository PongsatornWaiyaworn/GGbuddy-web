import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [step, setStep] = useState(1); // 1: form, 2: OTP
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('รหัสผ่านไม่ตรงกัน');
      return;
    }
    console.log('Register attempt:', formData);
    setStep(2);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('OTP verification:', otp);
    // Mock OTP success - redirect to profile
    navigate('/profile');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-900 via-red-900 to-orange-800 p-6">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20">
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
            {step === 1 ? 'สมัครสมาชิก' : 'ยืนยัน OTP'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-white">ชื่อ</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-gray-800 border-gray-600 text-white"
                  required
                />
              </div>
              
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
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
              >
                ยืนยันเเละส่ง OTP
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <Label htmlFor="otp" className="text-white">รหัส OTP</Label>
                <Input
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white text-center"
                  placeholder="ใส่รหัส 6 หลัก"
                  maxLength={6}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                ยืนยัน
              </Button>
              
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setStep(1)}
                className="w-full border-gray-400 text-black hover:bg-gray-700"
              >
                กลับ
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-300">
              มีบัญชีแล้ว?{" "}
              <Link to="/login" className="text-orange-400 hover:text-orange-300 underline">
                เข้าสู่ระบบ
              </Link>
            </p>
            <Link to="/" className="text-gray-400 hover:text-gray-300 text-sm">
              กลับหน้าแรก
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
