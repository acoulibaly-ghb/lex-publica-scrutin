import { CandidateList, DistributionResult, CalculationStep, ElectionRound, CityType } from '../types';

export function calculateDistribution(
  totalSeats: number,
  lists: CandidateList[],
  manualTotalVotes?: number,
  round: ElectionRound = 1,
  cityType: CityType = 'STANDARD'
): DistributionResult {
  const sumOfListVotes = lists.reduce((sum, list) => sum + list.votes, 0);
  const totalExpressedVotes = (manualTotalVotes && manualTotalVotes > 0) ? manualTotalVotes : sumOfListVotes;
  const steps: CalculationStep[] = [];

  // 1. Filtrage des listes admises (>= 5% des suffrages exprimés)
  const admittedListsData = lists.map(list => {
    const percentage = totalExpressedVotes > 0 ? (list.votes / totalExpressedVotes) * 100 : 0;
    return {
      ...list,
      percentage,
      isAdmitted: percentage >= 5, // Seuil légal [cite: 7, 11, 40]
      majorityBonus: 0,
      quotientSeats: 0,
      highestAverageSeats: 0,
      totalSeats: 0
    };
  });

  const admittedLists = admittedListsData.filter(l => l.isAdmitted);

  // 2. Attribution de la Prime Majoritaire
  const winner = [...admittedLists].sort((a, b) => {
    if (b.votes !== a.votes) return b.votes - a.votes;
    return (b.averageAge || 0) - (a.averageAge || 0); // Départage par l'âge
  })[0];
  
  const winnerPercentage = (winner.votes / totalExpressedVotes) * 100;
  const bonusFactor = cityType === 'PLM' ? 0.25 : 0.5; // 25% pour PLM, 50% sinon
  let majorityBonusSeats = totalSeats > 4 ? Math.ceil(totalSeats * bonusFactor) : Math.floor(totalSeats * bonusFactor); // Arrondi L.262 [cite: 20, 42, 43]

  // Vérification de la majorité absolue au 1er tour [cite: 6, 8, 41]
  if (round === 1 && winnerPercentage <= 50) {
    return { totalExpressedVotes, sumOfListVotes, totalSeats, majorityBonusSeats: 0, admittedLists: admittedListsData, steps, noMajorityInFirstRound: true } as any;
  }

  const remainingSeats = totalSeats - majorityBonusSeats;
  winner.majorityBonus = majorityBonusSeats;
  winner.totalSeats += majorityBonusSeats;

  // 3. Quotient Électoral (Voix des listes admises / sièges restants)
  const totalVotesAdmitted = admittedLists.reduce((sum, l) => sum + l.votes, 0);
  const quotient = totalVotesAdmitted / remainingSeats; // [cite: 22, 45, 47, 48]

  // 4. Répartition au quotient
  let seatsDistributedByQuotient = 0;
  admittedLists.forEach(list => {
    const qSeats = Math.floor(list.votes / quotient); // [cite: 46, 52]
    list.quotientSeats = qSeats;
    list.totalSeats += qSeats;
    seatsDistributedByQuotient += qSeats;
  });

  // 5. Répartition à la plus forte moyenne (Prime exclue du diviseur)
  let seatsToAssign = remainingSeats - seatsDistributedByQuotient;
  while (seatsToAssign > 0) {
    let bestAverage = -1;
    let winnerIdx = -1;

    admittedLists.forEach((l, idx) => {
      // REGLE CRUCIALE : On ne compte PAS la prime majoritaire dans le diviseur 
      const average = l.votes / (l.quotientSeats + l.highestAverageSeats + 1);
      if (average > bestAverage + 0.000001) {
        bestAverage = average;
        winnerIdx = idx;
      } else if (Math.abs(average - bestAverage) < 0.000001) { // Égalité de moyenne
        if (l.votes > admittedLists[winnerIdx].votes) winnerIdx = idx; // 1. Plus de voix
        else if (l.votes === admittedLists[winnerIdx].votes && (l.averageAge || 0) > (admittedLists[winnerIdx].averageAge || 0)) winnerIdx = idx; // 2. Plus âgé
      }
    });

    admittedLists[winnerIdx].highestAverageSeats += 1;
    admittedLists[winnerIdx].totalSeats += 1;
    seatsToAssign--;
  }

  return { totalExpressedVotes, sumOfListVotes, totalSeats, majorityBonusSeats, remainingSeats, quotient, admittedLists: admittedListsData, steps };
}
