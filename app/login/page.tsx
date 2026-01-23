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
    <div
      className="min-h-screen relative flex items-stretch justify-center bg-slate-900 text-slate-900"
      style={{
        // Background foto aktivitas sekolah dari Pexels
        // Bisa diganti dengan foto lain yang lebih sesuai kebutuhan
        backgroundImage:
          'url("https://tguray8zidjbrs4r.public.blob.vercel-storage.com/logo/bg.png")',
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay ungu untuk memberi tone konsisten dan tetap terbaca */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/40 via-fuchsia-500/35 to-indigo-500/40" />

      {/* Desktop layout: split left (form) & right (hero) */}
      <div className="relative z-10 flex flex-col md:flex-row w-full max-w-6xl min-h-screen md:min-h-[620px]">
        {/* Left column: login card */}
        <div className="w-full md:w-[40%] flex items-center justify-center px-4 py-8 min-h-screen md:min-h-0">
          <Card className="w-full max-w-md bg-white/95 backdrop-blur shadow-2xl border border-slate-100">
            <CardContent className="p-8">
              {!loading && (
                <div className="flex flex-col items-center text-center gap-6">
                  {/* Header logo dengan background berwarna untuk logo teks putih */}
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-500 flex items-center justify-center shadow-lg">
                    <img
                      src={logo}
                      alt={appName}
                      className="w-14 h-14 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = "/logo-main-new.png";
                      }}
                    />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                      {appName}
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                      Masuk ke sistem manajemen tiket dan kehadiran Anda.
                    </p>
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center text-center gap-6">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-500 flex items-center justify-center shadow-lg">
                    <div className="w-10 h-10 border-4 border-indigo-200 border-t-white rounded-full animate-spin" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                      {appName}
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">Memuat...</p>
                  </div>
                </div>
              )}

              <div className="mt-8 space-y-6">
                <div className="text-center">
                  <p className="text-xs md:text-sm text-slate-600">
                    Gunakan akun Google yang telah terdaftar untuk mengakses
                    dashboard admin.
                  </p>
                </div>

                <Button
                  className="w-full h-12 md:h-14 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-3 text-sm md:text-base font-semibold"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6"
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
                  <p className="text-[11px] md:text-xs text-slate-500">
                    Dengan masuk, Anda menyetujui{" "}
                    <span className="text-indigo-600 font-medium">
                      Syarat &amp; Ketentuan
                    </span>{" "}
                    dan{" "}
                    <span className="text-indigo-600 font-medium">
                      Kebijakan Privasi
                    </span>
                    .
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: hero section (hidden on mobile) */}
        <div className="hidden md:flex w-[60%] relative items-center justify-center px-10 py-10 text-white">
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/80 via-slate-900/40 to-transparent" />

          <div className="relative z-10 max-w-xl space-y-6">
            <p className="text-sm font-semibold tracking-wide text-indigo-200 uppercase">
              IJF Ticket Admin
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
              Kelola Tiket Event dengan Lebih Efisien
            </h2>
            <p className="text-sm lg:text-base text-slate-100/90">
              Pantau penjualan tiket, kelola kehadiran, dan optimalkan
              pengalaman peserta dalam satu panel admin yang terpadu.
            </p>
            <div className="space-y-3 text-sm lg:text-base">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-6 w-6 rounded-full bg-indigo-500/90 flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div>
                  <p className="font-semibold">Realtime Ticket Monitoring</p>
                  <p className="text-slate-100/80 text-sm">
                    Lihat progres penjualan dan check-in peserta secara
                    langsung.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-6 w-6 rounded-full bg-indigo-500/90 flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div>
                  <p className="font-semibold">Tim Lebih Terkoordinasi</p>
                  <p className="text-slate-100/80 text-sm">
                    Berikan akses terkontrol untuk operator dan tim lapangan.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-6 w-6 rounded-full bg-indigo-500/90 flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <div>
                  <p className="font-semibold">Laporan Siap Pakai</p>
                  <p className="text-slate-100/80 text-sm">
                    Unduh laporan transaksi dan kehadiran untuk evaluasi event.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Toaster />
    </div>
  );
}
