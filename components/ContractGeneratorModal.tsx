"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  FileSignature,
  Printer,
  X,
  Building2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { OperationData, Vendeur, calculerNbJours } from "@/types/operation";

interface CompanyInfo {
  raisonSociale: string;
  adresseSiege: string;
  codePostalVille: string;
  conventionNumero: string;
  urssaf: string;
  villeSignature: string;
}

const DEFAULT_COMPANY: CompanyInfo = {
  raisonSociale: "SARL FJA Conseils",
  adresseSiege: "40 rue de Bruxelles",
  codePostalVille: "69100 Villeurbanne",
  conventionNumero: "3056",
  urssaf: "Urssaf Rhône-Alpes",
  villeSignature: "Villeurbanne",
};

const COMPANY_STORAGE_KEY = "fja_company_legal_info_v2";

const fmtDateFR = (iso?: string) => {
  if (!iso) return "____/____/______";
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
};

const fmtSecu = (secu?: string) => {
  if (!secu) return "_ __ __ __ ___ ___ __";
  const clean = secu.replace(/\s+/g, "");
  if (clean.length === 15) {
    return `${clean[0]} ${clean.slice(1, 3)} ${clean.slice(3, 5)} ${clean.slice(5, 7)} ${clean.slice(7, 10)} ${clean.slice(10, 13)} ${clean.slice(13, 15)}`;
  }
  return secu;
};

interface Props {
  operation: OperationData;
  vendeurs: Vendeur[];
  onClose: () => void;
}

export default function ContractGeneratorModal({
  operation,
  vendeurs,
  onClose,
}: Props) {
  const affectations = operation.affectations ?? [];

  const [selectedAffId, setSelectedAffId] = useState<string>(
    affectations[0]?.id ?? ""
  );
  const [company, setCompany] = useState<CompanyInfo>(DEFAULT_COMPANY);
  const [editCompany, setEditCompany] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [heuresJour, setHeuresJour] = useState<number>(7);
  const [joursEssai, setJoursEssai] = useState<number>(3);
  const [dateSignature, setDateSignature] = useState<string>(
    affectations[0]?.dateDebut ||
      operation.dateDebut ||
      new Date().toISOString().slice(0, 10)
  );

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(COMPANY_STORAGE_KEY);
    if (saved) {
      try {
        setCompany(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveCompany = (updated: CompanyInfo) => {
    setCompany(updated);
    localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(updated));
  };

  const selectedAff = affectations.find((a) => a.id === selectedAffId);
  const vendeur = vendeurs.find((v) => v.id === selectedAff?.vendeurId);

  const dateDebutContrat = selectedAff?.dateDebut || operation.dateDebut;
  const dateFinContrat = selectedAff?.dateFin || operation.dateFin;
  const commissionMission = selectedAff?.commission ?? 0;
  const fraisJourMission = selectedAff?.fraisJournalier ?? 80;
  const roleMission = selectedAff?.role ?? "Vendeur";
  const nbJoursMission = calculerNbJours(dateDebutContrat, dateFinContrat);

  const renderContractSheet = (forPrint = false) => {
    if (!vendeur || !selectedAff) return null;
    return (
      <article
        className={
          forPrint
            ? "w-[210mm] h-[297mm] bg-white text-slate-950 px-[16mm] py-[12mm] text-[11px] leading-[1.45] flex flex-col justify-between font-sans box-border"
            : "w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-950 px-10 py-8 shadow-xl rounded-sm text-[11px] leading-[1.45] flex flex-col justify-between font-sans"
        }
      >
        <div className="space-y-3.5">
          {/* EN-TÊTE AVEC /logo.webp */}
          <header className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.webp"
                alt="Logo FJA Conseils"
                className="h-14 w-auto object-contain rounded"
              />
              <div>
                <p className="font-bold text-sm uppercase tracking-wide text-slate-900">
                  {company.raisonSociale}
                </p>
                <p className="text-[10.5px] text-slate-700">
                  {company.adresseSiege}
                </p>
                <p className="text-[10.5px] text-slate-700">
                  {company.codePostalVille}
                </p>
              </div>
            </div>

            <div className="text-right space-y-0.5">
              <span className="inline-block px-2.5 py-1 bg-slate-100 border border-slate-300 rounded text-[10px] font-semibold uppercase tracking-wider text-slate-800">
                Opération : {operation.magasin} ({operation.ville})
              </span>
              <p className="text-[10px] text-slate-500">
                Mission : {nbJoursMission} jour(s) • Rôle {roleMission}
              </p>
            </div>
          </header>

          {/* TITRE */}
          <h1 className="text-center text-sm font-bold uppercase tracking-wider py-1">
            CONTRAT DE TRAVAIL À DURÉE DÉTERMINÉE
          </h1>

          {/* PARTIES */}
          <div className="space-y-2.5">
            <div>
              <p className="font-semibold">Entre les soussignés :</p>
              <p>
                <strong>{company.raisonSociale}</strong>,{" "}
                {company.adresseSiege}, {company.codePostalVille}
              </p>
            </div>

            <p className="font-semibold">D&apos;une part et :</p>

            <div className="grid grid-cols-2 gap-x-6 gap-y-1 bg-slate-50 px-3.5 py-2.5 border border-slate-300 rounded">
              <div>
                <p className="font-bold text-[11.5px]">
                  {vendeur.civilite || "M."}{" "}
                  <span className="uppercase">{vendeur.nom}</span>{" "}
                  {vendeur.prenom || "________________"}
                </p>
                <p>
                  {vendeur.adresse || "________________________________"}
                </p>
                <p className="font-medium uppercase">
                  {vendeur.codePostal || "_____"}{" "}
                  {vendeur.ville || "________________"}
                </p>
              </div>

              <div className="space-y-0.5">
                <p>
                  <span className="text-slate-600">Né(e) le :</span>{" "}
                  <strong>{fmtDateFR(vendeur.dateNaissance)}</strong>
                </p>
                <p>
                  <span className="text-slate-600">À :</span>{" "}
                  <strong>
                    {vendeur.lieuNaissance || "________________"}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-600">N° de Sécu :</span>{" "}
                  <strong className="font-mono">
                    {fmtSecu(vendeur.numeroSecu)}
                  </strong>
                </p>
              </div>
            </div>
          </div>

          {/* CLAUSES */}
          <div className="space-y-2.5 text-justify">
            <p className="font-semibold">
              Il a été convenu et arrêté ce qui suit :
            </p>

            <p>
              La société <strong>FJA Conseils</strong> engage le salarié en
              qualité de{" "}
              <strong>
                {vendeur.qualification ||
                  "vendeur extra animateur de ventes"}
              </strong>{" "}
              ({roleMission}) pour l&apos;opération commerciale{" "}
              <strong>
                {operation.magasin} – {operation.ville}
              </strong>
              . Ce contrat a pour objet l&apos;accomplissement de tâches
              résultant de l&apos;accroissement temporaire de l&apos;activité de
              l&apos;entreprise. Les fonctions du salarié impliquent des
              déplacements professionnels qui doivent être effectués quels
              qu&apos;en soient la fréquence et la durée.
            </p>

            <p>
              La durée de travail est de{" "}
              <strong>{heuresJour} heures par jour</strong>.
            </p>

            <div>
              <p className="font-bold underline mb-0.5">Durée du contrat :</p>
              <p>
                Le présent contrat est conclu pour une durée déterminée à
                compter du <strong>{fmtDateFR(dateDebutContrat)}</strong> et
                prend fin le <strong>{fmtDateFR(dateFinContrat)}</strong>.
              </p>
              <p className="mt-1">
                Le salarié accomplira une période d&apos;essai de{" "}
                <strong>
                  {vendeur.periodeEssai || `${joursEssai} jours`}
                </strong>
                . Durant cette période, chacune des parties pourra mettre fin
                au présent contrat sans indemnités d&apos;aucune sorte. En ce
                qui concerne l&apos;exécution du contrat de travail, les parties
                entendent se référer aux dispositions légales ainsi qu&apos;aux
                dispositions conventionnelles (n°{" "}
                <strong>{company.conventionNumero}</strong>) de prestation de
                services consultants.
              </p>
            </div>

            <div>
              <p className="font-bold underline mb-0.5">Rémunération :</p>
              <p>
                En contrepartie de l&apos;accomplissement de ses fonctions, le
                salarié percevra une rémunération brute égale à{" "}
                <strong>{commissionMission} %</strong>, sur son chiffre
                d&apos;affaires personnel réalisé (Hors livraison et Hors
                agios), congés payés et prime de précarité inclus, durant cette
                période.
              </p>
              <p className="mt-1">
                Il sera versé une indemnité forfaitaire de grand déplacement
                dans la limite du tarif d&apos;un aller/retour SNCF ainsi
                qu&apos;une indemnité forfaitaire de logement et repas de{" "}
                <strong>{fraisJourMission} € par jour</strong>.
              </p>
              <p className="mt-1 font-medium">
                Le règlement des frais sera payé en présence de justificatifs
                en fin de mission ; à cet effet, le salarié devra
                impérativement retourner ces frais à l&apos;adresse indiquée
                ci-dessus, sans quoi ils ne seront pas remboursés.
              </p>
            </div>

            <p>
              La déclaration nominative préalable à l&apos;embauche a été
              transmise à l&apos;<strong>{company.urssaf}</strong>.
            </p>

            <p>
              Pour la bonne règle, vous voudrez bien me faire retour d&apos;un
              exemplaire de la présente, revêtu de votre signature précédée de
              la mention{" "}
              <strong>« Lu et approuvé, Bon pour accord »</strong>.
            </p>
          </div>
        </div>

        {/* SIGNATURES */}
        <footer className="pt-3 border-t border-slate-300 space-y-3">
          <p>
            Fait en deux exemplaires, à{" "}
            <strong>{company.villeSignature}</strong> le{" "}
            <strong>{fmtDateFR(dateSignature)}</strong>
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div className="h-24 border border-slate-400 rounded p-2.5">
              <p className="font-bold">L&apos;employé(e)</p>
              <p className="text-[10px] text-slate-600">
                {vendeur.prenom} {vendeur.nom}
              </p>
            </div>
            <div className="h-24 border border-slate-400 rounded p-2.5">
              <p className="font-bold">L&apos;employeur</p>
              <p className="text-[10px] text-slate-600">
                {company.raisonSociale}
              </p>
            </div>
          </div>
        </footer>
      </article>
    );
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body > *:not(#fja-print-portal) {
            display: none !important;
          }
          #fja-print-portal {
            display: block !important;
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
            background: #ffffff;
          }
        }
      `}</style>

      {mounted &&
        createPortal(
          <div id="fja-print-portal" className="hidden print:block">
            {renderContractSheet(true)}
          </div>,
          document.body
        )}

      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 overflow-y-auto print:hidden">
        <div className="w-full max-w-5xl bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[94dvh] flex flex-col">
          {/* Barre d'outils */}
          <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <FileSignature className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-sm sm:text-base font-bold text-amber-400 uppercase">
                  Contrat de Travail — {operation.nomOperation}
                </h2>
                <p className="text-[11px] text-slate-400">
                  Mission du {fmtDateFR(dateDebutContrat)} au{" "}
                  {fmtDateFR(dateFinContrat)} ({nbJoursMission} j)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedAffId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedAffId(id);
                  const aff = affectations.find((a) => a.id === id);
                  if (aff?.dateDebut) setDateSignature(aff.dateDebut);
                }}
                className="bg-slate-900 border border-amber-500/40 rounded-xl px-3 py-1.5 text-xs font-semibold text-amber-300"
              >
                {affectations.map((aff) => {
                  const v = vendeurs.find((x) => x.id === aff.vendeurId);
                  return (
                    <option key={aff.id} value={aff.id}>
                      {v?.prenom ? `${v.prenom} ${v.nom}` : v?.nom} ({aff.role}{" "}
                      • {fmtDateFR(aff.dateDebut)} → {fmtDateFR(aff.dateFin)})
                    </option>
                  );
                })}
              </select>

              <button
                type="button"
                onClick={() => setEditCompany(!editCompany)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Paramètres contrat</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer / PDF</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {editCompany && (
            <div className="p-4 bg-slate-950/90 border-b border-amber-500/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Employeur</label>
                <input
                  type="text"
                  value={company.raisonSociale}
                  onChange={(e) =>
                    saveCompany({ ...company, raisonSociale: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">
                  Adresse siège
                </label>
                <input
                  type="text"
                  value={company.adresseSiege}
                  onChange={(e) =>
                    saveCompany({ ...company, adresseSiege: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">CP & Ville</label>
                <input
                  type="text"
                  value={company.codePostalVille}
                  onChange={(e) =>
                    saveCompany({ ...company, codePostalVille: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">
                  Convention n°
                </label>
                <input
                  type="text"
                  value={company.conventionNumero}
                  onChange={(e) =>
                    saveCompany({
                      ...company,
                      conventionNumero: e.target.value,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">
                  Heures / jour
                </label>
                <input
                  type="number"
                  value={heuresJour}
                  onChange={(e) =>
                    setHeuresJour(parseFloat(e.target.value) || 7)
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">
                  Période essai (jours)
                </label>
                <input
                  type="number"
                  value={joursEssai}
                  onChange={(e) =>
                    setJoursEssai(parseInt(e.target.value, 10) || 3)
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">
                  Date signature
                </label>
                <input
                  type="date"
                  value={dateSignature}
                  onChange={(e) => setDateSignature(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Urssaf</label>
                <input
                  type="text"
                  value={company.urssaf}
                  onChange={(e) =>
                    saveCompany({ ...company, urssaf: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                />
              </div>
            </div>
          )}

          {vendeur &&
            (!vendeur.prenom || !vendeur.numeroSecu || !vendeur.adresse) && (
              <div className="px-5 py-2 bg-amber-950/70 border-b border-amber-500/30 flex items-center gap-2 text-xs text-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Certaines infos d&apos;état civil (prénom, date/lieu de
                  naissance, adresse ou N° Sécu) manquent sur cette fiche
                  vendeur.
                </span>
              </div>
            )}

          <div className="p-4 sm:p-6 overflow-y-auto bg-slate-800/60 flex justify-center">
            {vendeur && selectedAff ? (
              renderContractSheet(false)
            ) : (
              <p className="text-slate-400 text-sm">
                Aucun intervenant affecté à cette opération.
              </p>
            )}
          </div>

          <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Dates, rôle, commission ({commissionMission}%) et frais (
              {fraisJourMission} €/j) injectés automatiquement depuis
              l&apos;opération.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-300 hover:text-white underline cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
