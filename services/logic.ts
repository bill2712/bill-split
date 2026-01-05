import { Person, Expense, BillSummary, SettlementStep } from '../types';

export const calculateSummary = (people: Person[], expenses: Expense[]): BillSummary => {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Initialize map
  const stats = new Map<string, { paid: number; share: number }>();
  people.forEach(p => stats.set(p.id, { paid: 0, share: 0 }));

  // Process each expense
  expenses.forEach(expense => {
    // 1. Add to Payer's "Paid" tally
    const payerStats = stats.get(expense.payerId);
    if (payerStats) {
      payerStats.paid += expense.amount;
    }

    // 2. Calculate Share
    // Who needs to pay for this?
    let eligibleParticipants = people.filter(p => !expense.excludedIds.includes(p.id));

    // Handle Birthday logic: 
    // If there are non-birthday people involved, the birthday person pays 0.
    const nonBirthdayPeople = eligibleParticipants.filter(p => !p.isBirthday);
    
    let shareParticipants = eligibleParticipants;
    if (nonBirthdayPeople.length > 0 && nonBirthdayPeople.length < eligibleParticipants.length) {
       shareParticipants = nonBirthdayPeople;
    }

    if (shareParticipants.length > 0) {
      const shareAmount = expense.amount / shareParticipants.length;
      shareParticipants.forEach(p => {
        const pStats = stats.get(p.id);
        if (pStats) {
          pStats.share += shareAmount;
        }
      });
    }
  });

  const breakdown = Array.from(stats.entries()).map(([personId, data]) => ({
    personId,
    paid: data.paid,
    share: data.share,
    balance: data.paid - data.share
  }));

  return {
    total,
    perPerson: total / (people.length || 1), // rough average
    breakdown
  };
};

export const calculateSettlements = (summary: BillSummary, people: Person[]): SettlementStep[] => {
  // 1. Group balances by Couple / Individual (Financial Units)
  const unitBalances: { name: string; balance: number; ids: string[] }[] = [];
  const processedIds = new Set<string>();

  people.forEach(person => {
    if (processedIds.has(person.id)) return;

    // Find breakdown for this person
    const pData = summary.breakdown.find(b => b.personId === person.id) || { balance: 0, paid: 0, share: 0, personId: person.id };
    let balance = pData.balance;
    const ids = [person.id];
    let displayName = person.name;

    if (person.isCoupleWith) {
      const partner = people.find(p => p.id === person.isCoupleWith);
      if (partner) {
        // Find partner breakdown
        const partData = summary.breakdown.find(b => b.personId === partner.id) || { balance: 0, paid: 0, share: 0, personId: partner.id };
        balance += partData.balance;
        
        // Consistent Naming
        const names = [person.name, partner.name].sort();
        displayName = `${names[0]} & ${names[1]}`;
        
        ids.push(partner.id);
        processedIds.add(partner.id);
      }
    }
    
    processedIds.add(person.id);
    unitBalances.push({ name: displayName, balance, ids });
  });

  // 2. Settlement Algorithm on Units
  let balances = unitBalances.filter(u => Math.abs(u.balance) > 0.01);
  const steps: SettlementStep[] = [];
  
  let iterations = 0;
  // Safety break: typically N-1 transactions max for N units. 
  while (balances.length > 0 && iterations < people.length * 2) {
    // Sort ascending: most negative first (Debtors), most positive last (Creditors)
    balances.sort((a, b) => a.balance - b.balance);
    
    const debtor = balances[0];
    const creditor = balances[balances.length - 1];

    // If perfectly settled
    if (debtor.balance >= -0.01 || creditor.balance <= 0.01) break;

    const amount = Math.min(Math.abs(debtor.balance), creditor.balance);

    // Only add step if significant amount
    if (amount > 0.01) {
        steps.push({
            fromName: debtor.name,
            toName: creditor.name,
            amount: Number(amount.toFixed(2)),
            isCoupleTransfer: false // Couples are consolidated, so no internal transfers
        });
    }

    // Update balances
    debtor.balance += amount;
    creditor.balance -= amount;

    // Filter out ~0 balances for next iteration
    balances = balances.filter(u => Math.abs(u.balance) > 0.01);
    
    iterations++;
  }

  return steps;
};