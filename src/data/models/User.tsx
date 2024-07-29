export type User = {
  email: string;
  password: string;
};

export type Profile = {
  id: number;
  name: string;
  email: string;
  created_at: Date;
  updated_at: Date;
};
