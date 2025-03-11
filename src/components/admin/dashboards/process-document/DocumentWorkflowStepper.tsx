import { useState, useEffect } from 'react';
import { 
  MdCloudUpload, 
  MdSearch, 
  MdAutorenew, 
  MdCheckCircle 
} from 'react-icons/md';
import { ReactNode } from 'react';

export type WorkflowStep = {
  id: number;
  name: string;
  icon: ReactNode;
  highlighted?: boolean;
  selected?: boolean;
  completed?: boolean;
};

interface DocumentWorkflowStepperProps {
  currentStep: number;
  onStepClick?: (stepId: number) => void;
}

const DocumentWorkflowStepper = ({ 
  currentStep = 1, 
  onStepClick 
}: DocumentWorkflowStepperProps) => {
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);

  // Define the workflow steps
  const initialSteps: WorkflowStep[] = [
    {
      id: 1,
      name: 'Upload',
      icon: <MdCloudUpload size={22} />
    },
    {
      id: 2,
      name: 'Analyse',
      icon: <MdSearch size={22} />
    },
    {
      id: 3,
      name: 'Process',
      icon: <MdAutorenew size={22} />
    },
    {
      id: 4,
      name: 'Finalise',
      icon: <MdCheckCircle size={22} />
    }
  ];

  // Update steps based on current step
  const updateSteps = (currentStepId: number, steps: WorkflowStep[]): WorkflowStep[] => {
    return steps.map(step => {
      if (step.id === currentStepId) {
        // Current step
        return { ...step, highlighted: true, selected: true, completed: false };
      } else if (step.id < currentStepId) {
        // Completed steps
        return { ...step, highlighted: false, selected: true, completed: true };
      } else {
        // Future steps
        return { ...step, highlighted: false, selected: false, completed: false };
      }
    });
  };

  // Handle step click
  const handleStepClick = (stepId: number) => {
    if (onStepClick && stepId <= currentStep) {
      onStepClick(stepId);
    }
  };

  // Update workflow steps when current step changes
  useEffect(() => {
    const updatedSteps = updateSteps(currentStep, initialSteps);
    setWorkflowSteps(updatedSteps);
  }, [currentStep]);

  return (
    <div className="mb-8 flex justify-center w-full bg-white dark:bg-navy-900 py-4 rounded-xl shadow-sm">
      <div className="flex items-center justify-center max-w-xl w-full px-4">
        <div className="relative flex items-center w-full justify-between">
          {/* Connector line that runs through all steps */}
          <div className="absolute w-full h-[2px] bg-gray-200 dark:bg-navy-700 z-0"></div>
          
          {/* Steps */}
          {workflowSteps.map((step) => (
            <div 
              key={step.id} 
              className="flex flex-col items-center relative z-10"
              onClick={() => handleStepClick(step.id)}
            >
              <div className={`
                flex h-12 w-12 items-center justify-center rounded-full
                transition-all duration-300 ease-in-out
                ${step.id === currentStep 
                  ? 'bg-indigo-600 text-white ring-4 ring-gray-50 dark:ring-navy-700' 
                  : step.completed 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-gray-200 text-gray-500 dark:bg-navy-700 dark:text-white/70'}
                ${step.id <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}
              `}>
                {step.icon}
              </div>
              <span className={`
                mt-2 text-sm font-medium
                ${step.id === currentStep 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : step.completed 
                    ? 'text-indigo-500 dark:text-indigo-400' 
                    : 'text-gray-500 dark:text-white/70'}
              `}>
                {step.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentWorkflowStepper; 