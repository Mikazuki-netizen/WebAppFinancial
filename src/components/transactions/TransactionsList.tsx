import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDownRight,
  ArrowUpRight,
  Briefcase,
  Calendar,
  Car,
  Coffee,
  Coins,
  CreditCard,
  Film,
  Gift,
  HeartPulse,
  Home,
  PiggyBank,
  Receipt,
  Search,
  ShoppingBag,
  Trash2,
  TrendingUp,
  Utensils,
  Wallet,
  Zap,
  Upload,
  Loader2,
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassBadge } from '../common/GlassBadge';
import { useFinance } from '../../context/FinanceContext';
import { Transaction, TransactionType } from '../../types/finance';
import { formatDateIndo, formatRupiah } from '../../utils/financeCalculators';

export const TransactionsList: React.FC = () => {
  const { filteredTransactions, deleteTransaction, users, pushToGoogleSheets, isSyncing, syncConfig } = useFinance();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const getCategoryIcon = (category: string, type: TransactionType) => {
    switch (category) {
      case 'Makanan & Kuliner':
        return <Utensils className="w-4 h-4 text-rose-500" />;
      case 'Kopi & Nongkrong':
        return <Coffee className="w-4 h-4 text-amber-500" />;
      case 'Belanja Supermarket':
        return <ShoppingBag className="w-4 h-4 text-purple-500" />;
      case 'Transport & Bensin':
      case 'Cicilan Kendaraan':
        return <Car className="w-4 h-4 text-sky-500" />;
      case 'Gaji Pokok':
        return <Wallet className="w-4 h-4 text-emerald-500" />;
      case 'Passive Income':
        return <Coins className="w-4 h-4 text-blue-500" />;
      case 'KPR / Sewa':
        return <Home className="w-4 h-4 text-indigo-500" />;
      case 'Listrik & WiFi':
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'Reksadana':
      case 'Tabungan Emas':
        return <PiggyBank className="w-4 h-4 text-pink-500" />;
      default:
        return type === 'income' ? (
          <ArrowUpRight className="w-4 h-4 text-emerald-500" />
        ) : (
          <ArrowDownRight className="w-4 h-4 text-rose-500" />
        );
    }
  };

  const filtered = useMemo(() => {
    return filteredTransactions.filter(t => {
      const matchSearch =
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = filterType === 'all' || t.type === filterType;
      return matchSearch && matchType;
    });
  }, [filteredTransactions, searchQuery, filterType]);

  // Group by Date String
  const groupedByDate = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filtered.forEach(tx => {
      const dateKey = tx.timestamp.split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(tx);
    });
    return groups;
  }, [filtered]);

  const sortedDateKeys = useMemo(() => {
    return Object.keys(groupedByDate).sort((a, b) => (a < b ? 1 : -1));
  }, [groupedByDate]);

  return (
    <div className="space-y-4">
      {/* Search Bar & Filter Chips */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari transaksi atau kategori..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full glass-input pl-10 text-xs"
          />
        </div>

        {/* Filter Pills & Manual Sync */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'daily_expense', label: 'Harian' },
              { id: 'fixed_expense', label: 'Wajib' },
              { id: 'income', label: 'Pemasukan' },
              { id: 'savings', label: 'Tabungan' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold flex-shrink-0 transition-all border ${
                  filterType === f.id
                    ? 'bg-blue-600 text-white border-blue-500 shadow-glow-blue'
                    : 'bg-black/5 dark:bg-white/5 border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {syncConfig.scriptUrl && (
            <button
              onClick={() => pushToGoogleSheets()}
              disabled={isSyncing}
              title="Kirim semua data transaksi ke spreadsheet Google Sheets sekarang"
              className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-all flex-shrink-0"
            >
              {isSyncing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Upload className="w-3 h-3" />
              )}
              <span>{isSyncing ? 'Mengunggah...' : 'Kirim ke Sheets'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Transaction Feed */}
      <div className="space-y-4">
        {sortedDateKeys.length === 0 ? (
          <GlassCard className="text-center py-10">
            <Receipt className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs text-slate-400">
              Tidak ada riwayat transaksi yang cocok.
            </p>
          </GlassCard>
        ) : (
          sortedDateKeys.map(dateKey => {
            const txs = groupedByDate[dateKey];
            const isToday = new Date().toISOString().split('T')[0] === dateKey;
            const dateLabel = isToday ? 'Hari Ini' : formatDateIndo(dateKey);

            return (
              <div key={dateKey} className="space-y-2">
                {/* Date Header */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {dateLabel}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {txs.length} transaksi
                  </span>
                </div>

                {/* List items for this date */}
                <div className="space-y-1.5">
                  <AnimatePresence>
                    {txs.map(tx => {
                      const user = users.find(u => u.id === tx.userId);
                      const isIncome = tx.type === 'income';

                      return (
                        <motion.div
                          key={tx.id}
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="group p-3 rounded-2xl glass-card flex items-center justify-between gap-3 hover:border-black/20 dark:hover:border-white/20 transition-all"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] flex-shrink-0">
                              {getCategoryIcon(tx.category, tx.type)}
                            </div>

                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {tx.description}
                              </h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                  {tx.category}
                                </span>
                                <span className="text-[10px] text-slate-300 dark:text-slate-600">
                                  •
                                </span>
                                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                                  <span>{user?.avatar}</span>
                                  <span>{user?.name}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="text-right">
                              <div
                                className={`text-xs font-black tracking-tight ${
                                  isIncome
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-slate-900 dark:text-white'
                                }`}
                              >
                                {isIncome ? '+' : '-'} {formatRupiah(tx.amount)}
                              </div>
                              {tx.isPassiveIncome && (
                                <span className="text-[9px] font-semibold text-blue-500">
                                  Passive Yield
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => deleteTransaction(tx.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-opacity"
                              aria-label="Hapus Transaksi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
