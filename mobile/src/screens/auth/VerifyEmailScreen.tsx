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
import { resendOtp, verifyEmailOtp } from "../../lib/authApi";
import { authStyles as S, C } from "../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "VerifyEmail">;

export function VerifyEmailScreen({ route, navigation }: Props) {
  const { setSession } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(0);

  const email = route.params.email;

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const onVerify = async () => {
    try {
      setError("");
      setLoading(true);
      const data = await verifyEmailOtp(email, otp.trim());
      if (!data.success || !data.token || !data.user) {
        throw new Error(data.message || "Verification failed");
      }
      setSuccess("Email verified successfully");
      await setSession(data.token, data.user);
      navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Verification failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (countdown > 0) return;
    try {
      setError("");
      setResending(true);
      const data = await resendOtp(email, "register");
      setSuccess(data.message || "Code resent");
      setCountdown(60);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to resend";
      setError(message);
    } finally {
      setResending(false);
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
            <Text style={S.title}>{t("auth.verifyEmail")}</Text>
            <Text style={S.subtitle}>{t("auth.sentCodeTo", { email })}</Text>

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
              onPress={onVerify}
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
                <Pressable onPress={onResend} disabled={resending}>
                  <Text style={S.resendBtn}>{t("auth.resendVerification")}</Text>
                </Pressable>
              )}
            </View>

            <Pressable style={S.backBtn} onPress={() => navigation.navigate("Login")}>
              <Text style={S.backBtnText}>{t("auth.backToLogin")}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
