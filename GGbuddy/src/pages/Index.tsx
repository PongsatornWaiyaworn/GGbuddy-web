import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Sidebar from "@/components/Sidebar";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useState } from "react";

const Index = () => {
  // ใช้ useState เพื่อตรวจสอบสถานะการล็อกอิน
  const { isLoggedIn } = useAuth();

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        {/* Hero Section */}
        <div className="min-h-screen flex items-center justify-center px-6 pt-10 sm:pt-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
            <img 
                src="/public/LOGO GGbuddy.png" 
                alt="GGbuddy Logo" 
                className="h-20 sm:h-32 md:h-40 mx-auto mb-6 "  
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />

              <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                เล่นเกมเหงาๆ<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-400">
                  ชวนใครดี?
                </span>
              </h1>

              <p className="text-sm sm:text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                เชื่อมต่อกับเพื่อนใหม่ผ่านเกมที่คุณชื่นชอบ
              </p>
            </div>

            {/* เงื่อนไขการแสดงปุ่ม */}
            {!isLoggedIn && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"
                  asChild
                >
                  <Link to="/login">เข้าสู่ระบบ</Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white text-black hover:bg-white hover:text-orange-900 px-8 py-4 text-lg font-semibold rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"
                  asChild
                >
                  <Link to="/register">สมัครสมาชิก</Link>
                </Button>
              </div>
            )}

            {/* Features Section */}
            <div className="grid md:grid-cols-3 gap-6 mt-16">
              <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">🎮</div>
                  <h3 className="text-xl font-semibold text-white mb-2">หาเพื่อนเล่นเกม</h3>
                  <p className="text-gray-300">เชื่อมต่อกับผู้เล่นที่มีความสนใจเหมือนกัน และสนุกไปด้วยกัน</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">💬</div>
                  <h3 className="text-xl font-semibold text-white mb-2">แชทในทีม</h3>
                  <p className="text-gray-300">สื่อสารกับทีมของคุณได้อย่างง่ายดาย</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">🚫</div>
                  <h3 className="text-xl font-semibold text-white mb-2">บล็อกผู้เล่นที่ไม่ชอบ</h3>
                  <p className="text-gray-300">บล็อกผู้เล่นที่ไม่เหมาะสม เพื่อประสบการณ์เกมที่ดีขึ้น</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
