import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Sidebar from "@/components/Sidebar";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

const Index = () => {
  const { isLoggedIn } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-800 via-gray-900 to-black">
      <div className="flex flex-1 p-[1vh] w-full">
        <Sidebar />

        <main className="flex-1 overflow-auto">
          {/* Hero Section */}
          <div className="min-h-screen flex items-center justify-center px-6 pt-10 sm:pt-20">
            <div className="max-w-5xl mx-auto text-center">
              <div className="mb-12">
                <img
                  src="/LOGO GGbuddy.png"
                  alt="GGbuddy Logo"
                  className="h-20 sm:h-32 md:h-40 mx-auto mb-6 drop-shadow-xl"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />

                <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight drop-shadow-md">
                  เล่นเกมเหงาๆ<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500">
                    ชวนใครดี?
                  </span>
                </h1>

                <p className="text-md sm:text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                  เชื่อมต่อกับเพื่อนใหม่ผ่านเกมที่คุณชื่นชอบ และสร้างมิตรภาพใหม่ได้ที่นี่!
                </p>
              </div>

              {!isLoggedIn && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-xl transform hover:scale-105 transition-all duration-200"
                    asChild
                  >
                    <Link to="/login">เข้าสู่ระบบ</Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-gray hover:bg-white hover:text-gray-900 px-8 py-4 text-lg font-semibold rounded-full shadow-xl transform hover:scale-105 transition-all duration-200"
                    asChild
                  >
                    <Link to="/register">สมัครสมาชิก</Link>
                  </Button>
                </div>
              )}

              {/* Features Section */}
              <div className="grid gap-6 md:grid-cols-3 mt-10 px-4 pb-12">
                <Card className="bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 transition-transform duration-300 hover:scale-[1.03] rounded-2xl shadow-md">
                  <CardContent className="p-8 text-center">
                    <div className="text-5xl mb-4">🎮</div>
                    <h3 className="text-2xl font-semibold text-white mb-2">หาเพื่อนเล่นเกม</h3>
                    <p className="text-gray-300 text-sm">เชื่อมต่อกับผู้เล่นที่มีความสนใจเหมือนกัน และสนุกไปด้วยกัน</p>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 transition-transform duration-300 hover:scale-[1.03] rounded-2xl shadow-md">
                  <CardContent className="p-8 text-center">
                    <div className="text-5xl mb-4">💬</div>
                    <h3 className="text-2xl font-semibold text-white mb-2">แชทในทีม</h3>
                    <p className="text-gray-300 text-sm">สื่อสารกับทีมของคุณได้อย่างง่ายดาย</p>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 transition-transform duration-300 hover:scale-[1.03] rounded-2xl shadow-md">
                  <CardContent className="p-8 text-center">
                    <div className="text-5xl mb-4">🚫</div>
                    <h3 className="text-2xl font-semibold text-white mb-2">บล็อกผู้เล่นที่ไม่ชอบ</h3>
                    <p className="text-gray-300 text-sm">บล็อกผู้เล่นที่ไม่เหมาะสม เพื่อประสบการณ์เกมที่ดีขึ้น</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer Section */}
      <footer className="bg-black bg-opacity-60 text-gray-400 text-sm text-center py-6 border-t border-white/20 mt-auto">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} GGbuddy. All rights reserved.</p>
          <p className="mt-2">
            Made with by <a href="/team-dev" className="underline hover:text-white">GGbuddy Team</a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
