import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  ActiveProfile,
  FinancialHealth,
  FixedBudget,
  Investment,
  SyncConfig,
  Transaction,
  UserId,
  UserProfile,
} from '../types/finance';
import { DataService, DEFAULT_USERS } from '../services/dataService';
import {
  calculateFinancialHealth,
  formatMonthYearIndo,
  getCurrentYearMonth,
  getMonthDateRangeIndo,
  isDateInMonth,
  shiftYearMonth,
} from '../utils/financeCalculators';
import { triggerHaptic } from '../utils/haptics';

interface FinanceContextType {
  // Profiles & Selection
  users: UserProfile[];
  activeProfile: ActiveProfile;
  setActiveProfile: (profile: ActiveProfile) => void;
  currentUser: UserProfile | null;

  // Selected Month / Range Filter
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  selectedMonthName: string;
  selectedMonthRange: string;
  isCurrentMonth: boolean;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToCurrentMonth: () => void;

  // Data Collections
  transactions: Transaction[];
  fixedBudgets: FixedBudget[];
  investments: Investment[];

  // Filtered Collections for Current View
  filteredTransactions: Transaction[];
  monthTransactions: Transaction[];
  filteredFixedBudgets: FixedBudget[];
  filteredInvestments: Investment[];

  // Calculated Metrics
  totalIncome: number;
  salaryIncome: number;
  variableIncome: number;
  additionalIncome: number;
  depositoYieldTotal: number;
  totalFixedExpenses: number;
  totalDailyExpenses: number;
  totalSavings: number;
  netCashflow: number;
  savingsTarget: number;
  savingsProgressPercent: number;
  liquidAssetsEstimate: number;
  financialHealth: FinancialHealth;

  // Mutations
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'> & { timestamp?: string }) => void;
  deleteTransaction: (id: string) => void;
  toggleFixedBudgetPaid: (id: string) => void;
  addFixedBudget: (budget: Omit<FixedBudget, 'id'>) => void;
  deleteFixedBudget: (id: string) => void;
  addInvestment: (inv: Omit<Investment, 'id'>, injectToIncome?: boolean) => void;
  toggleInvestmentActive: (id: string) => void;
  updateUserProfile: (userId: UserId, updates: Partial<UserProfile>) => void;
  resetAllData: () => void;

  // Deposito Sync Mode (ON = Sync to Main App Cashflow, OFF = Standalone Calculator Only)
  isDepositoSyncEnabled: boolean;
  setDepositoSyncEnabled: (enabled: boolean) => void;

  // Floating Toast Feedback
  toast: { type: 'success' | 'error' | 'info'; message: string } | null;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;

  // Google Sheets Remote Sync
  syncConfig: SyncConfig;
  updateSyncConfig: (config: Partial<SyncConfig>) => void;
  isSyncing: boolean;
  syncError: string | null;
  syncSuccessMessage: string | null;
  syncWithGoogleSheets: () => Promise<boolean>;
  pushToGoogleSheets: () => Promise<boolean>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>(() => DataService.getUsers());
  const [activeProfile, setActiveProfileState] = useState<ActiveProfile>('household');
  const [transactions, setTransactions] = useState<Transaction[]>(() => DataService.getTransactions());
  const [fixedBudgets, setFixedBudgets] = useState<FixedBudget[]>(() => DataService.getFixedBudgets());
  const [investments, setInvestments] = useState<Investment[]>(() => DataService.getInvestments());
  const [syncConfig, setSyncConfigState] = useState<SyncConfig>(() => DataService.getSyncConfig());
  const [isDepositoSyncEnabled, setIsDepositoSyncEnabledState] = useState<boolean>(() =>
    DataService.getDepositoSyncEnabled()
  );

  const setDepositoSyncEnabled = (enabled: boolean) => {
    triggerHaptic('medium');
    setIsDepositoSyncEnabledState(enabled);
    DataService.saveDepositoSyncEnabled(enabled);
  };

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 3500);
  };

  // Sync to local storage on changes
  useEffect(() => {
    DataService.saveUsers(users);
  }, [users]);

  useEffect(() => {
    DataService.saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    DataService.saveFixedBudgets(fixedBudgets);
  }, [fixedBudgets]);

  useEffect(() => {
    DataService.saveInvestments(investments);
  }, [investments]);

  useEffect(() => {
    DataService.saveSyncConfig(syncConfig);
  }, [syncConfig]);

  // Auto-sync from Google Sheets on initial mount if scriptUrl is configured
  useEffect(() => {
    if (syncConfig.scriptUrl) {
      syncWithGoogleSheets();
    }
  }, []);

  const setActiveProfile = (profile: ActiveProfile) => {
    triggerHaptic('light');
    setActiveProfileState(profile);
  };

  const currentUser = useMemo(() => {
    if (activeProfile === 'household') return null;
    return users.find(u => u.id === activeProfile) || users[0] || null;
  }, [activeProfile, users]);

  // Selected month filter (default: current calendar month, e.g. "2026-10")
  const [selectedMonth, setSelectedMonthState] = useState<string>(() => getCurrentYearMonth());

  const setSelectedMonth = (month: string) => {
    triggerHaptic('light');
    setSelectedMonthState(month);
  };

  const goToPreviousMonth = () => {
    triggerHaptic('light');
    setSelectedMonthState(prev => shiftYearMonth(prev, -1));
  };

  const goToNextMonth = () => {
    triggerHaptic('light');
    setSelectedMonthState(prev => shiftYearMonth(prev, 1));
  };

  const goToCurrentMonth = () => {
    triggerHaptic('light');
    setSelectedMonthState(getCurrentYearMonth());
  };

  const isCurrentMonth = selectedMonth === getCurrentYearMonth();
  const selectedMonthName = useMemo(() => formatMonthYearIndo(selectedMonth), [selectedMonth]);
  const selectedMonthRange = useMemo(() => getMonthDateRangeIndo(selectedMonth), [selectedMonth]);

  // Filtered collections based on active profile and Deposito Sync Mode
  const filteredTransactions = useMemo(() => {
    let list = transactions;
    if (activeProfile !== 'household') {
      list = list.filter(t => t.userId === activeProfile);
    }
    // If Deposito Sync is turned OFF, isolate transactions from passive deposito yield
    if (!isDepositoSyncEnabled) {
      list = list.filter(t => !t.isPassiveIncome && t.category !== 'Passive Income' && t.type !== 'deposito');
    }
    return list;
  }, [activeProfile, transactions, isDepositoSyncEnabled]);

  // Transactions belonging specifically to the selected month's date range
  const monthTransactions = useMemo(() => {
    return filteredTransactions.filter(t => {
      if (!t.timestamp) return false;
      return isDateInMonth(t.timestamp, selectedMonth);
    });
  }, [filteredTransactions, selectedMonth]);

  const filteredFixedBudgets = useMemo(() => {
    if (activeProfile === 'household') return fixedBudgets;
    return fixedBudgets.filter(b => b.userId === activeProfile || b.userId === 'shared');
  }, [activeProfile, fixedBudgets]);

  const filteredInvestments = useMemo(() => {
    if (activeProfile === 'household') return investments;
    return investments.filter(i => i.userId === activeProfile || i.userId === 'shared');
  }, [activeProfile, investments]);

  // Financial Metrics Computation — Base Salary preserved + Additional Incomes accumulated by date range
  const {
    totalIncome,
    salaryIncome,
    variableIncome,
    additionalIncome,
    depositoYieldTotal,
    totalFixedExpenses,
    totalDailyExpenses,
    totalSavings,
    netCashflow,
    savingsTarget,
    savingsProgressPercent,
    liquidAssetsEstimate,
  } = useMemo(() => {
    // 1. Determine Base Salaries from Users table (baseline income for the month)
    let baseSalary = 0;
    let target = 0;

    if (activeProfile === 'household') {
      baseSalary = users.reduce((sum, u) => sum + (Number(u.baseSalary) || 0), 0);
      target = users.reduce((sum, u) => sum + (Number(u.targetSavings) || 0), 0);
    } else {
      const u = users.find(x => x.id === activeProfile);
      baseSalary = u ? Number(u.baseSalary) || 0 : 0;
      target = u ? Number(u.targetSavings) || 0 : 0;
    }

    // 2. Deposito / Investment Yield from active portfolio
    // ONLY included if isDepositoSyncEnabled is TRUE!
    const activeInvs = isDepositoSyncEnabled
      ? filteredInvestments.filter(i => i.isActive && i.injectedToIncome)
      : [];
    const depYield = activeInvs.reduce((sum, i) => sum + (Number(i.netMonthlyYield) || 0), 0);

    const passiveTxs = isDepositoSyncEnabled
      ? monthTransactions.filter(t => t.type === 'income' && (t.isPassiveIncome || t.category === 'Passive Income'))
      : [];
    const depYieldFinal = isDepositoSyncEnabled
      ? (passiveTxs.length > 0 ? passiveTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) : depYield)
      : 0;

    // 3. Additional Income transactions for this month (excluding passive yield)
    const additionalIncomeTxs = monthTransactions.filter(
      t => t.type === 'income' && !t.isPassiveIncome && t.category !== 'Passive Income'
    );
    const additionalIncomeTotal = additionalIncomeTxs.reduce(
      (sum, t) => sum + (Number(t.amount) || 0),
      0
    );

    // CRITICAL: Base monthly salary is ALWAYS maintained and NEVER wiped out!
    // Any income transactions inputted within this month's date range are ADDED to the base income!
    const totIncome = baseSalary + depYieldFinal + additionalIncomeTotal;

    // Specific breakdown
    const salaryTxs = additionalIncomeTxs.filter(t => t.category === 'Gaji Pokok');
    const extraSalary = salaryTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const salaryInc = baseSalary + extraSalary;

    const variableInc = additionalIncomeTxs
      .filter(t => t.category !== 'Gaji Pokok')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    // 4. Fixed Expenses: from FixedBudgets list (monthly obligations) or fixed_expense transactions in this month
    const fixedTxTotal = monthTransactions
      .filter(t => t.type === 'fixed_expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totFixed = filteredFixedBudgets.length > 0
      ? filteredFixedBudgets.reduce((sum, b) => sum + (Number(b.amount) || 0), 0)
      : fixedTxTotal;

    // 5. Daily Expenses: from transactions tagged daily_expense in this month
    const totDaily = monthTransactions
      .filter(t => t.type === 'daily_expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    // 6. Savings: from transactions tagged savings in this month
    const totSavings = monthTransactions
      .filter(t => t.type === 'savings')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const netCash = totIncome - (totFixed + totDaily + totSavings);
    const progress = target > 0 ? Math.min(Math.round((totSavings / target) * 100), 100) : 0;

    // Estimated liquid assets (sum of investments principal ONLY IF sync is enabled + 3x monthly savings buffer)
    const investmentPrincipal = isDepositoSyncEnabled
      ? filteredInvestments.reduce((sum, i) => sum + (Number(i.principal) || 0), 0)
      : 0;
    const liquid = investmentPrincipal + (totSavings * 3);

    return {
      totalIncome: totIncome,
      salaryIncome: salaryInc,
      variableIncome: variableInc,
      additionalIncome: additionalIncomeTotal,
      depositoYieldTotal: depYieldFinal,
      totalFixedExpenses: totFixed,
      totalDailyExpenses: totDaily,
      totalSavings: totSavings,
      netCashflow: netCash,
      savingsTarget: target,
      savingsProgressPercent: progress,
      liquidAssetsEstimate: liquid,
    };
  }, [
    activeProfile,
    users,
    filteredInvestments,
    monthTransactions,
    filteredFixedBudgets,
    isDepositoSyncEnabled,
  ]);

  // Financial Health Computation
  const financialHealth = useMemo(() => {
    return calculateFinancialHealth({
      totalIncome,
      totalFixedExpenses,
      totalDailyExpenses,
      totalSavings,
      totalLiquidAssets: liquidAssetsEstimate,
      depositoYieldTotal,
    });
  }, [totalIncome, totalFixedExpenses, totalDailyExpenses, totalSavings, liquidAssetsEstimate, depositoYieldTotal]);

  // Background auto-sync helper whenever data changes
  const triggerAutoSync = (
    updatedTransactions?: Transaction[],
    updatedBudgets?: FixedBudget[],
    updatedInvs?: Investment[],
    singleTx?: Transaction
  ) => {
    if (!syncConfig.scriptUrl) {
      showToast('info', 'Transaksi disimpan lokal di HP (Google Sheets belum terhubung)');
      return;
    }

    setTimeout(async () => {
      try {
        setIsSyncing(true);
        setSyncError(null);

        let ok = false;
        // If single newly added transaction, try direct non-destructive append first
        if (singleTx) {
          try {
            ok = await DataService.addTransactionToGoogleSheets(syncConfig.scriptUrl, singleTx);
          } catch (e) {
            console.warn('Direct append failed, fallback to pushAll:', e);
          }
        }

        // Fallback to pushAll if direct append was not used or failed
        if (!ok) {
          ok = await DataService.pushAllToGoogleSheets(syncConfig.scriptUrl, {
            users,
            transactions: updatedTransactions || transactions,
            fixedBudgets: updatedBudgets || fixedBudgets,
            investments: updatedInvs || investments,
          });
        }

        if (ok) {
          const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          setSyncConfigState(prev => ({ ...prev, lastSyncedAt: now }));
          setSyncSuccessMessage(`Tersinkron ke Google Sheets (${now})`);
          showToast('success', `Tersinkron ke Google Sheets (${now})`);
        } else {
          throw new Error('Google Sheets tidak merespon sukses.');
        }
      } catch (err: any) {
        console.warn('Auto-sync error:', err);
        const errMsg = err?.message || 'Gagal tersinkron ke Google Sheets';
        setSyncError(errMsg);
        showToast('error', `Gagal sync: ${errMsg.substring(0, 50)}`);
      } finally {
        setIsSyncing(false);
      }
    }, 200);
  };

  // Mutation Handlers
  const addTransaction = (newTx: Omit<Transaction, 'id' | 'timestamp'> & { timestamp?: string }) => {
    const tx: Transaction = {
      ...newTx,
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      timestamp: newTx.timestamp || new Date().toISOString(),
    };
    const nextList = [tx, ...transactions];
    setTransactions(nextList);
    triggerHaptic('success');
    triggerAutoSync(nextList, undefined, undefined, tx);
  };

  const deleteTransaction = (id: string) => {
    const nextList = transactions.filter(t => t.id !== id);
    setTransactions(nextList);
    triggerHaptic('medium');
    triggerAutoSync(nextList);
  };

  const toggleFixedBudgetPaid = (id: string) => {
    const nextList = fixedBudgets.map(b => (b.id === id ? { ...b, isPaid: !b.isPaid } : b));
    setFixedBudgets(nextList);
    triggerHaptic('light');
    triggerAutoSync(undefined, nextList);
  };

  const addFixedBudget = (budget: Omit<FixedBudget, 'id'>) => {
    const newBudget: FixedBudget = {
      ...budget,
      id: 'fb_' + Date.now(),
    };
    const nextList = [...fixedBudgets, newBudget];
    setFixedBudgets(nextList);
    triggerHaptic('success');
    triggerAutoSync(undefined, nextList);
  };

  const deleteFixedBudget = (id: string) => {
    const nextList = fixedBudgets.filter(b => b.id !== id);
    setFixedBudgets(nextList);
    triggerHaptic('medium');
    triggerAutoSync(undefined, nextList);
  };

  const addInvestment = (inv: Omit<Investment, 'id'>, injectToIncome: boolean = true) => {
    const id = 'inv_' + Date.now();
    const newInv: Investment = {
      ...inv,
      id,
      injectedToIncome: injectToIncome,
      isActive: true,
    };
    const nextInvs = [...investments, newInv];
    setInvestments(nextInvs);

    let nextTxs = transactions;
    // If marked to inject to income AND Deposito Sync is enabled, also record a passive income transaction
    if (injectToIncome && newInv.netMonthlyYield > 0 && isDepositoSyncEnabled) {
      const tx: Transaction = {
        id: 'tx_pass_' + Date.now(),
        timestamp: new Date().toISOString(),
        userId: inv.userId === 'shared' ? 'user_1' : inv.userId,
        type: 'income',
        category: 'Passive Income',
        amount: Math.round(newInv.netMonthlyYield),
        description: `Bunga Bersih Bulanan ${inv.name} (${inv.apyPercent}%)`,
        isPassiveIncome: true,
      };
      nextTxs = [tx, ...transactions];
      setTransactions(nextTxs);
    }

    triggerHaptic('success');
    triggerAutoSync(nextTxs, undefined, nextInvs);
  };

  const toggleInvestmentActive = (id: string) => {
    setInvestments(prev =>
      prev.map(i => (i.id === id ? { ...i, isActive: !i.isActive } : i))
    );
    triggerHaptic('light');
  };

  const updateUserProfile = (userId: UserId, updates: Partial<UserProfile>) => {
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, ...updates } : u))
    );
    triggerHaptic('success');
  };

  const resetAllData = () => {
    DataService.resetToDefaultData();
    setUsers(DEFAULT_USERS);
    setTransactions(DataService.getTransactions());
    setFixedBudgets(DataService.getFixedBudgets());
    setInvestments(DataService.getInvestments());
    triggerHaptic('warning');
  };

  const updateSyncConfig = (config: Partial<SyncConfig>) => {
    setSyncConfigState(prev => ({ ...prev, ...config }));
  };

  // Sync from Google Sheets
  const syncWithGoogleSheets = async (): Promise<boolean> => {
    if (!syncConfig.scriptUrl) {
      setSyncError('URL Google Apps Script belum diatur. Buka Pengaturan untuk menambahkan URL.');
      return false;
    }

    setIsSyncing(true);
    setSyncError(null);
    setSyncSuccessMessage(null);

    try {
      const data = await DataService.fetchFromGoogleSheets(syncConfig.scriptUrl);
      if (data.users && data.users.length > 0) setUsers(data.users);
      if (data.transactions && Array.isArray(data.transactions)) setTransactions(data.transactions);
      if (data.fixedBudgets && Array.isArray(data.fixedBudgets)) setFixedBudgets(data.fixedBudgets);
      if (data.investments && Array.isArray(data.investments)) setInvestments(data.investments);

      const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      setSyncConfigState(prev => ({ ...prev, lastSyncedAt: now }));
      setSyncSuccessMessage(`Sinkronisasi berhasil! ${data.transactions?.length || 0} transaksi & ${data.fixedBudgets?.length || 0} tagihan dimuat (${now})`);
      triggerHaptic('success');
      return true;
    } catch (err: any) {
      setSyncError(err.message || 'Gagal menyinkronkan data.');
      triggerHaptic('warning');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Push Local Data to Google Sheets
  const pushToGoogleSheets = async (): Promise<boolean> => {
    if (!syncConfig.scriptUrl) {
      setSyncError('URL Google Apps Script belum diatur.');
      return false;
    }

    setIsSyncing(true);
    setSyncError(null);
    setSyncSuccessMessage(null);

    try {
      const ok = await DataService.pushAllToGoogleSheets(syncConfig.scriptUrl, {
        users,
        transactions,
        fixedBudgets,
        investments,
      });

      if (ok) {
        const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setSyncConfigState(prev => ({ ...prev, lastSyncedAt: now }));
        setSyncSuccessMessage(`Berhasil! ${transactions.length} transaksi, ${fixedBudgets.length} tagihan & profil berhasil diunggah ke Google Sheets (${now})`);
        triggerHaptic('success');
        return true;
      } else {
        throw new Error('Google Sheets mengembalikan respon gagal.');
      }
    } catch (err: any) {
      setSyncError(err.message || 'Gagal mengirim data ke Google Sheets.');
      triggerHaptic('warning');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        users,
        activeProfile,
        setActiveProfile,
        currentUser,
        selectedMonth,
        setSelectedMonth,
        selectedMonthName,
        selectedMonthRange,
        isCurrentMonth,
        goToPreviousMonth,
        goToNextMonth,
        goToCurrentMonth,
        transactions,
        fixedBudgets,
        investments,
        filteredTransactions,
        monthTransactions,
        filteredFixedBudgets,
        filteredInvestments,
        totalIncome,
        salaryIncome,
        variableIncome,
        additionalIncome,
        depositoYieldTotal,
        totalFixedExpenses,
        totalDailyExpenses,
        totalSavings,
        netCashflow,
        savingsTarget,
        savingsProgressPercent,
        liquidAssetsEstimate,
        financialHealth,
        addTransaction,
        deleteTransaction,
        toggleFixedBudgetPaid,
        addFixedBudget,
        deleteFixedBudget,
        addInvestment,
        toggleInvestmentActive,
        updateUserProfile,
        resetAllData,
        isDepositoSyncEnabled,
        setDepositoSyncEnabled,
        toast,
        showToast,
        syncConfig,
        updateSyncConfig,
        isSyncing,
        syncError,
        syncSuccessMessage,
        syncWithGoogleSheets,
        pushToGoogleSheets,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
