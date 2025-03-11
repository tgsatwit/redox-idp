'use client';
import Card from '@/components/card';
import { AiFillExclamationCircle } from 'react-icons/ai';
import { BsFillCheckCircleFill } from 'react-icons/bs';
import { IoMdInformation } from 'react-icons/io';
import { MdWarning } from 'react-icons/md';
import PillLabel from '@/components/admin/main/others/pill-labels/PillLabel';
import ClickablePillLabel from '@/components/admin/main/others/pill-labels/ClickablePillLabel';
import { useState } from 'react';

const PillLabelsDemo = () => {
  const [activeStatus, setActiveStatus] = useState<string>('active');

  return (
    <div className="mt-3 grid h-full w-full grid-cols-1 gap-5 rounded-[20px] lg:grid-cols-2">
      {/* Solid Pills */}
      <div className="col-span-2 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card extra={'w-full h-full px-[18px] py-[18px]'}>
          {/* Header */}
          <h4 className="mb-6 text-xl font-bold text-navy-700 dark:text-white">
            Solid Pill Labels
          </h4>
          
          <div className="flex flex-wrap gap-3 mb-6">
            <PillLabel 
              label="Error"
              icon={<AiFillExclamationCircle />}
              iconColor="text-white dark:!text-navy-900"
              bg="bg-red-500 dark:!bg-red-300"
              solid="solid"
            />
            <PillLabel 
              label="Warning"
              icon={<MdWarning />}
              iconColor="text-white dark:!text-navy-900"
              bg="bg-amber-500 dark:!bg-amber-200"
              solid="solid"
            />
            <PillLabel 
              label="Info"
              icon={<IoMdInformation />}
              iconColor="text-white dark:!text-navy-900"
              bg="bg-blue-500 dark:!bg-blue-300"
              solid="solid"
            />
            <PillLabel 
              label="Success"
              icon={<BsFillCheckCircleFill />}
              iconColor="text-white dark:!text-navy-900"
              bg="bg-green-500 dark:!bg-green-300"
              solid="solid"
            />
          </div>

          <h5 className="mb-4 text-lg font-semibold text-navy-700 dark:text-white">
            Without Icons
          </h5>
          <div className="flex flex-wrap gap-3">
            <PillLabel 
              label="Error"
              bg="bg-red-500 dark:!bg-red-300"
              solid="solid"
            />
            <PillLabel 
              label="Warning"
              bg="bg-amber-500 dark:!bg-amber-200"
              solid="solid"
            />
            <PillLabel 
              label="Info"
              bg="bg-blue-500 dark:!bg-blue-300"
              solid="solid"
            />
            <PillLabel 
              label="Success"
              bg="bg-green-500 dark:!bg-green-300"
              solid="solid"
            />
          </div>
        </Card>

        {/* Subtle Pills */}
        <Card extra={'w-full h-full px-[18px] py-[18px]'}>
          {/* Header */}
          <h4 className="mb-6 text-xl font-bold text-navy-700 dark:text-white">
            Subtle Pill Labels
          </h4>
          
          <div className="flex flex-wrap gap-3 mb-6">
            <PillLabel 
              label="Error"
              icon={<AiFillExclamationCircle />}
              iconColor="text-red-500"
              bg="bg-[#FDE0D0] dark:!bg-navy-700"
            />
            <PillLabel 
              label="Warning"
              icon={<MdWarning />}
              iconColor="text-amber-500"
              bg="bg-[#FFF6DA] dark:!bg-navy-700"
            />
            <PillLabel 
              label="Info"
              icon={<IoMdInformation />}
              iconColor="text-brand-600"
              bg="bg-[#E9E3FF] dark:!bg-navy-700"
            />
            <PillLabel 
              label="Success"
              icon={<BsFillCheckCircleFill />}
              iconColor="text-green-500"
              bg="bg-[#C9FBD5] dark:!bg-navy-700"
            />
          </div>

          <h5 className="mb-4 text-lg font-semibold text-navy-700 dark:text-white">
            Without Icons
          </h5>
          <div className="flex flex-wrap gap-3">
            <PillLabel 
              label="Error"
              bg="bg-[#FDE0D0] dark:!bg-navy-700"
            />
            <PillLabel 
              label="Warning"
              bg="bg-[#FFF6DA] dark:!bg-navy-700"
            />
            <PillLabel 
              label="Info"
              bg="bg-[#E9E3FF] dark:!bg-navy-700"
            />
            <PillLabel 
              label="Success"
              bg="bg-[#C9FBD5] dark:!bg-navy-700"
            />
          </div>
        </Card>
      </div>

      {/* Clickable Pills */}
      <div className="col-span-2 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card extra={'w-full h-full px-[18px] py-[18px]'}>
          {/* Header */}
          <h4 className="mb-6 text-xl font-bold text-navy-700 dark:text-white">
            Clickable Solid Pill Labels
          </h4>
          
          <div className="flex flex-wrap gap-3 mb-6">
            <ClickablePillLabel 
              label="Error"
              icon={<AiFillExclamationCircle />}
              iconColor="text-white dark:!text-navy-900"
              bg="bg-red-500 dark:!bg-red-300"
              solid="solid"
              onClick={() => console.log('Error clicked')}
            />
            <ClickablePillLabel 
              label="Warning"
              icon={<MdWarning />}
              iconColor="text-white dark:!text-navy-900"
              bg="bg-amber-500 dark:!bg-amber-200"
              solid="solid"
              onClick={() => console.log('Warning clicked')}
            />
            <ClickablePillLabel 
              label="Info"
              icon={<IoMdInformation />}
              iconColor="text-white dark:!text-navy-900"
              bg="bg-blue-500 dark:!bg-blue-300"
              solid="solid"
              onClick={() => console.log('Info clicked')}
            />
            <ClickablePillLabel 
              label="Success"
              icon={<BsFillCheckCircleFill />}
              iconColor="text-white dark:!text-navy-900"
              bg="bg-green-500 dark:!bg-green-300"
              solid="solid"
              onClick={() => console.log('Success clicked')}
            />
          </div>
        </Card>

        {/* Clickable Subtle Pills */}
        <Card extra={'w-full h-full px-[18px] py-[18px]'}>
          {/* Header */}
          <h4 className="mb-6 text-xl font-bold text-navy-700 dark:text-white">
            Clickable Subtle Pill Labels
          </h4>
          
          <div className="flex flex-wrap gap-3 mb-6">
            <ClickablePillLabel 
              label="Error"
              icon={<AiFillExclamationCircle />}
              iconColor="text-red-500"
              bg="bg-[#FDE0D0] dark:!bg-navy-700"
              onClick={() => console.log('Error clicked')}
            />
            <ClickablePillLabel 
              label="Warning"
              icon={<MdWarning />}
              iconColor="text-amber-500"
              bg="bg-[#FFF6DA] dark:!bg-navy-700"
              onClick={() => console.log('Warning clicked')}
            />
            <ClickablePillLabel 
              label="Info"
              icon={<IoMdInformation />}
              iconColor="text-brand-600"
              bg="bg-[#E9E3FF] dark:!bg-navy-700"
              onClick={() => console.log('Info clicked')}
            />
            <ClickablePillLabel 
              label="Success"
              icon={<BsFillCheckCircleFill />}
              iconColor="text-green-500"
              bg="bg-[#C9FBD5] dark:!bg-navy-700"
              onClick={() => console.log('Success clicked')}
            />
          </div>
        </Card>
      </div>

      {/* Status Filter Example */}
      <Card extra={'col-span-2 w-full h-full px-[18px] py-[18px]'}>
        {/* Header */}
        <h4 className="mb-6 text-xl font-bold text-navy-700 dark:text-white">
          Status Filter Example
        </h4>
        
        <div className="flex flex-wrap gap-3 mb-6">
          <ClickablePillLabel 
            label="Active"
            icon={<BsFillCheckCircleFill />}
            iconColor="text-green-500"
            bg="bg-[#C9FBD5] dark:!bg-navy-700"
            isActive={activeStatus === 'active'}
            activeBg="bg-green-500"
            onClick={() => setActiveStatus('active')}
          />
          <ClickablePillLabel 
            label="Pending"
            icon={<MdWarning />}
            iconColor="text-amber-500"
            bg="bg-[#FFF6DA] dark:!bg-navy-700"
            isActive={activeStatus === 'pending'}
            activeBg="bg-amber-500"
            onClick={() => setActiveStatus('pending')}
          />
          <ClickablePillLabel 
            label="Inactive"
            icon={<AiFillExclamationCircle />}
            iconColor="text-red-500"
            bg="bg-[#FDE0D0] dark:!bg-navy-700"
            isActive={activeStatus === 'inactive'}
            activeBg="bg-red-500"
            onClick={() => setActiveStatus('inactive')}
          />
        </div>
        
        <div className="p-4 bg-gray-50 dark:bg-navy-800 rounded-lg">
          <p className="text-navy-700 dark:text-white">
            Selected status: <span className="font-semibold">{activeStatus.charAt(0).toUpperCase() + activeStatus.slice(1)}</span>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default PillLabelsDemo; 