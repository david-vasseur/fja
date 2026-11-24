"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "@tanstack/react-form";
import {
  LayoutDashboard,
  Users,
  Plus,
  ExternalLink,
  Trash2,
  LogOut,
  Calendar,
  KeyRound,
  X,
  FileSignature,
  UserPlus,
} from "lucide-react";
import {
  AffectationVendeur,
  OperationData,
  RoleMission,
} from "@/types/operation";
import { useAppStore } from "@/lib/store/useAppStore";
import VendeurManager from "../components/VendorManager";
import ContractGeneratorModal from "../components/ContractGeneratorModal";

const fmtEur = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n);

function slugifyOperation(magasin: string, ville: string, dateDebut: string) {
  const base = `${magasin}-${ville}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const datePart = dateDebut
    ? `${dateDebut.slice(8, 10)}${dateDebut.slice(5, 7)}`
    : "op";
  return `operation-${base}-${datePart}`;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const {
    auth,
    vendeurs,
    operations,
    logout,
    addOperation,
    deleteOperation,
  } = useAppStore();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"operations" | "vendeurs">(
    "operations"
  );
  const [showNewOpModal, setShowNewOpModal] = useState(false);
  const [contractOperation, setContractOperation] =
    useState<OperationData | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && auth.role !== "admin") {
      router.push("/");
    }
  }, [mounted, auth.role, router]);

  const operationForm = useForm({
    defaultValues: {
      magasin: "",
      ville: "",
      dateDebut: "2026-12-01",
      dateFin: "2026-12-20",
      coefOperation: 2.5,
      tva: 1.2,
      loginId: "",
      loginPassword: "",
      affectations: [] as AffectationVendeur[],
    },
    onSubmit: async ({ value }) => {
      const slug = slugifyOperation(
        value.magasin,
        value.ville,
        value.dateDebut
      );
      const generatedLogin =
        value.loginId.trim() ||
        `mag-${value.magasin.toLowerCase().replace(/[^a-z0-9]/g, "")}-${value.ville.toLowerCase().replace(/[^a-z0-9]/g, "")}`;

      addOperation({
        slug,
        nomOperation: `${value.magasin} ${value.ville}`.trim(),
        magasin: value.magasin,
        ville: value.ville,
        loginId: generatedLogin,
        loginPassword: value.loginPassword || "admin123",
        dateDebut: value.dateDebut,
        dateFin: value.dateFin,
        coefOperation: Number(value.coefOperation) || 2.5,
        tva: Number(value.tva) || 1.2,
        affectations: value.affectations,
      });

      operationForm.reset();
      setShowNewOpModal(false);
    },
  });

  if (!mounted || auth.role !== "admin") return null;

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 pb-16">
      {/* HEADER ADMIN */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-amber-500/20 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-8 rounded overflow-hidden border border-amber-500/30">
              <Image
                src="/logo.jpeg"
                alt="FJA Conseils"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold block">
                Administration FJA Conseils
              </span>
              <h1 className="text-base sm:text-lg font-bold text-white">
                Tableau de Bord Général
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-slate-400 mr-2">
              {auth.email}
            </span>
            <button
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-950/70 border border-slate-700 text-xs text-slate-300 hover:text-red-300 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
        {/* NAVIGATION ONGLETS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 w-fit">
            <button
              onClick={() => setActiveTab("operations")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer ${
                activeTab === "operations"
                  ? "bg-amber-500 text-slate-950 font-semibold shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Opérations ({operations.length})
            </button>
            <button
              onClick={() => setActiveTab("vendeurs")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer ${
                activeTab === "vendeurs"
                  ? "bg-amber-500 text-slate-950 font-semibold shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4" />
              Annuaire Vendeurs ({vendeurs.length})
            </button>
          </div>

          {activeTab === "operations" && (
            <button
              onClick={() => setShowNewOpModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nouvelle Opération
            </button>
          )}
        </div>

        {/* ONGLET 1 : LISTE DES OPÉRATIONS */}
        {activeTab === "operations" && (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {operations.map((op) => {
              const totalVenteTTC = op.ventes.reduce(
                (acc, v) => acc + v.prixVenteTTC,
                0
              );
              const totalCAHT = totalVenteTTC / op.tva;
              const totalAchatHT = op.ventes.reduce(
                (acc, v) => acc + v.prixAchatHT,
                0
              );
              const margeHT = totalCAHT - totalAchatHT;
              const tauxMarque =
                totalCAHT > 0 ? (margeHT / totalCAHT) * 100 : 0;

              return (
                <div
                  key={op.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 flex flex-col justify-between transition shadow-lg"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                          {op.magasin}
                        </span>
                        <h3 className="text-lg font-bold text-white">
                          {op.nomOperation}
                        </h3>
                      </div>
                      <button
                        onClick={() => {
                          if (
                            confirm(`Supprimer l'opération ${op.nomOperation} ?`)
                          ) {
                            deleteOperation(op.id);
                          }
                        }}
                        className="text-slate-600 hover:text-red-400 p-1 cursor-pointer"
                        title="Supprimer l'opération"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-amber-500/70" />
                      <span>
                        Du {op.dateDebut} au {op.dateFin}
                      </span>
                      <span className="ml-auto px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-semibold">
                        Coef {op.coefOperation}
                      </span>
                    </div>

                    {/* Liste compacte des intervenants affectés */}
                    <div className="flex flex-wrap gap-1.5">
                      {(op.affectations ?? []).map((aff) => {
                        const v = vendeurs.find((x) => x.id === aff.vendeurId);
                        return (
                          <span
                            key={aff.id}
                            className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[11px] text-slate-300"
                          >
                            <strong className="text-amber-400">
                              {v?.prenom || v?.nom || "?"}
                            </strong>{" "}
                            • {aff.role} ({aff.commission}%)
                          </span>
                        );
                      })}
                    </div>

                    {/* Mini KPIs */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 text-center">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">
                          Ventes TTC
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-white mt-0.5">
                          {fmtEur(totalVenteTTC)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">
                          Marge HT
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-emerald-400 mt-0.5">
                          {fmtEur(margeHT)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">
                          Taux Marque
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-amber-400 mt-0.5">
                          {tauxMarque.toFixed(1)} %
                        </p>
                      </div>
                    </div>

                    {/* Identifiants accès magasin */}
                    <div className="bg-slate-950/50 border border-slate-800/70 rounded-xl p-2.5 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <KeyRound className="w-3 h-3 text-amber-500/70" />
                          Identifiant :
                        </span>
                        <code className="text-amber-300 font-mono">
                          {op.loginId}
                        </code>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Mot de passe :</span>
                        <code className="text-slate-300 font-mono">
                          {op.loginPassword}
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* Actions bas de carte */}
                  <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setContractOperation(op)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
                    >
                      <FileSignature className="w-3.5 h-3.5 text-amber-400" />
                      <span>Contrats</span>
                    </button>

                    <Link
                      href={`/${op.slug}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 text-xs font-semibold transition"
                    >
                      <span>Ouvrir ({op.ventes.length})</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* ONGLET 2 : ANNUAIRE VENDEURS */}
        {activeTab === "vendeurs" && <VendeurManager />}
      </main>

      {/* MODALE NOUVELLE OPÉRATION + AFFECTATION ÉQUIPE */}
      {showNewOpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-3xl bg-slate-900 border border-amber-500/30 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-5 my-auto max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-amber-400 uppercase tracking-wide">
                Créer une Opération Commerciale
              </h2>
              <button
                onClick={() => setShowNewOpModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                operationForm.handleSubmit();
              }}
              className="space-y-4 text-xs sm:text-sm"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <operationForm.Field
                  name="magasin"
                  validators={{
                    onChange: ({ value }) =>
                      !value.trim() ? "Magasin requis" : undefined,
                  }}
                >
                  {(field) => (
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">
                        Enseigne / Magasin *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Château d’Ax"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                  )}
                </operationForm.Field>

                <operationForm.Field
                  name="ville"
                  validators={{
                    onChange: ({ value }) =>
                      !value.trim() ? "Ville requise" : undefined,
                  }}
                >
                  {(field) => (
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">
                        Ville *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Fréjus"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                  )}
                </operationForm.Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <operationForm.Field name="dateDebut">
                  {(field) => (
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">
                        Début Opération
                      </label>
                      <input
                        type="date"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                  )}
                </operationForm.Field>

                <operationForm.Field name="dateFin">
                  {(field) => (
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">
                        Fin Opération
                      </label>
                      <input
                        type="date"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                  )}
                </operationForm.Field>

                <operationForm.Field name="coefOperation">
                  {(field) => (
                    <div>
                      <label className="block text-xs text-amber-400 mb-1">
                        Coef Opération
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={field.state.value}
                        onChange={(e) =>
                          field.handleChange(parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 text-amber-300 font-bold"
                      />
                    </div>
                  )}
                </operationForm.Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <operationForm.Field name="loginId">
                  {(field) => (
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">
                        Identifiant connexion (optionnel)
                      </label>
                      <input
                        type="text"
                        placeholder="Auto-généré si vide"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs"
                      />
                    </div>
                  )}
                </operationForm.Field>

                <operationForm.Field name="loginPassword">
                  {(field) => (
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">
                        Mot de passe magasin
                      </label>
                      <input
                        type="text"
                        placeholder="admin123"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs"
                      />
                    </div>
                  )}
                </operationForm.Field>
              </div>

              {/* AFFECTATION DES VENDEURS AVEC DATES, FRAIS/JOUR ET COMMISSION PROPRES */}
              <operationForm.Field name="affectations">
                {(field) => {
                  const addLigneAffectation = () => {
                    const debut =
                      operationForm.getFieldValue("dateDebut") || "2026-12-01";
                    const fin =
                      operationForm.getFieldValue("dateFin") || "2026-12-20";
                    const newAff: AffectationVendeur = {
                      id: crypto.randomUUID(),
                      vendeurId: vendeurs[0]?.id ?? "",
                      role: "Vendeur",
                      dateDebut: debut,
                      dateFin: fin,
                      fraisJournalier: 80,
                      commission: 5,
                    };
                    field.handleChange([...field.state.value, newAff]);
                  };

                  const updateAff = <K extends keyof AffectationVendeur>(
                    id: string,
                    key: K,
                    val: AffectationVendeur[K]
                  ) => {
                    field.handleChange(
                      field.state.value.map((a) =>
                        a.id === id ? { ...a, [key]: val } : a
                      )
                    );
                  };

                  const removeAff = (id: string) => {
                    field.handleChange(
                      field.state.value.filter((a) => a.id !== id)
                    );
                  };

                  return (
                    <div className="space-y-2.5 pt-3 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase text-amber-400">
                          Équipe affectée & Conditions de mission
                        </label>
                        <button
                          type="button"
                          onClick={addLigneAffectation}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Ajouter un intervenant
                        </button>
                      </div>

                      {field.state.value.length === 0 ? (
                        <p className="text-xs text-slate-500 italic bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                          Clique sur « Ajouter un intervenant » pour affecter un
                          vendeur ou un finisseur avec ses dates et ses taux.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {field.state.value.map((aff) => (
                            <div
                              key={aff.id}
                              className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-end bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-xs"
                            >
                              <div className="col-span-2 sm:col-span-3">
                                <span className="text-[10px] text-slate-400 block mb-0.5">
                                  Intervenant
                                </span>
                                <select
                                  value={aff.vendeurId}
                                  onChange={(e) =>
                                    updateAff(
                                      aff.id,
                                      "vendeurId",
                                      e.target.value
                                    )
                                  }
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white"
                                >
                                  {vendeurs.map((v) => (
                                    <option key={v.id} value={v.id}>
                                      {v.prenom ? `${v.prenom} ${v.nom}` : v.nom}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="col-span-1 sm:col-span-2">
                                <span className="text-[10px] text-slate-400 block mb-0.5">
                                  Rôle
                                </span>
                                <select
                                  value={aff.role}
                                  onChange={(e) =>
                                    updateAff(
                                      aff.id,
                                      "role",
                                      e.target.value as RoleMission
                                    )
                                  }
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-amber-300 font-medium"
                                >
                                  <option value="Vendeur">Vendeur</option>
                                  <option value="Finisseur">Finisseur</option>
                                </select>
                              </div>

                              <div className="col-span-1 sm:col-span-2">
                                <span className="text-[10px] text-slate-400 block mb-0.5">
                                  Du
                                </span>
                                <input
                                  type="date"
                                  value={aff.dateDebut}
                                  onChange={(e) =>
                                    updateAff(
                                      aff.id,
                                      "dateDebut",
                                      e.target.value
                                    )
                                  }
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1.5 text-slate-200"
                                />
                              </div>

                              <div className="col-span-1 sm:col-span-2">
                                <span className="text-[10px] text-slate-400 block mb-0.5">
                                  Au
                                </span>
                                <input
                                  type="date"
                                  value={aff.dateFin}
                                  min={aff.dateDebut}
                                  onChange={(e) =>
                                    updateAff(aff.id, "dateFin", e.target.value)
                                  }
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1.5 text-slate-200"
                                />
                              </div>

                              <div className="col-span-1 sm:col-span-1">
                                <span className="text-[10px] text-slate-400 block mb-0.5">
                                  Frais/j
                                </span>
                                <input
                                  type="number"
                                  value={aff.fraisJournalier}
                                  onChange={(e) =>
                                    updateAff(
                                      aff.id,
                                      "fraisJournalier",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1.5 text-white text-center"
                                />
                              </div>

                              <div className="col-span-1 sm:col-span-1">
                                <span className="text-[10px] text-slate-400 block mb-0.5">
                                  Comm%
                                </span>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={aff.commission}
                                  onChange={(e) =>
                                    updateAff(
                                      aff.id,
                                      "commission",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1.5 text-amber-300 font-bold text-center"
                                />
                              </div>

                              <div className="col-span-1 sm:col-span-1 text-right">
                                <button
                                  type="button"
                                  onClick={() => removeAff(aff.id)}
                                  className="p-1.5 text-slate-500 hover:text-red-400 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }}
              </operationForm.Field>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewOpModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Créer l&apos;opération
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE CONTRATS */}
      {contractOperation && (
        <ContractGeneratorModal
          operation={contractOperation}
          vendeurs={vendeurs}
          onClose={() => setContractOperation(null)}
        />
      )}
    </div>
  );
}
