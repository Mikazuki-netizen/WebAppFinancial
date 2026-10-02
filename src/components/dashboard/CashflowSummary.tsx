import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarCheck,
  Coins,
  Percent,
  PiggyBank,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GlassCard } from '../common/GlassCard';
import { GlassBadge } from '../common/GlassBadge';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah } from '../../utils/financeCalculators';
import { triggerHaptic } from '../../utils/haptics';

export const CashflowSummary: React.FC = () => {
  const {
    totalIncome,
    salaryIncome,
    variableIncome,
    depositoYieldTotal,
    totalFixedExpenses,
    totalDailyExpenses,
    totalSavings,
    netCashflow,
    savingsTarget,
    savingsProgressPercent,
    activeProfile,
  } = useFinance();

  const handleCelebrate = () => {
    triggerHaptic('success');
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#007AFF', '#34C759', '#AF52DE', '#FFCC00'],
    });
  };

  return (
    <div className="space-y-3.5">
      {/* Primary Balance / Net Cashflow Hero Card */}
      <GlassCard variant="glow-blue" className="bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-purple-600/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Sisa Arus Kas Bersih (Net Cashflow)
            </span>
          </div>

          <GlassBadge variant={netCashflow >= 0 ? 'green' : 'red'} size="sm">
            {netCashflow >= 0 ? '+ Surplus' : '- Defisit'}
          </GlassBadge>
        </div>

        <div className="mt-2.5">
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatRupiah(netCashflow)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Setelah dikurangi kewajiban awal bulan, pengeluaran harian, & alokasi tabungan.
          </p>
        </div>

        {/* 2-Column Split: Inflow vs Outflow */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-black/5 dark:border-white/10">
          {/* Total Inflow */}
          <div className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
              <span>Total Pemasukan</span>
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
              {formatRupiah(totalIncome)}
            </div>

            {/* Inflow breakdown pills */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                Gaji: {formatRupiah(salaryIncome, true)}
              </span>
              {depositoYieldTotal > 0 && (
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                  <Coins className="w-2.5 h-2.5" />
                  Yield: +{formatRupiah(depositoYieldTotal, true)}
                </span>
              )}
            </div>
          </div>

          {/* Total Outflow (Fixed + Daily) */}
          <div className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-rose-500 dark:text-rose-400">
              <ArrowDownRight className="w-4 h-4" />
              <span>Total Beban Hidup</span>
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
              {formatRupiah(totalFixedExpenses + totalDailyExpenses)}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px] text-slate-400 dark:text-slate-500">
              <span>Wajib: {formatRupiah(totalFixedExpenses, true)}</span>
              <span>• Harian: {formatRupiah(totalDailyExpenses, true)}</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Monthly Savings Target Progress Card */}
      <GlassCard variant="default">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="p-1.5 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex-shrink-0">
              <PiggyBank className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                Target Tabungan Bulanan
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                Alokasi investasi & dana cadangan
              </p>
            </div>
          </div>

          <div className="flex-shrink-0">
            {savingsProgressPercent >= 100 ? (
              <button
                onClick={handleCelebrate}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-glow-green animate-bounce"
              >
                <Sparkles className="w-3 h-3" />
                <span>Tercapai!</span>
              </button>
            ) : (
              <GlassBadge variant="purple" size="sm">
                {savingsProgressPercent}% Tercapai
              </GlassBadge>
            )}
          </div>
        </div>

        {/* Progress Bar with Liquid Glow */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
            <span className="text-slate-900 dark:text-white font-bold">
              {formatRupiah(totalSavings)}
            </span>
            <span className="text-slate-400 dark:text-slate-500">
              Target: {formatRupiah(savingsTarget)}
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden relative p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(savingsProgressPercent, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shadow-glow-purple relative overflow-hidden"
            >
              {/* Shimmer line inside progress */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            </motion.div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
