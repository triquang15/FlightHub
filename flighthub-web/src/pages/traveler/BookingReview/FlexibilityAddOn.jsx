import { motion } from 'framer-motion';
import { Shield, Check, TrendingUp } from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const FlexibilityAddOn = ({ flexibilityData, selectedPlan, onSelectPlan }) => {
  if (!flexibilityData?.options?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-white/10 dark:bg-slate-900/90"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-violet-50 dark:bg-violet-500/10">
          <Shield className="h-6 w-6 text-violet-600 dark:text-violet-300" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Flexibility Add-Ons</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{flexibilityData.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {flexibilityData.options.map((option) => {
          const isSelected = selectedPlan === option.id;

          return (
            <motion.div
              key={option.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative cursor-pointer rounded-xl border-2 p-5 transition-all ${
                isSelected
                  ? 'border-violet-600 bg-violet-50 dark:border-violet-400/70 dark:bg-violet-500/10'
                  : 'border-slate-200 bg-white hover:border-violet-300 dark:border-white/10 dark:bg-slate-950/30'
              }`}
              onClick={() => onSelectPlan(isSelected ? null : option.id)}
            >
              {option.popular && (
                <div className="absolute -top-3 right-4">
                  <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold rounded-full shadow-lg flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{option.name}</h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold text-slate-950 dark:text-white">
                      {currencyFormatter.format(option.price)}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">/passenger</span>
                  </div>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? 'border-purple-600 bg-purple-600'
                      : 'border-slate-300 bg-white dark:border-white/20 dark:bg-slate-900'
                  }`}
                >
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
              </div>

              <div className="space-y-2">
                {option.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-700 dark:text-slate-300">{feature}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {selectedPlan && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/10"
        >
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-100">
              Flexibility add-on selected! Travel with peace of mind.
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default FlexibilityAddOn;
