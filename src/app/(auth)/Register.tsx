import { Button } from "@/src/components/ui";
import ThemedInput from "@/src/components/elements/ThemedInput";
import { Text as ThemedText } from "@/src/components/ui";
import DropdownField from "@/src/components/elements/dropdown/DropdownField";
import supabase from "@/src/providers/Supabase";
import { CURRENCIES, DEFAULT_CURRENCY } from "@/src/utils/currency";
import { storage } from "@/src/utils/storageUtils";
import GenerateUuid from "@/src/utils/uuid.Helper";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, Platform, View } from "react-native";

const initailRegisterState = {
  id: GenerateUuid(),
  email: "",
  password: "",
  confirmPassword: "",
  tenantId: "",
  currency: DEFAULT_CURRENCY,
};

const currencyOptions = CURRENCIES.map((c) => ({
  id: c.code,
  label: `${c.code} — ${c.name}`,
  value: c.code,
}));

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function Register() {
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

    if (error) Alert.alert(error.message);
    setLoading(false);
    router.navigate("/Login");
  };

  return (
    <View className="justify-center m-auto p-4 h-full w-full md:w-[50%]">
      <Button
        variant="ghost"
        label="Back"
        onPress={() => router.navigate("/")}
        leadingIcon="ArrowLeft"
        className="self-start text-blue-600 text-center"
      />
      <ThemedText variant="h3" className="text-2xl mb-10 text-center">Register</ThemedText>
      <ThemedInput
        className="my-2 p-4 text-lg"
        placeholder="Email"
        onChangeText={text => setUser({ ...user, email: text })}
      />
      <ThemedInput
        className="my-2 p-4 text-lg"
        placeholder="Password"
        secureTextEntry
        onChangeText={text => setUser({ ...user, password: text })}
      />
      <ThemedInput
        className="my-2 p-4 text-lg"
        placeholder="Confirm Password"
        secureTextEntry
        onChangeText={text => setUser({ ...user, confirmPassword: text })}
      />
      <ThemedInput
        className="my-2 p-4 text-lg"
        placeholder="Tenant Id"
        onChangeText={text => setUser({ ...user, tenantId: text })}
      />
      <View className="z-10">
        <DropdownField
          label="Primary Currency"
          selectedValue={user.currency}
          options={currencyOptions}
          onSelect={(item) => setUser({ ...user, currency: (item?.value as string) ?? DEFAULT_CURRENCY })}
          isModal={Platform.OS !== "web"}
        />
      </View>
      <Button
        variant="primary"
        size="lg"
        haptic="success"
        className="p-4 mt-4 mb-4 bg-primary rounded-lg items-center"
        onPress={signUpWithEmail}
        disabled={!isValid}
        label="Register"
        testID="btn-register"
      />
      <Link className=" py-4 mb-4 bg-secondary rounded-lg items-center text-center" href="/Login">
        <ThemedText selectable={false}>
          Login
        </ThemedText>
      </Link>
    </View>
  );
}
