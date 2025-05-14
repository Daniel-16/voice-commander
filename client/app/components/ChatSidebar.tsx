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
import { ChevronsUpDown, Menu, AlignLeft } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatSidebarProps {
  isMobile?: boolean;
}

const ChatSidebar = ({ isMobile = false }: ChatSidebarProps) => {
  const { signOut, user } = useAuth();

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      {isMobile && (
        <SidebarTrigger className="fixed top-4 left-4 z-50">
          <Menu className="w-6 h-6 text-gray-400" />
        </SidebarTrigger>
      )}
      <Sidebar className="bg-[#18181B]">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-gray-400 uppercase tracking-wider px-3 font-bold mb-2">
              Tools
            </SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem className="mb-2">
                <SidebarMenuButton className="bg-blue-500/10" isActive>
                  <FaYoutube className="w-4 h-4 text-red-500" />
                  <span className="text-gray-300">YouTube Tools</span>
                  <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-500 text-black">
                    Active
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem className="mb-2">
                <SidebarMenuButton>
                  <FaEnvelope className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Gmail</span>
                  <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                    Inactive
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem className="mb-2">
                <SidebarMenuButton>
                  <FaCalendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Google Calendar</span>
                  <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                    Inactive
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem className="mb-2">
                <SidebarMenuButton>
                  <FaTwitter className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">X</span>
                  <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                    Inactive
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem className="mb-2">
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

        <SidebarFooter className="border-t border-gray-800 rounded-md">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center rounded-lg gap-3 p-4 cursor-pointer hover:bg-gray-800/50">
                <div className="px-2.5 py-1 rounded-full flex items-center justify-center text-white" style={{backgroundColor: user?.user_metadata?.color || '#4F46E5'}}>
                  {user?.user_metadata?.full_name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-400 font-medium">
                    {user?.user_metadata?.full_name}
                  </div>
                </div>
                <ChevronsUpDown className="w-4 h-4 text-gray-400" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" side="top">
              {/* <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator /> */}
              {/* <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator /> */}
              <DropdownMenuItem onClick={signOut} className="cursor-pointer text-red-500">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
};

export default ChatSidebar;
