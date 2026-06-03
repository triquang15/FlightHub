import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, FileText, Shield, Sparkles, Users, Zap } from 'lucide-react';
import {
  OwnerDetailsStep,
  AirlineDetailsStep,
  SupportContactStep,
  ReviewConfirmationStep,
  SuccessScreen
} from './steps';

const steps = [
  {
    id: 'owner',
    title: 'Account Setup',
    description: 'Create your admin account',
    icon: Shield,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'airline',
    title: 'Airline Profile',
    description: 'Configure airline details',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'support',
    title: 'Support Center',
    description: 'Setup customer support',
    icon: Users,
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'review',
    title: 'Launch Ready',
    description: 'Review and activate',
    icon: Zap,
    color: 'from-orange-500 to-red-500'
  }
];

const emptyFormData = {
  owner: {},
  airline: {},
  support: {}
};

const getSavedProgress = () => {
  const savedProgress = localStorage.getItem('airline_onboarding_progress');

  if (!savedProgress) {
    return {
      currentStep: 1,
      formData: emptyFormData
    };
  }

  try {
    const progress = JSON.parse(savedProgress);
    const savedStep = Number(progress.currentStep);
    const safeStep = Number.isInteger(savedStep)
      ? Math.min(Math.max(savedStep, 1), steps.length)
      : 1;

    return {
      currentStep: safeStep,
      formData: {
        owner: progress.formData?.owner || {},
        airline: progress.formData?.airline || {},
        support: progress.formData?.support || {}
      }
    };
  } catch {
    localStorage.removeItem('airline_onboarding_progress');
    return {
      currentStep: 1,
      formData: emptyFormData
    };
  }
};

const AirlineOnboardingWizard = () => {
  const [initialProgress] = useState(getSavedProgress);
  const [currentStep, setCurrentStep] = useState(initialProgress.currentStep);
  const [isCompleted, setIsCompleted] = useState(false);
  const [formData, setFormData] = useState(initialProgress.formData);

  const saveProgress = (step, data) => {
    const progress = {
      currentStep: Math.min(Math.max(step, 1), steps.length),
      formData: data
    };
    localStorage.setItem('airline_onboarding_progress', JSON.stringify(progress));
  };

  const handleStepData = (stepKey, data) => {
    const newFormData = {
      ...formData,
      [stepKey]: data
    };
    setFormData(newFormData);
    saveProgress(currentStep, newFormData);
  };

  const handleNext = () => {
    
    if (currentStep < steps.length) {

      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      saveProgress(nextStep, formData);
      
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      saveProgress(prevStep, formData);
    }
  };

  const handleEditStep = (stepNumber) => {
    setCurrentStep(stepNumber);
    saveProgress(stepNumber, formData);
  };

  const handleComplete = () => {
    setIsCompleted(true);
    localStorage.removeItem('airline_onboarding_progress');
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <OwnerDetailsStep
            data={formData.owner}
            onDataChange={(data) => handleStepData('owner', data)}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <AirlineDetailsStep
            data={formData.airline}
            onDataChange={(data) => handleStepData('airline', data)}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <SupportContactStep
            data={formData.support}
            onDataChange={(data) => handleStepData('support', data)}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 4:
        return (
          <ReviewConfirmationStep
            formData={formData}
            onEdit={handleEditStep}
            onPrevious={handlePrevious}
            onComplete={handleComplete}
          />
        );
      default:
        return null;
    }
  };

  if (isCompleted) {
    return <SuccessScreen airlineData={formData.airline} />;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_42%,#f8fafc_100%)] text-slate-950 dark:bg-[linear-gradient(180deg,#020617_0%,#0f172a_46%,#020617_100%)] dark:text-white">
      <div className="border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4 border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/40 dark:bg-blue-500/10 dark:text-blue-100">
              Airline partner onboarding
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white md:text-5xl">
              Join Our Global Network
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 md:text-lg">
              Register your airline profile, support contacts and administrator account for review by the FlightHub operations team.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
            <div>
              <p className="text-2xl font-semibold text-slate-950 dark:text-white">{currentStep}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Current step</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-950 dark:text-white">{steps.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total steps</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-950 dark:text-white">{Math.round((currentStep / steps.length) * 100)}%</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Complete</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="space-y-4">
                {steps.map((step, index) => {
                  const stepNumber = index + 1;
                  const isCompletedStep = stepNumber < currentStep;
                  const isCurrent = stepNumber === currentStep;
                  const IconComponent = step.icon;

                  return (
                    <div
                      key={step.id}
                      className={`rounded-md border p-3 transition-colors ${
                        isCurrent
                          ? 'border-blue-300 bg-blue-50 dark:border-blue-400/60 dark:bg-blue-500/15'
                          : isCompletedStep
                          ? 'border-green-300 bg-green-50 dark:border-green-400/40 dark:bg-green-500/10'
                          : 'border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                          isCompletedStep ? 'bg-green-500 text-white' : isCurrent ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {isCompletedStep ? <CheckCircle className="h-5 w-5" /> : <IconComponent className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-950 dark:text-white">{step.title}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{step.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <Shield className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                Secure registration
              </div>
              <div className="mt-3 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <Users className="h-4 w-4 text-green-600 dark:text-green-300" />
                Operations team review
              </div>
              <div className="mt-3 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <FileText className="h-4 w-4 text-orange-600 dark:text-orange-300" />
                Pending approval by default
              </div>
            </div>
          </aside>

          <Card className="overflow-hidden rounded-lg border border-slate-200 bg-white/95 text-slate-950 shadow-2xl shadow-slate-950/10 backdrop-blur dark:border-white/10 dark:bg-slate-950/75 dark:text-white dark:shadow-black/30">
            <div className={`h-2 bg-gradient-to-r ${steps[currentStep - 1]?.color}`}></div>
            <CardHeader className="border-b border-slate-200 px-4 py-4 dark:border-white/10 sm:px-6 sm:py-5">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${steps[currentStep - 1]?.color} sm:h-11 sm:w-11`}>
                  {React.createElement(steps[currentStep - 1]?.icon, { className: "w-6 h-6 text-white" })}
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-lg font-semibold text-slate-950 dark:text-white sm:text-xl">
                    {steps[currentStep - 1]?.title}
                  </CardTitle>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {steps[currentStep - 1]?.description}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 py-5 sm:px-6 sm:py-6">
              {renderCurrentStep()}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
          <div
            className={`h-full bg-gradient-to-r ${steps[currentStep - 1]?.color} transition-all duration-500 ease-out`}
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default AirlineOnboardingWizard;
