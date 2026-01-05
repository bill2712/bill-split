export interface Person {
  id: string;
  name: string;
  isBirthday: boolean; // If true, they don't pay for shareable items (treated as guest)
  isCoupleWith?: string; // ID of the partner if linked (visual grouping)
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  payerId: string; // Who paid upfront
  excludedIds: string[]; // Who is NOT involved in this specific cost (default empty = everyone involved)
  manualOverride?: boolean;
}

export interface Debt {
  fromId: string;
  toId: string;
  amount: number;
}

export interface SettlementStep {
  fromName: string;
  toName: string;
  amount: number;
  isCoupleTransfer: boolean;
}

export interface BillSummary {
  total: number;
  perPerson: number; // Average
  breakdown: {
    personId: string;
    paid: number; // How much they paid upfront
    share: number; // How much they consumed/owe
    balance: number; // paid - share (+ means receive, - means give)
  }[];
}