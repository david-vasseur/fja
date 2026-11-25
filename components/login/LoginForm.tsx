"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, User, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { loginAction } from "@/lib/actions/auth.action";
import { getClientFingerprint } from "@/lib/fingerPrintClient";



export default function LoginForm() {
  const router = useRouter();
  const loginAdmin = useAppStore((s) => s.loginAdmin);
  const loginOperation = useAppStore((s) => s.loginOperation);
  

  const [identifiant, setIdentifiant] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const clientFp = await getClientFingerprint();
      const result = await loginAction(identifiant, password, clientFp);

      if (!result.success) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      if (result.role === "admin") {
        loginAdmin(result.identifiant);
        router.push("/dashboard");
        router.refresh();
        return;
      }

      loginOperation(result.identifiant, result.operationSlug);
      router.push(`/${result.operationSlug}`);
      router.refresh();
    } catch {
      setError("Impossible de joindre le serveur d'authentification.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] bg-slate-900/95 backdrop-blur-md rounded-2xl border border-amber-500/25 shadow-2xl p-5 sm:p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

      <div className="flex flex-col items-center mb-6 sm:mb-8 text-center">
        <div className="relative w-36 h-20 sm:w-44 sm:h-28 mb-3 sm:mb-4 rounded-lg overflow-hidden">
          <Image
            src="/logo.webp"
            alt="FJA Conseils"
            fill
            sizes="(max-width: 640px) 144px, 176px"
            priority
            className="object-contain"
          />
        </div>

        <h1 className="text-lg sm:text-xl font-semibold text-amber-400 tracking-wider uppercase">
          Connexion
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xs leading-relaxed">
          Espace Administration & Suivi des Opérations.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start sm:items-center gap-2 p-3 rounded-xl bg-red-950/60 border border-red-500/30 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5 sm:mt-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label
            htmlFor="identifiant"
            className="block text-xs font-medium text-slate-300 mb-1.5"
          >
            Identifiant ou Email
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="identifiant"
              type="text"
              required
              autoComplete="username"
              placeholder="admin@fja-conseils.fr ou code opération"
              value={identifiant}
              onChange={(e) => setIdentifiant(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 text-base sm:text-sm bg-slate-950/60 border border-slate-700/70 text-white rounded-xl placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-medium text-slate-300 mb-1.5"
          >
            Mot de passe
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-11 py-2.5 text-base sm:text-sm bg-slate-950/60 border border-slate-700/70 text-white rounded-xl placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 sm:py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm font-semibold shadow-md shadow-amber-500/10 active:scale-[0.99] disabled:opacity-60 transition cursor-pointer"
        >
          <span>{isLoading ? "Connexion..." : "Se connecter"}</span>
          {!isLoading && <ArrowRight className="w-4 h-4 text-slate-950" />}
        </button>
      </form>
    </div>
  );
}
