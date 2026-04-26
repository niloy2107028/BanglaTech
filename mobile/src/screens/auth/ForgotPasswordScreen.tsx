import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
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
import { forgotPassword, resendOtp, resetPassword, verifyResetOtp } from "../../lib/authApi";
import { authStyles as S, C } from "../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "ForgotPassword">;

export function ForgotPasswordScreen({ navigation }: Props) {
  const { setSession } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const normalizedEmail = email.trim().toLowerCase();

  const onSendCode = async () => {
    try {
      setError("");
      setSuccess("");
      setLoading(true);
      const response = await forgotPassword(normalizedEmail);
      setSuccess(response.message || "OTP sent to your email");
      setStep(2);
      setCountdown(60);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to send OTP";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const onVerifyCode = async () => {
    try {
      setError("");
      setLoading(true);
      const response = await verifyResetOtp(normalizedEmail, otp.trim());
      if (!response.success) {
        throw new Error(response.message || "Verification failed");
      }
      setSuccess("OTP verified. Set your new password.");
      setStep(3);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Invalid code";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const onResendCode = async () => {
    try {
      setError("");
      setLoading(true);
      const response = await resendOtp(normalizedEmail, "forgot-password");
      setSuccess(response.message || "Code resent");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to resend";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async () => {
    if (!password || password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setError("");
      setLoading(true);
      const data = await resetPassword(normalizedEmail, otp.trim(), password);
      if (!data.success || !data.token || !data.user) {
        throw new Error(data.message || "Password reset failed");
      }
      await setSession(data.token, data.user);
      setSuccess("Password reset complete");
      navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to reset password";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const titleKey =
    step === 1 ? "auth.forgotTitle" : step === 2 ? "auth.verifyCodeTitle" : "auth.newPasswordTitle";
  const subtitleKey =
    step === 1
      ? "auth.forgotSubtitle"
      : step === 2
        ? "auth.sentCodeTo"
        : "auth.enterNewPassword";

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
            <Text style={S.title}>{t(titleKey)}</Text>
            <Text style={S.subtitle}>
              {step === 2 ? t(subtitleKey, { email: normalizedEmail }) : t(subtitleKey)}
            </Text>

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

            {step === 1 && (
              <>
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
                <Pressable
                  style={[S.submitBtn, loading && S.submitBtnDisabled]}
                  onPress={onSendCode}
                  disabled={loading}
                >
                  <Text style={S.submitBtnText}>
                    {loading ? "..." : t("auth.sendResetCode")}
                  </Text>
                </Pressable>
              </>
            )}

            {step === 2 && (
              <>
                <View style={S.formGroup}>
                  <Text style={S.label}>{t("auth.resetCode")}</Text>
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
                  onPress={onVerifyCode}
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
                    <Pressable onPress={onResendCode} disabled={loading}>
                      <Text style={S.resendBtn}>{t("auth.resendVerification")}</Text>
                    </Pressable>
                  )}
                </View>

                <Pressable style={S.backBtn} onPress={() => setStep(1)}>
                  <Text style={S.backBtnText}>{t("auth.backToEmail")}</Text>
                </Pressable>
              </>
            )}

            {step === 3 && (
              <>
                <View style={S.formGroup}>
                  <Text style={S.label}>{t("auth.newPassword")}</Text>
                  <TextInput
                    style={S.input}
                    placeholder={t("auth.enterNewPassword")}
                    placeholderTextColor={C.dividerText}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
                <View style={S.formGroup}>
                  <Text style={S.label}>{t("auth.confirmNewPassword")}</Text>
                  <TextInput
                    style={S.input}
                    placeholder={t("auth.confirmPasswordPlaceholder")}
                    placeholderTextColor={C.dividerText}
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>
                <Pressable
                  style={[S.submitBtn, loading && S.submitBtnDisabled]}
                  onPress={onResetPassword}
                  disabled={loading}
                >
                  <Text style={S.submitBtnText}>
                    {loading ? "..." : t("auth.resetPassword")}
                  </Text>
                </Pressable>
              </>
            )}

            <View style={S.switchRow}>
              <Pressable onPress={() => navigation.navigate("Login")}>
                <Text style={S.switchLink}>{t("auth.backToLogin")}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
