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

  // 1. Filter admitted lists (>= 5% of totalExpressedVotes)
  const admittedListsData = lists.map(list => {
    const percentage = totalExpressedVotes > 0 ? (list.votes / totalExpressedVotes) * 100 : 0;
    return {
      ...list,
      percentage,
      isAdmitted: percentage >= 5,
      majorityBonus: 0,
      quotientSeats: 0,
      highestAverageSeats: 0,
      totalSeats: 0
    };
  });

  const admittedLists = admittedListsData.filter(l => l.isAdmitted);

  steps.push({
    title: "Seuil d'admission",
    description: "Seules les listes ayant obtenu au moins 5% des suffrages exprimés sont admises à la répartition des sièges.",
    details: [
      `Suffrages exprimés : ${totalExpressedVotes}`,
      ...admittedListsData.map(l => `${l.name} : ${l.percentage.toFixed(2)}% (${l.isAdmitted ? 'Admise' : 'Exclue'})`)
    ]
  });

  if (admittedLists.length === 0) {
    return {
      totalExpressedVotes,
      sumOfListVotes,
      totalSeats,
      majorityBonusSeats: 0,
      remainingSeats: 0,
      quotient: 0,
      admittedLists: admittedListsData,
      steps
    };
  }

  // Find the winner (list with most votes)
  // Tie-breaker: Highest average age (Article L262)
  const winner = [...admittedLists].sort((a, b) => {
    if (b.votes !== a.votes) return b.votes - a.votes;
    return (b.averageAge || 0) - (a.averageAge || 0);
  })[0];
  const winnerPercentage = totalExpressedVotes > 0 ? (winner.votes / totalExpressedVotes) * 100 : 0;

  // Detect tie for winner to warn user
  const topVotes = winner.votes;
  const listsWithTopVotes = admittedLists.filter(l => l.votes === topVotes);
  const hasTieForWinner = listsWithTopVotes.length > 1;

  // 2. Majority Bonus (Prime Majoritaire)
  // Standard: 50%, PLM: 25%
  // Article L.262: Arrondi supérieur si > 4 sièges, inférieur si < 4 sièges
  const bonusFactor = cityType === 'PLM' ? 0.25 : 0.5;
  const rawBonus = totalSeats * bonusFactor;
  let majorityBonusSeats: number;
  
  if (totalSeats > 4) {
    majorityBonusSeats = Math.ceil(rawBonus);
  } else if (totalSeats < 4) {
    majorityBonusSeats = Math.floor(rawBonus);
  } else {
    majorityBonusSeats = Math.round(rawBonus);
  }
  
  // Check eligibility for bonus in Round 1
  if (round === 1 && winnerPercentage <= 50) {
    steps.push({
      title: "Pas de majorité absolue",
      description: "Au premier tour, une liste doit obtenir la majorité absolue (> 50%) pour bénéficier de la prime majoritaire et déclencher la répartition des sièges.",
      details: [`Meilleur score : ${winner.name} avec ${winnerPercentage.toFixed(2)}% (Seuil : > 50%)`]
    });

    return {
      totalExpressedVotes,
      sumOfListVotes,
      totalSeats,
      majorityBonusSeats: 0,
      remainingSeats: 0,
      quotient: 0,
      noMajorityInFirstRound: true,
      admittedLists: admittedListsData,
      steps
    };
  }

  const remainingSeats = totalSeats - majorityBonusSeats;
  winner.majorityBonus = majorityBonusSeats;
  winner.totalSeats += majorityBonusSeats;

  steps.push({
    title: "Prime majoritaire",
    description: `Une prime de ${cityType === 'PLM' ? '25%' : '50%'} des sièges (${majorityBonusSeats}) est attribuée à la liste arrivée en tête.`,
    details: [
      `Type de commune : ${cityType === 'PLM' ? 'Paris, Lyon, Marseille' : 'Standard'}`,
      `Tour : ${round === 1 ? '1er tour (Majorité absolue)' : '2nd tour (Majorité relative)'}`,
      `Liste bénéficiaire : ${winner.name} (${majorityBonusSeats} sièges)`,
      ...(hasTieForWinner ? [`Note : Égalité de suffrages détectée. La prime est attribuée à la liste la plus âgée.`] : [])
    ]
  });

  // 3. Electoral Quotient
  const totalVotesAdmitted = admittedLists.reduce((sum, l) => sum + l.votes, 0);
  const quotient = totalVotesAdmitted / remainingSeats;

  steps.push({
    title: "Quotient électoral",
    description: "Le quotient est calculé en divisant le total des suffrages des listes admises par le nombre de sièges restant à pourvoir.",
    details: [
      `Total suffrages listes admises : ${totalVotesAdmitted}`,
      `Sièges restants : ${remainingSeats}`,
      `Quotient : ${totalVotesAdmitted} / ${remainingSeats} = ${quotient.toFixed(2)}`
    ]
  });

  // 4. Distribution by Quotient
  let seatsDistributedByQuotient = 0;
  admittedLists.forEach(list => {
    const qSeats = Math.floor(list.votes / quotient);
    list.quotientSeats = qSeats;
    list.totalSeats += qSeats;
    seatsDistributedByQuotient += qSeats;
  });

  steps.push({
    title: "Répartition au quotient",
    description: "Chaque liste obtient autant de sièges que son nombre de suffrages contient de fois le quotient.",
    details: admittedLists.map(l => `${l.name} : ${l.votes} / ${quotient.toFixed(2)} = ${(l.votes / quotient).toFixed(2)} -> ${l.quotientSeats} sièges`)
  });

  // 5. Highest Average (Plus forte moyenne)
  let remainingToDistribute = remainingSeats - seatsDistributedByQuotient;
  const highestAverageSteps: string[] = [];

  while (remainingToDistribute > 0) {
    let bestAverage = -1;
    let winnerOfSeatIndex = -1;

    admittedLists.forEach((list, index) => {
      const average = list.votes / (list.quotientSeats + list.highestAverageSeats + 1);
      if (average > bestAverage + 0.000001) {
        bestAverage = average;
        winnerOfSeatIndex = index;
      } else if (Math.abs(average - bestAverage) < 0.000001) {
        // Tie-breaker for highest average (Art. L262):
        // 1. List with most votes
        // 2. If still tie, list with highest average age
        const currentWinner = admittedLists[winnerOfSeatIndex];
        if (list.votes > currentWinner.votes) {
          winnerOfSeatIndex = index;
        } else if (list.votes === currentWinner.votes) {
          if ((list.averageAge || 0) > (currentWinner.averageAge || 0)) {
            winnerOfSeatIndex = index;
          }
        }
      }
    });

    if (winnerOfSeatIndex !== -1) {
      const seatWinner = admittedLists[winnerOfSeatIndex];
      
      // Check if it was a tie
      const isTie = admittedLists.some((l, idx) => 
        idx !== winnerOfSeatIndex && 
        Math.abs((l.votes / (l.quotientSeats + l.highestAverageSeats + 1)) - bestAverage) < 0.000001
      );

      seatWinner.highestAverageSeats += 1;
      seatWinner.totalSeats += 1;
      
      let detail = `Siège restant n°${remainingSeats - remainingToDistribute + 1} attribué à ${seatWinner.name} (Moyenne : ${bestAverage.toFixed(2)})`;
      if (isTie) {
        detail += ` [Égalité départagée par les suffrages/l'âge]`;
      }
      highestAverageSteps.push(detail);
      remainingToDistribute--;
    } else {
      break;
    }
  }

  if (highestAverageSteps.length > 0) {
    steps.push({
      title: "Répartition à la plus forte moyenne",
      description: "Les sièges non pourvus par le quotient sont attribués un par un à la plus forte moyenne.",
      details: highestAverageSteps
    });
  }

  return {
    totalExpressedVotes,
    sumOfListVotes,
    totalSeats,
    majorityBonusSeats,
    remainingSeats,
    quotient,
    admittedLists: admittedListsData,
    steps
  };
}
