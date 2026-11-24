export type RoleMission = "Vendeur" | "Finisseur";
export type TypeContrat = "CDD" | "CDI" | "CDD_USAGE" | "INDEPENDANT";
export type Civilite = "M." | "Mme";
export type ModePaiement = "COMPTANT" | "CREDIT" | "CB" | "CHEQUE" | "VIREMENT";
export type StatutCredit = "" | "Oui" | "Non" | "En cours";

// 1. Fiche signalétique & légale pure du vendeur (indépendante des missions)
export interface Vendeur {
  id: string;
  civilite?: Civilite;
  nom: string;
  prenom?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  nationalite?: string;
  numeroSecu?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  telephone?: string;
  email?: string;
  iban?: string;
  typeContrat?: TypeContrat;
  qualification?: string;
  coefficientConvention?: string;
  periodeEssai?: string;
  baseHoraire?: number;
  salaireBrutMensuel?: number;
  tauxHoraireBrut?: number;
  notes?: string;
}

// 2. Affectation d'un vendeur sur UNE opération précise (pivot / relation)
export interface AffectationVendeur {
  id: string;
  vendeurId: string;
  role: RoleMission;          // "Vendeur" (ex-Pique) ou "Finish"
  dateDebut: string;          // YYYY-MM-DD (ex: 2026-11-19)
  dateFin: string;            // YYYY-MM-DD (ex: 2026-11-28)
  fraisJournalier: number;    // Ex: 80 (€ / jour)
  commission: number;         // Ex: 5 (% CA HT)
}

export interface Vente {
  id: string;
  date: string;
  numBL: string;
  client: string;
  prixVenteTTC: number;
  acompte: number;
  prixAchatHT: number;
  modele: string;
  vendeurId: string;          // Référence Vendeur.id (rôle Vendeur)
  finisseurId: string;        // Référence Vendeur.id (rôle Finish)
  paiement: ModePaiement;
  livraisonTTC: number;
  creditAccepte: StatutCredit;
  observations: string;
}

export interface OperationData {
  id: string;
  slug: string;
  nomOperation: string;
  magasin: string;
  ville: string;
  loginId: string;
  loginPassword: string;
  dateDebut: string;
  dateFin: string;
  coefOperation: number;
  tva: number;
  affectations: AffectationVendeur[]; // Remplace vendeurIds[]
  vendeursEnPied?: string[];
  ventes: Vente[];
}

// Utilitaire : nombre de jours inclus entre deux dates YYYY-MM-DD
export function calculerNbJours(dateDebut: string, dateFin: string): number {
  if (!dateDebut || !dateFin) return 0;
  const d1 = new Date(dateDebut + "T00:00:00");
  const d2 = new Date(dateFin + "T00:00:00");
  const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff + 1 : 0;
}

export function calculerLigne(vente: Vente, coefOp = 2.5, tva = 1.2) {
  const caHT = vente.prixVenteTTC / tva;
  const margeNetHT = caHT - vente.prixAchatHT;
  const totalClientTTC = vente.prixVenteTTC + vente.livraisonTTC;
  const pctAcompte =
    vente.prixVenteTTC > 0 ? (vente.acompte / vente.prixVenteTTC) * 100 : 0;
  const coef =
    vente.prixAchatHT > 0 ? vente.prixVenteTTC / vente.prixAchatHT : 0;
  const margeTheoriqueOpHT = vente.prixAchatHT * (coefOp / tva - 1);
  const ecartCoefOp = margeNetHT - margeTheoriqueOpHT;

  return {
    caHT,
    margeNetHT,
    totalClientTTC,
    pctAcompte,
    coef,
    ecartCoefOp,
  };
}
