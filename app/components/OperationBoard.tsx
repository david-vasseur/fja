"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Download,
  Upload,
  FileSpreadsheet,
  LogOut,
  Users,
  Calendar,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  UserPlus,
  Store,
  X,
  Pencil,
  Check,
} from "lucide-react";
import {
  ModePaiement,
  RoleMission,
  StatutCredit,
  Vente,
  calculerLigne,
  calculerNbJours,
} from "@/types/operation";
import { useAppStore } from "@/lib/store/useAppStore";

const fmtEur = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n);

const fmtPct = (n: number) =>
  `${n.toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  })} %`;

const PIED_PREFIX = "pied:";

type VenteFormData = Omit<Vente, "id">;

export default function OperationBoard({ slug }: { slug: string }) {
  const router = useRouter();

  const {
    auth,
    vendeurs: allVendeurs,
    operations,
    updateOperation,
    addAffectation,
    updateAffectation,
    deleteAffectation,
    addVente,
    updateVente,
    deleteVente,
    logout,
  } = useAppStore();

  const [mounted, setMounted] = useState(false);
  const [showVendeurs, setShowVendeurs] = useState(true);
  const [nouveauVendeurPied, setNouveauVendeurPied] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- État de la modale Vente (null = fermée, "new" = création, string = id édition) ---
  const [venteModalMode, setVenteModalMode] = useState<"new" | string | null>(
    null
  );
  const [venteForm, setVenteForm] = useState<VenteFormData>({
    date: "",
    numBL: "",
    client: "",
    prixVenteTTC: 0,
    acompte: 0,
    prixAchatHT: 0,
    modele: "",
    vendeurId: "",
    finisseurId: "",
    paiement: "COMPTANT",
    livraisonTTC: 0,
    creditAccepte: "",
    observations: "Contremarque",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = auth.role === "admin";
  const data = operations.find((op) => op.slug === slug);

  useEffect(() => {
    if (!mounted) return;
    const autorise =
      auth.role === "admin" ||
      (auth.role === "operation" && auth.operationSlug === slug);

    if (!autorise) {
      router.push("/");
    }
  }, [mounted, auth, slug, router]);

  // --- Liste unifiée des intervenants pour les <select> Vendeur & Finisseur ---
  const optionsIntervenants = useMemo(() => {
    if (!data) return [];
    const affs = data.affectations ?? [];
    const pieds = data.vendeursEnPied ?? [];

    const fjaOptions = affs.map((a) => {
      const v = allVendeurs.find((x) => x.id === a.vendeurId);
      const label = v ? (v.prenom ? `${v.prenom}` : v.nom) : "Inconnu";
      return {
        value: a.vendeurId,
        label,
        badge: `FJA (${a.role})`,
        roleMission: a.role,
        isPied: false,
      };
    });

    const uniqueFja = fjaOptions.filter(
      (item, idx, self) =>
        idx === self.findIndex((t) => t.value === item.value)
    );

    const piedOptions = pieds.map((nom) => ({
      value: `${PIED_PREFIX}${nom}`,
      label: nom,
      badge: "Magasin",
      roleMission: null,
      isPied: true,
    }));

    return [...uniqueFja, ...piedOptions];
  }, [data, allVendeurs]);

  // --- Calculs Totaux + CA par intervenant (FJA + Vendeurs en pied) ---
  const totaux = useMemo(() => {
    if (!data) {
      return {
        totalVentePlusLivraison: 0,
        totalVenteTTC: 0,
        totalLivraisonTTC: 0,
        totalAcompte: 0,
        pctAcompteGlobal: 0,
        totalAchatHT: 0,
        coefProduit: 0,
        coefLivre: 0,
        tauxMargeComptable: 0,
        margeNetHT: 0,
        tauxMarque: 0,
        totalEcartCoefOp: 0,
        caParIntervenant: {} as Record<
          string,
          { caVendeur: number; caFinish: number; nbVentes: number }
        >,
      };
    }

    let totalVenteTTC = 0;
    let totalLivraisonTTC = 0;
    let totalAcompte = 0;
    let totalAchatHT = 0;
    let totalEcartCoefOp = 0;

    const caParIntervenant: Record<
      string,
      { caVendeur: number; caFinish: number; nbVentes: number }
    > = {};

    const ensureEntry = (id: string) => {
      if (!caParIntervenant[id]) {
        caParIntervenant[id] = { caVendeur: 0, caFinish: 0, nbVentes: 0 };
      }
    };

    (data.affectations ?? []).forEach((a) => ensureEntry(a.vendeurId));
    (data.vendeursEnPied ?? []).forEach((nom) =>
      ensureEntry(`${PIED_PREFIX}${nom}`)
    );

    for (const v of data.ventes) {
      const horsPeriode =
        (data.dateDebut && v.date < data.dateDebut) ||
        (data.dateFin && v.date > data.dateFin);
      if (horsPeriode) continue;

      const calc = calculerLigne(v, data.coefOperation, data.tva);
      totalVenteTTC += v.prixVenteTTC;
      totalLivraisonTTC += v.livraisonTTC;
      totalAcompte += v.acompte;
      totalAchatHT += v.prixAchatHT;
      totalEcartCoefOp += calc.ecartCoefOp;

      if (v.vendeurId) {
        ensureEntry(v.vendeurId);
        caParIntervenant[v.vendeurId].caVendeur += calc.caHT;
        caParIntervenant[v.vendeurId].nbVentes += 1;
      }
      if (v.finisseurId) {
        ensureEntry(v.finisseurId);
        caParIntervenant[v.finisseurId].caFinish += calc.caHT;
        if (v.finisseurId !== v.vendeurId) {
          caParIntervenant[v.finisseurId].nbVentes += 1;
        }
      }
    }

    const totalVentePlusLivraison = totalVenteTTC + totalLivraisonTTC;
    const totalCAHT = totalVenteTTC / data.tva;
    const margeNetHT = totalCAHT - totalAchatHT;
    const pctAcompteGlobal =
      totalVenteTTC > 0 ? (totalAcompte / totalVenteTTC) * 100 : 0;
    const coefProduit = totalAchatHT > 0 ? totalVenteTTC / totalAchatHT : 0;
    const coefLivre =
      totalAchatHT > 0 ? totalVentePlusLivraison / totalAchatHT : 0;
    const tauxMargeComptable =
      totalAchatHT > 0 ? (margeNetHT / totalAchatHT) * 100 : 0;
    const tauxMarque = totalCAHT > 0 ? (margeNetHT / totalCAHT) * 100 : 0;

    return {
      totalVentePlusLivraison,
      totalVenteTTC,
      totalLivraisonTTC,
      totalAcompte,
      pctAcompteGlobal,
      totalAchatHT,
      coefProduit,
      coefLivre,
      tauxMargeComptable,
      margeNetHT,
      tauxMarque,
      totalEcartCoefOp,
      caParIntervenant,
    };
  }, [data]);

  if (!mounted || !data) return null;

  const affectations = data.affectations ?? [];
  const vendeursEnPied = data.vendeursEnPied ?? [];

  // --- Ouverture / Sauvegarde Modale Vente ---
  const openNewVenteModal = () => {
    const defaultVendeur =
      affectations.find((a) => a.role === "Vendeur")?.vendeurId ?? "";
    const defaultFinish =
      affectations.find(
        (a) => a.role === "Finisseur" || (a.role as string) === "Finisseur"
      )?.vendeurId ?? "";

    const today = new Date().toISOString().slice(0, 10);
    const defaultDate =
      data.dateDebut && today < data.dateDebut
        ? data.dateDebut
        : data.dateFin && today > data.dateFin
          ? data.dateFin
          : today;

    setVenteForm({
      date: defaultDate,
      numBL: "",
      client: "",
      prixVenteTTC: 0,
      acompte: 0,
      prixAchatHT: 0,
      modele: "",
      vendeurId: defaultVendeur,
      finisseurId: defaultFinish,
      paiement: "COMPTANT",
      livraisonTTC: 0,
      creditAccepte: "",
      observations: "Contremarque",
    });
    setVenteModalMode("new");
  };

  const openEditVenteModal = (v: Vente) => {
    const { id, ...rest } = v;
    setVenteForm({ ...rest });
    setVenteModalMode(id);
  };

  const handleSaveVenteModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!venteModalMode) return;

    const payload: VenteFormData = {
      ...venteForm,
      client: venteForm.client.trim().toUpperCase(),
      modele: venteForm.modele.trim().toUpperCase(),
    };

    if (venteModalMode === "new") {
      addVente(slug, payload);
    } else {
      updateVente(slug, venteModalMode, payload);
    }
    setVenteModalMode(null);
  };

  // Aperçu live des calculs dans la modale
  const previewCalc = calculerLigne(
    { id: "preview", ...venteForm },
    data.coefOperation,
    data.tva
  );

  // --- Gestion des vendeurs en pied (accessible magasin + admin) ---
  const handleAddVendeurPied = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = nouveauVendeurPied.trim();
    if (!clean) return;
    const formatted = clean.charAt(0).toUpperCase() + clean.slice(1);
    if (
      vendeursEnPied.some(
        (v) => v.toLowerCase() === formatted.toLowerCase()
      )
    ) {
      setNouveauVendeurPied("");
      return;
    }
    updateOperation(slug, {
      vendeursEnPied: [...vendeursEnPied, formatted],
    });
    setNouveauVendeurPied("");
  };

  const handleRemoveVendeurPied = (nom: string) => {
    updateOperation(slug, {
      vendeursEnPied: vendeursEnPied.filter((v) => v !== nom),
    });
  };

  const handleAddAffectation = () => {
    if (allVendeurs.length === 0) return;
    addAffectation(slug, {
      vendeurId: allVendeurs[0].id,
      role: "Vendeur",
      dateDebut: data.dateDebut,
      dateFin: data.dateFin,
      fraisJournalier: 80,
      commission: 5,
    });
  };

  const resolveNomIntervenant = (id: string) => {
    if (!id) return "";
    if (id.startsWith(PIED_PREFIX)) return id.slice(PIED_PREFIX.length);
    const v = allVendeurs.find((x) => x.id === id);
    return v ? v.prenom || v.nom : "";
  };

  // --- Export / Import ---
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed.ventes) {
          updateOperation(slug, {
            nomOperation: isAdmin
              ? (parsed.nomOperation ?? data.nomOperation)
              : data.nomOperation,
            dateDebut: isAdmin
              ? (parsed.dateDebut ?? data.dateDebut)
              : data.dateDebut,
            dateFin: isAdmin
              ? (parsed.dateFin ?? data.dateFin)
              : data.dateFin,
            coefOperation: isAdmin
              ? (parsed.coefOperation ?? data.coefOperation)
              : data.coefOperation,
            affectations: isAdmin
              ? (parsed.affectations ?? data.affectations)
              : data.affectations,
            vendeursEnPied: parsed.vendeursEnPied ?? data.vendeursEnPied,
            ventes: parsed.ventes,
          });
        }
      } catch {
        alert("Fichier JSON invalide");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const exportCSV = () => {
    const sep = ";";
    const headers = [
      "Date",
      "N° BL",
      "Nom Client",
      "Prix Vente TTC",
      "Acompte",
      "% Acompte",
      "Prix Achat HT",
      "Coef",
      "Modèle",
      "Vendeur",
      "Finisseur",
      "Paiement",
      "Livraison",
      "Crédit Accepté",
      "Observations",
      "Écart Coef Op (€)",
    ];
    const rows = data.ventes.map((v) => {
      const c = calculerLigne(v, data.coefOperation, data.tva);
      return [
        v.date,
        v.numBL,
        `"${v.client}"`,
        v.prixVenteTTC.toFixed(2).replace(".", ","),
        v.acompte.toFixed(2).replace(".", ","),
        c.pctAcompte.toFixed(2).replace(".", ","),
        v.prixAchatHT.toFixed(2).replace(".", ","),
        c.coef.toFixed(2).replace(".", ","),
        `"${v.modele}"`,
        resolveNomIntervenant(v.vendeurId),
        resolveNomIntervenant(v.finisseurId),
        v.paiement,
        v.livraisonTTC.toFixed(2).replace(".", ","),
        v.creditAccepte,
        `"${v.observations}"`,
        c.ecartCoefOp.toFixed(2).replace(".", ","),
      ].join(sep);
    });
    const csv = "\uFEFF" + [headers.join(sep), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 pb-16">
      {/* TOP BAR */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-amber-500/20 px-4 py-3">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                href="/dashboard"
                title="Retour au Dashboard Admin"
                className="p-2 rounded-lg bg-slate-800 hover:bg-amber-500/20 border border-slate-700 text-amber-400 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
            )}
            <div className="relative w-12 h-8 rounded overflow-hidden border border-amber-500/30 shrink-0">
              <Image
                src="/logo.webp"
                alt="FJA Conseils"
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div>
              {isAdmin ? (
                <input
                  type="text"
                  value={data.nomOperation}
                  onChange={(e) =>
                    updateOperation(slug, { nomOperation: e.target.value })
                  }
                  className="text-base sm:text-lg font-bold text-amber-400 bg-transparent border-b border-transparent hover:border-amber-500/40 focus:border-amber-400 focus:outline-none"
                />
              ) : (
                <h1 className="text-base sm:text-lg font-bold text-amber-400">
                  {data.nomOperation}
                </h1>
              )}

              {/* DATES & COEF OP : ÉDITABLES UNIQUEMENT PAR L'ADMIN */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-amber-500/70" />
                <span>Du</span>
                <input
                  type="date"
                  value={data.dateDebut}
                  disabled={!isAdmin}
                  onChange={(e) =>
                    isAdmin &&
                    updateOperation(slug, { dateDebut: e.target.value })
                  }
                  className={`bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 ${
                    !isAdmin ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                />
                <span>au</span>
                <input
                  type="date"
                  value={data.dateFin}
                  min={data.dateDebut}
                  disabled={!isAdmin}
                  onChange={(e) =>
                    isAdmin &&
                    updateOperation(slug, { dateFin: e.target.value })
                  }
                  className={`bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 ${
                    !isAdmin ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                />
                <span className="hidden sm:inline text-slate-600">|</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400/90 font-medium">
                    Coef Op :
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    value={data.coefOperation}
                    disabled={!isAdmin}
                    onChange={(e) =>
                      isAdmin &&
                      updateOperation(slug, {
                        coefOperation: parseFloat(e.target.value) || 0,
                      })
                    }
                    className={`w-14 bg-slate-950 border border-amber-500/40 rounded px-1.5 py-0.5 text-amber-300 font-semibold text-center ${
                      !isAdmin ? "opacity-75 cursor-not-allowed" : ""
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* BOUTONS ACTIONS */}
          <div className="flex items-center gap-2">
            <button
              onClick={exportJSON}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sauvegarder</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Charger</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={importJSON}
              className="hidden"
            />
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-xs font-medium transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={() => {
                logout();
                router.push("/");
              }}
              title="Déconnexion"
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-950/60 border border-slate-700 text-slate-400 hover:text-red-300 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 pt-6 space-y-6">
        {/* BANDEAU KPI */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-900/90 border border-amber-500/20 rounded-xl p-3.5">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">
              Vente + Livraison
            </p>
            <p className="text-lg sm:text-xl font-bold text-white mt-1">
              {fmtEur(totaux.totalVentePlusLivraison)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Dont Liv. {fmtEur(totaux.totalLivraisonTTC)}
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">
              Total Vente TTC
            </p>
            <p className="text-lg sm:text-xl font-bold text-amber-400 mt-1">
              {fmtEur(totaux.totalVenteTTC)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Acomptes : {fmtEur(totaux.totalAcompte)} (
              {fmtPct(totaux.pctAcompteGlobal)})
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">
              Total Achat HT
            </p>
            <p className="text-lg sm:text-xl font-bold text-slate-200 mt-1">
              {fmtEur(totaux.totalAchatHT)}
            </p>
            <p className="text-[11px] text-amber-400/80 mt-0.5">
              Coef : {totaux.coefProduit.toFixed(2)} | Livré :{" "}
              {totaux.coefLivre.toFixed(2)}
            </p>
          </div>

          <div className="bg-slate-900/90 border border-emerald-500/25 rounded-xl p-3.5">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">
              Marge Net HT
            </p>
            <p className="text-lg sm:text-xl font-bold text-emerald-400 mt-1">
              {fmtEur(totaux.margeNetHT)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Taux marge : {fmtPct(totaux.tauxMargeComptable)}
            </p>
          </div>

          <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-3.5">
            <p className="text-[11px] uppercase tracking-wider text-amber-300/80">
              Taux de Marque
            </p>
            <p className="text-lg sm:text-xl font-bold text-amber-400 mt-1">
              {fmtPct(totaux.tauxMarque)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Base WinMeuble HT
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">
              Bilan Coef Op ({data.coefOperation})
            </p>
            <p
              className={`text-lg sm:text-xl font-bold mt-1 ${
                totaux.totalEcartCoefOp >= 0
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {totaux.totalEcartCoefOp >= 0 ? "+" : ""}
              {fmtEur(totaux.totalEcartCoefOp)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Écart vs objectif coef
            </p>
          </div>
        </section>

        {/* BLOC ÉQUIPE : VUE ADMIN VS VUE MAGASIN */}
        {isAdmin ? (
          <section className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
            <div
              onClick={() => setShowVendeurs(!showVendeurs)}
              className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400">
                  Équipe Mission FJA & Vendeurs Magasin (Vue Admin)
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddAffectation();
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-medium cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Affecter FJA
                </button>
                {showVendeurs ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>

            {showVendeurs && (
              <div className="p-4 space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left min-w-[850px]">
                    <thead className="text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="pb-2">Intervenant FJA</th>
                        <th className="pb-2">Rôle</th>
                        <th className="pb-2">Du</th>
                        <th className="pb-2">Au</th>
                        <th className="pb-2 text-center">Jours</th>
                        <th className="pb-2">Frais / j (€)</th>
                        <th className="pb-2">Comm. (%)</th>
                        <th className="pb-2 text-right">CA HT Réalisé</th>
                        <th className="pb-2 text-right">Comm. Due</th>
                        <th className="pb-2 text-right">Total Frais</th>
                        <th className="pb-2 text-right text-amber-400">
                          Total Mission
                        </th>
                        <th className="pb-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {affectations.map((aff) => {
                        const statsV = totaux.caParIntervenant[
                          aff.vendeurId
                        ] ?? {
                          caVendeur: 0,
                          caFinish: 0,
                          nbVentes: 0,
                        };
                        const caRetenu =
                          aff.role === "Vendeur"
                            ? statsV.caVendeur
                            : statsV.caFinish;
                        const commDue = (caRetenu * aff.commission) / 100;
                        const nbJours = calculerNbJours(
                          aff.dateDebut,
                          aff.dateFin
                        );
                        const totalFrais = nbJours * aff.fraisJournalier;

                        return (
                          <tr key={aff.id}>
                            <td className="py-2 pr-2">
                              <select
                                value={aff.vendeurId}
                                onChange={(e) =>
                                  updateAffectation(slug, aff.id, {
                                    vendeurId: e.target.value,
                                  })
                                }
                                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-medium"
                              >
                                {allVendeurs.map((v) => (
                                  <option key={v.id} value={v.id}>
                                    {v.prenom ? `${v.prenom} ${v.nom}` : v.nom}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 pr-2">
                              <select
                                value={aff.role}
                                onChange={(e) =>
                                  updateAffectation(slug, aff.id, {
                                    role: e.target.value as RoleMission,
                                  })
                                }
                                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-amber-300 font-medium"
                              >
                                <option value="Vendeur">Vendeur</option>
                                <option value="Finish">Finisseur</option>
                              </select>
                            </td>
                            <td className="py-2 pr-2">
                              <input
                                type="date"
                                value={aff.dateDebut}
                                min={data.dateDebut}
                                max={data.dateFin}
                                onChange={(e) =>
                                  updateAffectation(slug, aff.id, {
                                    dateDebut: e.target.value,
                                  })
                                }
                                className="bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-slate-200"
                              />
                            </td>
                            <td className="py-2 pr-2">
                              <input
                                type="date"
                                value={aff.dateFin}
                                min={aff.dateDebut}
                                max={data.dateFin}
                                onChange={(e) =>
                                  updateAffectation(slug, aff.id, {
                                    dateFin: e.target.value,
                                  })
                                }
                                className="bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-slate-200"
                              />
                            </td>
                            <td className="py-2 text-center font-semibold text-slate-300">
                              {nbJours} j
                            </td>
                            <td className="py-2 pr-2">
                              <input
                                type="number"
                                value={aff.fraisJournalier}
                                onChange={(e) =>
                                  updateAffectation(slug, aff.id, {
                                    fraisJournalier:
                                      parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 w-16 text-slate-200"
                              />
                            </td>
                            <td className="py-2 pr-2">
                              <input
                                type="number"
                                step="0.1"
                                value={aff.commission}
                                onChange={(e) =>
                                  updateAffectation(slug, aff.id, {
                                    commission: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 w-16 text-amber-300 font-bold"
                              />
                            </td>
                            <td className="py-2 text-right font-medium text-slate-300">
                              {fmtEur(caRetenu)}
                            </td>
                            <td className="py-2 text-right text-slate-400">
                              {fmtEur(commDue)}
                            </td>
                            <td className="py-2 text-right text-slate-400">
                              {fmtEur(totalFrais)}
                            </td>
                            <td className="py-2 text-right font-bold text-amber-400">
                              {fmtEur(commDue + totalFrais)}
                            </td>
                            <td className="py-2 text-right">
                              <button
                                type="button"
                                onClick={() => deleteAffectation(slug, aff.id)}
                                className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Gestion des vendeurs en pied du magasin */}
                <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-400 font-medium inline-flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-amber-400" />
                      Vendeurs en pied (magasin, hors comm/frais FJA) :
                    </span>
                    {vendeursEnPied.map((nom) => {
                      const st = totaux.caParIntervenant[
                        `${PIED_PREFIX}${nom}`
                      ] ?? { caVendeur: 0, caFinish: 0, nbVentes: 0 };
                      return (
                        <span
                          key={nom}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
                        >
                          <strong>{nom}</strong>
                          <span className="text-slate-400">
                            ({fmtEur(st.caVendeur + st.caFinish)} HT)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveVendeurPied(nom)}
                            className="text-slate-500 hover:text-red-400 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>

                  <form
                    onSubmit={handleAddVendeurPied}
                    className="flex items-center gap-1.5"
                  >
                    <input
                      type="text"
                      placeholder="Ajouter vendeur magasin..."
                      value={nouveauVendeurPied}
                      onChange={(e) => setNouveauVendeurPied(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white w-44"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-amber-300 font-medium cursor-pointer"
                    >
                      + Ajouter
                    </button>
                  </form>
                </div>
              </div>
            )}
          </section>
        ) : (
          /* VUE MAGASIN (NON-ADMIN) */
          <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400">
                  Suivi du Chiffre par Vendeur & Équipe Magasin
                </h2>
              </div>

              <form
                onSubmit={handleAddVendeurPied}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Prénom vendeur magasin (ex: Ingrid)"
                  value={nouveauVendeurPied}
                  onChange={(e) => setNouveauVendeurPied(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white w-56"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Ajouter
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {optionsIntervenants.map((item) => {
                const st = totaux.caParIntervenant[item.value] ?? {
                  caVendeur: 0,
                  caFinish: 0,
                  nbVentes: 0,
                };
                return (
                  <div
                    key={item.value}
                    className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white">
                          {item.label}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            item.isPied
                              ? "bg-slate-800 text-slate-300"
                              : "bg-amber-500/15 text-amber-400"
                          }`}
                        >
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Vendeur :{" "}
                        <strong className="text-slate-200">
                          {fmtEur(st.caVendeur)}
                        </strong>{" "}
                        HT
                      </p>
                      <p className="text-xs text-slate-400">
                        Finisseur :{" "}
                        <strong className="text-slate-200">
                          {fmtEur(st.caFinish)}
                        </strong>{" "}
                        HT
                      </p>
                    </div>

                    {item.isPied && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVendeurPied(item.label)}
                        title="Retirer ce vendeur magasin"
                        className="text-slate-600 hover:text-red-400 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION TABLEAU DES VENTES */}
        <section className="bg-slate-900/90 border border-amber-500/20 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400">
                Journal des Ventes ({data.ventes.length})
              </h2>
            </div>
            <button
              onClick={openNewVenteModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Ajouter une vente
            </button>
          </div>

          {data.ventes.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-400">
              Aucune vente enregistrée pour le moment. Cliquez sur{" "}
              <strong className="text-amber-400">Ajouter une vente</strong> pour
              saisir le premier bon de commande.
            </div>
          ) : (
            <>
              {/* VUE DESKTOP */}
              <div className="hidden xl:block overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase">
                    <tr>
                      <th className="py-2.5 px-2.5">Date</th>
                      <th className="py-2.5 px-2">BL</th>
                      <th className="py-2.5 px-2.5">Client</th>
                      <th className="py-2.5 px-2">Vente TTC</th>
                      <th className="py-2.5 px-2">Acompte</th>
                      <th className="py-2.5 px-2 text-right">% Ac.</th>
                      <th className="py-2.5 px-2">Achat HT</th>
                      <th className="py-2.5 px-2 text-right">Coef</th>
                      <th className="py-2.5 px-2">Modèle</th>
                      <th className="py-2.5 px-2">Vendeur</th>
                      <th className="py-2.5 px-2">Finisseur</th>
                      <th className="py-2.5 px-2">Paiement</th>
                      <th className="py-2.5 px-2">Livraison</th>
                      <th className="py-2.5 px-2">Crédit</th>
                      <th className="py-2.5 px-2">Observations</th>
                      <th className="py-2.5 px-2 text-right text-amber-400">
                        Écart Op
                      </th>
                      <th className="py-2.5 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {data.ventes.map((v) => {
                      const c = calculerLigne(v, data.coefOperation, data.tva);
                      const horsPeriode =
                        (data.dateDebut && v.date < data.dateDebut) ||
                        (data.dateFin && v.date > data.dateFin);

                      return (
                        <tr
                          key={v.id}
                          className={
                            horsPeriode
                              ? "bg-red-950/30"
                              : "hover:bg-slate-800/40 transition"
                          }
                        >
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-1">
                              <input
                                type="date"
                                value={v.date}
                                min={data.dateDebut}
                                max={data.dateFin}
                                onChange={(e) =>
                                  updateVente(slug, v.id, {
                                    date: e.target.value,
                                  })
                                }
                                className="bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-slate-200 w-28"
                              />
                              {horsPeriode && (
                                <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-1.5">
                            <input
                              type="text"
                              value={v.numBL}
                              onChange={(e) =>
                                updateVente(slug, v.id, {
                                  numBL: e.target.value,
                                })
                              }
                              className="bg-slate-950 border border-slate-700 rounded px-1.5 py-1 w-14 text-slate-200"
                            />
                          </td>
                          <td className="py-2 px-1.5">
                            <input
                              type="text"
                              value={v.client}
                              onChange={(e) =>
                                updateVente(slug, v.id, {
                                  client: e.target.value.toUpperCase(),
                                })
                              }
                              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 w-28 font-semibold text-white"
                            />
                          </td>
                          <td className="py-2 px-1.5">
                            <input
                              type="number"
                              value={v.prixVenteTTC || ""}
                              onChange={(e) =>
                                updateVente(slug, v.id, {
                                  prixVenteTTC:
                                    parseFloat(e.target.value) || 0,
                                })
                              }
                              className="bg-slate-950 border border-slate-700 rounded px-1.5 py-1 w-20 text-amber-300 font-semibold"
                            />
                          </td>
                          <td className="py-2 px-1.5">
                            <input
                              type="number"
                              value={v.acompte || ""}
                              onChange={(e) =>
                                updateVente(slug, v.id, {
                                  acompte: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="bg-slate-950 border border-slate-700 rounded px-1.5 py-1 w-20 text-slate-200"
                            />
                          </td>
                          <td className="py-2 px-1.5 text-right text-slate-400">
                            {c.pctAcompte.toFixed(1)}%
                          </td>
                          <td className="py-2 px-1.5">
                            <input
                              type="number"
                              value={v.prixAchatHT || ""}
                              onChange={(e) =>
                                updateVente(slug, v.id, {
                                  prixAchatHT: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="bg-slate-950 border border-slate-700 rounded px-1.5 py-1 w-20 text-slate-200"
                            />
                          </td>
                          <td
                            className={`py-2 px-1.5 text-right font-bold ${
                              c.coef >= data.coefOperation
                                ? "text-emerald-400"
                                : "text-amber-400"
                            }`}
                          >
                            {c.coef.toFixed(2)}
                          </td>
                          <td className="py-2 px-1.5">
                            <input
                              type="text"
                              value={v.modele}
                              onChange={(e) =>
                                updateVente(slug, v.id, {
                                  modele: e.target.value.toUpperCase(),
                                })
                              }
                              className="bg-slate-950 border border-slate-700 rounded px-1.5 py-1 w-24 text-slate-200"
                            />
                          </td>
                          <td className="py-2 px-1.5">
                            <select
                              value={v.vendeurId}
                              onChange={(e) =>
                                updateVente(slug, v.id, {
                                  vendeurId: e.target.value,
                                })
                              }
                              className="bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-slate-200"
                            >
                              <option value="">-</option>
                              {optionsIntervenants.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-1.5">
                            <select
                              value={v.finisseurId}
                              onChange={(e) =>
                                updateVente(slug, v.id, {
                                  finisseurId: e.target.value,
                                })
                              }
                              className="bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-slate-200"
                            >
                              <option value="">-</option>
                              {optionsIntervenants.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-1.5">
                            <select
                              value={v.paiement}
                              onChange={(e) =>
                                updateVente(slug, v.id, {
                                  paiement: e.target.value as ModePaiement,
                                })
                              }
                              className="bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-slate-200"
                            >
                              <option value="COMPTANT">COMPTANT</option>
                              <option value="CREDIT">CREDIT</option>
                              <option value="CB">CB</option>
                              <option value="CHEQUE">CHEQUE</option>
                              <option value="VIREMENT">VIREMENT</option>
                            </select>
                          </td>
                          <td className="py-2 px-1.5">
                            <input
                              type="number"
                              value={v.livraisonTTC || ""}
                              onChange={(e) =>
                                updateVente(slug, v.id, {
                                  livraisonTTC:
                                    parseFloat(e.target.value) || 0,
                                })
                              }
                              className="bg-slate-950 border border-slate-700 rounded px-1.5 py-1 w-16 text-slate-200"
                            />
                          </td>
                          <td className="py-2 px-1.5">
                            <select
                              value={v.creditAccepte}
                              onChange={(e) =>
                                updateVente(slug, v.id, {
                                  creditAccepte: e.target.value as StatutCredit,
                                })
                              }
                              className="bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-slate-200"
                            >
                              <option value="">-</option>
                              <option value="Oui">Oui</option>
                              <option value="Non">Non</option>
                              <option value="En cours">En cours</option>
                            </select>
                          </td>
                          <td className="py-2 px-1.5">
                            <input
                              type="text"
                              value={v.observations}
                              onChange={(e) =>
                                updateVente(slug, v.id, {
                                  observations: e.target.value,
                                })
                              }
                              className="bg-slate-950 border border-slate-700 rounded px-1.5 py-1 w-28 text-slate-300"
                            />
                          </td>
                          <td
                            className={`py-2 px-2 text-right font-bold ${
                              c.ecartCoefOp >= 0
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            {c.ecartCoefOp.toFixed(1)}
                          </td>
                          <td className="py-2 px-1.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => openEditVenteModal(v)}
                              title="Modifier dans le formulaire"
                              className="text-slate-400 hover:text-amber-400 p-1 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteVente(slug, v.id)}
                              title="Supprimer"
                              className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* VUE MOBILE & TABLETTE : CARTES COMPACTES -> MODALE AU CLIC */}
              <div className="xl:hidden divide-y divide-slate-800">
                {data.ventes.map((v) => {
                  const c = calculerLigne(v, data.coefOperation, data.tva);
                  const horsPeriode =
                    (data.dateDebut && v.date < data.dateDebut) ||
                    (data.dateFin && v.date > data.dateFin);
                  const nomVendeur = resolveNomIntervenant(v.vendeurId);
                  const nomFinisseur = resolveNomIntervenant(v.finisseurId);

                  return (
                    <div
                      key={v.id}
                      onClick={() => openEditVenteModal(v)}
                      className={`p-4 space-y-2.5 active:bg-slate-800/70 transition cursor-pointer ${
                        horsPeriode ? "bg-red-950/25" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 text-xs font-bold">
                              BL #{v.numBL || "—"}
                            </span>
                            <span className="font-bold text-white text-sm">
                              {v.client || "CLIENT SANS NOM"}
                            </span>
                            {horsPeriode && (
                              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {v.date} • {v.modele || "Modèle non précisé"} •{" "}
                            <span className="text-slate-300">{v.paiement}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded ${
                              c.coef >= data.coefOperation
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                                : "bg-amber-950 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            Coef {c.coef.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditVenteModal(v);
                            }}
                            aria-label="Modifier la vente"
                            className="p-1.5 rounded-lg bg-slate-800 text-amber-400"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteVente(slug, v.id);
                            }}
                            aria-label="Supprimer la vente"
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1 text-xs bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
                        <div>
                          <span className="text-slate-400 block">Vente TTC</span>
                          <strong className="text-amber-300 text-sm">
                            {fmtEur(v.prixVenteTTC)}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">
                            Acompte ({c.pctAcompte.toFixed(0)}%)
                          </span>
                          <strong className="text-slate-200">
                            {fmtEur(v.acompte)}
                          </strong>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 block">Écart Op</span>
                          <strong
                            className={
                              c.ecartCoefOp >= 0
                                ? "text-emerald-400"
                                : "text-red-400"
                            }
                          >
                            {c.ecartCoefOp >= 0 ? "+" : ""}
                            {fmtEur(c.ecartCoefOp)}
                          </strong>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                        <span>
                          Vendeur :{" "}
                          <strong className="text-slate-200">
                            {nomVendeur || "—"}
                          </strong>{" "}
                          | Finisseur :{" "}
                          <strong className="text-slate-200">
                            {nomFinisseur || "—"}
                          </strong>
                        </span>
                        {v.livraisonTTC > 0 && (
                          <span>Liv. {fmtEur(v.livraisonTTC)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </main>

      {/* ============================================================ */}
      {/* MODALE AJOUT / MODIFICATION D'UNE VENTE                      */}
      {/* ============================================================ */}
      {venteModalMode !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setVenteModalMode(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-2xl bg-slate-900 border border-amber-500/30 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92dvh] flex flex-col overflow-hidden"
          >
            {/* Header modale */}
            <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-amber-400">
                  {venteModalMode === "new"
                    ? "Nouvelle vente"
                    : `Modifier la vente ${venteForm.numBL ? `#${venteForm.numBL}` : ""}`}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Objectif Coef Op :{" "}
                  <strong className="text-amber-300">
                    {data.coefOperation}
                  </strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVenteModalMode(null)}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Corps formulaire */}
            <form
              onSubmit={handleSaveVenteModal}
              className="p-5 overflow-y-auto space-y-4 text-xs"
            >
              {/* Aperçu live des indicateurs calculés */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950 border border-slate-800 rounded-xl p-3">
                <div>
                  <span className="text-slate-400 block">Coef calculé</span>
                  <span
                    className={`text-base font-bold ${
                      previewCalc.coef >= data.coefOperation
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }`}
                  >
                    {previewCalc.coef.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">% Acompte</span>
                  <span className="text-base font-bold text-slate-200">
                    {previewCalc.pctAcompte.toFixed(1)} %
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Écart Coef Op</span>
                  <span
                    className={`text-base font-bold ${
                      previewCalc.ecartCoefOp >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {previewCalc.ecartCoefOp >= 0 ? "+" : ""}
                    {fmtEur(previewCalc.ecartCoefOp)}
                  </span>
                </div>
              </div>

              {/* Ligne 1 : Date, N° BL, Client */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Date de vente *
                  </label>
                  <input
                    type="date"
                    required
                    value={venteForm.date}
                    min={data.dateDebut}
                    max={data.dateFin}
                    onChange={(e) =>
                      setVenteForm({ ...venteForm, date: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    N° BL
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 1042"
                    value={venteForm.numBL}
                    onChange={(e) =>
                      setVenteForm({ ...venteForm, numBL: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-slate-300 font-medium block mb-1">
                    Nom Client *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="DUPONT"
                    value={venteForm.client}
                    onChange={(e) =>
                      setVenteForm({
                        ...venteForm,
                        client: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold"
                  />
                </div>
              </div>

              {/* Ligne 2 : Montants */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-amber-400 font-medium block mb-1">
                    Prix Vente TTC (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0"
                    value={venteForm.prixVenteTTC || ""}
                    onChange={(e) =>
                      setVenteForm({
                        ...venteForm,
                        prixVenteTTC: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-950 border border-amber-500/50 rounded-lg px-3 py-2 text-amber-300 font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Acompte (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={venteForm.acompte || ""}
                    onChange={(e) =>
                      setVenteForm({
                        ...venteForm,
                        acompte: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Prix Achat HT (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0"
                    value={venteForm.prixAchatHT || ""}
                    onChange={(e) =>
                      setVenteForm({
                        ...venteForm,
                        prixAchatHT: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Livraison TTC (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={venteForm.livraisonTTC || ""}
                    onChange={(e) =>
                      setVenteForm({
                        ...venteForm,
                        livraisonTTC: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              {/* Ligne 3 : Modèle, Vendeur, Finisseur */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Modèle
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: MILANO"
                    value={venteForm.modele}
                    onChange={(e) =>
                      setVenteForm({
                        ...venteForm,
                        modele: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Vendeur
                  </label>
                  <select
                    value={venteForm.vendeurId}
                    onChange={(e) =>
                      setVenteForm({ ...venteForm, vendeurId: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  >
                    <option value="">— Aucun —</option>
                    {optionsIntervenants.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} ({opt.badge})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Finisseur
                  </label>
                  <select
                    value={venteForm.finisseurId}
                    onChange={(e) =>
                      setVenteForm({
                        ...venteForm,
                        finisseurId: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  >
                    <option value="">— Aucun —</option>
                    {optionsIntervenants.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} ({opt.badge})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ligne 4 : Paiement, Crédit, Observations */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Mode de paiement
                  </label>
                  <select
                    value={venteForm.paiement}
                    onChange={(e) =>
                      setVenteForm({
                        ...venteForm,
                        paiement: e.target.value as ModePaiement,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  >
                    <option value="COMPTANT">COMPTANT</option>
                    <option value="CREDIT">CREDIT</option>
                    <option value="CB">CB</option>
                    <option value="CHEQUE">CHEQUE</option>
                    <option value="VIREMENT">VIREMENT</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Crédit accepté
                  </label>
                  <select
                    value={venteForm.creditAccepte}
                    onChange={(e) =>
                      setVenteForm({
                        ...venteForm,
                        creditAccepte: e.target.value as StatutCredit,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  >
                    <option value="">—</option>
                    <option value="Oui">Oui</option>
                    <option value="Non">Non</option>
                    <option value="En cours">En cours</option>
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-slate-300 font-medium block mb-1">
                    Observations
                  </label>
                  <input
                    type="text"
                    value={venteForm.observations}
                    onChange={(e) =>
                      setVenteForm({
                        ...venteForm,
                        observations: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              {/* Footer modale */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setVenteModalMode(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {venteModalMode === "new"
                    ? "Enregistrer la vente"
                    : "Mettre à jour"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
