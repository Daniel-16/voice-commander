import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lotczbzqzkdbmtqucnya.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseAnonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const updateUserMessageLimit = async (
  userId: string,
  remainingMessages: number
) => {
  try {
    const { data: existingData, error: checkError } = await supabase
      .from("user_message_limits")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking user message limits:", checkError);
      throw checkError;
    }

    const { data, error } = await supabase
      .from("user_message_limits")
      .upsert(
        {
          user_id: userId,
          remaining_messages: remainingMessages,
          last_reset: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error updating message limit:", error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error("Failed to update message limit:", err);
    throw err;
  }
};

export const getUserMessageLimit = async (userId: string) => {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw new Error("Authentication error: No valid session");
    }

    if (!session) {
      throw new Error("Authentication error: Please sign in");
    }

    const { data, error } = await supabase
      .from("user_message_limits")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Database error:", error);
      throw error;
    }

    if (
      !data ||
      new Date().getTime() - new Date(data.last_reset).getTime() >=
        24 * 60 * 60 * 1000
    ) {
      const newData = await updateUserMessageLimit(userId, 3);
      return newData;
    }

    return data;
  } catch (err) {
    console.error("Failed to get message limit:", err);
    throw err;
  }
};
