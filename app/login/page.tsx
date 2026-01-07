"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [logo, setLogo] = useState("/logo-main-new.png");
  const [appName, setAppName] = useState("IJF Ticket Admin");
  const [loading, setLoading] = useState(true);

  // Fetch logo and app name from settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const settings = await response.json();
          const logoSetting = settings.find(
            (s: any) => s.key === "app_logo",
          );
          const nameSetting = settings.find(
            (s: any) => s.key === "app_name",
          );
          if (logoSetting?.value) setLogo(logoSetting.value);
          if (nameSetting?.value) setAppName(nameSetting.value);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Handle error from query params
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      let errorMessage = "Gagal melakukan login. Silakan coba lagi.";
      
      if (error === "AccessDenied") {
        errorMessage =
          "Email Anda tidak terdaftar di sistem. Hubungi administrator untuk mendapatkan akses.";
      } else if (error === "Configuration") {
        errorMessage =
          "Terjadi kesalahan konfigurasi. Silakan hubungi administrator.";
      } else if (error === "OAuthSignin") {
        errorMessage = "Gagal memulai proses login dengan Google.";
      } else if (error === "OAuthCallback") {
        errorMessage = "Gagal memproses callback dari Google.";
      } else if (error === "OAuthCreateAccount") {
        errorMessage = "Gagal membuat akun. Email mungkin sudah digunakan.";
      } else if (error === "EmailCreateAccount") {
        errorMessage = "Gagal membuat akun dengan email tersebut.";
      } else if (error === "Callback") {
        errorMessage = "Terjadi kesalahan saat memproses callback.";
      } else if (error === "OAuthAccountNotLinked") {
        errorMessage =
          "Akun Google ini sudah terhubung dengan akun lain. Gunakan email yang terdaftar.";
      } else if (error === "EmailSignin") {
        errorMessage = "Gagal mengirim email verifikasi.";
      } else if (error === "CredentialsSignin") {
        errorMessage = "Kredensial yang diberikan tidak valid.";
      } else if (error === "SessionRequired") {
        errorMessage = "Sesi Anda telah berakhir. Silakan login kembali.";
      }

      toast({
        title: "Login Gagal",
        description: errorMessage,
        variant: "destructive",
      });

      // Remove error from URL
      router.replace("/login");
    }
  }, [searchParams, router, toast]);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated Background with Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-indigo-700"></div>
      
      {/* Animated Blob Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      ></div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md px-4">
        <Card className="shadow-2xl border-0 overflow-hidden bg-white">
          {/* Header with Solid Color */}
          <div className="bg-purple-700 p-8 text-center relative overflow-hidden">
            {/* Decorative Circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
            
            {!loading && (
              <div className="flex flex-col items-center gap-4 relative z-10">
                <div className="w-28 h-28 bg-white rounded-full p-4 shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
                  <img
                    src={logo}
                    alt={appName}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "/logo-main-new.png";
                    }}
                  />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                    {appName}
                  </h1>
                  <p className="text-purple-100 text-sm font-medium">
                    Masuk ke sistem admin
                  </p>
                </div>
              </div>
            )}
            {loading && (
              <div className="flex flex-col items-center gap-4 relative z-10">
                <div className="w-28 h-28 bg-white rounded-full p-4 shadow-2xl flex items-center justify-center">
                  <div className="w-14 h-14 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                    {appName}
                  </h1>
                  <p className="text-purple-100 text-sm font-medium">
                    Memuat...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <CardContent className="p-8 bg-white">
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-700 text-sm mb-6 font-medium">
                  Gunakan akun Google yang sudah terdaftar di sistem untuk
                  melanjutkan
                </p>
              </div>

              <Button
                className="w-full h-14 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 text-base font-semibold hover:scale-[1.02] active:scale-[0.98]"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Masuk dengan Google
              </Button>

              <div className="text-center">
                <p className="text-xs text-gray-600 font-medium">
                  Hanya email yang terdaftar di sistem yang dapat mengakses
                  halaman ini
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  );
}
