import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export const useGetList = <T>(key: any) => {
  return useQuery<T[]>({
    queryKey: [key],
    queryFn: async () => {
      const { data, error } = await supabase.from(key).select("*").eq("isdeleted", false);
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });
};

export const useGetOneById = <T>(key: any, id: string, table?: string) => {
  return useQuery<T>({
    queryKey: [key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table ?? key)
        .select()
        .eq("isdeleted", false)
        .eq("id", id);
      if (error) throw new Error(error.message);
      return data[0];
    },
  });
};
