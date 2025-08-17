import { useAuth } from "@/src/providers/AuthProvider";
import { useRouter } from "expo-router";

export default function Logout() {
  const auth = useAuth();
  const router = useRouter();

  if (auth.user) {
    auth.logout().then(() => {
      router.replace("/Login");
    });
  } else {
    router.replace("/Login");
  }
}
