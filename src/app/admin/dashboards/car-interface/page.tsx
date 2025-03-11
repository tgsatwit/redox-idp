'use client';
import EagleView from '@/components/admin/dashboards/car-interface/EagleView';
import MapCard from '@/components/admin/dashboards/car-interface/MapCard';
import Phone from '@/components/admin/dashboards/car-interface/Phone';
import CarTile from '@/components/admin/dashboards/car-interface/CarTile';
import EnergyTile from '@/components/admin/dashboards/car-interface/EnergyTile';
import { 
  MdBatteryFull, 
  MdAcUnit, 
  MdSpeed, 
  MdThermostat, 
  MdTimelapse,
  MdDirectionsCar,
  MdLock,
  MdWbSunny,
  MdSettings
} from 'react-icons/md';
import { FaChargingStation, FaRoute, FaFan } from 'react-icons/fa';

const CarInterface = () => {
  return (
    <div className="mt-3 grid h-full w-full gap-5">
      {/* Smaller tiles for quick information */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
        <CarTile 
          title="Battery" 
          value="78%" 
          icon={<MdBatteryFull size={18} />} 
          iconColor="text-green-500" 
          bgColor="bg-green-100"
        />
        <CarTile 
          title="Range" 
          value="296 mi" 
          icon={<FaRoute size={18} />} 
          iconColor="text-blue-500" 
          bgColor="bg-blue-100"
        />
        <CarTile 
          title="Speed" 
          value="0 mph" 
          icon={<MdSpeed size={18} />} 
          iconColor="text-amber-500" 
          bgColor="bg-amber-100"
        />
        <CarTile 
          title="Temperature" 
          value="72°F" 
          icon={<MdThermostat size={18} />} 
          iconColor="text-red-500" 
          bgColor="bg-red-100"
        />
        <div className="col-span-2">
          <EnergyTile />
        </div>
      </div>

      {/* Main layout */}
      <div className="3xl:grid-cols-5 grid h-full grid-cols-1 gap-5">
        {/* left side */}
        <div className="3xl:col-span-3 col-span-1 h-full w-full rounded-[20px] lg:grid-cols-11">
          <div className="grid h-full grid-cols-1 gap-5 lg:grid-cols-11">
            <div className="col-span-1 lg:col-span-5">
              <EagleView />
            </div>
            <div className="col-span-1 lg:col-span-6">
              <Phone />
            </div>
          </div>
        </div>

        {/* right side */}
        <div className="3xl:col-span-2 col-span-1">
          <MapCard />
        </div>
      </div>
      
      {/* Additional tiles with advanced features */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
        <CarTile 
          title="Climate" 
          value="Auto" 
          icon={<MdAcUnit size={18} />} 
          iconColor="text-cyan-500" 
          bgColor="bg-cyan-100"
        />
        <CarTile 
          title="Charging" 
          value="50 kW" 
          icon={<FaChargingStation size={18} />} 
          iconColor="text-purple-500" 
          bgColor="bg-purple-100"
        />
        <CarTile 
          title="Trip Time" 
          value="12:45" 
          icon={<MdTimelapse size={18} />} 
          iconColor="text-indigo-500" 
          bgColor="bg-indigo-100"
        />
        <CarTile 
          title="Car Status" 
          value="Parked" 
          icon={<MdDirectionsCar size={18} />} 
          iconColor="text-gray-500" 
          bgColor="bg-gray-100"
        />
        <CarTile 
          title="Security" 
          value="Locked" 
          icon={<MdLock size={18} />} 
          iconColor="text-green-500" 
          bgColor="bg-green-100"
        />
        <CarTile 
          title="Fan Speed" 
          value="Level 2" 
          icon={<FaFan size={18} />} 
          iconColor="text-blue-500" 
          bgColor="bg-blue-100"
        />
      </div>
    </div>
  );
};

export default CarInterface;
