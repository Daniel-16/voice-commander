import { createClient } from "./supabase";
import { UAParser } from "ua-parser-js";

export interface LoginInfo {
  user_id: string;
  device_info: {
    browser: string;
    os: string;
    device: string;
  };
  ip_address: string;
  login_date: string;
}

export async function trackLogin(userId: string): Promise<void> {
  console.log("Starting login tracking for user:", userId);
  const supabase = createClient();

  // Get device information
  const parser = new UAParser();
  const result = parser.getResult();

  const deviceInfo = {
    browser: `${result.browser.name} ${result.browser.version}`,
    os: `${result.os.name} ${result.os.version}`,
    device: result.device.type || "desktop",
  };
  console.log("Device info collected:", deviceInfo);

  // Get IP address
  let ipAddress = "";
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    ipAddress = data.ip;
    console.log("IP address fetched:", ipAddress);
  } catch (error) {
    console.error("Error fetching IP address:", error);
    ipAddress = "unknown";
  }

  const loginInfo: LoginInfo = {
    user_id: userId,
    device_info: deviceInfo,
    ip_address: ipAddress,
    login_date: new Date().toISOString(),
  };
  console.log("Prepared login info:", loginInfo);

  try {
    console.log("Attempting to insert login info into Supabase...");
    const { error } = await supabase.from("login_history").insert([loginInfo]);

    if (error) {
      console.error("Supabase insert error:", error);
      throw error;
    }
    console.log("Successfully tracked login info in Supabase");
  } catch (error) {
    console.error("Error tracking login:", error);
  }
}
