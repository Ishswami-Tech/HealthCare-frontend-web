"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "../../ui/sidebar";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useLoadingOverlay } from "@/app/providers/LoadingOverlayContext";

export interface SidebarLinkItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export interface GlobalSidebarProps {
  links: SidebarLinkItem[];
  user: { name: string; avatarUrl?: string };
  children: React.ReactNode;
}

const Logo = () => (
  <Link
    href="#"
    className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
  >
    <span className="font-medium whitespace-pre text-black dark:text-white">
      Ishswami
    </span>
  </Link>
);

const LogoIcon = () => (
  <a
    href="#"
    className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
  >
    <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-red-500 dark:bg-white" />
  </a>
);

export default function GlobalSidebar({ links, user, children }: GlobalSidebarProps) {
  const [open, setOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const firstLetter = user.name?.charAt(0).toUpperCase() || "U";
  const { logout } = useAuth();
  const router = useRouter();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { setOverlay } = useLoadingOverlay();

  // Memoize a random color for this user (based on their name)
  const avatarColor = React.useMemo(() => {
    const COLORS = [
      "bg-blue-400",
      "bg-green-400",
      "bg-pink-400",
      "bg-yellow-400",
      "bg-purple-400",
      "bg-red-400",
      "bg-indigo-400",
      "bg-teal-400",
      "bg-orange-400",
    ];
    if (!user.name) return COLORS[0];
    const hash = user.name.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return COLORS[hash % COLORS.length];
  }, [user.name]);

  const handleLinkClick = (link: SidebarLinkItem, e: React.MouseEvent) => {
    if (link.label === "Logout") {
      e.preventDefault();
      setShowLogoutDialog(true);
    }
  };

  const handleLogoutConfirm = async () => {
    setOverlay({ show: true, variant: "logout" }); // Show global overlay
    try {
      await logout();
      router.replace("/auth/login");
    } catch {
      setOverlay({ show: false });
      toast.error("Logout failed. Please try again.");
      router.replace("/auth/login");
    } finally {
      setShowLogoutDialog(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          "flex w-full max-w-7xl flex-1 flex-col overflow-hidden border-gray-200 bg-white md:flex-row",
          "h-screen"
        )}
      >
        <Sidebar open={open} setOpen={setOpen}>
          <SidebarBody className="justify-between gap-10 bg-white text-gray-900 rounded-lg border-1 m-1 border-gray-200 ">
            <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
              <div className="bg-white rounded-lg shadow p-3 my-6 flex items-center justify-center">
                {open ? <Logo /> : <LogoIcon />}
              </div>
              <div className="mt-2 flex flex-col gap-2">
                {links.map((link, idx) => {
                  const isLogout = link.label === "Logout";
                  return (
                    <div
                      key={idx}
                      onClick={isLogout ? (e) => handleLinkClick(link, e) : undefined}
                      role={isLogout ? "button" : undefined}
                      tabIndex={isLogout ? 0 : undefined}
                    >
                      <SidebarLink
                        link={{ ...link, href: isLogout ? "#" : link.href }}
                        className={
                          isLogout
                            ? "bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 font-semibold transition-colors duration-200 rounded-lg px-3 py-2"
                            : "hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200 rounded-lg px-3 py-2 text-gray-900"
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <SidebarLink
                link={{
                  label: user.name,
                  href: "#",
                  icon: !avatarError && user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      className="size-9 shrink-0 rounded-full object-cover"
                      width={50}
                      height={50}
                      alt="Avatar"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <div className={`size-6 flex items-center justify-center rounded-lg ${avatarColor} text-white font-bold text-md`}>
                      {firstLetter}
                    </div>
                  ),
                }}
                className="bg-gray-100 rounded-lg px-3 py-2 text-gray-900 transition-colors duration-200 hover:bg-gray-200"
              />
            </div>
          </SidebarBody>
        </Sidebar>
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          {children}
        </div>
      </div>
      
      {/* Dialog moved outside sidebar structure to ensure it appears above mobile sidebar */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent showCloseButton={true} className="!z-[9999]">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTitle>Are you sure you want to logout?</AlertTitle>
            <AlertDescription>
              You will be redirected to the login page and your session will end.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <button
              className="bg-gray-200 text-gray-900 rounded px-4 py-2 mr-2"
              onClick={() => setShowLogoutDialog(false)}
            >
              Cancel
            </button>
            <button
              className="bg-red-600 text-white rounded px-4 py-2 flex items-center gap-2"
              onClick={handleLogoutConfirm}
            >
              Logout
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 