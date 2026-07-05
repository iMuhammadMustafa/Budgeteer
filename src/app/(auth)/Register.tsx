import { useState } from "react";
import { View } from "react-native";
import { Link, router } from "expo-router";

import supabase from "@/src/providers/Supabase";
import { CURRENCIES, DEFAULT_CURRENCY } from "@/src/utils/currency";
import { storage } from "@/src/utils/storageUtils";
import GenerateUuid from "@/src/utils/uuid.Helper";
import { Button, Input, Select, Text as ThemedText, useNotify } from "@/src/components/ui";

const initailRegisterState = {
  id: GenerateUuid(),
  email: "",
  password: "",
  confirmPassword: "",
  tenantId: "",
  currency: DEFAULT_CURRENCY,
};

const currencyOptions = CURRENCIES.map(c => ({
  id: c.code,
  label: `${c.code} — ${c.name}`,
  value: c.code,
}));

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export default function Register() {
  const { notify } = useNotify();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(initailRegisterState);
  const isValid = !!(
    !loading &&
    user.email &&
    user.password &&
    user.confirmPassword &&
    user.password === user.confirmPassword &&
    (!user.tenantId || (user.tenantId.trim().length > 2 && uuidRegex.test(user.tenantId)))
  );

  const signUpWithEmail = async () => {
    setLoading(true);
    // Cache the chosen currency so it survives the redirect to /Login and
    // the first profile read after the user signs in. usePrimaryCurrency
    // syncs it into profiles.currency on first authenticated load.
    // TODO: move key to constants
    await storage.setItem("app:primaryCurrency", user.currency);

    const { error } = await supabase.auth.signUp({
      email: user?.email,
      password: user.password,
      options: {
        data: {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          tenantid: user.tenantId || user.id,
          currency: user.currency,
        },
      },
    });

    if (error) {
      notify({ message: error.message, type: "error" });
    } else {
      notify({ message: "Registered successfully", type: "success" });
      router.navigate("/Login");
    }
    setLoading(false);
  };

  return (
    <View className="justify-center m-auto p-4 h-full w-full md:w-[50%]">
      <Button
        variant="ghost"
        label="Back"
        onPress={() => router.navigate("/")}
        leadingIcon="ArrowLeft"
        className="self-start text-blue-600 text-center p-0 my-2"
      />
      <Input containerClassName="my-2" placeholder="Email" onChangeText={text => setUser({ ...user, email: text })} />
      <Input
        containerClassName="my-2"
        placeholder="Password"
        secureTextEntry
        onChangeText={text => setUser({ ...user, password: text })}
      />
      <Input
        containerClassName="my-2"
        placeholder="Confirm Password"
        secureTextEntry
        onChangeText={text => setUser({ ...user, confirmPassword: text })}
      />
      <Input
        containerClassName="my-2"
        placeholder="Tenant Id"
        onChangeText={text => setUser({ ...user, tenantId: text })}
      />
      <Select
        label="Primary Currency"
        options={currencyOptions}
        value={user.currency}
        onChange={next => {
          const code = Array.isArray(next) ? next[0] : next;
          setUser({ ...user, currency: (code as string) ?? DEFAULT_CURRENCY });
        }}
      />
      <Button
        variant="primary"
        size="lg"
        haptic="success"
        className="p-3 mt-4 mb-4 bg-primary rounded-lg items-center"
        onPress={signUpWithEmail}
        disabled={!isValid}
        label="Register"
        testID="btn-register"
      />
      <Link className=" py-3 mb-4 bg-secondary rounded-lg items-center text-center" href="/Login">
        <ThemedText selectable={false}>Login</ThemedText>
      </Link>
    </View>
  );
}
