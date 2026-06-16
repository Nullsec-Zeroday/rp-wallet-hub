import { Check, Clock3, LifeBuoy, Mail, MessageCircle, RotateCcw, ShieldCheck, X } from "lucide-react";

type ResultKind = "success" | "cancelled";

interface PaymentResultPageProps {
  kind: ResultKind;
}

const resultCopy = {
  success: {
    eyebrow: "Payment submitted",
    title: "We are confirming your crypto payment.",
    body:
      "NOWPayments has received your checkout. Once the blockchain confirmation finishes, your RPWallet license key will be sent to the email you used at checkout.",
    accent: "emerald",
    icon: Check,
    primaryHref: "/dashboard",
    primaryLabel: "Go to dashboard",
    secondaryHref: "/buy",
    secondaryLabel: "Back to plans",
    steps: [
      {
        icon: Clock3,
        title: "Confirmation can take a few minutes",
        body: "Crypto payments complete after network confirmation. You can keep this page open or check your inbox.",
      },
      {
        icon: Mail,
        title: "Your license arrives by email",
        body: "The license is created automatically after NOWPayments sends the finished payment webhook.",
      },
      {
        icon: MessageCircle,
        title: "Need help?",
        body: "Join Telegram or message support with the email you used at checkout.",
      },
    ],
  },
  cancelled: {
    eyebrow: "Checkout cancelled",
    title: "No payment was completed.",
    body:
      "Your checkout was closed before payment finished, so no license has been issued. You can return to the plans page whenever you are ready.",
    accent: "amber",
    icon: X,
    primaryHref: "/buy",
    primaryLabel: "Choose a plan",
    secondaryHref: "/",
    secondaryLabel: "Return home",
    steps: [
      {
        icon: RotateCcw,
        title: "Restart checkout anytime",
        body: "Pick your plan again and NOWPayments will create a fresh crypto invoice.",
      },
      {
        icon: ShieldCheck,
        title: "No license was issued",
        body: "Cancelled checkouts do not create access keys or charge through RPWallet.",
      },
      {
        icon: LifeBuoy,
        title: "Questions before buying?",
        body: "Telegram support can help with payment networks, plan choice, or stuck invoices.",
      },
    ],
  },
} satisfies Record<ResultKind, {
  eyebrow: string;
  title: string;
  body: string;
  accent: "emerald" | "amber";
  icon: typeof Check;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  steps: Array<{
    icon: typeof Check;
    title: string;
    body: string;
  }>;
}>;

export function PaymentResultPage({ kind }: PaymentResultPageProps) {
  const copy = resultCopy[kind];
  const Icon = copy.icon;
  const isSuccess = kind === "success";

  const accentClasses = isSuccess
    ? {
        halo: "bg-[#00FF85]/10",
        ring: "border-[#00FF85]/20 bg-[#00FF85]/10 text-[#00FF85]",
        text: "text-[#00FF85]",
      }
    : {
        halo: "bg-amber-500/10",
        ring: "border-amber-500/20 bg-amber-500/10 text-amber-400",
        text: "text-amber-400",
      };

  return (
    <div className="min-h-screen text-white font-sans selection:bg-[#9c8df6]/30 relative pb-24 pt-16 flex flex-col items-center justify-center">
      {/* Background glow matching the accent color */}
      <div className={`absolute top-[10%] left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] pointer-events-none ${accentClasses.halo}`} />

      <main className="relative z-10 w-full max-w-[1200px] mx-auto px-6 pt-6 flex flex-col items-center">
        {/* ── H E A D E R ── */}
        <div className="flex flex-col items-center text-center mb-16 relative">
          <div className={`mb-6 inline-flex size-16 items-center justify-center rounded-2xl border ${accentClasses.ring}`}>
            <Icon size={32} strokeWidth={2.6} />
          </div>
          <p className={`mb-3 text-sm font-bold uppercase tracking-[0.2em] ${accentClasses.text}`}>{copy.eyebrow}</p>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight font-medium text-white mb-4">
            {copy.title}
          </h1>
          <p className="text-white/60 text-base md:text-lg font-medium max-w-[600px] mx-auto leading-relaxed">
            {copy.body}
          </p>
        </div>

        {/* ── S T E P S  G R I D ── */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mb-16 relative max-w-[1000px]">
          {copy.steps.map((step) => {
            const StepIcon = step.icon;
            return (
              <div
                key={step.title}
                className="glass-panel p-8 flex flex-col items-center text-center relative transition-all duration-300 rounded-[2rem] bg-[#121212]/80 border border-white/[0.04] hover:bg-[#151515] hover:border-white/[0.08] hover:scale-[1.01]"
              >
                <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.05] text-white/70">
                  <StepIcon size={24} />
                </div>
                <h3 className="text-white/90 font-semibold text-lg mb-3">{step.title}</h3>
                <p className="text-white/50 text-[15px] leading-relaxed">
                  {step.body}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── S U P P O R T ── */}
        <div className="w-full max-w-[500px] px-8 py-8 rounded-[2rem] border border-white/5 bg-white/[0.01] relative overflow-hidden text-center mb-10">
          <p className="text-white/40 text-[14px] leading-relaxed relative z-10">
            Need help? Message{" "}
            <a href="https://t.me/RPWallet_support_bot" target="_blank" rel="noopener noreferrer" className="text-[#9c8df6] hover:text-[#aba0f7] transition-colors">
              @RPWallet_support_bot
            </a>{" "}
            on Telegram.
          </p>
        </div>
      </main>
    </div>
  );
}
