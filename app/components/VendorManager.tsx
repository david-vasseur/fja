"use client";

import React, { useState } from "react";
import { useForm } from "@tanstack/react-form";
import {
  Plus,
  Trash2,
  Edit3,
  UserCheck,
  FileText,
  Phone,
  MapPin,
  BadgeEuro,
  X,
  Briefcase,
  ShieldCheck,
} from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import {
  Civilite,
  TypeContrat,
  Vendeur,
  calculerLigne,
  calculerNbJours,
} from "@/types/operation";

const fmtEur = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n);

const fmtDateFR = (iso?: string) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
};

export default function VendeurManager() {
  const {
    vendeurs,
    operations,
    addVendeur,
    updateVendeur,
    deleteVendeur,
  } = useAppStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVendeur, setEditingVendeur] = useState<Vendeur | null>(null);
  const [selectedVendeurId, setSelectedVendeurId] = useState<string | null>(
    null
  );

  const form = useForm({
    defaultValues: {
      civilite: "M." as Civilite,
      nom: "",
      prenom: "",
      dateNaissance: "",
      lieuNaissance: "",
      nationalite: "Française",
      numeroSecu: "",
      adresse: "",
      codePostal: "",
      ville: "",
      telephone: "",
      email: "",
      iban: "",
      typeContrat: "CDD" as TypeContrat,
      qualification: "vendeur extra animateur de ventes",
      coefficientConvention: "3056",
      periodeEssai: "3 jours",
      baseHoraire: 35,
      salaireBrutMensuel: 0,
      tauxHoraireBrut: 0,
      notes: "",
    },
    onSubmit: async ({ value }) => {
      const payload: Omit<Vendeur, "id"> = {
        civilite: value.civilite,
        nom: value.nom.trim().toUpperCase(),
        prenom: value.prenom.trim(),
        dateNaissance: value.dateNaissance,
        lieuNaissance: value.lieuNaissance.trim(),
        nationalite: value.nationalite.trim(),
        numeroSecu: value.numeroSecu.replace(/\s+/g, ""),
        adresse: value.adresse.trim(),
        codePostal: value.codePostal.trim(),
        ville: value.ville.trim(),
        telephone: value.telephone.trim(),
        email: value.email.trim().toLowerCase(),
        iban: value.iban.trim().toUpperCase(),
        typeContrat: value.typeContrat,
        qualification: value.qualification.trim(),
        coefficientConvention: value.coefficientConvention.trim(),
        periodeEssai: value.periodeEssai.trim(),
        baseHoraire: Number(value.baseHoraire) || 35,
        salaireBrutMensuel: Number(value.salaireBrutMensuel) || 0,
        tauxHoraireBrut: Number(value.tauxHoraireBrut) || 0,
        notes: value.notes.trim(),
      };

      if (editingVendeur) {
        updateVendeur(editingVendeur.id, payload);
      } else {
        addVendeur(payload);
      }

      setIsFormOpen(false);
      setEditingVendeur(null);
      form.reset();
    },
  });

  const openCreateModal = () => {
    setEditingVendeur(null);
    form.reset();
    setIsFormOpen(true);
  };

  const openEditModal = (v: Vendeur) => {
    setEditingVendeur(v);
    form.setFieldValue("civilite", v.civilite ?? "M.");
    form.setFieldValue("nom", v.nom ?? "");
    form.setFieldValue("prenom", v.prenom ?? "");
    form.setFieldValue("dateNaissance", v.dateNaissance ?? "");
    form.setFieldValue("lieuNaissance", v.lieuNaissance ?? "");
    form.setFieldValue("nationalite", v.nationalite ?? "Française");
    form.setFieldValue("numeroSecu", v.numeroSecu ?? "");
    form.setFieldValue("adresse", v.adresse ?? "");
    form.setFieldValue("codePostal", v.codePostal ?? "");
    form.setFieldValue("ville", v.ville ?? "");
    form.setFieldValue("telephone", v.telephone ?? "");
    form.setFieldValue("email", v.email ?? "");
    form.setFieldValue("iban", v.iban ?? "");
    form.setFieldValue("typeContrat", v.typeContrat ?? "CDD");
    form.setFieldValue(
      "qualification",
      v.qualification ?? "vendeur extra animateur de ventes"
    );
    form.setFieldValue(
      "coefficientConvention",
      v.coefficientConvention ?? "3056"
    );
    form.setFieldValue("periodeEssai", v.periodeEssai ?? "3 jours");
    form.setFieldValue("baseHoraire", v.baseHoraire ?? 35);
    form.setFieldValue("salaireBrutMensuel", v.salaireBrutMensuel ?? 0);
    form.setFieldValue("tauxHoraireBrut", v.tauxHoraireBrut ?? 0);
    form.setFieldValue("notes", v.notes ?? "");
    setIsFormOpen(true);
  };

  const selectedVendeur = vendeurs.find((v) => v.id === selectedVendeurId);

  const isContratReady = (v: Vendeur) =>
    Boolean(
      v.prenom &&
        v.dateNaissance &&
        v.lieuNaissance &&
        v.numeroSecu &&
        v.adresse &&
        v.codePostal &&
        v.ville
    );

  // Calcule le bilan d'un vendeur à travers toutes ses affectations sur les opérations
  const getBilanVendeur = (vendeurId: string) => {
    let totalCAHT = 0;
    let totalCommissions = 0;
    let totalFrais = 0;
    let nbMissions = 0;

    const detailsMissions: {
      opId: string;
      opNom: string;
      role: string;
      dateDebut: string;
      dateFin: string;
      nbJours: number;
      caHT: number;
      commissionPct: number;
      commissionEur: number;
      fraisEur: number;
    }[] = [];

    operations.forEach((op) => {
      const affs = (op.affectations ?? []).filter(
        (a) => a.vendeurId === vendeurId
      );

      affs.forEach((aff) => {
        nbMissions += 1;
        const nbJours = calculerNbJours(aff.dateDebut, aff.dateFin);
        const fraisMission = nbJours * aff.fraisJournalier;

        const ventesRole = op.ventes.filter((v) =>
          aff.role === "Vendeur"
            ? v.vendeurId === vendeurId
            : v.finisseurId === vendeurId
        );

        const caHT = ventesRole.reduce(
          (acc, v) => acc + calculerLigne(v, op.coefOperation, op.tva).caHT,
          0
        );
        const commEur = (caHT * aff.commission) / 100;

        totalCAHT += caHT;
        totalCommissions += commEur;
        totalFrais += fraisMission;

        detailsMissions.push({
          opId: op.id,
          opNom: op.nomOperation,
          role: aff.role,
          dateDebut: aff.dateDebut,
          dateFin: aff.dateFin,
          nbJours,
          caHT,
          commissionPct: aff.commission,
          commissionEur: commEur,
          fraisEur: fraisMission,
        });
      });
    });

    return {
      totalCAHT,
      totalCommissions,
      totalFrais,
      nbMissions,
      detailsMissions,
    };
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white">
            Annuaire Vendeurs & Dossiers Contrats ({vendeurs.length})
          </h2>
          <p className="text-xs text-slate-400">
            État civil et coordonnées permanentes. Les rôles, dates, frais et
            commissions se définissent sur chaque opération.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nouveau Vendeur
        </button>
      </div>

      {/* Grille des fiches vendeurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {vendeurs.map((vendeur) => {
          const bilan = getBilanVendeur(vendeur.id);
          const complet = isContratReady(vendeur);

          return (
            <div
              key={vendeur.id}
              onClick={() => setSelectedVendeurId(vendeur.id)}
              className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 flex flex-col justify-between space-y-4 cursor-pointer transition"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-slate-800 text-amber-300 border border-amber-500/20">
                      {vendeur.typeContrat || "CDD"}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        complet
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-950/60 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {complet ? "Dossier contrat OK" : "État civil à compléter"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(vendeur);
                      }}
                      title="Modifier le dossier"
                      className="text-slate-400 hover:text-amber-400 p-1 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          confirm(
                            `Supprimer la fiche de ${vendeur.prenom ?? ""} ${vendeur.nom} ?`
                          )
                        ) {
                          deleteVendeur(vendeur.id);
                        }
                      }}
                      title="Supprimer"
                      className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">
                    {vendeur.civilite ? `${vendeur.civilite} ` : ""}
                    {vendeur.prenom ? `${vendeur.prenom} ` : ""}
                    {vendeur.nom}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {vendeur.qualification ||
                      "vendeur extra animateur de ventes"}
                  </p>
                </div>

                <div className="space-y-1 text-xs text-slate-400">
                  {vendeur.telephone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{vendeur.telephone}</span>
                    </div>
                  )}
                  {vendeur.ville && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        {vendeur.codePostal} {vendeur.ville}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>CA HT Cumulé ({bilan.nbMissions} mission(s)) :</span>
                  <span className="font-semibold text-white">
                    {fmtEur(bilan.totalCAHT)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Commissions + Frais cumulés :</span>
                  <span className="font-bold text-amber-400">
                    {fmtEur(bilan.totalCommissions + bilan.totalFrais)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODALE CRÉATION / ÉDITION VENDEUR */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-3xl bg-slate-900 border border-amber-500/30 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-6 my-auto max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h2 className="text-base sm:text-lg font-bold text-amber-400 uppercase tracking-wide">
                  {editingVendeur
                    ? `Modifier : ${editingVendeur.prenom ?? ""} ${editingVendeur.nom}`
                    : "Nouveau Vendeur — Fiche Signalétique"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="space-y-6 text-xs sm:text-sm"
            >
              {/* BLOC 1 : ÉTAT CIVIL */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  1. Identité & État Civil (Contrat de travail)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <form.Field name="civilite">
                    {(field) => (
                      <div>
                        <label className="block text-xs text-slate-300 mb-1">
                          Civilité *
                        </label>
                        <select
                          value={field.state.value}
                          onChange={(e) =>
                            field.handleChange(e.target.value as Civilite)
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                        >
                          <option value="M.">Monsieur (M.)</option>
                          <option value="Mme">Madame (Mme)</option>
                        </select>
                      </div>
                    )}
                  </form.Field>

                  <form.Field
                    name="nom"
                    validators={{
                      onChange: ({ value }) =>
                        !value.trim() ? "Nom obligatoire" : undefined,
                    }}
                  >
                    {(field) => (
                      <div>
                        <label className="block text-xs text-slate-300 mb-1">
                          Nom de naissance *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="VASSEUR"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white uppercase"
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field
                    name="prenom"
                    validators={{
                      onChange: ({ value }) =>
                        !value.trim() ? "Prénom obligatoire" : undefined,
                    }}
                  >
                    {(field) => (
                      <div className="sm:col-span-2">
                        <label className="block text-xs text-slate-300 mb-1">
                          Prénom(s) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="David"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <form.Field name="dateNaissance">
                    {(field) => (
                      <div>
                        <label className="block text-xs text-slate-300 mb-1">
                          Date de naissance *
                        </label>
                        <input
                          type="date"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="lieuNaissance">
                    {(field) => (
                      <div>
                        <label className="block text-xs text-slate-300 mb-1">
                          Lieu de naissance *
                        </label>
                        <input
                          type="text"
                          placeholder="Châtenay-Malabry (92)"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="nationalite">
                    {(field) => (
                      <div>
                        <label className="block text-xs text-slate-300 mb-1">
                          Nationalité
                        </label>
                        <input
                          type="text"
                          placeholder="Française"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="numeroSecu">
                    {(field) => (
                      <div>
                        <label className="block text-xs text-slate-300 mb-1">
                          N° Sécurité Sociale *
                        </label>
                        <input
                          type="text"
                          maxLength={21}
                          placeholder="1 82 08 92 ..."
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs"
                        />
                      </div>
                    )}
                  </form.Field>
                </div>
              </div>

              {/* BLOC 2 : ADRESSE & COORDONNÉES */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  2. Domicile & Coordonnées
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <form.Field name="adresse">
                    {(field) => (
                      <div className="sm:col-span-2">
                        <label className="block text-xs text-slate-300 mb-1">
                          Adresse postale *
                        </label>
                        <input
                          type="text"
                          placeholder="58 chemin des Grands Fonts"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="codePostal">
                    {(field) => (
                      <div>
                        <label className="block text-xs text-slate-300 mb-1">
                          Code postal *
                        </label>
                        <input
                          type="text"
                          placeholder="30390"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="ville">
                    {(field) => (
                      <div>
                        <label className="block text-xs text-slate-300 mb-1">
                          Ville *
                        </label>
                        <input
                          type="text"
                          placeholder="ESTEZARGUES"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white uppercase"
                        />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <form.Field name="telephone">
                    {(field) => (
                      <div>
                        <label className="block text-xs text-slate-300 mb-1">
                          Téléphone
                        </label>
                        <input
                          type="tel"
                          placeholder="06 00 00 00 00"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="email">
                    {(field) => (
                      <div>
                        <label className="block text-xs text-slate-300 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          placeholder="vendeur@email.fr"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="iban">
                    {(field) => (
                      <div>
                        <label className="block text-xs text-slate-300 mb-1">
                          IBAN (Virements)
                        </label>
                        <input
                          type="text"
                          placeholder="FR76 ...."
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs"
                        />
                      </div>
                    )}
                  </form.Field>
                </div>
              </div>

              {/* BLOC 3 : PROFIL CONTRACTUEL PAR DÉFAUT */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4" />
                  3. Profil Contractuel par Défaut
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <form.Field name="typeContrat">
                    {(field) => (
                      <div>
                        <label className="block text-xs text-slate-300 mb-1">
                          Type de contrat
                        </label>
                        <select
                          value={field.state.value}
                          onChange={(e) =>
                            field.handleChange(e.target.value as TypeContrat)
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-medium"
                        >
                          <option value="CDD">CDD</option>
                          <option value="CDD_USAGE">CDD d&apos;usage</option>
                          <option value="CDI">CDI</option>
                          <option value="INDEPENDANT">Indépendant</option>
                        </select>
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="qualification">
                    {(field) => (
                      <div className="sm:col-span-2">
                        <label className="block text-xs text-slate-300 mb-1">
                          Qualification / Fonction contrat
                        </label>
                        <input
                          type="text"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <form.Field name="periodeEssai">
                    {(field) => (
                      <div>
                        <label className="block text-xs text-slate-300 mb-1">
                          Période d&apos;essai
                        </label>
                        <input
                          type="text"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="notes">
                    {(field) => (
                      <div className="sm:col-span-2">
                        <label className="block text-xs text-slate-300 mb-1">
                          Notes internes
                        </label>
                        <input
                          type="text"
                          placeholder="Notes sur le profil..."
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                    )}
                  </form.Field>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  {editingVendeur
                    ? "Enregistrer les modifications"
                    : "Créer la fiche vendeur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE CONSULTATION FICHE & HISTORIQUE DES MISSIONS */}
      {selectedVendeur && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-5 my-auto">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] uppercase text-amber-400 font-bold">
                  Fiche Vendeur • {selectedVendeur.typeContrat || "CDD"}
                </span>
                <h2 className="text-xl font-bold text-white mt-0.5">
                  {selectedVendeur.civilite} {selectedVendeur.prenom}{" "}
                  {selectedVendeur.nom}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const v = selectedVendeur;
                    setSelectedVendeurId(null);
                    openEditModal(v);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-semibold cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Modifier
                </button>
                <button
                  onClick={() => setSelectedVendeurId(null)}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-950/80 p-4 rounded-xl border border-slate-800">
              <div className="space-y-1">
                <p className="text-amber-400 font-semibold uppercase text-[10px]">
                  État civil
                </p>
                <p className="text-slate-300">
                  <span className="text-slate-500">Né(e) le :</span>{" "}
                  {fmtDateFR(selectedVendeur.dateNaissance)} à{" "}
                  {selectedVendeur.lieuNaissance || "—"}
                </p>
                <p className="text-slate-300 font-mono">
                  <span className="text-slate-500 font-sans">N° Sécu :</span>{" "}
                  {selectedVendeur.numeroSecu || "Non renseigné"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-amber-400 font-semibold uppercase text-[10px]">
                  Adresse & Contact
                </p>
                <p className="text-slate-300">
                  {selectedVendeur.adresse
                    ? `${selectedVendeur.adresse}, ${selectedVendeur.codePostal} ${selectedVendeur.ville}`
                    : "Non renseignée"}
                </p>
                <p className="text-slate-400">
                  {selectedVendeur.telephone || "—"} •{" "}
                  {selectedVendeur.email || "—"}
                </p>
              </div>
            </div>

            {/* Historique des missions affectées */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase text-slate-400 flex items-center gap-1.5">
                <BadgeEuro className="w-4 h-4 text-amber-400" />
                Missions & Rémunérations par Opération
              </h3>
              {getBilanVendeur(selectedVendeur.id).detailsMissions.length ===
              0 ? (
                <p className="text-xs text-slate-500 italic">
                  Aucune mission affectée pour le moment.
                </p>
              ) : (
                getBilanVendeur(selectedVendeur.id).detailsMissions.map(
                  (m, idx) => (
                    <div
                      key={`${m.opId}-${idx}`}
                      className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">
                            {m.opNom}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400">
                            {m.role} ({m.commissionPct}%)
                          </span>
                        </div>
                        <p className="text-slate-500 mt-0.5">
                          Du {fmtDateFR(m.dateDebut)} au {fmtDateFR(m.dateFin)}{" "}
                          ({m.nbJours} j) • CA HT : {fmtEur(m.caHT)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-amber-400 block">
                          {fmtEur(m.commissionEur + m.fraisEur)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Comm {fmtEur(m.commissionEur)} + Frais{" "}
                          {fmtEur(m.fraisEur)}
                        </span>
                      </div>
                    </div>
                  )
                )
              )}
            </div>

            <div className="flex items-center gap-1.5 pt-3 border-t border-slate-800 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                {isContratReady(selectedVendeur)
                  ? "Dossier complet prêt pour l'édition des contrats."
                  : "Complète l'état civil et l'adresse pour générer des contrats complets."}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
