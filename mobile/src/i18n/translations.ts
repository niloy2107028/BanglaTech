type Translations = {
  auth: {
    welcomeBack: string;
    loginSubtitle: string;
    emailAddress: string;
    enterEmail: string;
    password: string;
    enterPassword: string;
    forgotPassword: string;
    or: string;
    continueWithGoogle: string;
    noAccount: string;
    alreadyAccount: string;
    createAccount: string;
    registerSubtitle: string;
    fullName: string;
    enterName: string;
    minSix: string;
    verifyEmail: string;
    sentCodeTo: string;
    sixDigitCode: string;
    enterSixDigit: string;
    verifyCode: string;
    resendIn: string;
    resendVerification: string;
    backToRegistration: string;
    forgotTitle: string;
    forgotSubtitle: string;
    sendResetCode: string;
    resetCode: string;
    newPassword: string;
    enterNewPassword: string;
    confirmNewPassword: string;
    confirmPasswordPlaceholder: string;
    resetPassword: string;
    backToEmail: string;
    backToLogin: string;
    verifyCodeTitle: string;
    newPasswordTitle: string;
  };
  navbar: {
    login: string;
    register: string;
    myOrders: string;
    logout: string;
  };
  common: {
    loading: string;
    english: string;
    bangla: string;
  };
};

export const translations: Record<"en" | "bn", Translations> = {
  en: {
    auth: {
      welcomeBack: "Welcome Back",
      loginSubtitle: "Login to continue shopping on BanglaMart.",
      emailAddress: "Email Address",
      enterEmail: "Enter your email",
      password: "Password",
      enterPassword: "Enter your password",
      forgotPassword: "Forgot Password?",
      or: "OR",
      continueWithGoogle: "Continue with Google",
      noAccount: "Don't have an account?",
      alreadyAccount: "Already have an account?",
      createAccount: "Create Account",
      registerSubtitle: "Join BanglaMart and start shopping today.",
      fullName: "Full Name",
      enterName: "Enter your name",
      minSix: "Min 6 characters",
      verifyEmail: "Verify Email",
      sentCodeTo: "We've sent a 6-digit code to {{email}}",
      sixDigitCode: "6-Digit Verification Code",
      enterSixDigit: "Enter 6-digit code",
      verifyCode: "Verify Code",
      resendIn: "Resend code in {{count}}s",
      resendVerification: "Resend Verification Code",
      backToRegistration: "Back to Registration",
      forgotTitle: "Forgot Password",
      forgotSubtitle: "Enter your email address to receive a verification code.",
      sendResetCode: "Send Reset Code",
      resetCode: "6-Digit Reset Code",
      newPassword: "New Password",
      enterNewPassword: "Enter new password",
      confirmNewPassword: "Confirm New Password",
      confirmPasswordPlaceholder: "Confirm new password",
      resetPassword: "Reset Password",
      backToEmail: "Back to Email",
      backToLogin: "Back to Login",
      verifyCodeTitle: "Verify Code",
      newPasswordTitle: "New Password",
    },
    navbar: {
      login: "Login",
      register: "Register",
      myOrders: "My Orders",
      logout: "Logout",
    },
    common: {
      loading: "Loading...",
      english: "English",
      bangla: "বাংলা",
    },
  },
  bn: {
    auth: {
      welcomeBack: "আবার স্বাগতম",
      loginSubtitle: "BanglaMart-এ কেনাকাটা চালিয়ে যেতে লগইন করুন।",
      emailAddress: "ইমেইল ঠিকানা",
      enterEmail: "আপনার ইমেইল লিখুন",
      password: "পাসওয়ার্ড",
      enterPassword: "আপনার পাসওয়ার্ড লিখুন",
      forgotPassword: "পাসওয়ার্ড ভুলে গেছেন?",
      or: "অথবা",
      continueWithGoogle: "গুগল দিয়ে চালিয়ে যান",
      noAccount: "অ্যাকাউন্ট নেই?",
      alreadyAccount: "আগেই অ্যাকাউন্ট আছে?",
      createAccount: "অ্যাকাউন্ট তৈরি করুন",
      registerSubtitle: "BanglaMart-এ যোগ দিন এবং আজই কেনাকাটা শুরু করুন।",
      fullName: "পূর্ণ নাম",
      enterName: "আপনার নাম লিখুন",
      minSix: "কমপক্ষে ৬ অক্ষর",
      verifyEmail: "ইমেইল যাচাই",
      sentCodeTo: "{{email}} এ ৬ সংখ্যার কোড পাঠানো হয়েছে",
      sixDigitCode: "৬ সংখ্যার ভেরিফিকেশন কোড",
      enterSixDigit: "৬ সংখ্যার কোড লিখুন",
      verifyCode: "কোড যাচাই করুন",
      resendIn: "{{count}} সেকেন্ড পরে আবার পাঠান",
      resendVerification: "ভেরিফিকেশন কোড আবার পাঠান",
      backToRegistration: "রেজিস্ট্রেশনে ফিরুন",
      forgotTitle: "পাসওয়ার্ড ভুলে গেছেন",
      forgotSubtitle: "ভেরিফিকেশন কোড পেতে আপনার ইমেইল ঠিকানা লিখুন।",
      sendResetCode: "রিসেট কোড পাঠান",
      resetCode: "৬ সংখ্যার রিসেট কোড",
      newPassword: "নতুন পাসওয়ার্ড",
      enterNewPassword: "নতুন পাসওয়ার্ড লিখুন",
      confirmNewPassword: "নতুন পাসওয়ার্ড নিশ্চিত করুন",
      confirmPasswordPlaceholder: "নতুন পাসওয়ার্ড নিশ্চিত করুন",
      resetPassword: "পাসওয়ার্ড রিসেট করুন",
      backToEmail: "ইমেইলে ফিরে যান",
      backToLogin: "লগইনে ফিরুন",
      verifyCodeTitle: "কোড যাচাই",
      newPasswordTitle: "নতুন পাসওয়ার্ড",
    },
    navbar: {
      login: "লগইন",
      register: "রেজিস্টার",
      myOrders: "আমার অর্ডার",
      logout: "লগআউট",
    },
    common: {
      loading: "লোড হচ্ছে...",
      english: "English",
      bangla: "বাংলা",
    },
  },
};

export function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;
  return Object.entries(params).reduce(
    (acc, [key, value]) => acc.replace(new RegExp(`{{${key}}}`, "g"), String(value)),
    str,
  );
}
