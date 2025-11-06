import { useState, useEffect } from "react";

export const useFetch = <T>(fetcher: () => Promise<T>, deps: any[] = []) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetcher()
      .then((res) => mounted && setData(res))
      .catch((err) => mounted && setError(err))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, deps);

  return { data, loading, error };
};
