class DrawController {
  constructor(supabase) {
    this.supabase = supabase;
  }

  // Generate random winning numbers
  generateRandomNumbers() {
    const numbers = [];
    while (numbers.length < 5) {
      const num = Math.floor(Math.random() * 45) + 1;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    return numbers.sort((a, b) => a - b);
  }

  // Generate algorithmic numbers based on most frequent scores
  async generateAlgorithmicNumbers() {
    try {
      const { data: scores } = await this.supabase
        .from('scores')
        .select('score')
        .limit(1000);

      const frequency = {};
      scores?.forEach(score => {
        frequency[score.score] = (frequency[score.score] || 0) + 1;
      });

      const sorted = Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(item => parseInt(item[0]));

      const numbers = [];
      while (numbers.length < 5 && sorted.length > 0) {
        const randomIndex = Math.floor(Math.random() * sorted.length);
        const num = sorted[randomIndex];
        if (!numbers.includes(num)) {
          numbers.push(num);
        }
      }

      return numbers.sort((a, b) => a - b);
    } catch (error) {
      console.error('Algorithmic generation error:', error);
      return this.generateRandomNumbers();
    }
  }

  // Calculate prize distribution based on active subscribers
  calculatePrizeDistribution(activeSubscribers, jackpotCarryover = 0) {
    const monthlyFee = 20;
    const totalPrizePool = (activeSubscribers * monthlyFee * 0.5) + jackpotCarryover;
    
    return {
      total: totalPrizePool,
      fiveMatch: totalPrizePool * 0.4,
      fourMatch: totalPrizePool * 0.35,
      threeMatch: totalPrizePool * 0.25,
      jackpotCarryover: 0
    };
  }

  // Find winners based on matching scores
  async findWinners(drawId, winningNumbers) {
    try {
      const { data: users } = await this.supabase
        .from('users')
        .select(`
          id,
          scores (score)
        `)
        .eq('subscription_status', 'active');

      const winners = {
        fiveMatch: [],
        fourMatch: [],
        threeMatch: []
      };

      users?.forEach(user => {
        const userScores = user.scores?.map(s => s.score) || [];
        const matchedCount = userScores.filter(score => 
          winningNumbers.includes(score)
        ).length;

        if (matchedCount === 5) {
          winners.fiveMatch.push(user.id);
        } else if (matchedCount === 4) {
          winners.fourMatch.push(user.id);
        } else if (matchedCount === 3) {
          winners.threeMatch.push(user.id);
        }
      });

      return winners;
    } catch (error) {
      console.error('Find winners error:', error);
      return { fiveMatch: [], fourMatch: [], threeMatch: [] };
    }
  }

  // Record winners in database
  async recordWinners(drawId, winners, prizeDistribution) {
    const recordedWinners = [];

    // Record 5-match winners
    if (winners.fiveMatch.length > 0) {
      const prizePerWinner = prizeDistribution.fiveMatch / winners.fiveMatch.length;
      for (const userId of winners.fiveMatch) {
        const { data: winner } = await this.supabase
          .from('winners')
          .insert({
            draw_id: drawId,
            user_id: userId,
            match_type: '5-match',
            prize_amount: prizePerWinner,
            verification_status: 'pending',
            payment_status: 'pending'
          })
          .select()
          .single();
        recordedWinners.push(winner);
      }
    }

    // Record 4-match winners
    if (winners.fourMatch.length > 0) {
      const prizePerWinner = prizeDistribution.fourMatch / winners.fourMatch.length;
      for (const userId of winners.fourMatch) {
        const { data: winner } = await this.supabase
          .from('winners')
          .insert({
            draw_id: drawId,
            user_id: userId,
            match_type: '4-match',
            prize_amount: prizePerWinner,
            verification_status: 'pending',
            payment_status: 'pending'
          })
          .select()
          .single();
        recordedWinners.push(winner);
      }
    }

    // Record 3-match winners
    if (winners.threeMatch.length > 0) {
      const prizePerWinner = prizeDistribution.threeMatch / winners.threeMatch.length;
      for (const userId of winners.threeMatch) {
        const { data: winner } = await this.supabase
          .from('winners')
          .insert({
            draw_id: drawId,
            user_id: userId,
            match_type: '3-match',
            prize_amount: prizePerWinner,
            verification_status: 'pending',
            payment_status: 'pending'
          })
          .select()
          .single();
        recordedWinners.push(winner);
      }
    }

    return recordedWinners;
  }

  // Run the monthly draw
  async runDraw(drawType = 'random', adminId) {
    try {
      // Get active subscribers count
      const { count: activeCount } = await this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'active');

      // Get previous jackpot carryover
      const { data: lastDraw } = await this.supabase
        .from('draws')
        .select('jackpot_amount')
        .eq('status', 'completed')
        .order('draw_month', { ascending: false })
        .limit(1)
        .single();

      const jackpotCarryover = lastDraw?.jackpot_amount || 0;

      // Generate winning numbers
      const winningNumbers = drawType === 'random' 
        ? this.generateRandomNumbers()
        : await this.generateAlgorithmicNumbers();

      // Calculate prize distribution
      const prizeDistribution = this.calculatePrizeDistribution(activeCount, jackpotCarryover);

      // Create draw record
      const { data: draw, error: drawError } = await this.supabase
        .from('draws')
        .insert({
          draw_month: new Date(),
          winning_numbers: winningNumbers,
          draw_type: drawType,
          status: 'completed',
          prize_pool: prizeDistribution.total,
          jackpot_amount: prizeDistribution.jackpotCarryover,
          total_participants: activeCount
        })
        .select()
        .single();

      if (drawError) throw drawError;

      // Find winners
      const winners = await this.findWinners(draw.id, winningNumbers);

      // Record winners
      const recordedWinners = await this.recordWinners(draw.id, winners, prizeDistribution);

      // If no 5-match winner, jackpot rolls over
      if (winners.fiveMatch.length === 0) {
        await this.supabase
          .from('draws')
          .update({ jackpot_amount: prizeDistribution.fiveMatch + prizeDistribution.jackpotCarryover })
          .eq('id', draw.id);
      }

      return {
        draw,
        winners: recordedWinners,
        statistics: {
          totalParticipants: activeCount,
          prizeDistribution,
          winnersCount: {
            fiveMatch: winners.fiveMatch.length,
            fourMatch: winners.fourMatch.length,
            threeMatch: winners.threeMatch.length
          }
        }
      };
    } catch (error) {
      console.error('Run draw error:', error);
      throw error;
    }
  }

  // Simulate draw without saving
  async simulateDraw(drawType = 'random') {
    try {
      const { count: activeCount } = await this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'active');

      const winningNumbers = drawType === 'random' 
        ? this.generateRandomNumbers()
        : await this.generateAlgorithmicNumbers();

      const prizeDistribution = this.calculatePrizeDistribution(activeCount);
      const winners = await this.findWinners(null, winningNumbers);

      return {
        winningNumbers,
        prizeDistribution,
        winners,
        statistics: {
          totalParticipants: activeCount,
          winnersCount: {
            fiveMatch: winners.fiveMatch.length,
            fourMatch: winners.fourMatch.length,
            threeMatch: winners.threeMatch.length
          }
        }
      };
    } catch (error) {
      console.error('Simulate draw error:', error);
      throw error;
    }
  }
}

module.exports = DrawController;