"use client";

import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";

interface OperationCredentialsCardProps {
  loginId: string;
  loginPassword: string;
  operationName?: string;
  url?: string;
}

export function OperationCredentialsCard({
  loginId,
  loginPassword,
  operationName,
  url = "https://dvweb-agency.fr",
}: OperationCredentialsCardProps) {
  const [copied, setCopied] = useState(false);

  const buildSmsMessage = () => {
    const opLabel = operationName ? ` (${operationName})` : "";
    return [
      "Bonjour,",
      "",
      `Pour accéder à l'opération${opLabel} dont vous avez la responsabilité et suivre les ventes, connectez-vous sur :`,
      url,
      "",
      `Identifiant : ${loginId}`,
      `Mot de passe : ${loginPassword}`,
      "",
      "Bonne opération !",
    ].join("\n");
  };

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const text = buildSmsMessage();

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback fiable si iOS PWA restreint navigator.clipboard
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-950/50 border border-slate-800/70 rounded-xl p-2.5 text-[11px] space-y-1.5">
      <div className="flex items-center justify-between text-slate-400">
        <span className="inline-flex items-center gap-1">
          <KeyRound className="w-3 h-3 text-amber-500/70" />
          Identifiant :
        </span>
        <code className="text-amber-300 font-mono">{loginId}</code>
      </div>

      <div className="flex items-center justify-between text-slate-400">
        <span>Mot de passe :</span>
        <code className="text-slate-300 font-mono">{loginPassword}</code>
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className={`w-full mt-1 pt-1.5 border-t border-slate-800/70 flex items-center justify-center gap-1.5 font-medium transition-colors cursor-pointer ${
          copied
            ? "text-emerald-400"
            : "text-slate-400 hover:text-amber-300"
        }`}
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5" />
            Message SMS copié
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            Copier les accès (SMS)
          </>
        )}
      </button>
    </div>
  );
}
