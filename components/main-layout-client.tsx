"use client";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { PanelLeft, LogOut } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

export default function MainLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { status, data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // Auto logout dan redirect jika tidak ada session
  useEffect(() => {
    if (status === "unauthenticated" && pathname !== "/login") {
      // Clear any stale session data
      if (typeof window !== "undefined") {
        // Force sign out to clear any cached session
        signOut({ redirect: false }).then(() => {
          router.replace("/login");
        });
      }
    }
  }, [status, pathname, router, signOut]);

  // Untuk halaman login, jangan tampilkan sidebar/layout admin
  if (pathname === "/login") {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }

  return (
    <div
      className={
        isMobile ? "flex h-screen bg-gray-50 pt-16" : "flex h-screen bg-gray-50"
      }
    >
      {isMobile ? (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-50 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <PanelLeft />
          </Button>
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        </>
      ) : (
        <Sidebar />
      )}
      <main className="flex-1 overflow-auto">
        <div className="flex items-center justify-end px-6 pt-4 space-x-4">
          {session?.user?.email && (
            <span className="text-sm text-gray-600">
              Masuk sebagai{" "}
              <span className="font-medium">{session.user.email}</span>
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Keluar
          </Button>
        </div>
        <div className="p-6 pt-2">{children}</div>
      </main>
      <Toaster />
    </div>
  );
}
