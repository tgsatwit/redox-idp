import { ReactNode, useState, useEffect } from 'react';
import { MdLock, MdExpandMore } from 'react-icons/md';
import Card from "@/components/card";

export type WorkflowStep = {
  id: number;
  name: string;
  icon: ReactNode;
  completed?: boolean;
  locked?: boolean;
  selected?: boolean;
  content?: ReactNode;
};

interface WorkflowStepperCardProps {
  steps: WorkflowStep[];
  currentStep: number;
  completedCount: number;
  totalSteps: number;
  title: string;
  onStepClick?: (stepId: number) => void;
  expandedStep?: number;
}

const WorkflowStepperCard = ({
  steps,
  currentStep,
  completedCount,
  totalSteps,
  title,
  onStepClick,
  expandedStep
}: WorkflowStepperCardProps) => {
  const [expandedStepId, setExpandedStepId] = useState<number | null>(expandedStep || null);
  
  // Update expanded step when current step changes from props
  useEffect(() => {
    if (expandedStep) {
      setExpandedStepId(expandedStep);
    }
  }, [expandedStep]);
  
  const handleStepClick = (step: WorkflowStep) => {
    if (onStepClick && !step.locked) {
      onStepClick(step.id);
      
      // Toggle expanded state for the clicked step only if it has content
      if (step.content) {
        // If this is the current step, toggle expansion. Otherwise, just navigate.
        if (step.id === currentStep) {
          setExpandedStepId(expandedStepId === step.id ? null : step.id);
        }
      }
    }
  };

  return (
    <Card extra="w-full overflow-hidden shadow-md h-full">
      <div className="flex flex-col h-full">
        {/* Header with progress - Using gradient background */}
        <div className="bg-gradient-to-r from-brand-400 to-brand-600 p-6 text-white">
          <h3 className="text-xl font-medium mb-2">{title}</h3>
          <p className="text-sm text-white font-medium">{completedCount}/{totalSteps} COMPLETED</p>
          
          {/* Progress bar */}
          <div className="mt-4 grid grid-cols-5 gap-1">
            {[...Array(totalSteps)].map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full ${i < completedCount ? 'bg-green-500' : 'bg-white/30'}`}
              />
            ))}
          </div>
        </div>
        
        {/* Steps list */}
        <div className="flex flex-col bg-white dark:bg-navy-800">
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col">
              <div 
                onClick={() => handleStepClick(step)}
                className={`
                  flex items-center px-6 py-4 cursor-pointer transition-colors
                  ${step.id === currentStep ? 'bg-gray-50 text-amber-500 dark:bg-navy-700 font-medium' : 'hover:bg-gray-50 dark:hover:bg-navy-700'}
                  ${step.locked ? 'opacity-70 cursor-not-allowed' : ''}
                  border-b border-gray-100 dark:border-navy-700 ${(!step.content || expandedStepId !== step.id) && 'last:border-b-0'}
                `}
              >
                <div className="flex items-center w-full justify-between">
                  <div className="flex items-center">
                    {/* Circle with number */}
                    <div 
                      className={`
                        flex h-8 w-8 items-center justify-center rounded-full mr-4 transition-colors
                        ${step.completed 
                          ? 'bg-green-500 text-white' 
                          : step.id === currentStep
                            ? 'bg-amber-500 dark:bg-amber-400 text-white' 
                            : 'bg-gray-200 dark:bg-navy-700 text-gray-700 dark:text-white'}
                      `}
                    >
                      {step.completed ? (
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span className="text-sm font-medium">{step.id}</span>
                      )}
                    </div>
                    
                    {/* Step name */}
                    <div className="flex flex-col">
                      <span className={`font-medium transition-colors ${
                        step.completed 
                          ? 'text-green-500 dark:text-green-400' 
                          : step.id === currentStep
                            ? 'text-amber-500 dark:text-amber-400'
                            : ''
                      }`}>
                        {step.name}
                        {step.completed && " ✓"}
                      </span>
                      {step.id === currentStep && !step.completed && (
                        <span className="text-xs text-amber-500 dark:text-amber-400 mt-0.5">In progress</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Lock icon if step is locked */}
                  {step.locked && (
                    <div className="text-gray-400">
                      <MdLock size={20} />
                    </div>
                  )}
                  
                  {/* Expand icon for steps with content */}
                  {step.content && !step.locked ? (
                    <div className={`transform transition-transform duration-300 ${expandedStepId === step.id ? 'rotate-180' : ''}`}>
                      <MdExpandMore size={24} className="text-gray-400" />
                    </div>
                  ) : !step.locked && (
                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
              
              {/* Collapsible content for the step */}
              {step.content && (
                <div 
                  className={`
                    overflow-hidden transition-all duration-300 ease-in-out border-b border-gray-100 dark:border-navy-700 last:border-b-0
                    ${expandedStepId === step.id ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}
                  `}
                >
                  <div className="px-6 py-4 bg-gray-50 dark:bg-navy-800">
                    {step.content}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default WorkflowStepperCard; 