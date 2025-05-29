import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { useAuth } from "../AuthContext";

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      const response = await fetch('http://127.0.0.1:3000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData) 
      });

      if (!response.ok) {
        const errorData = await response.text();
        setErrorMessage(errorData || 'เกิดข้อผิดพลาดในการล็อกอิน');
        return;
      }

      const data = await response.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        login();      
        navigate('/'); 
      } else {
        setErrorMessage('ไม่พบ token จากเซิร์ฟเวอร์');
      }

    } catch (error) {
      setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      console.error('Login error:', error);
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
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <CardTitle className="text-2xl font-bold text-white flex items-center gap-2 justify-center">
            <User />
            เข้าสู่ระบบ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="identifier" className="text-white">
                อีเมล หรือ ชื่อผู้ใช้
              </Label>
              <Input
                id="identifier"
                type="text"
                value={formData.identifier}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
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

            {errorMessage && (
              <p className="text-red-500 text-sm">{errorMessage}</p>
            )}

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
            >
              เข้าสู่ระบบ
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-300">
              ยังไม่มีบัญชี?{" "}
              <Link to="/register" className="text-orange-400 hover:text-orange-300 underline">
                สมัครสมาชิก
              </Link>
            </p>
            <Link to="/" className="text-gray-400 hover:text-gray-300 text-sm mt-2 inline-block">
              กลับหน้าแรก
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;