'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'; // <-- Added reset function
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false); // <-- Added state for Remember Me

  // Load saved email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('ladoo_saved_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // THE REAL FIREBASE LOGIN
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Look up this user in the Firestore 'users' collection to get tenantId
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      let targetPath = '/admin'; // fallback
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.role === 'super_admin') {
          targetPath = '/super-admin';
        } else if (data.tenantId) {
          targetPath = `/${data.tenantId}/admin`;
        }
      }
      
      // REMEMBER ME LOGIC
      if (rememberMe) {
        localStorage.setItem('ladoo_saved_email', email);
      } else {
        localStorage.removeItem('ladoo_saved_email');
      }

      // If it succeeds, send them to the Admin Dashboard dynamically
      router.push(targetPath);
    } catch (error: any) {
      console.error("Login failed:", error);
      toast.error("Invalid email or password. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address in the box first to reset your password.");
      return;
    }
    
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error: any) {
      console.error("Password reset failed:", error);
      toast.error(`Failed to send reset email: ${error.message || error}. Please ensure this email is registered.`);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Left Side: The Form */}
      <div className="flex w-full flex-col justify-center px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-3xl font-black tracking-tight text-foreground">Welcome back.</h1>
            <p className="mt-2 text-sm font-medium text-muted-foreground">Sign in to your Ladoo powered by Drivesync POS workspace.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              {/* Email Input */}
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <FiMail className="text-muted-foreground" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@cafe.com"
                  className="block w-full rounded-2xl border border-border bg-input p-4 pl-12 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              {/* Password Input */}
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <FiLock className="text-muted-foreground" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-2xl border border-border bg-input p-4 pl-12 pr-12 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground hover:text-foreground focus:outline-none"
                >
                  {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-ring cursor-pointer" 
                /> 
                Remember me
              </label>
              <button 
                onClick={handleForgotPassword} 
                type="button"
                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary p-4 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-70"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary-foreground"></div>
              ) : (
                <>Sign In <FiArrowRight /></>
              )}
            </button>
          </form>
          {/* Quick Cashier Login Hint for Testing */}
          <div className="mt-8 rounded-xl bg-muted p-4 text-center text-xs text-muted-foreground">
            <p><strong>Test:</strong> tenant_001@ladoo.com / Cafe@123</p>
            <p className="mt-1">Any other login routes to POS.</p>
          </div>
        </div>
      </div>
    </div>
  );
}