import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RootStackParamList } from "../../../App";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { getMobileGoogleAuthUrl, parseGoogleCallbackUrl } from "../../lib/authApi";
import { authStyles as S, C } from "../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { login, setSession } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async () => {
    try {
      setError("");
      setLoading(true);
      await login(email.trim(), password);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const onGoogleLogin = async () => {
    try {
      setError("");
      setGoogleLoading(true);
      const redirectUri = Linking.createURL("auth/callback");
      const authUrl = getMobileGoogleAuthUrl(redirectUri);
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type !== "success" || !result.url) {
        return;
      }

      const { token, user } = parseGoogleCallbackUrl(result.url);
      if (!token || !user) {
        throw new Error("Google sign-in failed");
      }

      await setSession(token, user);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Google login failed";
      setError(message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={S.page}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={S.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={S.langRow}>
            <Pressable onPress={toggleLanguage} style={S.langBtn}>
              <Text style={S.langBtnText}>
                {language === "en" ? t("common.bangla") : t("common.english")}
              </Text>
            </Pressable>
          </View>

          <View style={S.card}>
            <Text style={S.title}>{t("auth.welcomeBack")}</Text>
            <Text style={S.subtitle}>{t("auth.loginSubtitle")}</Text>

            {error ? (
              <View style={S.errorBox}>
                <Text style={S.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={S.formGroup}>
              <Text style={S.label}>{t("auth.emailAddress")}</Text>
              <TextInput
                style={S.input}
                placeholder={t("auth.enterEmail")}
                placeholderTextColor={C.dividerText}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={S.formGroup}>
              <Text style={S.label}>{t("auth.password")}</Text>
              <TextInput
                style={S.input}
                placeholder={t("auth.enterPassword")}
                placeholderTextColor={C.dividerText}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <View style={S.forgotRow}>
              <Pressable onPress={() => navigation.navigate("ForgotPassword")}>
                <Text style={S.forgotText}>{t("auth.forgotPassword")}</Text>
              </Pressable>
            </View>

            <Pressable
              style={[S.submitBtn, loading && S.submitBtnDisabled]}
              onPress={onSubmit}
              disabled={loading}
            >
              <Text style={S.submitBtnText}>
                {loading ? "..." : t("navbar.login")}
              </Text>
            </Pressable>

            <View style={S.dividerRow}>
              <View style={S.dividerLine} />
              <Text style={S.dividerText}>{t("auth.or")}</Text>
              <View style={S.dividerLine} />
            </View>

            <Pressable
              style={[S.googleBtn, googleLoading && S.submitBtnDisabled]}
              onPress={onGoogleLogin}
              disabled={googleLoading}
            >
              <Image
                source={{ uri: "https://developers.google.com/identity/images/g-logo.png" }}
                style={S.googleIcon}
              />
              <Text style={S.googleBtnText}>
                {googleLoading ? "..." : t("auth.continueWithGoogle")}
              </Text>
            </Pressable>

            <View style={S.switchRow}>
              <Text style={S.switchText}>{t("auth.noAccount")}</Text>
              <Pressable onPress={() => navigation.navigate("Register")}>
                <Text style={S.switchLink}>{t("navbar.register")}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
