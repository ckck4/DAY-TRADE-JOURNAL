(function () {
    const contractSpecs = {
        NQ: { pointValue: 20 },
        ES: { pointValue: 50 },
        MNQ: { pointValue: 2 },
        MES: { pointValue: 5 },
        GC: { pointValue: 100 },
        MGC: { pointValue: 10 }
    };

    function normalizeTrades(trades) {
        return [...trades].filter(trade => trade && trade.date).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    function equityCurve(trades) {
        const ordered = normalizeTrades(trades);
        let cumulative = 0;
        return ordered.map(trade => {
            cumulative += trade.pnl || 0;
            return {
                date: trade.date,
                value: cumulative
            };
        });
    }

    function drawdownSeries(trades) {
        const curve = equityCurve(trades);
        let peak = 0;
        let maxDrawdown = 0;
        const series = curve.map(point => {
            peak = Math.max(peak, point.value);
            const drawdown = point.value - peak;
            maxDrawdown = Math.min(maxDrawdown, drawdown);
            return {
                date: point.date,
                drawdown
            };
        });
        const currentDrawdown = series.length ? series[series.length - 1].drawdown : 0;
        return {
            series,
            maxDrawdown,
            currentDrawdown
        };
    }

    function winRate(trades) {
        if (!trades.length) return 0;
        const wins = trades.filter(t => t.pnl > 0).length;
        return (wins / trades.length) * 100;
    }

    function averageWin(trades) {
        const wins = trades.filter(t => t.pnl > 0);
        if (!wins.length) return 0;
        return wins.reduce((sum, trade) => sum + trade.pnl, 0) / wins.length;
    }

    function averageLoss(trades) {
        const losses = trades.filter(t => t.pnl < 0);
        if (!losses.length) return 0;
        const total = losses.reduce((sum, trade) => sum + Math.abs(trade.pnl), 0);
        return total / losses.length;
    }

    function profitFactor(trades) {
        const totalWins = trades.filter(t => t.pnl > 0).reduce((sum, trade) => sum + trade.pnl, 0);
        const totalLosses = trades.filter(t => t.pnl < 0).reduce((sum, trade) => sum + Math.abs(trade.pnl), 0);
        if (totalLosses === 0) return totalWins > 0 ? Infinity : 0;
        return totalWins / totalLosses;
    }

    function expectancy(trades) {
        if (!trades.length) return 0;
        const rate = winRate(trades) / 100;
        const avgWin = averageWin(trades);
        const avgLoss = averageLoss(trades);
        return (rate * avgWin) - ((1 - rate) * avgLoss);
    }

    function expectancyPerR(trades) {
        const rTrades = trades.map(trade => {
            if (!trade.stopLoss || !trade.entry || !trade.quantity) return null;
            const spec = contractSpecs[trade.symbol] || { pointValue: 1 };
            const risk = Math.abs(trade.entry - trade.stopLoss) * spec.pointValue * trade.quantity;
            if (!risk) return null;
            return trade.pnl / risk;
        }).filter(value => value !== null);

        if (!rTrades.length) return null;
        const total = rTrades.reduce((sum, value) => sum + value, 0);
        return total / rTrades.length;
    }

    function dailyAggregation(trades) {
        const map = {};
        trades.forEach(trade => {
            const dateKey = trade.date.split('T')[0];
            if (!map[dateKey]) {
                map[dateKey] = { date: dateKey, pnl: 0, count: 0 };
            }
            map[dateKey].pnl += trade.pnl || 0;
            map[dateKey].count += 1;
        });
        return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
    }

    function monthlyAggregation(trades) {
        const map = {};
        trades.forEach(trade => {
            const date = new Date(trade.date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!map[key]) {
                map[key] = { month: key, pnl: 0, count: 0 };
            }
            map[key].pnl += trade.pnl || 0;
            map[key].count += 1;
        });
        return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
    }

    function setupPerformance(trades) {
        const map = {};
        trades.forEach(trade => {
            const setup = trade.setup || 'Unknown';
            if (!map[setup]) {
                map[setup] = { setup, trades: 0, wins: 0, losses: 0, pnl: 0, winTotal: 0, lossTotal: 0 };
            }
            map[setup].trades += 1;
            map[setup].pnl += trade.pnl || 0;
            if (trade.pnl > 0) {
                map[setup].wins += 1;
                map[setup].winTotal += trade.pnl;
            } else if (trade.pnl < 0) {
                map[setup].losses += 1;
                map[setup].lossTotal += Math.abs(trade.pnl);
            }
        });

        return Object.values(map).map(item => {
            const winRateValue = item.trades ? (item.wins / item.trades) * 100 : 0;
            const avgWinValue = item.wins ? item.winTotal / item.wins : 0;
            const avgLossValue = item.losses ? item.lossTotal / item.losses : 0;
            return {
                ...item,
                winRate: winRateValue,
                avgWin: avgWinValue,
                avgLoss: avgLossValue
            };
        }).sort((a, b) => b.pnl - a.pnl);
    }

    function complianceStats(trades) {
        if (!trades.length) {
            return { followedRate: 0, violationCost: 0 };
        }
        const followed = trades.filter(trade => trade.followedPlan === 'yes');
        const violations = trades.filter(trade => trade.followedPlan === 'no');
        const followedRate = (followed.length / trades.length) * 100;
        const violationCost = violations.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
        return { followedRate, violationCost };
    }

    window.TradeJournalAnalytics = {
        equityCurve,
        drawdownSeries,
        winRate,
        averageWin,
        averageLoss,
        profitFactor,
        expectancy,
        expectancyPerR,
        dailyAggregation,
        monthlyAggregation,
        setupPerformance,
        complianceStats
    };
})();
