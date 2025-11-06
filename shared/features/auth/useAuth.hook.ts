import { useEffect, useState } from "react";
import { AuthService } from "./auth.service";
import { storage } from "../../utils/storage";

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const localUser = storage.get("user_info");
    if (localUser) {
      setUser(localUser);
      setLoading(false);
    } else {
      AuthService.getProfile()
        .then((res) => {
          setUser(res.user);
        })
        .finally(() => setLoading(false));
    }
  }, []);

  return { user, loading, isAuthenticated: !!user };
};
