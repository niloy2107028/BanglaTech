import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
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
import {
  getMobileGoogleAuthUrl,
  parseGoogleCallbackUrl,
  registerUser,
  resendOtp,
  verifyEmailOtp,
} from "../../lib/authApi";
import { authStyles as S, C } from "../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const { setSession } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const onRegister = async () => {
    try {
      setError("");
      setSuccess("");
      setLoading(true);
      const data = await registerUser(name.trim(), email.trim().toLowerCase(), password);
      setSuccess(data.message || "");
      setShowOtp(true);
      setCountdown(60);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async () => {
    try {
      setError("");
      setLoading(true);
      const data = await verifyEmailOtp(email.trim().toLowerCase(), otp.trim());
      if (!data.success || !data.token || !data.user) {
        throw new Error(data.message || "Verification failed");
      }
      setSuccess("Email verified successfully!");
      await setSession(data.token, data.user);
      navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const onResendOtp = async () => {
    if (countdown > 0) return;
    try {
      setError("");
      const data = await resendOtp(email.trim().toLowerCase(), "register");
      setSuccess(data.message || "Code resent");
      setCountdown(60);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend");
    }
  };

  const onGoogleSignIn = async () => {
    try {
      setError("");
      setGoogleLoading(true);
      const redirectUri = Linking.createURL("auth/callback");
      const authUrl = getMobileGoogleAuthUrl(redirectUri);
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      if (result.type !== "success" || !result.url) return;
      const { token, user } = parseGoogleCallbackUrl(result.url);
      if (!token || !user) throw new Error("Google sign-in failed");
      await setSession(token, user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const title = showOtp ? t("auth.verifyEmail") : t("auth.createAccount");
  const subtitle = showOtp
    ? t("auth.sentCodeTo", { email: email.trim().toLowerCase() })
    : t("auth.registerSubtitle");

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
            <Text style={S.title}>{title}</Text>
            <Text style={S.subtitle}>{subtitle}</Text>

            {error ? (
              <View style={S.errorBox}>
                <Text style={S.errorText}>{error}</Text>
              </View>
            ) : null}
            {success ? (
              <View style={S.successBox}>
                <Text style={S.successText}>{success}</Text>
              </View>
            ) : null}

            {!showOtp ? (
              <>
                <View style={S.formGroup}>
                  <Text style={S.label}>{t("auth.fullName")}</Text>
                  <TextInput
                    style={S.input}
                    placeholder={t("auth.enterName")}
                    placeholderTextColor={C.dividerText}
                    value={name}
                    onChangeText={setName}
                  />
                </View>
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
                    placeholder={t("auth.minSix")}
                    placeholderTextColor={C.dividerText}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>

                <Pressable
                  style={[S.submitBtn, loading && S.submitBtnDisabled]}
                  onPress={onRegister}
                  disabled={loading}
                >
                  <Text style={S.submitBtnText}>
                    {loading ? "..." : t("auth.createAccount")}
                  </Text>
                </Pressable>

                <View style={S.dividerRow}>
                  <View style={S.dividerLine} />
                  <Text style={S.dividerText}>{t("auth.or")}</Text>
                  <View style={S.dividerLine} />
                </View>

                <Pressable
                  style={[S.googleBtn, googleLoading && S.submitBtnDisabled]}
                  onPress={onGoogleSignIn}
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
                  <Text style={S.switchText}>{t("auth.alreadyAccount")}</Text>
                  <Pressable onPress={() => navigation.navigate("Login")}>
                    <Text style={S.switchLink}>{t("navbar.login")}</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <View style={S.formGroup}>
                  <Text style={S.label}>{t("auth.sixDigitCode")}</Text>
                  <TextInput
                    style={[S.input, S.otpInput]}
                    placeholder={t("auth.enterSixDigit")}
                    placeholderTextColor={C.dividerText}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otp}
                    onChangeText={setOtp}
                  />
                </View>

                <Pressable
                  style={[S.submitBtn, loading && S.submitBtnDisabled]}
                  onPress={onVerifyOtp}
                  disabled={loading}
                >
                  <Text style={S.submitBtnText}>
                    {loading ? "..." : t("auth.verifyCode")}
                  </Text>
                </Pressable>

                <View style={S.resendRow}>
                  {countdown > 0 ? (
                    <Text style={S.resendText}>
                      {t("auth.resendIn", { count: countdown })}
                    </Text>
                  ) : (
                    <Pressable onPress={onResendOtp}>
                      <Text style={S.resendBtn}>{t("auth.resendVerification")}</Text>
                    </Pressable>
                  )}
                </View>

                <Pressable style={S.backBtn} onPress={() => setShowOtp(false)}>
                  <Text style={S.backBtnText}>{t("auth.backToRegistration")}</Text>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
