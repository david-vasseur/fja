"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  AffectationVendeur,
  OperationData,
  Vendeur,
  Vente,
} from "@/types/operation";

interface AuthState {
  role: "admin" | "operation" | null;
  email: string | null;
  operationSlug: string | null;
}

interface AppStore {
  auth: AuthState;
  vendeurs: Vendeur[];
  operations: OperationData[];

  // Auth
  loginAdmin: (email: string) => void;
  loginOperation: (loginId: string, slug: string) => void;
  logout: () => void;

  // Vendeurs (Annuaire global)
  addVendeur: (vendeur: Omit<Vendeur, "id">) => void;
  updateVendeur: (id: string, data: Partial<Vendeur>) => void;
  deleteVendeur: (id: string) => void;

  // Opérations
  addOperation: (op: Omit<OperationData, "id" | "ventes">) => void;
  updateOperation: (slug: string, data: Partial<OperationData>) => void;
  deleteOperation: (id: string) => void;

  // Affectations Vendeurs sur une Opération
  addAffectation: (slug: string, aff: Omit<AffectationVendeur, "id">) => void;
  updateAffectation: (
    slug: string,
    affId: string,
    data: Partial<AffectationVendeur>
  ) => void;
  deleteAffectation: (slug: string, affId: string) => void;

  // Ventes
  addVente: (slug: string, vente: Omit<Vente, "id">) => void;
  updateVente: (slug: string, venteId: string, data: Partial<Vente>) => void;
  deleteVente: (slug: string, venteId: string) => void;
}

const INITIAL_VENDEURS: Vendeur[] = [
  {
    id: "v2",
    civilite: "M.",
    nom: "VASSEUR",
    prenom: "David",
    dateNaissance: "1982-08-29",
    lieuNaissance: "Châtenay-Malabry (92)",
    nationalite: "Française",
    numeroSecu: "182089201910975",
    adresse: "58 chemin des Grands Fonts",
    codePostal: "30390",
    ville: "ESTEZARGUES",
    qualification: "vendeur extra animateur de ventes",
    typeContrat: "CDD",
    periodeEssai: "3 jours",
  },
  {
    id: "v3",
    civilite: "M.",
    nom: "SEB",
    prenom: "Sébastien",
    qualification: "vendeur extra animateur de ventes",
    typeContrat: "CDD",
    periodeEssai: "3 jours",
  },
];


const INITIAL_OPERATIONS: OperationData[] = [
  {
    id: "op-1",
    slug: "operation-chateaudax-frejus-1911",
    nomOperation: "Château d’Ax Fréjus",
    magasin: "Château d’Ax",
    ville: "Fréjus",
    loginId: "mag-chateau-frejus-1911",
    loginPassword: "admin123",
    dateDebut: "2026-11-19",
    dateFin: "2026-12-15",
    coefOperation: 2.5,
    tva: 1.2,
    affectations: [
      {
        id: "aff-1",
        vendeurId: "v1",
        role: "Vendeur",
        dateDebut: "2026-11-19",
        dateFin: "2026-12-15",
        fraisJournalier: 0,
        commission: 0,
      },
      {
        id: "aff-2",
        vendeurId: "v2",
        role: "Vendeur",
        dateDebut: "2026-11-19",
        dateFin: "2026-11-28",
        fraisJournalier: 80,
        commission: 5,
      },
      {
        id: "aff-3",
        vendeurId: "v3",
        role: "Finisseur",
        dateDebut: "2026-11-21",
        dateFin: "2026-12-15",
        fraisJournalier: 80,
        commission: 2.5,
      },
    ],
    ventes: [
      {
        id: "1",
        date: "2026-11-20",
        numBL: "379",
        client: "JARDIN",
        prixVenteTTC: 3589,
        acompte: 1637,
        prixAchatHT: 1359,
        modele: "VENTADOR",
        vendeurId: "v2",
        finisseurId: "v3",
        paiement: "COMPTANT",
        livraisonTTC: 160,
        creditAccepte: "",
        observations: "Contremarque",
      },
      {
        id: "2",
        date: "2026-11-20",
        numBL: "380",
        client: "ROUAULT",
        prixVenteTTC: 2490,
        acompte: 750,
        prixAchatHT: 824,
        modele: "HJORT",
        vendeurId: "v2",
        finisseurId: "v3",
        paiement: "COMPTANT",
        livraisonTTC: 0,
        creditAccepte: "",
        observations: "Contremarque",
      },
      {
        id: "3",
        date: "2026-11-21",
        numBL: "382",
        client: "WEYMESKIRCH",
        prixVenteTTC: 2300,
        acompte: 760,
        prixAchatHT: 921,
        modele: "VIVA",
        vendeurId: "v2",
        finisseurId: "v3",
        paiement: "CREDIT",
        livraisonTTC: 100,
        creditAccepte: "Oui",
        observations: "Contremarque",
      },
      {
        id: "4",
        date: "2026-11-23",
        numBL: "386",
        client: "MARCOUX",
        prixVenteTTC: 2269,
        acompte: 1000,
        prixAchatHT: 929,
        modele: "VIVA",
        vendeurId: "v2",
        finisseurId: "v3",
        paiement: "COMPTANT",
        livraisonTTC: 150,
        creditAccepte: "",
        observations: "Contremarque",
      },
      {
        id: "5",
        date: "2026-11-23",
        numBL: "385",
        client: "BURDET",
        prixVenteTTC: 2090,
        acompte: 1000,
        prixAchatHT: 826,
        modele: "CENTRAL",
        vendeurId: "v1",
        finisseurId: "v3",
        paiement: "COMPTANT",
        livraisonTTC: 150,
        creditAccepte: "",
        observations: "Contremarque",
      },
      {
        id: "6",
        date: "2026-11-23",
        numBL: "387",
        client: "DEL POPOLO",
        prixVenteTTC: 1966,
        acompte: 690,
        prixAchatHT: 781,
        modele: "CENTRAL",
        vendeurId: "v1",
        finisseurId: "v3",
        paiement: "COMPTANT",
        livraisonTTC: 90,
        creditAccepte: "",
        observations: "Contremarque",
      },
      {
        id: "7",
        date: "2026-11-23",
        numBL: "389",
        client: "DEL POPOLO",
        prixVenteTTC: 2319,
        acompte: 705,
        prixAchatHT: 1023,
        modele: "VIVA",
        vendeurId: "v1",
        finisseurId: "v3",
        paiement: "COMPTANT",
        livraisonTTC: 150,
        creditAccepte: "",
        observations: "Contremarque",
      },
    ],
  },
];

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      auth: { role: null, email: null, operationSlug: null },
      vendeurs: INITIAL_VENDEURS,
      operations: INITIAL_OPERATIONS,

      loginAdmin: (email) =>
        set({ auth: { role: "admin", email, operationSlug: null } }),

      loginOperation: (loginId, slug) =>
        set({ auth: { role: "operation", email: loginId, operationSlug: slug } }),

      logout: () =>
        set({ auth: { role: null, email: null, operationSlug: null } }),

      addVendeur: (vendeur) =>
        set((state) => ({
          vendeurs: [
            ...state.vendeurs,
            { ...vendeur, id: crypto.randomUUID() },
          ],
        })),

      updateVendeur: (id, data) =>
        set((state) => ({
          vendeurs: state.vendeurs.map((v) =>
            v.id === id ? { ...v, ...data } : v
          ),
        })),

      deleteVendeur: (id) =>
        set((state) => ({
          vendeurs: state.vendeurs.filter((v) => v.id !== id),
        })),

      addOperation: (op) =>
        set((state) => ({
          operations: [
            ...state.operations,
            { ...op, id: crypto.randomUUID(), ventes: [] },
          ],
        })),

      updateOperation: (slug, data) =>
        set((state) => ({
          operations: state.operations.map((op) =>
            op.slug === slug ? { ...op, ...data } : op
          ),
        })),

      deleteOperation: (id) =>
        set((state) => ({
          operations: state.operations.filter((op) => op.id !== id),
        })),

      addAffectation: (slug, aff) =>
        set((state) => ({
          operations: state.operations.map((op) =>
            op.slug === slug
              ? {
                  ...op,
                  affectations: [
                    ...(op.affectations ?? []),
                    { ...aff, id: crypto.randomUUID() },
                  ],
                }
              : op
          ),
        })),

      updateAffectation: (slug, affId, data) =>
        set((state) => ({
          operations: state.operations.map((op) =>
            op.slug === slug
              ? {
                  ...op,
                  affectations: (op.affectations ?? []).map((a) =>
                    a.id === affId ? { ...a, ...data } : a
                  ),
                }
              : op
          ),
        })),

      deleteAffectation: (slug, affId) =>
        set((state) => ({
          operations: state.operations.map((op) =>
            op.slug === slug
              ? {
                  ...op,
                  affectations: (op.affectations ?? []).filter(
                    (a) => a.id !== affId
                  ),
                }
              : op
          ),
        })),

      addVente: (slug, vente) =>
        set((state) => ({
          operations: state.operations.map((op) =>
            op.slug === slug
              ? {
                  ...op,
                  ventes: [...op.ventes, { ...vente, id: crypto.randomUUID() }],
                }
              : op
          ),
        })),

      updateVente: (slug, venteId, data) =>
        set((state) => ({
          operations: state.operations.map((op) =>
            op.slug === slug
              ? {
                  ...op,
                  ventes: op.ventes.map((v) =>
                    v.id === venteId ? { ...v, ...data } : v
                  ),
                }
              : op
          ),
        })),

      deleteVente: (slug, venteId) =>
        set((state) => ({
          operations: state.operations.map((op) =>
            op.slug === slug
              ? {
                  ...op,
                  ventes: op.ventes.filter((v) => v.id !== venteId),
                }
              : op
          ),
        })),
    }),
    {
      name: "fja-conseils-storage-v2",
    }
  )
);
