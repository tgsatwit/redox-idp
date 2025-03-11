// Chakra Imports
// Custom Icons
import React from 'react';

import { RiMoonFill, RiSunFill } from 'react-icons/ri';
export default function FixedPlugin(props: { [x: string]: any }) {
  const { ...rest } = props;
  const [darkmode, setDarkmode] = React.useState(
    document.body.classList.contains('dark')
  );

  return (
    <button
      className="border-px fixed bottom-[30px] right-[35px] !z-[99] flex h-[60px] w-[60px] items-center justify-center rounded-full border-[#6a53ff] bg-gradient-to-br from-brand-400 to-brand-600 p-0"
      onClick={() => {
        if (darkmode) {
          document.body.classList.remove('dark');
          setDarkmode(false);
        } else {
          document.body.classList.add('dark');
          setDarkmode(true);
        }
      }}
      {...rest}
    >
      <div className="cursor-pointer text-gray-600">
        {darkmode ? (
          <RiSunFill size="1rem" color="white" />
        ) : (
          <RiMoonFill size="1rem" color="white" />
        )}
      </div>
    </button>
  );
}
