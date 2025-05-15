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
    // First check if the user exists in the table
    const { data: existingData, error: checkError } = await supabase
      .from("user_message_limits")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking user message limits:", checkError);
      throw checkError;
    }

    // If user doesn't exist, insert new record, otherwise update
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
    // First verify the user's session
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

    // Then try to get the message limits
    const { data, error } = await supabase
      .from("user_message_limits")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Database error:", error);
      throw error;
    }

    // If no data exists or it's time to reset
    if (
      !data ||
      new Date().getTime() - new Date(data.last_reset).getTime() >=
        24 * 60 * 60 * 1000
    ) {
      // Create new record with default values
      const newData = await updateUserMessageLimit(userId, 3);
      return newData;
    }

    return data;
  } catch (err) {
    console.error("Failed to get message limit:", err);
    throw err;
  }
};
