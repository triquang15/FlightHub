import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Clock, IdCard, Mail, ShieldCheck } from "lucide-react";

const IMPORTANT_ITEMS = [
  {
    icon: IdCard,
    title: "Passenger names",
    description: "Names must match the ID or passport used at the airport.",
  },
  {
    icon: Mail,
    title: "Contact details",
    description: "Schedule changes and payment updates will be sent to the email and phone above.",
  },
  {
    icon: Clock,
    title: "Airport timing",
    description: "Arrive early enough for baggage drop, security, and boarding.",
  },
  {
    icon: ShieldCheck,
    title: "Travel documents",
    description: "Check visa, transit, and destination entry rules before payment.",
  },
];

const ImportantInformation = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-white/10 dark:bg-slate-900/90"
    >
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-amber-50 dark:bg-amber-500/10">
          <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-300" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
            Before You Pay
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Quick final checks for a smooth trip.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {IMPORTANT_ITEMS.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/40"
          >
            <div className="mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
              <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <p className="text-sm font-semibold text-slate-950 dark:text-white">
                {title}
              </p>
            </div>
            <p className="text-xs leading-5 text-slate-600 dark:text-slate-400">
              {description}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default ImportantInformation;
