// shared/features/user/user.hooks.ts
import { useEffect, useState } from "react";
import { UserAPI } from "./user.api";
import { UserInfo } from "./user.types";

export const useUsers = () => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    UserAPI.getAll()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  return { users, loading };
};

export const useUserById = (id: string) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    UserAPI.getById(id)
      .then(setUser)
      .finally(() => setLoading(false));
  }, [id]);

  return { user, loading };
};
