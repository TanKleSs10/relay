export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  status: string;
  created_at: string;
};
