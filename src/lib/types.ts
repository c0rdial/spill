export type Gender = "man" | "woman" | "nonbinary";

export type User = {
  id: string;
  phone: string;
  name: string;
  age: number;
  gender: Gender;
  show_me: Gender[];
  interests: string[];
  bio: string | null;
  photo_url: string | null;
  created_at: string;
};

export type InterestTag = {
  id: string;
  label: string;
  category: string;
  created_at: string;
};

export type Prompt = {
  id: string;
  text: string;
  active_date: string | null;
  created_at: string;
};

export type Answer = {
  id: string;
  user_id: string;
  prompt_id: string;
  text: string;
  created_at: string;
};

export type Reveal = {
  id: string;
  viewer_id: string;
  answerer_id: string;
  prompt_id: string;
  action: "pending" | "dare" | "pass";
  created_at: string;
  acted_at: string | null;
};

export type Match = {
  id: string;
  user_a_id: string;
  user_b_id: string;
  prompt_id: string;
  created_at: string;
};

export type Message = {
  id: string;
  match_id: string;
  sender_id: string;
  text: string;
  created_at: string;
};
