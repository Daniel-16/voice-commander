"use client";

import * as React from "react";
import { useAuth } from "../utils/AuthContext";
import {
  FaYoutube,
  FaEnvelope,
  FaCalendar,
  FaTwitter,
  FaGoogleDrive,
} from "react-icons/fa";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { ChevronRight, Menu, AlignLeft } from "lucide-react";

interface ChatSidebarProps {
  isMobile?: boolean;
}

const ChatSidebar = ({ isMobile = false }: ChatSidebarProps) => {
  const { signOut, user } = useAuth();
  const [showLogout, setShowLogout] = React.useState(false);

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      {isMobile && (
        <SidebarTrigger className="fixed top-4 left-4 z-50">
          <Menu className="w-6 h-6 text-gray-400" />
        </SidebarTrigger>
      )}
      <Sidebar className="bg-[#18181B]">
        {/* <SidebarHeader>
          <div
            className="flex items-center w-full cursor-pointer px-4"
            onMouseEnter={() => setShowLogout(true)}
            onMouseLeave={() => setShowLogout(false)}
          >
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm mr-3">
              {user?.email?.[0].toUpperCase() || "D"}
            </div>
            <div className="flex-1">
              <div className="text-sm text-white font-medium">
                {user?.user_metadata?.full_name}
              </div>
              {showLogout && (
                <button
                  onClick={signOut}
                  className="text-xs text-red-500 hover:text-red-400 transition-colors mt-0.5"
                >
                  Log out
                </button>
              )}
            </div>
          </div>
        </SidebarHeader> */}

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-gray-400 uppercase tracking-wider px-3">
              Tools
            </SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="bg-blue-500/10" isActive>
                  <FaYoutube className="w-4 h-4 text-red-500" />
                  <span className="text-gray-300">YouTube Tools</span>
                  <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-500 text-black">
                    Active
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton>
                  <FaEnvelope className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Gmail</span>
                  <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                    Inactive
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton>
                  <FaCalendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Google Calendar</span>
                  <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                    Inactive
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton>
                  <FaTwitter className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">X</span>
                  <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                    Inactive
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton>
                  <FaGoogleDrive className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Google Drive</span>
                  <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                    Inactive
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-gray-800">
          <div className="flex items-center gap-3 p-4">
            <div className="px-2.5 py-1 rounded-full flex items-center justify-center text-white" style={{backgroundColor: user?.user_metadata?.color || '#4F46E5'}}>
              {user?.user_metadata?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-400 font-medium">
                {user?.user_metadata?.full_name}
              </div>
              {/* <div className="text-xs text-gray-500">
                {user?.email}
              </div> */}
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
};

export default ChatSidebar;
