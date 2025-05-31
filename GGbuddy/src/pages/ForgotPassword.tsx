// import { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Link, useNavigate } from "react-router-dom";
// import { Mail, Key } from "lucide-react";

// const ForgotPassword = () => {
//   const [email, setEmail] = useState('');
//   const [otp, setOtp] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
//   const [timeLeft, setTimeLeft] = useState(0);
//   const [errorMessage, setErrorMessage] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const navigate = useNavigate();

//   // Timer countdown
//   useEffect(() => {
//     if (timeLeft <= 0) return;

//     const timer = setInterval(() => {
//       setTimeLeft(prev => prev - 1);
//     }, 1000);

//     return () => clearInterval(timer);
//   }, [timeLeft]);

//   const formatTime = (seconds: number) => {
//     const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
//     const secs = (seconds % 60).toString().padStart(2, '0');
//     return `${mins}:${secs}`;
//   };

//   const handleSendOtp = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setErrorMessage('');

//     try {
//       const response = await fetch('http://127.0.0.1:3000/forgot-password', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email })
//       });

//       if (!response.ok) throw new Error(await response.text());
      
//       setStep(2);
//       setTimeLeft(300); // 5 minutes
//     } catch (error) {
//       setErrorMessage(error.message || 'Failed to send OTP');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleVerifyOtp = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);

//     try {
//       const response = await fetch('http://127.0.0.1:3000/verify-forgot-password-otp', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, code: otp })
//       });

//       if (!response.ok) throw new Error(await response.text());
      
//       setStep(3);
//     } catch (error) {
//       setErrorMessage(error.message || 'Invalid OTP');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleResetPassword = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (newPassword !== confirmPassword) {
//       setErrorMessage('รหัสผ่านไม่ตรงกัน');
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const response = await fetch('http://127.0.0.1:3000/reset-password', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ 
//           email,
//           new_password: newPassword 
//         })
//       });

//       if (!response.ok) throw new Error(await response.text());
      
//       navigate('/login');
//     } catch (error) {
//       setErrorMessage(error.message || 'Failed to reset password');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-6">
//       <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20">
//         <CardHeader className="text-center">
            // <div className="mx-auto mb-4">
            //     <img 
            //     src="/public/LOGO GGbuddy.png" 
            //     alt="GGbuddy Logo" 
            //     className="h-16 mx-auto"
            //     onError={(e) => {
            //         e.currentTarget.style.display = 'none';
            //     }}
            //     />
            // </div>
//           <CardTitle className="text-2xl font-bold text-white flex items-center gap-2 justify-center">
//             {step === 1 ? <Mail /> : <Key />}
//             {step === 1 ? 'ลืมรหัสผ่าน' : step === 2 ? 'ยืนยัน OTP' : 'ตั้งรหัสผ่านใหม่'}
//           </CardTitle>
//         </CardHeader>
        
//         <CardContent>
//           {/* Step 1: Email Input */}
//           {step === 1 && (
//             <form onSubmit={handleSendOtp} className="space-y-4">
//               <div>
//                 <Label htmlFor="email" className="text-white">
//                   อีเมล
//                 </Label>
//                 <Input
//                   id="email"
//                   type="email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   className="bg-gray-800 border-gray-600 text-white"
//                   required
//                 />
//                 <p className="text-gray-400 text-sm mt-1">
//                   กรุณากรอกอีเมลที่ใช้สมัครสมาชิก
//                 </p>
//               </div>

//               {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}

//               <Button 
//                 type="submit" 
//                 className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
//                 disabled={isLoading}
//               >
//                 {isLoading ? 'กำลังส่ง...' : 'ส่ง OTP'}
//               </Button>
//             </form>
//           )}

//           {/* Step 2: OTP Verification */}
//           {step === 2 && (
//             <form onSubmit={handleVerifyOtp} className="space-y-4">
//               <p className="text-white">
//                 เราได้ส่งรหัส OTP ไปยัง <span className="text-orange-400">{email}</span>
//               </p>
              
//               <div>
//                 <Label htmlFor="otp" className="text-white">
//                   รหัส OTP
//                 </Label>
//                 <Input
//                   id="otp"
//                   type="text"
//                   maxLength={6}
//                   value={otp}
//                   onChange={(e) => setOtp(e.target.value)}
//                   className="bg-gray-800 border-gray-600 text-white text-center text-lg"
//                   required
//                 />
//                 <p className="text-gray-400 text-sm mt-1">
//                   เวลาที่เหลือ: {formatTime(timeLeft)}
//                 </p>
//               </div>

//               {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}

//               <Button 
//                 type="submit" 
//                 className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
//                 disabled={isLoading}
//               >
//                 {isLoading ? 'กำลังตรวจสอบ...' : 'ยืนยัน OTP'}
//               </Button>
//             </form>
//           )}

//           {/* Step 3: New Password */}
//           {step === 3 && (
//             <form onSubmit={handleResetPassword} className="space-y-4">
//               <div>
//                 <Label htmlFor="newPassword" className="text-white">
//                   รหัสผ่านใหม่
//                 </Label>
//                 <Input
//                   id="newPassword"
//                   type="password"
//                   value={newPassword}
//                   onChange={(e) => setNewPassword(e.target.value)}
//                   className="bg-gray-800 border-gray-600 text-white"
//                   required
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="confirmPassword" className="text-white">
//                   ยืนยันรหัสผ่านใหม่
//                 </Label>
//                 <Input
//                   id="confirmPassword"
//                   type="password"
//                   value={confirmPassword}
//                   onChange={(e) => setConfirmPassword(e.target.value)}
//                   className="bg-gray-800 border-gray-600 text-white"
//                   required
//                 />
//               </div>

//               {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}

//               <Button 
//                 type="submit" 
//                 className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
//                 disabled={isLoading}
//               >
//                 {isLoading ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
//               </Button>
//             </form>
//           )}

//           {/* Back to Login Link */}
//           <div className="mt-6 text-center">
//             <Link 
//               to="/login" 
//               className="text-orange-400 hover:text-orange-300 underline text-sm"
//             >
//               กลับไปหน้าเข้าสู่ระบบ
//             </Link>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default ForgotPassword;


import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Key, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

// Mock data for testing
const mockUsers = [
  { email: "user1@example.com", otp: "123456", password: "Password123!" },
  { email: "user2@example.com", otp: "654321", password: "SecurePass456!" },
];

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [timeLeft, setTimeLeft] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

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

    // Mock API call
    setTimeout(() => {
      const userExists = mockUsers.some(user => user.email === email);
      
      if (userExists) {
        setStep(2);
        setTimeLeft(300); // 5 minutes
        toast({
          title: "OTP Sent",
          description: `We've sent an OTP to ${email}`,
          variant: "default",
        });
      } else {
        setErrorMessage("Email not found. Please try again.");
      }
      setIsLoading(false);
    }, 1500);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock API call
    setTimeout(() => {
      const user = mockUsers.find(user => user.email === email);
      
      if (user && user.otp === otp) {
        setStep(3);
        toast({
          title: "OTP Verified",
          description: "You can now set your new password",
          variant: "default",
        });
      } else {
        setErrorMessage("Invalid OTP. Please try again.");
      }
      setIsLoading(false);
    }, 1500);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMessage('รหัสผ่านไม่ตรงกัน');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    // Mock API call
    setTimeout(() => {
      const userIndex = mockUsers.findIndex(user => user.email === email);
      
      if (userIndex !== -1) {
        // In a real app, you would update the password in your database
        mockUsers[userIndex].password = newPassword;
        
        toast({
          title: "Password Updated",
          description: "Your password has been successfully updated",
          variant: "default",
        });
        
        navigate('/login');
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
      setIsLoading(false);
    }, 2000);
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
            {step === 1 ? <Mail /> : <Key />}
            {step === 1 ? 'ลืมรหัสผ่าน' : step === 2 ? 'ยืนยัน OTP' : 'ตั้งรหัสผ่านใหม่'}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {/* Step 1: Email Input */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-white">
                  อีเมล
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  required
                />
                <p className="text-gray-400 text-sm mt-1">
                  กรุณากรอกอีเมลที่ใช้สมัครสมาชิก
                </p>
              </div>

              {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังส่ง...
                  </>
                ) : 'ส่ง OTP'}
              </Button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-white">
                เราได้ส่งรหัส OTP ไปยัง <span className="text-orange-400">{email}</span>
              </p>
              
              <div>
                <Label htmlFor="otp" className="text-white">
                  รหัส OTP
                </Label>
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
                  className="w-full bg-transparent text-white border-gray-600 hover:bg-gray-400"
                  onClick={() => setStep(1)}
                >
                  เปลี่ยนอีเมล
                </Button>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                  disabled={isLoading || timeLeft <= 0}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังตรวจสอบ...
                    </>
                  ) : 'ยืนยัน OTP'}
                </Button>
              </div>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <Label htmlFor="newPassword" className="text-white">
                  รหัสผ่านใหม่
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  required
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-white">
                  ยืนยันรหัสผ่านใหม่
                </Label>
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
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : 'เปลี่ยนรหัสผ่าน'}
              </Button>
            </form>
          )}

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <Link 
              to="/login" 
              className="text-orange-400 hover:text-orange-300 underline text-sm"
            >
              กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;