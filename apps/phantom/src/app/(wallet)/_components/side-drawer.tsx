import React from "react";
import { User, MessageCircle, Clock, Settings, Info } from "lucide-react";
import Avatar from "./avatar";
import { useWalletStore } from "@/lib/wallet-store";

interface SideDrawerProps {
  onNavigate: (path: string) => void;
}

export default function SideDrawer({ onNavigate }: SideDrawerProps) {
  const { profile, walletName } = useWalletStore();

  const accountLabel = walletName || "Account 1";
  const initials = accountLabel
    .split(' ')
    .slice(0, 2)
    .map(word => word[0]?.toUpperCase() || '')
    .join('');

  const menuItems = [
    {
      label: accountLabel,
      icon: (
        <div className="w-6 h-6 rounded-full bg-[#1e1e1e] border border-white/5 flex items-center justify-center text-[10px] font-bold text-[#888]">
          {initials}
        </div>
      ),
      path: null, // No routing for now
    },
    {
      label: "Profile",
      icon: <img src="/icons/user_white.webp" alt="Profile" className="w-[20px] h-[20px] object-contain" />,
      path: "/settings/edit-profile",
    },
    {
      label: "Chats",
      icon: <img src="/icons/chat_white.webp" alt="Chats" className="w-[20px] h-[20px] object-contain" />,
      path: "/chats",
    },
    {
      label: "History",
      icon: <img src="/icons/history_white.webp" alt="History" className="w-[20px] h-[20px] object-contain" />,
      path: "/activity",
    },
  ];

  const bottomItems = [
    {
      label: "Settings",
      icon: <img src="/icons/settings_white.webp" alt="Settings" className="w-[20px] h-[20px] object-contain opacity-80" />,
      path: "/settings",
    },
    {
      label: "Help & Support",
      icon: <img src="/icons/info_white.webp" alt="Help" className="w-[20px] h-[20px] object-contain opacity-80" />,
      path: null,
    },
  ];

  return (
    <div className="fixed inset-0 z-0 bg-black pt-[calc(30px+env(safe-area-inset-top))] pb-[calc(20px+env(safe-area-inset-bottom))] px-6 flex flex-col justify-between w-[75vw]">
      {/* Top Section */}
      <div className="flex flex-col">
        <div className="mb-4">
          <Avatar
            iconIndex={profile.iconIndex}
            avatarType={profile.avatarType}
            size={64}
          />
        </div>

        <h2 className="text-white text-[32px] font-bold tracking-tight mb-8">
          {profile.username ? `@${profile.username}` : "@Account"}
        </h2>

        <div className="flex flex-col gap-6">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => item.path && onNavigate(item.path)}
              className="flex items-center gap-5 text-left active:opacity-60 transition-opacity"
            >
              <div className="w-6 flex justify-center">
                {item.icon}
              </div>
              <span className="text-white text-[20px] font-semibold tracking-tight">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col gap-6">
        {bottomItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => item.path && onNavigate(item.path)}
            className="flex items-center gap-5 text-left active:opacity-60 transition-opacity"
          >
            <div className="w-6 flex justify-center">
              {item.icon}
            </div>
            <span className="text-white text-[20px] font-medium tracking-tight">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
