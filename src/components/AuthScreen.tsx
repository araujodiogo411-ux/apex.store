import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDocs, collection, query, where } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";
import { UserProfile } from "../types";
import { LogIn, UserPlus, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AuthScreenProps {
  onAuthSuccess: (profile: UserProfile | null) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAdminMockLogin = () => {
    // Return standard admin profile
    const adminProfile: UserProfile = {
      uid: "admin-apex-uid",
      name: "APEX",
      email: "admin@apex.com",
      role: "Administrador Oficial APEXCRAFT",
    };
    // Save to local storage for persistence
    localStorage.setItem("apex_user", JSON.stringify(adminProfile));
    onAuthSuccess(adminProfile);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // 1. Check for specific Admin credentials
    if (name.trim() === "APEX" && password === "APEX500") {
      handleAdminMockLogin();
      setLoading(false);
      return;
    }

    try {
      // Find the user's email by looking up their Name in Firestore
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("name", "==", name.trim()));
      const querySnapshot = await getDocs(q);

      let targetEmail = "";
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0].data();
        targetEmail = userDoc.email;
      } else {
        // If name wasn't found, try treating "Name" field as email
        if (name.includes("@")) {
          targetEmail = name.trim();
        } else {
          throw new Error("Nome de usuário não encontrado.");
        }
      }

      // Perform standard Firebase authentication
      const userCredential = await signInWithEmailAndPassword(auth, targetEmail, password);
      const user = userCredential.user;

      // Fetch role from Firestore
      const profileSnapshot = await getDocs(query(usersRef, where("uid", "==", user.uid)));
      let profile: UserProfile;

      if (!profileSnapshot.empty) {
        const data = profileSnapshot.docs[0].data();
        profile = {
          uid: user.uid,
          name: data.name,
          email: data.email,
          role: data.role || "Visitante",
        };
      } else {
        profile = {
          uid: user.uid,
          name: user.displayName || name,
          email: user.email || "",
          role: "Visitante",
        };
        // Save the profile if it doesn't exist
        await setDoc(doc(db, "users", user.uid), profile);
      }

      localStorage.setItem("apex_user", JSON.stringify(profile));
      onAuthSuccess(profile);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setError("Credenciais incorretas ou usuário não cadastrado.");
      } else if (err.code === "auth/operation-not-allowed") {
        setError("O método de login por E-mail e Senha não está ativado no console do Firebase. Ative-o na aba Authentication > Sign-in method.");
      } else {
        setError(err.message || "Erro ao realizar login.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Por favor, preencha o nome.");
      return;
    }
    if (!email.trim()) {
      setError("Por favor, preencha o e-mail.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      // Create account in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      const profile: UserProfile = {
        uid: user.uid,
        name: name.trim(),
        email: email.trim(),
        role: "Visitante",
      };

      // Store in Firestore
      await setDoc(doc(db, "users", user.uid), profile);

      localStorage.setItem("apex_user", JSON.stringify(profile));
      onAuthSuccess(profile);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError("Este e-mail já está sendo utilizado.");
      } else if (err.code === "auth/operation-not-allowed") {
        setError("O método de cadastro por E-mail e Senha não está ativado no console do Firebase. Ative-o em Authentication > Sign-in method.");
      } else if (err.message && err.message.includes("permission-denied")) {
        setError("Erro do Firestore: Permissão negada para salvar o perfil do usuário. Verifique as regras de segurança.");
      } else {
        setError(err.message || "Erro ao criar conta.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user already has a document in Firestore
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);

      let profile: UserProfile;

      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        profile = {
          uid: user.uid,
          name: data.name || user.displayName || "Visitante",
          email: data.email || user.email || "",
          role: data.role || "Visitante",
        };
      } else {
        // Create new profile
        profile = {
          uid: user.uid,
          name: user.displayName || "Visitante",
          email: user.email || "",
          role: "Visitante",
        };
        await setDoc(doc(db, "users", user.uid), profile);
      }

      localStorage.setItem("apex_user", JSON.stringify(profile));
      onAuthSuccess(profile);
    } catch (err: any) {
      console.error(err);
      let errorMessage = "Erro ao autenticar com o Google.";
      if (err.code === "auth/operation-not-allowed") {
        errorMessage = "O provedor do Google não está ativado no console do Firebase. Vá para Authentication > Sign-in method e ative o Google.";
      } else if (err.code === "auth/unauthorized-domain") {
        errorMessage = `Este domínio não está autorizado no console do Firebase. Adicione o domínio do app nas configurações de domínios autorizados do Firebase Auth.`;
      } else if (err.code === "auth/popup-blocked") {
        errorMessage = "O pop-up de login foi bloqueado pelo seu navegador. Por favor, ative os pop-ups ou abra o aplicativo em uma nova aba.";
      } else if (err.code === "auth/popup-closed-by-user") {
        errorMessage = "O pop-up foi fechado antes de concluir o login com o Google.";
      } else if (err.message && err.message.includes("permission-denied")) {
        errorMessage = "Login realizado, mas sem permissão para ler/gravar o perfil do usuário no Firestore.";
      } else if (err.message) {
        errorMessage = `Erro de Autenticação: ${err.message} (Código: ${err.code || "desconhecido"})`;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center px-4 py-12 font-sans relative overflow-hidden" id="auth-screen-container">
      {/* Decorative gradient background elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-orange-100/30 blur-3xl" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gray-100/50 blur-3xl" />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-white border border-gray-100 shadow-xl rounded-2xl p-8 z-10"
        id="auth-card"
      >
        {/* Header with Logo */}
        <div className="text-center mb-8 flex flex-col items-center" id="auth-header">
          <img
            src="https://i.ibb.co/zVQKcfm2/APEX-4-removebg-preview.png"
            alt="APEX Logo"
            className="h-16 md:h-20 object-contain mb-4 select-none"
            id="auth-logo"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-2xl font-display font-bold tracking-tight text-black" id="auth-title">
            {isLogin ? "Bem-vindo à APEX" : "Crie sua Conta APEX"}
          </h1>
          <p className="text-sm text-gray-500 mt-1" id="auth-subtitle">
            {isLogin ? "Acesse a plataforma exclusiva de marketplace" : "Faça parte da nossa rede exclusiva de produtos premium"}
          </p>
        </div>

        {/* Error Message */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm mb-6 flex items-start gap-2 overflow-hidden"
              id="auth-error-alert"
            >
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-4" id="auth-form">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-1" htmlFor="signup-name">
                Nome Completo
              </label>
              <input
                id="signup-name"
                type="text"
                placeholder="Ex: Diogo Araújo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-full text-black focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition duration-200 text-sm shadow-sm"
                required
              />
            </div>
          )}

          {isLogin ? (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-1" htmlFor="login-name">
                Nome de Usuário (ou Email)
              </label>
              <input
                id="login-name"
                type="text"
                placeholder="Seu nome ou e-mail"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-full text-black focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition duration-200 text-sm shadow-sm"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-1" htmlFor="signup-email">
                E-mail
              </label>
              <input
                id="signup-email"
                type="email"
                placeholder="exemplo@apex.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-full text-black focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition duration-200 text-sm shadow-sm"
                required
              />
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1 px-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider" htmlFor="auth-password">
                Senha
              </label>
            </div>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                placeholder={isLogin ? "Sua senha" : "Mínimo 6 caracteres"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-5 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-full text-black focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition duration-200 text-sm shadow-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                id="toggle-password-btn"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-1" htmlFor="signup-confirm-password">
                Confirmar Senha
              </label>
              <input
                id="signup-confirm-password"
                type={showPassword ? "text" : "password"}
                placeholder="Digite a senha novamente"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-full text-black focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition duration-200 text-sm shadow-sm"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand hover:bg-brand-hover text-white font-bold uppercase tracking-widest text-xs rounded-full transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 mt-6 cursor-pointer disabled:opacity-55"
            id="auth-submit-btn"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isLogin ? (
              <>
                <LogIn className="w-4.5 h-4.5" />
                <span>Entrar</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4.5 h-4.5" />
                <span>Criar Conta</span>
              </>
            )}
          </button>
        </form>

        {/* OR Divider */}
        <div className="relative my-6" id="auth-divider">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-gray-400 font-semibold tracking-wider">Ou continue com</span>
          </div>
        </div>

        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-bold uppercase tracking-widest text-xs rounded-full transition duration-200 flex items-center justify-center gap-3 cursor-pointer hover:bg-gray-50 shadow-sm"
          id="google-login-btn"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.81-2.48-.81-5.18 0-7.66z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#EA4335"
            />
          </svg>
          <span className="text-sm">Entrar com Google</span>
        </button>

        {/* Footer Toggle */}
        <div className="text-center mt-6" id="auth-toggle-container">
          <p className="text-sm text-gray-500">
            {isLogin ? "Não possui uma conta?" : "Já possui uma conta?"}{" "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-brand hover:text-brand-hover font-semibold transition-colors focus:outline-none"
              id="toggle-auth-mode-btn"
            >
              {isLogin ? "Criar conta" : "Acessar conta"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
