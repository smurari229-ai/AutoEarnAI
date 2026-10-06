import React, { useState } from 'react';
import { 
  X, 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  QrCode, 
  CreditCard, 
  Building, 
  Coins, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Copy, 
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Receipt,
  Sparkles,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WalletState, Transaction } from '../types';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: WalletState;
  onDepositSuccess: (amount: number, method: string, details?: any) => Promise<void>;
  onWithdrawSuccess: (amount: number, method: string, destination: string, extra?: any) => Promise<void>;
  onResetBalance: () => Promise<void>;
  initialTab?: 'deposit' | 'withdraw' | 'history';
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  wallet,
  onDepositSuccess,
  onWithdrawSuccess,
  onResetBalance,
  initialTab = 'deposit',
}) => {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>(initialTab);
  
  // Deposit State
  const [depositAmount, setDepositAmount] = useState<number>(5000);
  const [customDeposit, setCustomDeposit] = useState<string>('');
  const [depositMethod, setDepositMethod] = useState<'upi' | 'card' | 'netbanking' | 'crypto'>('upi');
  const [upiVpa, setUpiVpa] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [selectedBank, setSelectedBank] = useState<string>('HDFC Bank');
  const [cryptoNetwork, setCryptoNetwork] = useState<'TRC20' | 'ERC20'>('TRC20');
  const [isProcessingDeposit, setIsProcessingDeposit] = useState<boolean>(false);
  const [depositSuccessMsg, setDepositSuccessMsg] = useState<string | null>(null);

  // Withdrawal State
  const [withdrawAmount, setWithdrawAmount] = useState<string>('2500');
  const [withdrawMethod, setWithdrawMethod] = useState<'bank' | 'upi' | 'crypto'>('upi');
  const [withdrawUpi, setWithdrawUpi] = useState<string>('');
  const [bankAccount, setBankAccount] = useState<string>('');
  const [bankIfsc, setBankIfsc] = useState<string>('');
  const [accountHolder, setAccountHolder] = useState<string>('');
  const [cryptoAddress, setCryptoAddress] = useState<string>('');
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState<boolean>(false);
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // Filter for Transaction History
  const [historyFilter, setHistoryFilter] = useState<'all' | 'deposits' | 'withdrawals' | 'earnings'>('all');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentDepositAmount = customDeposit ? parseFloat(customDeposit) || 0 : depositAmount;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const executeDeposit = async () => {
    if (currentDepositAmount < 100) {
      alert('Minimum deposit amount is ₹100');
      return;
    }

    setIsProcessingDeposit(true);
    setDepositSuccessMsg(null);

    try {
      let methodLabel = 'Payment provider';
      let details: any = {};

      if (depositMethod === 'upi') {
        methodLabel = 'UPI provider';
        details = { upiId: upiVpa };
      } else if (depositMethod === 'card') {
        methodLabel = 'Credit/Debit Card (3D Secure)';
        details = { cardLast4: cardNumber.slice(-4) };
      } else if (depositMethod === 'netbanking') {
        methodLabel = `Net Banking (${selectedBank})`;
      } else if (depositMethod === 'crypto') {
        methodLabel = `Crypto USDT (${cryptoNetwork})`;
      }

      await onDepositSuccess(currentDepositAmount, methodLabel, details);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setDepositSuccessMsg(`₹${currentDepositAmount.toLocaleString('en-IN')} payment request accepted. Wallet credits only after verified provider settlement.`);
      setTimeout(() => {
        setDepositSuccessMsg(null);
      }, 4000);
    } catch (err: any) {
      alert(err.message || 'Deposit failed');
    } finally {
      setIsProcessingDeposit(false);
    }
  };

  const executeWithdraw = async () => {
    setWithdrawError(null);
    setWithdrawSuccessMsg(null);

    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setWithdrawError('Please enter a valid withdrawal amount');
      return;
    }

    if (amountNum < 500) {
      setWithdrawError('Minimum payout threshold is ₹500');
      return;
    }

    const availableBalance = Math.max(0, wallet.totalBalance - wallet.lockedInTrades);
    if (amountNum > availableBalance) {
      setWithdrawError(`Insufficient available balance. Maximum withdrawable is ₹${availableBalance.toFixed(2)}`);
      return;
    }

    setIsProcessingWithdraw(true);

    try {
      let destination = '';
      let extra: any = {};

      if (withdrawMethod === 'upi') {
        if (!withdrawUpi || !withdrawUpi.includes('@')) {
          throw new Error('Please enter a valid UPI ID (e.g. name@okhdfcbank)');
        }
        destination = withdrawUpi;
      } else if (withdrawMethod === 'bank') {
        if (!bankAccount || !bankIfsc) {
          throw new Error('Please provide bank account number and IFSC code');
        }
        destination = bankAccount;
        extra = { ifscCode: bankIfsc, accountHolder };
      } else {
        if (!cryptoAddress) throw new Error('Please provide crypto wallet address');
        destination = cryptoAddress;
      }

      await onWithdrawSuccess(amountNum, withdrawMethod, destination, extra);

      setWithdrawSuccessMsg(`₹${amountNum.toLocaleString('en-IN')} withdrawal request submitted. Payout occurs only after provider verification.`);
      setTimeout(() => {
        setWithdrawSuccessMsg(null);
      }, 4000);
    } catch (err: any) {
      setWithdrawError(err.message || 'Withdrawal failed');
    } finally {
      setIsProcessingWithdraw(false);
    }
  };

  const filteredTransactions = wallet.transactions.filter(txn => {
    if (historyFilter === 'deposits') return txn.type === 'deposit';
    if (historyFilter === 'withdrawals') return txn.type === 'withdrawal';
    if (historyFilter === 'earnings') return txn.type.includes('earning') || txn.type.includes('profit') || txn.type.includes('payout');
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Payment & Wallet
              </h2>
              <p className="text-xs text-slate-400">
                Provider-backed payments only; no demo balances or payouts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Balance Overview Ribbon */}
        <div className="grid grid-cols-3 bg-slate-950 border-b border-slate-800 p-4 text-center divide-x divide-slate-800">
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Available Balance</div>
            <div className="text-base sm:text-lg font-extrabold text-emerald-400">
              ₹{wallet.totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Today's AI Earnings</div>
            <div className="text-base sm:text-lg font-extrabold text-cyan-400">
              +₹{wallet.todaysEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Withdrawn</div>
            <div className="text-base sm:text-lg font-extrabold text-amber-400">
              ₹{wallet.totalWithdrawn.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex px-6 pt-3 border-b border-slate-800 bg-slate-900/50 gap-2">
          {[
            { id: 'deposit', label: 'Deposit Gateway', icon: ArrowDownLeft, color: 'text-emerald-400' },
            { id: 'withdraw', label: 'Withdrawal Gateway', icon: ArrowUpRight, color: 'text-amber-400' },
            { id: 'history', label: 'Passbook & Ledger', icon: Receipt, color: 'text-cyan-400' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
                  isActive
                    ? 'border-emerald-500 text-white bg-emerald-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${tab.color}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: DEPOSIT GATEWAY */}
          {activeTab === 'deposit' && (
            <div className="space-y-5">
              {depositSuccessMsg && (
                <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>{depositSuccessMsg}</span>
                </div>
              )}

              {/* Amount Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Deposit Amount (INR)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-2">
                  {[500, 1000, 5000, 10000, 25000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => { setDepositAmount(amt); setCustomDeposit(''); }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        depositAmount === amt && !customDeposit
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      ₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">₹</span>
                  <input
                    type="number"
                    value={customDeposit}
                    onChange={(e) => setCustomDeposit(e.target.value)}
                    placeholder="Or enter custom amount (e.g. 15000)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Payment Gateway Method */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Choose Payment Method
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'upi', label: 'UPI', sub: 'GPay, PhonePe, QR', icon: QrCode },
                    { id: 'card', label: 'Debit / Credit', sub: 'Visa, Master, RuPay', icon: CreditCard },
                    { id: 'netbanking', label: 'Net Banking', sub: 'Direct Bank Wire', icon: Building },
                    { id: 'crypto', label: 'Crypto (USDT)', sub: 'TRC20 / ERC20', icon: Coins },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = depositMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setDepositMethod(m.id as any)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-white shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <div className="text-xs font-bold text-slate-200">{m.label}</div>
                        <div className="text-[10px] text-slate-500">{m.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Gateway Details Section */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                
                {/* UPI Details */}
                {depositMethod === 'upi' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-slate-400" />
                        <div>
                          <div className="text-xs font-bold text-white">Payment provider unavailable</div>
                          <div className="text-[11px] text-slate-400">No QR, VPA, or payment credentials are active. Wallet credit requires verified provider settlement.</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Or enter your Personal UPI ID to receive a direct collect request:
                      </label>
                      <input
                        type="text"
                        value={upiVpa}
                        onChange={(e) => setUpiVpa(e.target.value)}
                        placeholder="yourname@okhdfcbank"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Card Details */}
                {depositMethod === 'card' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4532 8910 2341 9081"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">Expiry Date</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">CVV</label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="***"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Net Banking */}
                {depositMethod === 'netbanking' && (
                  <div className="space-y-2">
                    <label className="block text-[11px] font-medium text-slate-400">Select Net Banking Bank</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank'].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setSelectedBank(b)}
                          className={`p-2 rounded-lg text-xs font-semibold text-center border transition-all ${
                            selectedBank === b
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Crypto */}
                {depositMethod === 'crypto' && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      {(['TRC20', 'ERC20'] as const).map(net => (
                        <button
                          key={net}
                          type="button"
                          onClick={() => setCryptoNetwork(net)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            cryptoNetwork === net
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          USDT ({net})
                        </button>
                      ))}
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-300 truncate mr-2">0x89F1a4D88a6d7Eb39c8A1102A6F29C8931</span>
                      <button
                        type="button"
                        onClick={() => handleCopy('0x89F1a4D88a6d7Eb39c8A1102A6F29C8931')}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* Deposit Action Button */}
              <button
                type="button"
                onClick={executeDeposit}
                disabled={isProcessingDeposit || currentDepositAmount <= 0}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                {isProcessingDeposit ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Pay & Deposit ₹{currentDepositAmount.toLocaleString('en-IN')} Instantly</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: WITHDRAWAL GATEWAY */}
          {activeTab === 'withdraw' && (
            <div className="space-y-5">
              {withdrawSuccessMsg && (
                <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>{withdrawSuccessMsg}</span>
                </div>
              )}

              {withdrawError && (
                <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{withdrawError}</span>
                </div>
              )}

              {/* Amount to Withdraw */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Enter Payout Amount (INR)
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Available: <strong className="text-emerald-400">₹{Math.max(0, wallet.totalBalance - wallet.lockedInTrades).toFixed(2)}</strong>
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">₹</span>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Min ₹500"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-20 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(Math.max(0, wallet.totalBalance - wallet.lockedInTrades).toString())}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold rounded-lg transition-colors"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Payout Channels */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Disbursal Payout Destination
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'upi', label: 'UPI Payout', sub: 'Provider required', icon: QrCode },
                    { id: 'bank', label: 'IMPS Bank Wire', sub: 'Direct Account credit', icon: Building },
                    { id: 'crypto', label: 'Crypto USDT', sub: 'TRC-20 Address', icon: Coins },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = withdrawMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setWithdrawMethod(m.id as any)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                        <div className="text-xs font-bold text-slate-200">{m.label}</div>
                        <div className="text-[10px] text-slate-500">{m.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payout Target Inputs */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                {withdrawMethod === 'upi' && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Receiver UPI ID (VPA)
                    </label>
                    <input
                      type="text"
                      value={withdrawUpi}
                      onChange={(e) => setWithdrawUpi(e.target.value)}
                      placeholder="e.g. mobile@upi or name@okhdfcbank"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}

                {withdrawMethod === 'bank' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Bank Account Holder Name
                      </label>
                      <input
                        type="text"
                        value={accountHolder}
                        onChange={(e) => setAccountHolder(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Account Number
                        </label>
                        <input
                          type="text"
                          value={bankAccount}
                          onChange={(e) => setBankAccount(e.target.value)}
                          placeholder="501000..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          IFSC Code
                        </label>
                        <input
                          type="text"
                          value={bankIfsc}
                          onChange={(e) => setBankIfsc(e.target.value)}
                          placeholder="HDFC0001234"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono uppercase text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {withdrawMethod === 'crypto' && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Receiver USDT (TRC-20) Wallet Address
                    </label>
                    <input
                      type="text"
                      value={cryptoAddress}
                      onChange={(e) => setCryptoAddress(e.target.value)}
                      placeholder="TX8mZ..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* Submit Withdrawal */}
              <button
                type="button"
                onClick={executeWithdraw}
                disabled={isProcessingWithdraw}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold py-3.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                {isProcessingWithdraw ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ArrowUpRight className="w-5 h-5" />
                    <span>Submit ₹{parseFloat(withdrawAmount || '0').toLocaleString('en-IN')} Withdrawal Request</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 3: PASSBOOK & LEDGER */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {/* Filter Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
                  {[
                    { id: 'all', label: 'All Activity' },
                    { id: 'earnings', label: 'AI Earnings' },
                    { id: 'deposits', label: 'Deposits' },
                    { id: 'withdrawals', label: 'Payouts' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setHistoryFilter(f.id as any)}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        historyFilter === f.id
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={onResetBalance}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold underline"
                >
                  Demo wallet reset disabled
                </button>
              </div>

              {/* Transaction List */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    No transactions recorded in this category.
                  </div>
                ) : (
                  filteredTransactions.map((txn) => {
                    const isCredit = txn.type === 'deposit' || txn.type.includes('earning') || txn.type.includes('profit') || txn.type.includes('payout');
                    return (
                      <div
                        key={txn.id}
                        className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isCredit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">{txn.title}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2">
                              <span>{new Date(txn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span>•</span>
                              <span className="font-mono">{txn.referenceId}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={`text-xs sm:text-sm font-extrabold font-mono ${
                            isCredit ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            {isCredit ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {txn.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
