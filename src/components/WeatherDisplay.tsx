'use client';

import { WeatherData } from '../lib/getWeather';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function WeatherDisplay({ data, city }: { data: WeatherData; city: string }) {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!data || !data.current) {
    return (
      <div className="mt-8 p-6 bg-white rounded-xl shadow-lg text-center text-gray-600">
        <p>No weather data to display for {city}. Please try again.</p>
      </div>
    );
  }


  const getWeatherGradient = (icon: string) => {
    switch(icon){
      case '01d':
        return 'from-blue-200 to-blue-300';
      case '02d':
      case '03d':
        return 'from-sky-200 to-indigo-200';
      case '04d':
        return 'from-gray-300 to-gray-400';
      case '09d':
      case '10d':
        return 'from-blue-300 to-blue-400';
      case '11d':
        return 'from-yellow-300 to-orange-400';
      case '13d':
        return 'from-white to-blue-100';
      case '50d':
        return 'from-gray-200 to-gray-300';
      case '01n':
        return 'from-indigo-600 to-blue-800 text-white';
      case '02n':
      case '03n':
        return 'from-indigo-500 to-blue-700 text-white';
      case '04n':
        return 'from-gray-600 to-gray-700 text-white';
      case '09n':
      case '10n':
        return 'from-blue-600 to-blue-700 text-white';
      default:
        return 'from-blue-100 to-blue-200';
     };
    
  };

  const gradientClass = getWeatherGradient(data.current.icon);
  const textColorClass = gradientClass.includes('text-white') ? 'text-white' : 'text-gray-800';

  return (
    <div className={`p-6 rounded-3xl shadow-2xl transition-all duration-500 ease-in-out bg-gradient-to-br ${gradientClass} ${textColorClass}`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-4xl sm:text-5xl font-extrabold leading-tight">{city}</h2>
          {isClient && (
            <p className="text-lg opacity-90 mt-1">
              {formatDate(data.current.dt)}, {formatTime(data.current.dt)}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Image
            src={`https://openweathermap.org/img/wn/${data.current.icon}@4x.png`}
            alt={data.current.description}
            width={120}
            height={120}
            className="drop-shadow-lg"
          />
          <div>
            <p className="text-5xl sm:text-5xl font-bold">
              {data.current.temp.toFixed(0)}°C
            </p>
            <p className="text-xl sm:text-2xl opacity-90 capitalize font-bold">
              {data.current.description}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-6 sm:mt-0 sm:ml-auto text-lg">
          <div className="flex items-center gap-2">
            <span>Humidity:</span>
            <span className="font-semibold">{data.current.humidity}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Wind:</span>
            <span className="font-semibold">{data.current.wind_speed.toFixed(1)} m/s</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Pressure:</span>
            <span className="font-semibold">{data.current.pressure.toFixed(0)} hPa</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Clouds:</span>
            <span className="font-semibold">{data.current.clouds.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {data.hourly && data.hourly.length > 0 && (
        <div className="mt-10 pt-4 border-t border-gray-300/50">
          <h3 className="text-2xl font-bold mb-4">Hourly Forecast (24 hr)</h3>
          <div className="flex overflow-x-auto gap-4 py-3 px-2 custom-scrollbar -mx-2">
            {data.hourly.slice(0, 24).map((hour) => (
              <div
                key={hour.dt}
                className="flex-shrink-0 w-32 text-center bg-white/40 backdrop-blur-sm rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <p className="font-semibold text-lg">{isClient && formatTime(hour.dt)}</p>
                <Image
                  src={`https://openweathermap.org/img/wn/${hour.icon}@2x.png`}
                  alt={hour.description}
                  width={60}
                  height={60}
                  className="mx-auto"
                />
                <p className="text-xl font-bold">{hour.temp.toFixed(0)}°C</p>
                <p className="text-sm opacity-90 capitalize">{hour.description}</p>
                {hour.precipitation_amount !== undefined && hour.precipitation_amount > 0.1 && (
                  <p className="text-xs text-blue-700 font-medium mt-1">
                    <p>Precipitation:</p>
                    {hour.precipitation_amount.toFixed(1)} mm
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.daily && data.daily.length > 0 && (
        <div className="mt-10 pt-4 border-t border-gray-300/50">
          <h3 className="text-2xl font-bold mb-4">Daily Forecast</h3>
          <div className="space-y-3">
            {data.daily.slice().map((day) => (
              <div
                key={day.dt}
                className="flex items-center justify-between bg-white/40 backdrop-blur-sm rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.01]"
              >
                <p className="w-28 text-lg font-semibold">{isClient && formatDate(day.dt)}</p>
                <Image
                  src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                  alt={day.description}
                  width={60}
                  height={60}
                  className="mx-4 flex-shrink-0"
                />
                <div className="flex-grow text-center">
                  <p className="text-md capitalize opacity-90">{day.description}</p>
                  {day.precipitation_amount !== undefined && day.precipitation_amount > 0.1 && (
                    <p className="text-sm text-blue-700 font-medium mt-1">
                      Precipitation: {day.precipitation_amount.toFixed(1)} mm
                    </p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <p className="text-xl font-bold">
                    {day.temp.max.toFixed(0)}° / {day.temp.min.toFixed(0)}°C
                  </p>
                  <p className="text-sm opacity-80">
                    Day: {day.temp.day?.toFixed(0)}°C
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}