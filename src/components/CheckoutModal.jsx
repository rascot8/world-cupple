import React, { useState } from 'react';
import { X, CreditCard, Lock, CheckCircle2, ExternalLink } from 'lucide-react';
import { FIRST_BUY_MULTIPLIER } from '../utils/economy';

/**
 * Checkout sheet for CupCoin bundles.
 *
 * Two gateways:
 *  - If a Stripe Payment Link is configured for the bundle
 *    (VITE_STRIPE_LINK_{ID}), we hand off to Stripe and crediting happens
 *    server-side via the stripeWebhook Cloud Function.
 *  - Otherwise: the built-in sandbox gateway — full purchase UX, instant
 *    credit, clearly marked, no card ever charged.
 */
const stripeLinkFor = (bundleId) =>
  import.meta.env[`VITE_STRIPE_LINK_${bundleId.toUpperCase()}`] || null;

const CheckoutModal = ({ bundle, firstBuy, uid, onConfirm, onClose }) => {
  const [state, setState] = useState('idle'); // idle | processing | success
  const [credited, setCredited] = useState(0);
  const stripeLink = stripeLinkFor(bundle.id);
  const coins = bundle.coins * (firstBuy ? FIRST_BUY_MULTIPLIER : 1);

  const handlePay = async () => {
    if (stripeLink) {
      // client_reference_id ties the Stripe session back to this player.
      window.open(`${stripeLink}?client_reference_id=${uid}`, '_blank', 'noopener');
      onClose();
      return;
    }
    setState('processing');
    // A beat of suspense makes the credit feel earned.
    await new Promise((r) => setTimeout(r, 1400));
    const result = await onConfirm();
    setCredited(result?.credited ?? coins);
    setState('success');
    window.dispatchEvent(new CustomEvent('confetti-burst', { detail: { count: 90, gold: true } }));
    setTimeout(onClose, 2200);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm">
      <div className="bg-fifa-dark w-full max-w-sm rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-float-up">
        {state === 'success' ? (
          <div className="p-10 flex flex-col items-center text-center">
            <CheckCircle2 className="w-16 h-16 text-fifa-neon mb-4" />
            <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-1">Payment complete</h3>
            <p className="animate-coin-pop text-4xl font-black text-gold-glow my-3 tabular-nums">+{credited.toLocaleString()} 🪙</p>
            <p className="text-gray-400 text-sm font-bold">CupCoins added to your wallet</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center p-5 border-b border-white/10">
              <h3 className="font-black text-white uppercase tracking-wider">Checkout</h3>
              <button onClick={onClose} disabled={state === 'processing'} className="text-gray-400 hover:text-white transition-colors disabled:opacity-30">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{bundle.icon}</span>
                  <div>
                    <p className="font-black text-white">{bundle.name}</p>
                    <p className="text-xs font-bold text-gold-glow tabular-nums">
                      {bundle.coins.toLocaleString()} CupCoins
                      {firstBuy && <span className="ml-1.5 text-fifa-neon">×2 FIRST BUY = {coins.toLocaleString()}!</span>}
                    </p>
                  </div>
                </div>
                <span className="font-black text-white text-lg tabular-nums">${bundle.price}</span>
              </div>

              {!stripeLink && (
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                  <CreditCard className="w-5 h-5 text-gray-400 shrink-0" />
                  <div className="flex-grow">
                    <p className="text-sm font-bold text-white">Visa •••• 4242</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Sandbox card</p>
                  </div>
                </div>
              )}

              <button
                onClick={handlePay}
                disabled={state === 'processing'}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-fifa-green to-fifa-neon text-fifa-black font-black text-lg uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-60 disabled:scale-100 flex items-center justify-center gap-2"
              >
                {state === 'processing' ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-fifa-black/40 border-t-fifa-black rounded-full animate-spin" />
                    Processing…
                  </span>
                ) : stripeLink ? (
                  <><ExternalLink className="w-5 h-5" /> Pay with Stripe — ${bundle.price}</>
                ) : (
                  <><Lock className="w-4 h-4" /> Pay ${bundle.price}</>
                )}
              </button>

              <p className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" />
                {stripeLink ? 'Secure checkout by Stripe' : 'Sandbox mode — no real charge'}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CheckoutModal;
