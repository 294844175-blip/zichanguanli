export interface ScoreInput {
  status: string;
  unitPrice: number;
  area: number;
  monthlyEstimate: number;
  leaseEndDate: Date;
  totalCost: number;
}

export function calculateAssetScore(input: ScoreInput): number {
  const now = new Date();
  
  const occupancyScore = input.status === 'RENTED' ? 100 : 0;
  
  const pricePerSqm = input.area > 0 ? input.monthlyEstimate / input.area : 0;
  const yieldScore = Math.min(pricePerSqm * 10, 100);
  
  const monthsToExpiry = (input.leaseEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
  const stabilityScore = monthsToExpiry > 6 ? 100 : monthsToExpiry > 3 ? 50 : 20;
  
  const costRatio = input.monthlyEstimate > 0 ? input.totalCost / input.monthlyEstimate : 1;
  const costEfficiency = Math.max(100 - costRatio * 100, 0);
  
  const score = (
    occupancyScore * 0.4 +
    yieldScore * 0.3 +
    stabilityScore * 0.2 +
    costEfficiency * 0.1
  );
  
  return Math.round(score * 100) / 100;
}
