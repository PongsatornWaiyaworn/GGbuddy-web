import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/Sidebar";
import { Settings as SettingsIcon, Shield, UserX, Eye, EyeOff } from "lucide-react";

const Settings = () => {
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [blockUsername, setBlockUsername] = useState('');
  const [blockedUsers, setBlockedUsers] = useState([
    { id: 1, username: 'Teehid', blockedDate: '2024-01-15' },
    { id: 2, username: 'Tidhin', blockedDate: '2024-01-10' },
    { id: 3, username: 'Tee', blockedDate: '2024-01-05' }
  ]);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alert('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }
    console.log('Password change submitted');
    setPasswords({ current: '', new: '', confirm: '' });
  };

  const handleBlockUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockUsername.trim()) return;
    
    const newBlockedUser = {
      id: blockedUsers.length + 1,
      username: blockUsername,
      blockedDate: new Date().toISOString().split('T')[0]
    };
    
    setBlockedUsers([...blockedUsers, newBlockedUser]);
    setBlockUsername('');
    console.log('Blocked user:', blockUsername);
  };

  const handleUnblockUser = (userId: number) => {
    setBlockedUsers(blockedUsers.filter(user => user.id !== userId));
    console.log('Unblocking user:', userId);
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-orange-900 via-red-900 to-orange-800">
      <Sidebar />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <SettingsIcon />
              ตั้งค่า
            </h1>
            <p className="text-gray-300">จัดการบัญชีและความปลอดภัยของคุณ</p>
          </div>

          {/* Change Password Section */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield />
                เปลี่ยนรหัสผ่าน
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <div>
                  <Label htmlFor="currentPassword" className="text-white">รหัสผ่านปัจจุบัน</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      className="bg-gray-800 border-gray-600 text-white pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      onClick={() => togglePasswordVisibility('current')}
                    >
                      {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="newPassword" className="text-white">รหัสผ่านใหม่</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      className="bg-gray-800 border-gray-600 text-white pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      onClick={() => togglePasswordVisibility('new')}
                    >
                      {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-white">ยืนยันรหัสผ่านใหม่</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      className="bg-gray-800 border-gray-600 text-white pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      onClick={() => togglePasswordVisibility('confirm')}
                    >
                      {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  เปลี่ยนรหัสผ่าน
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Block User Section */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <UserX />
                บล็อกผู้ใช้
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBlockUser} className="space-y-4 max-w-md mb-6">
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

          {/* Blocked Users Section */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <UserX />
                ผู้ใช้ที่ถูกบล็อก
              </CardTitle>
            </CardHeader>
            <CardContent>
              {blockedUsers.length > 0 ? (
                <div className="space-y-3">
                  {blockedUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">{user.username}</h4>
                        <p className="text-gray-400 text-sm">บล็อกเมื่อ: {new Date(user.blockedDate).toLocaleDateString('th-TH')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">บล็อกแล้ว</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnblockUser(user.id)}
                          className="border-gray-400 text-black hover:bg-gray-700"
                        >
                          ยกเลิกบล็อก
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserX size={48} className="text-gray-400 mx-auto mb-4" />
                  <h3 className="text-white font-medium mb-2">ไม่มีผู้ใช้ที่ถูกบล็อก</h3>
                  <p className="text-gray-400">คุณยังไม่ได้บล็อกผู้ใช้คนใด</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white">การจัดการบัญชี</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div>
                  <h4 className="text-white font-medium">ออกจากระบบ</h4>
                </div>
                <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">
                  ออกจากระบบ
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
