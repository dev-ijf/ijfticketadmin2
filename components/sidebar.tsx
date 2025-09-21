"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Users,
  ShoppingCart,
  CreditCard,
  Tag,
  FileText,
  BarChart3,
  Home,
  Bell,
  MessageSquare,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Events & Tickets", href: "/events", icon: Calendar },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Tickets", href: "/tickets", icon: FileText },
  { name: "Scan", href: "/scan-ticket", icon: QrCode },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Discounts", href: "/discounts", icon: Tag },
  {
    name: "Payment & Instructions",
    href: "/payment-channels",
    icon: CreditCard,
  },
  {
    name: "Notification Templates",
    href: "/notification-templates",
    icon: Bell,
  },
  { name: "Payment Logs", href: "/payment-logs", icon: BarChart3 },
  {
    name: "Notification Logs",
    href: "/notification-logs",
    icon: MessageSquare,
  },
];

export function Sidebar({
  open,
  setOpen,
}: { open?: boolean; setOpen?: (open: boolean) => void } = {}) {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const sidebarContent = (
    <div className="flex h-full w-64 flex-col bg-gradient-to-b from-purple-600 to-purple-800">
      <div className="flex h-20 shrink-0 items-center justify-center px-6">
        <Image
          src="/logo-main-new.png"
          alt="Kreativa Global School"
          width={64}
          height={64}
          className="h-16 w-16"
        />
      </div>
      <nav className="flex flex-1 flex-col px-4 pb-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={cn(
                  pathname === item.href
                    ? "bg-purple-700 text-white"
                    : "text-white hover:text-white hover:bg-purple-700/50", // Changed from text-purple-100 to text-white for better contrast
                  "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors",
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );

  if (isMobile && open !== undefined && setOpen) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="p-0 w-64 max-w-full bg-gradient-to-b from-purple-600 to-purple-800"
        >
          {sidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="hidden md:flex h-full w-64 flex-col bg-gradient-to-b from-purple-600 to-purple-800">
      {sidebarContent}
    </div>
  );
}
