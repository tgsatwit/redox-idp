/* eslint-disable */

import React from 'react';
import { HiX } from 'react-icons/hi';
import SidebarLinks from './components/Links';

import {
  renderThumb,
  renderTrack,
  renderView,
  renderViewMini,
} from '@/components/scrollbar/Scrollbar';
import { Scrollbars } from 'react-custom-scrollbars-2';
import Card from '@/components/card';
import { IRoute } from '@/types/navigation';
import { useContext } from 'react';
import { ConfiguratorContext } from '@/contexts/ConfiguratorContext';
import { RedoxLogo } from '@/components/icons/RedoxLogo';

// Utility function to get initials from a name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

function SidebarHorizon(props: { routes: IRoute[]; [x: string]: any }) {
  const { routes, open, setOpen, variant, setHovered, hovered } = props;
  const context = useContext(ConfiguratorContext);
  const { mini, theme } = context;
  return (
    <div
      className={`sm:none ${
        mini === false
          ? 'w-[285px]'
          : mini === true && hovered === true
          ? 'w-[285px]'
          : 'w-[285px] xl:!w-[120px]'
      } duration-175 linear fixed !z-50 min-h-full transition-all md:!z-50 lg:!z-50 xl:!z-0 ${
        variant === 'auth' ? 'xl:hidden' : 'xl:block'
      } ${open ? '' : '-translate-x-[110%] xl:translate-x-[unset]'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Card
        extra={`ml-3 w-full h-[96.5vh] sm:mr-4 sm:my-4 m-7 !rounded-[20px]`}
      >
        <Scrollbars
          autoHide
          renderTrackVertical={renderTrack}
          renderThumbVertical={renderThumb}
          renderView={
            mini === false
              ? renderView
              : mini === true && hovered === true
              ? renderView
              : renderViewMini
          }
        >
          <div className="flex h-full flex-col justify-between">
            <div>
              <span
                className="absolute right-4 top-4 block cursor-pointer xl:hidden"
                onClick={() => setOpen(false)}
              >
                <HiX />
              </span>

              <div className={`mt-[44px] flex items-center justify-center`}>
                <RedoxLogo />
              </div>
              <div className="mb-7 mt-[20px] h-px bg-gray-200 dark:bg-white/10" />
              {/* Nav item */}
              <ul>
                {React.createElement(React.Fragment, {}, 
                  SidebarLinks({ mini, hovered, routes })
                )}
              </ul>
            </div>
            <div className="mb-[30px] mt-[28px]">
              {/* Sidebar profile info */}
              <div className="mt-5 flex items-center justify-center gap-3 pr-8">
                <div 
                  className="flex h-12 w-12 items-center justify-center rounded-full text-white font-bold text-lg"
                  style={{ backgroundColor: theme?.['--color-500'] || '#422AFB' }}
                >
                  {getInitials('Tim Gillam')}
                </div>
                <div
                  className={`ml-1 ${
                    mini === false
                      ? 'block'
                      : mini === true && hovered === true
                      ? 'block'
                      : 'block xl:hidden'
                  }`}
                >
                  <h4 className="text-base font-bold text-navy-700 dark:text-white">
                    Tim Gillam
                  </h4>
                  <p className="text-sm font-medium text-gray-600">
                    Product Designer
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Scrollbars>
      </Card>
    </div>
  );
}

export default SidebarHorizon;
