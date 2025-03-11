'use client';
import Card from 'src/components/card';
import { AiFillExclamationCircle } from 'react-icons/ai';
import { BsFillCheckCircleFill } from 'react-icons/bs';
import { IoMdInformation } from 'react-icons/io';
import { MdWarning } from 'react-icons/md';
import SolidSubtleAlert from 'src/components/admin/main/others/notifications/SolidSubtleAlert';
import SolidSubtleMultiAlert from 'src/components/admin/main/others/notifications/SolidSubtleMultiAlert';
import { PillLabel, ClickablePillLabel } from 'src/components/admin/main/others/pill-labels';
import { useState } from 'react';

const Notification = () => {
  const [activeStatus, setActiveStatus] = useState<string>('active');
  
  return (
    <div className="mt-3 grid h-full w-full grid-cols-1 gap-5 rounded-[20px] lg:grid-cols-2">
      {/* Solid alert */}
      <div className="col-span-2 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card extra={'w-full h-full px-[18px] py-[18px]'}>
          {/* Header */}
          <h4 className="mb-6 text-xl font-bold text-navy-700 dark:text-white">
            Solid Alert - Left
          </h4>
          {/* Alerts */}

          <SolidSubtleAlert
            title="Title here"
            description="Description here."
            icon={<AiFillExclamationCircle />}
            iconColor="text-white dark:!text-navy-900"
            closeBg="hover:bg-white/20 text-white dark:!text-navy-900"
            bg="bg-red-500 dark:!bg-red-300"
            mb="mb-14"
            solid="solid"
          />
          <SolidSubtleAlert
            title="Title here"
            description="Description here."
            icon={<AiFillExclamationCircle />}
            iconColor="text-white dark:!text-navy-900"
            bg="bg-amber-500 dark:!bg-amber-200"
            mb="mb-14"
            closeBg="hover:bg-white/20 text-white dark:!text-navy-900"
            solid="solid"
          />
          <SolidSubtleAlert
            title="Title here"
            description="Description here."
            icon={<AiFillExclamationCircle />}
            iconColor="text-white dark:!text-navy-900"
            bg="bg-blue-500 dark:!bg-blue-300"
            mb="mb-14"
            closeBg="hover:bg-white/20 text-white dark:!text-navy-900"
            solid="solid"
          />

          <SolidSubtleAlert
            title="Title here"
            description="Description here."
            icon={<BsFillCheckCircleFill />}
            iconColor="text-white dark:!text-navy-900"
            bg="bg-green-500 dark:!bg-green-300"
            mb="mb-6"
            closeBg="hover:bg-white/20 text-white dark:!text-navy-900"
            solid="solid"
          />
        </Card>
        {/* solid alert center */}
        <Card extra={'w-full h-full px-[18px] py-[18px]'}>
          {/* Header */}
          <h4 className="mb-6 text-xl font-bold text-navy-700 dark:text-white">
            Solid Alert - Center
          </h4>
          <SolidSubtleAlert
            title="Title here"
            description="Description here."
            justify="justify-center"
            icon={<AiFillExclamationCircle />}
            iconColor="text-white dark:!text-navy-900"
            closeBg="hover:bg-white/20 text-white dark:!text-navy-900"
            bg="bg-red-500 dark:!bg-red-300"
            mb="mb-14"
            solid="solid"
          />
          <SolidSubtleAlert
            title="Title here"
            description="Description here."
            justify="justify-center"
            icon={<AiFillExclamationCircle />}
            iconColor="text-white dark:!text-navy-900"
            bg="bg-amber-500 dark:!bg-amber-200"
            mb="mb-14"
            closeBg="hover:bg-white/20 text-white dark:!text-navy-900"
            solid="solid"
          />
          <SolidSubtleAlert
            title="Title here"
            description="Description here."
            justify="justify-center"
            icon={<AiFillExclamationCircle />}
            iconColor="text-white dark:!text-navy-900"
            bg="bg-blue-500 dark:!bg-blue-300"
            mb="mb-14"
            closeBg="hover:bg-white/20 text-white dark:!text-navy-900"
            solid="solid"
          />

          <SolidSubtleAlert
            title="Title here"
            description="Description here."
            justify="justify-center"
            icon={<BsFillCheckCircleFill />}
            iconColor="text-white dark:!text-navy-900"
            bg="bg-green-500 dark:!bg-green-300"
            mb="mb-6"
            closeBg="hover:bg-white/20 text-white dark:!text-navy-900"
            solid="solid"
          />
        </Card>
      </div>

      {/* subtle alert left*/}
      <div className="col-span-2 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card extra={'w-full h-full px-[18px] py-[18px]'}>
          {/* Header */}
          <h4 className="mb-6 text-xl font-bold text-navy-700 dark:text-white">
            Subtle Alert - Left
          </h4>
          {/* Alerts */}

          <SolidSubtleAlert
            title="Title here"
            description="Description here."
            icon={<AiFillExclamationCircle />}
            iconColor="text-red-500"
            closeBg="hover:bg-white/20 text-navy-700 dark:text-white"
            bg="bg-[#FDE0D0] dark:!bg-navy-700"
            mb="mb-14"
          />
          <SolidSubtleAlert
            title="Title here"
            description="Description here."
            icon={<AiFillExclamationCircle />}
            iconColor="text-amber-500"
            bg="bg-[#FFF6DA] dark:!bg-navy-700"
            mb="mb-14"
            closeBg="hover:bg-white/20 text-navy-700 dark:text-white"
          />
          <SolidSubtleAlert
            title="Title here"
            description="Description here."
            icon={<AiFillExclamationCircle />}
            iconColor="text-brand-600"
            bg="bg-[#E9E3FF] dark:!bg-navy-700"
            mb="mb-14"
            closeBg="hover:bg-white/20 text-navy-700 dark:text-white"
          />

          <SolidSubtleAlert
            title="Title here"
            description="Description here."
            icon={<BsFillCheckCircleFill />}
            iconColor="text-green-500"
            bg="bg-[#C9FBD5] dark:!bg-navy-700 "
            mb="mb-6"
            closeBg="hover:bg-white/20 text-navy-700 dark:text-white"
          />
        </Card>
        {/* subtle alert center */}
        <Card extra={'w-full h-full px-[18px] py-[18px]'}>
          {/* Header */}
          <h4 className="mb-6 text-xl font-bold text-navy-700 dark:text-white">
            Subtle Alert - Center
          </h4>
          <SolidSubtleAlert
            title="Title here"
            description="Description here."
            justify="justify-center"
            icon={<AiFillExclamationCircle />}
            iconColor="text-red-500"
            closeBg="hover:bg-white/20 text-navy-700 dark:text-white"
            bg="bg-[#FDE0D0] dark:!bg-navy-700"
            mb="mb-14"
          />
          <SolidSubtleAlert
            title="Title here"
            description="Description here."
            justify="justify-center"
            icon={<AiFillExclamationCircle />}
            iconColor="text-amber-500"
            bg="bg-[#FFF6DA] dark:!bg-navy-700"
            mb="mb-14"
            closeBg="hover:bg-white/20 text-navy-700 dark:text-white"
          />
          <SolidSubtleAlert
            title="Title here"
            description="Description here."
            justify="justify-center"
            icon={<AiFillExclamationCircle />}
            iconColor="text-brand-600"
            bg="bg-brand-50 dark:!bg-navy-700"
            mb="mb-14"
            closeBg="hover:bg-white/20 text-navy-700 dark:text-white"
          />

          <SolidSubtleAlert
            title="Title here"
            description="Description here."
            justify="justify-center"
            icon={<BsFillCheckCircleFill />}
            iconColor="text-green-500"
            bg="bg-[#C9FBD5] dark:!bg-navy-700"
            mb="mb-6"
            closeBg="hover:bg-white/20 text-navy-700 dark:text-white"
          />
        </Card>
      </div>

      {/* multi Alert section */}
      <div className="col-span-2 grid w-full grid-cols-1 gap-5 px-[4px] lg:grid-cols-2 2xl:px-40">
        {/* Solid Multi Alert */}
        <Card extra={'w-full h-full px-[18px] py-[18px]'}>
          {/* Header */}
          <h4 className="mb-6 text-xl font-bold text-navy-700 dark:text-white">
            Solid MultiAlert
          </h4>
          <SolidSubtleMultiAlert
            title="Title here"
            description="Description here."
            icon={<AiFillExclamationCircle />}
            iconColor="text-white dark:!text-navy-900"
            closeBg="hover:bg-white/20 text-white dark:!text-navy-900"
            bg="bg-red-500 dark:!bg-red-300"
            mb="mb-14"
            solid="solid"
          />
          <SolidSubtleMultiAlert
            title="Title here"
            description="Description here."
            icon={<AiFillExclamationCircle />}
            iconColor="text-white dark:!text-navy-900"
            bg="bg-amber-500 dark:!bg-amber-200"
            mb="mb-14"
            closeBg="hover:bg-white/20 text-white dark:!text-navy-900"
            solid="solid"
          />
          <SolidSubtleMultiAlert
            title="Title here"
            description="Description here."
            icon={<AiFillExclamationCircle />}
            iconColor="text-white dark:!text-navy-900"
            bg="bg-blue-500 dark:!bg-blue-300"
            mb="mb-14"
            closeBg="hover:bg-white/20 text-white dark:!text-navy-900"
            solid="solid"
          />

          <SolidSubtleMultiAlert
            title="Title here"
            description="Description here."
            icon={<BsFillCheckCircleFill />}
            iconColor="text-white dark:!text-navy-900"
            bg="bg-green-500 dark:!bg-green-300"
            mb="mb-6"
            closeBg="hover:bg-white/20 text-white dark:!text-navy-900"
            solid="solid"
          />
        </Card>

        {/* Subtle Multi Alert */}
        <Card extra={'w-full h-full px-[18px] py-[18px]'}>
          {/* Header */}
          <h4 className="mb-6 text-xl font-bold text-navy-700 dark:text-white">
            Subtle MultiAlert
          </h4>
          <SolidSubtleMultiAlert
            title="Title here"
            description="Description here."
            icon={<AiFillExclamationCircle />}
            iconColor="text-red-500"
            closeBg="hover:bg-white/20 text-navy-900 dark:text-white"
            bg="bg-[#FDE0D0] dark:!bg-navy-700"
            mb="mb-14"
          />
          <SolidSubtleMultiAlert
            title="Title here"
            description="Description here."
            icon={<AiFillExclamationCircle />}
            iconColor="text-amber-500"
            bg="bg-[#FFF6DA] dark:!bg-navy-700"
            mb="mb-14"
            closeBg="hover:bg-white/20 text-navy-900 dark:text-white"
          />
          <SolidSubtleMultiAlert
            title="Title here"
            description="Description here."
            icon={<AiFillExclamationCircle />}
            iconColor="text-brand-600"
            bg="bg-[#E9E3FF] dark:!bg-navy-700"
            mb="mb-14"
            closeBg="hover:bg-white/20 text-navy-900 dark:text-white"
          />

          <SolidSubtleMultiAlert
            title="Title here"
            description="Description here."
            icon={<BsFillCheckCircleFill />}
            iconColor="text-green-500"
            bg="bg-[#C9FBD5] dark:!bg-navy-700"
            mb="mb-6"
            closeBg="hover:bg-white/20 text-navy-900 dark:text-white"
          />
        </Card>
      </div>

      {/* Pill Labels section */}
      <div className="col-span-2 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Solid Pills */}
        <Card extra={'w-full h-full px-[18px] py-[18px]'}>
          {/* Header */}
          <h4 className="mb-6 text-xl font-bold text-navy-700 dark:text-white">
            Pill Labels - Solid
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
            Clickable Pills
          </h5>
          <div className="flex flex-wrap gap-3">
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

        {/* Subtle Pills */}
        <Card extra={'w-full h-full px-[18px] py-[18px]'}>
          {/* Header */}
          <h4 className="mb-6 text-xl font-bold text-navy-700 dark:text-white">
            Pill Labels - Subtle
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
            Clickable Pills
          </h5>
          <div className="flex flex-wrap gap-3">
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
          Status Filter with Pills
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

export default Notification;
