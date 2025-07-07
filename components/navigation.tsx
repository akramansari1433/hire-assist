"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BriefcaseIcon, FileTextIcon, SearchIcon, HistoryIcon, HomeIcon, UsersIcon } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/",
      label: "Home",
      icon: HomeIcon,
      current: pathname === "/",
    },
    {
      href: "/jobs",
      label: "Jobs",
      icon: BriefcaseIcon,
      current: pathname === "/jobs",
    },
    {
      href: "/resumes",
      label: "Resumes",
      icon: FileTextIcon,
      current: pathname === "/resumes",
    },
    {
      href: "/matching",
      label: "Matching",
      icon: SearchIcon,
      current: pathname === "/matching",
    },
    {
      href: "/history",
      label: "History",
      icon: HistoryIcon,
      current: pathname === "/history",
    },
  ];

  return (
    <nav className="border-b bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <UsersIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">Hire Assist</span>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
              AI-Powered
            </Badge>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={item.current ? "default" : "ghost"}
                    size="sm"
                    className={`gap-2 ${
                      item.current
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm">
              Menu
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
