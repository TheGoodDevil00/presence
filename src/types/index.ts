export type Profile = {
  id: string;
  display_name: string;
  created_at: string;
};

export type Pair = {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
};

export type Invite = {
  id: string;
  token: string;
  inviter_id: string;
  accepted_by: string | null;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
};

export type PresenceState = "loading" | "partner-present" | "partner-absent" | "error";

export type SoundOption = "rain" | "cafe" | "forest" | "off";
