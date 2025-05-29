import { useState } from "react";
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
  const [blockUsername, setBlockUsername] = useState("");
  const [blockedUsers, setBlockedUsers] = useState([
    { id: 1, username: "Teehid", blockedDate: "2024-01-15" },
    { id: 2, username: "Tidhin", blockedDate: "2024-01-10" },
    { id: 3, username: "Tee", blockedDate: "2024-01-05" },
  ]);

  const [confirmAction, setConfirmAction] = useState<null | (() => void)>(null);
  const [showDialog, setShowDialog] = useState(false);

  const confirm = (action: () => void) => {
    setConfirmAction(() => action);
    setShowDialog(true);
  };

  const executeConfirmedAction = () => {
    if (confirmAction) confirmAction();
    setShowDialog(false);
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handlePasswordChange = () => {
    if (passwords.new !== passwords.confirm) {
      alert("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }
    console.log("Password changed");
    setPasswords({ current: "", new: "", confirm: "" });
  };

  const handleBlockUser = () => {
    if (!blockUsername.trim()) return;
    const newUser = {
      id: blockedUsers.length + 1,
      username: blockUsername,
      blockedDate: new Date().toISOString().split("T")[0],
    };
    setBlockedUsers([...blockedUsers, newUser]);
    setBlockUsername("");
  };

  const handleUnblockUser = (userId: number) => {
    setBlockedUsers(blockedUsers.filter((u) => u.id !== userId));
  };

  const handleDeleteAccount = () => {
    console.log("Account deleted!");
  };

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-orange-900 via-red-900 to-orange-800">
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
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  confirm(handlePasswordChange);
                }}
                className="space-y-4 max-w-md"
              >
                {["current", "new", "confirm"].map((field, idx) => (
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
            </CardContent>
          </Card>

          {/* Block User */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <UserX /> บล็อกผู้ใช้
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  confirm(handleBlockUser);
                }}
                className="space-y-4 max-w-md"
              >
                <div>
                  <Label htmlFor="blockUsername" className="text-white">ชื่อผู้ใช้ที่ต้องการบล็อก</Label>
                  <Input
                    id="blockUsername"
                    value={blockUsername}
                    onChange={(e) => setBlockUsername(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="ใส่ชื่อผู้ใช้"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                >
                  บล็อก
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Blocked Users */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <UserX /> ผู้ใช้ที่ถูกบล็อก
              </CardTitle>
            </CardHeader>
            <CardContent>
              {blockedUsers.length > 0 ? (
                blockedUsers.map((user) => (
                  <div key={user.id} className="flex justify-between items-center p-3 bg-gray-800 rounded-lg mb-2">
                    <div>
                      <h4 className="text-white font-medium">{user.username}</h4>
                      <p className="text-gray-400 text-sm">บล็อกเมื่อ: {new Date(user.blockedDate).toLocaleDateString('th-TH')}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge variant="destructive">บล็อกแล้ว</Badge>
                      <Button
                        variant="outline"
                        className="text-black border-gray-400 hover:bg-gray-700"
                        onClick={() => confirm(() => handleUnblockUser(user.id))}
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

          {/* Account Actions */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white">การจัดการบัญชี</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg">
                <h4 className="text-white font-medium">ลบบัญชี</h4>
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
    </div>
  );
};

export default Settings;
