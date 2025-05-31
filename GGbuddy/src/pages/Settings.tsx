import { useEffect, useRef, useState } from "react";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/Sidebar";
import { Settings as SettingsIcon, Shield, UserX, Eye, EyeOff } from "lucide-react";

const Settings = () => {
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [blockedUsers, setBlockedUsers] = useState([]);
  const username = localStorage.getItem('username');

  useEffect(() => {
    fetch(`http://localhost:3000/blocked-list/${username}`)
      .then(res => res.json())
      .then(data => setBlockedUsers(data))
      .catch(err => console.error("โหลดข้อมูลผู้ใช้ที่ถูกบล็อกล้มเหลว", err));
      console.log(blockedUsers)
  }, []);  

  const [confirmAction, setConfirmAction] = useState<null | (() => void)>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showDialog_passwords, setShowDialog_password] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  const [waitingForOtp, setWaitingForOtp] = useState(false);

  const [timeLeft, setTimeLeft] = useState(300); // 5 นาที = 300 วินาที

  useEffect(() => {
    if (!waitingForOtp) {
      setTimeLeft(300); 
      return;
    }
    if (timeLeft <= 0) {
      setWaitingForOtp(false);
      setOtpError("หมดเวลาในการยืนยัน OTP กรุณาขอ OTP ใหม่");
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [waitingForOtp, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  };

  
  const confirm = (action: () => void) => {
    setConfirmAction(() => action);
    setShowDialog(true);
  };

  const executeConfirmedAction = () => {
    if (confirmAction) confirmAction();
    setShowDialog(false);
  };

  const executeConfirmedAction_password = () => {
    if (confirmAction) confirmAction();
    sendOtp()
    setShowDialog(false);
  };


  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const checkCurrentPassword = async (): Promise<boolean> => {
    const email = localStorage.getItem("identifier");
    if (!email) {
      alert("ไม่พบอีเมลของคุณ กรุณาเข้าสู่ระบบใหม่");
      return false;
    }
  
    try {
      const res = await fetch("http://localhost:3000/check-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: email,
          password: passwords.current,
        }),
      });
  
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "รหัสผ่านปัจจุบันไม่ถูกต้อง");
        return false;
      }
  
      return true;
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการตรวจสอบรหัสผ่าน:", error);
      alert("เกิดข้อผิดพลาดในการตรวจสอบรหัสผ่าน");
      return false;
    }
  };  

  const sendOtp = async () => {
    const email = localStorage.getItem("identifier");
    if (!email) {
      alert("ไม่พบอีเมลของคุณ กรุณาเข้าสู่ระบบใหม่");
      return;
    }
    try {
      const res = await fetch("http://localhost:3000/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email }),
      });
      if (!res.ok) throw new Error("ส่ง OTP ไม่สำเร็จ");
      setOtpSent(true);
      setWaitingForOtp(true);
      setShowDialog_password(false)
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการส่ง OTP");
      console.error(error);
    }
  };

  const verifyOtp = async () => {
    const email = localStorage.getItem("identifier");
    if (!email) {
      alert("ไม่พบอีเมลของคุณ กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, code: otp }),
      });
      if (!res.ok) {
        setOtpError("OTP ไม่ถูกต้อง");
        return;
      }
      setOtpError("");
      await changePassword();
    } catch (error) {
      setOtpError("เกิดข้อผิดพลาดในการยืนยัน OTP");
      console.error(error);
    }
  };

  const changePassword = async () => {
    const email = localStorage.getItem("identifier");
    if (!email) {
      alert("ไม่พบอีเมลของคุณ กรุณาเข้าสู่ระบบใหม่");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      alert("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: email,
          new_password: passwords.new,
        }),
      });
      if (!res.ok) throw new Error("เปลี่ยนรหัสผ่านไม่สำเร็จ");

      alert("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว");
      setPasswords({ current: "", new: "", confirm: "" });
      setOtp("");
      setOtpSent(false);
      setWaitingForOtp(false);
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
      console.error(error);
    }
  };

  const handlePasswordChangeStart = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (passwords.new !== passwords.confirm) {
      alert("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }
  
    const isValid = await checkCurrentPassword();
    if (!isValid) return;

    setShowDialog_password(true)
  };

  async function handleUnblockUser(blockedUsername: string): Promise<void> {
    try {
      const response = await fetch(`http://localhost:3000/unblock/${blockedUsername}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blocker_username: username, 
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Unblock failed");
      }
      
      const data = await response.json();
      alert(data.message); 
      window.location.reload();
    } catch (error) {
      console.error("Unblock error:", error);
      alert("เกิดข้อผิดพลาดในการยกเลิกบล็อกผู้ใช้");
    }
  }
  

  function handleDeleteAccount(): void {
    throw new Error("Function not implemented.");
  }

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <SettingsIcon /> ตั้งค่า
          </h1>

          {/* Change Password */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield /> เปลี่ยนรหัสผ่าน
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!waitingForOtp && (
                <form onSubmit={handlePasswordChangeStart} className="space-y-4 max-w-md">
                  {["current", "new", "confirm"].map((field) => (
                    <div key={field}>
                      <Label htmlFor={field} className="text-white">
                        {field === "current"
                          ? "รหัสผ่านปัจจุบัน"
                          : field === "new"
                          ? "รหัสผ่านใหม่"
                          : "ยืนยันรหัสผ่านใหม่"}
                      </Label>
                      <div className="relative">
                        <Input
                          id={field}
                          type={showPasswords[field as keyof typeof showPasswords] ? "text" : "password"}
                          value={passwords[field as keyof typeof passwords]}
                          onChange={(e) =>
                            setPasswords((prev) => ({ ...prev, [field]: e.target.value }))
                          }
                          className="bg-gray-800 border-gray-600 text-white pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => togglePasswordVisibility(field as keyof typeof showPasswords)}
                        >
                          {showPasswords[field as keyof typeof showPasswords] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    เปลี่ยนรหัสผ่าน
                  </Button>
                </form>
              )}

              {/* กรอก OTP */}
              {waitingForOtp && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    verifyOtp();
                  }}
                  className="space-y-4 max-w-md"
                >
                  <Label htmlFor="otp" className="text-white">
                    กรอก OTP ที่ได้รับทางอีเมล
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    required
                  />
                  {otpError && <p className="text-red-500 text-sm">{otpError}</p>}
                  {waitingForOtp && (
                    <p className="text-white font-semibold text-sm mb-2">
                      เวลาที่เหลือ: {formatTime(timeLeft)}
                    </p>
                  )}

                  <div className="flex gap-4">
                    <button
                      type="button"
                      className="bg-gradient-to-r from-gray-400 to-gray-400 hover:from-gray-500 hover:to-gray-500 text-white px-4 py-2 rounded font-medium shadow"
                      onClick={() => {
                        setWaitingForOtp(false);
                        setOtp("");
                        setOtpError("");
                        setTimeLeft(300);
                      }}
                    >
                      ยกเลิก
                    </button>

                    <button
                      type="submit"
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded font-medium shadow"
                    >
                      ยืนยัน OTP
                    </button>
                  </div>

                </form>
              )}
            </CardContent>
          </Card>

          {/* Blocked Users & Account Actions ส่วนอื่น ๆ เหมือนเดิม */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <UserX /> ผู้ใช้ที่ถูกบล็อก
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(blockedUsers) && blockedUsers.length > 0 ? (
                blockedUsers.map((user, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-800 rounded-lg mb-2"
                  >
                    <div>
                      <h4 className="text-white font-medium">{user.BlockedDisplayName}</h4>
                      <p className="text-gray-400 text-sm">@{user.BlockedUsername}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        บล็อกเมื่อ: {new Date(user.Timestamp).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge variant="destructive">บล็อกแล้ว</Badge>
                      <Button
                        variant="outline"
                        className="text-black border-gray-400 hover:bg-gray-700"
                        onClick={() => confirm(() => handleUnblockUser(user.BlockedUsername))}
                      >
                        ยกเลิกบล็อก
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-300">ไม่มีผู้ใช้ที่ถูกบล็อก</p>
              )}
            </CardContent>
          </Card>


          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white">การจัดการบัญชี</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg">
                <h4 className="text-white font-medium">ลบบัญชี (การลบบัญชีจะเป็นการลบบัญชีถาวร)</h4>
                <Button
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  onClick={() => confirm(handleDeleteAccount)}
                >
                  ลบบัญชี
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Confirm Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>คุณแน่ใจหรือไม่?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">โปรดยืนยันการดำเนินการนี้</p>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              ยกเลิก
            </Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={executeConfirmedAction}
            >
              ดำเนินการต่อ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDialog_passwords} onOpenChange={setShowDialog_password}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>คุณแน่ใจหรือไม่?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">โปรดยืนยันการดำเนินการนี้</p>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDialog_password(false)}>
              ยกเลิก
            </Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={executeConfirmedAction_password}
            >
              ดำเนินการต่อ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Settings;
