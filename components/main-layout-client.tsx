"use client";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";

export default function MainLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
        <div className="p-6">{children}</div>
      </main>
      <Toaster />
    </div>
  );
}
