import axios from 'axios';

interface MetNoInstantDetails {
  air_pressure_at_sea_level: number;
  air_temperature: number;
  cloud_area_fraction: number;
  relative_humidity: number;
  wind_from_direction: number;
  wind_speed: number;
}

interface MetNoForecastDetails {
  precipitation_amount: number;
}

interface MetNoDataEntry {
  instant: {
    details: MetNoInstantDetails;
  };
  next_1_hours?: {
    summary: { symbol_code: string; };
    details: MetNoForecastDetails;
  };
}

interface MetNoTimeseries {
  time: string;
  data: MetNoDataEntry;
}

interface MetNoAPIResponse {
  properties: {
    timeseries: MetNoTimeseries[];
  };
}

export interface WeatherData {
  lat: number;
  lon: number;
  current: {
    dt: number;
    temp: number;
    humidity: number;
    pressure: number;
    wind_speed: number;
    wind_deg: number;
    clouds: number;
    description: string;
    icon: string;
  };

  hourly: {
    dt: number;
    temp: number;
    description: string;
    icon: string;
    precipitation_amount?: number;
  }[];

  daily: {
    dt: number;
    temp: {
      min: number;
      max: number;
      day?: number;
      night?: number;
    };
    description: string;
    icon: string;
    precipitation_amount?: number;
  }[];
}

const metNoSymbolMap: { [key: string]: { description: string; icon: string } } = {
  'clearsky_day': { description: 'Clear sky', icon: '01d' },
  'clearsky_night': { description: 'Clear sky', icon: '01n' },
  'fair_day': { description: 'Fair', icon: '02d' },
  'fair_night': { description: 'Fair', icon: '02n' },
  'partlycloudy_day': { description: 'Partly cloudy', icon: '03d' },
  'partlycloudy_night': { description: 'Partly cloudy', icon: '03n' },
  'cloudy': { description: 'Cloudy', icon: '04d' },
  'lightrainshowers_day': { description: 'Light rain showers', icon: '09d' },
  'lightrainshowers_night': { description: 'Light rain showers', icon: '09n' },
  'rainshowers_day': { description: 'Rain showers', icon: '09d' },
  'rainshowers_night': { description: 'Rain showers', icon: '09n' },
  'heavyrainshowers_day': { description: 'Heavy rain showers', icon: '09d' },
  'heavyrainshowers_night': { description: 'Heavy rain showers', icon: '09n' },
  'lightrain': { description: 'Light rain', icon: '10d' },
  'rain': { description: 'Rain', icon: '10d' },
  'heavyrain': { description: 'Heavy rain', icon: '10d' },
  'lightrainandthunder': { description: 'Light rain with thunder', icon: '11d' },
  'rainandthunder': { description: 'Rain with thunder', icon: '11d' },
  'heavyrainandthunder': { description: 'Heavy rain with thunder', icon: '11d' },
  'lightsnowshowers_day': { description: 'Light snow showers', icon: '13d' },
  'lightsnowshowers_night': { description: 'Light snow showers', icon: '13n' },
  'snowshowers_day': { description: 'Snow showers', icon: '13d' },
  'snowshowers_night': { description: 'Snow showers', icon: '13n' },
  'heavysnowshowers_day': { description: 'Heavy snow showers', icon: '13d' },
  'heavysnowshowers_night': { description: 'Heavy snow showers', icon: '13n' },
  'lightsnow': { description: 'Light snow', icon: '13d' },
  'snow': { description: 'Snow', icon: '13d' },
  'heavysnow': { description: 'Heavy snow', icon: '13d' },
  'fog': { description: 'Fog', icon: '50d' },
};

function getMetNoWeatherInfo(symbolCode: string | undefined): { description: string; icon: string } {
  if (!symbolCode) {
    return { description: 'N/A', icon: '04d' };
  }
  return metNoSymbolMap[symbolCode] || { description: symbolCode.replace(/_/g, ' '), icon: '04d' };
}

function aggregateDailyForecasts(timeseries: MetNoTimeseries[]): WeatherData['daily'] {
  const dailyAggregates: {
    [dateKey: string]: {
      temps: number[];
      precipitationAmounts: number[];
      symbolCodes: string[];
      dt: number;
      dayTemps: number[];
      nightTemps: number[];
    };
  } = {};

  timeseries.forEach(entry => {
    const date = new Date(entry.time);
    const dateKey = date.toISOString().split('T')[0];

    if (!dailyAggregates[dateKey]) {
      dailyAggregates[dateKey] = {
        temps: [],
        precipitationAmounts: [],
        symbolCodes: [],
        dt: new Date(dateKey).getTime() / 1000,
        dayTemps: [],
        nightTemps: [],
      };
    }

    const instantDetails = entry.data.instant.details;
    dailyAggregates[dateKey].temps.push(instantDetails.air_temperature);

    dailyAggregates[dateKey].precipitationAmounts.push(
      entry.data.next_1_hours?.details?.precipitation_amount || 0
    );

    const symbol = entry.data.next_1_hours?.summary.symbol_code;
    if (symbol) {
      dailyAggregates[dateKey].symbolCodes.push(symbol);
    }
    const hour = date.getUTCHours();
    if (hour >= 6 && hour < 18) { // Assuming 6 AM to 6 PM UTC is "day"
      dailyAggregates[dateKey].dayTemps.push(instantDetails.air_temperature);
    } else {
      dailyAggregates[dateKey].nightTemps.push(instantDetails.air_temperature);
    }
  });

  const dailyForecasts: WeatherData['daily'] = [];
  const sortedDateKeys = Object.keys(dailyAggregates).sort();
  for (let i = 0; i < sortedDateKeys.length; i++) {
    const dateKey = sortedDateKeys[i];
    const data = dailyAggregates[dateKey];
    if (data.temps.length === 0) continue;
    const minTemp = Math.min(...data.temps);
    const maxTemp = Math.max(...data.temps);
    const totalPrecipitation = data.precipitationAmounts.reduce((sum, p) => sum + p, 0);
    let dailySymbolCode: string = 'clearsky_day';
    if (data.symbolCodes.length > 0) {
      const symbolCounts: { [s: string]: number } = {};
      data.symbolCodes.forEach(s => { symbolCounts[s] = (symbolCounts[s] || 0) + 1; });
      dailySymbolCode = Object.keys(symbolCounts).reduce((a, b) => symbolCounts[a] > symbolCounts[b] ? a : b);
    }
    const dailyInfo = getMetNoWeatherInfo(dailySymbolCode);
    const dayTemp = data.dayTemps.length > 0 ? data.dayTemps.reduce((a, b) => a + b, 0) / data.dayTemps.length : undefined;
    const nightTemp = data.nightTemps.length > 0 ? data.nightTemps.reduce((a, b) => a + b, 0) / data.nightTemps.length : undefined;
    dailyForecasts.push({
      dt: data.dt,
      temp: {
        min: minTemp,
        max: maxTemp,
        day: dayTemp,
        night: nightTemp,
      },
      description: dailyInfo.description,
      icon: dailyInfo.icon,
      precipitation_amount: totalPrecipitation,
    });
  }
  return dailyForecasts;
}
export async function getWeatherByCity(city: string): Promise<WeatherData> {

  const geoUrl = `https://nominatim.openstreetmap.org/search?q=${city.replace(" ", '_')}&format=json&limit=1`
  const geoRes = await axios.get(geoUrl);

  if (geoRes.data.length === 0) {
    throw new Error(`City "${city}" not found.`);
  }
  const { lat, lon } = geoRes.data[0];

  const weatherUrl = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`;
  try {
    const weatherRes = await axios.get<MetNoAPIResponse>(weatherUrl);

    if (weatherRes.status !== 200 || !weatherRes.data?.properties?.timeseries?.length) {
      throw new Error('Invalid or empty weather data response from met.no');
    }

    const timeseries = weatherRes.data.properties.timeseries;
    const currentRaw = timeseries[0];
    const currentDetails = currentRaw.data.instant.details;
    const currentSummaryCode =
      currentRaw.data.next_1_hours?.summary.symbol_code;
    const currentInfo = getMetNoWeatherInfo(currentSummaryCode);

    const currentWeatherData: WeatherData['current'] = {
      dt: new Date(currentRaw.time).getTime() / 1000,
      temp: currentDetails.air_temperature,
      humidity: currentDetails.relative_humidity,
      pressure: currentDetails.air_pressure_at_sea_level,
      wind_speed: currentDetails.wind_speed,
      wind_deg: currentDetails.wind_from_direction,
      clouds: currentDetails.cloud_area_fraction,
      description: currentInfo.description,
      icon: currentInfo.icon,
    };

    const hourlyWeatherData: WeatherData['hourly'] = timeseries.slice(0, 24).map(entry => {
      const details = entry.data.instant.details;
      const summaryCode = entry.data.next_1_hours?.summary.symbol_code;
      const info = getMetNoWeatherInfo(summaryCode);
      return {
        dt: new Date(entry.time).getTime() / 1000,
        temp: details.air_temperature,
        description: info.description,
        icon: info.icon,
        precipitation_amount: entry.data.next_1_hours?.details?.precipitation_amount || 0,
      };
    });

    const dailyForecasts = aggregateDailyForecasts(timeseries);

    return {
      lat: lat,
      lon: lon,
      current: currentWeatherData,
      hourly: hourlyWeatherData,
      daily: dailyForecasts,
    };

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error fetching weather:', error.response?.status, error.response?.data);
    } else {
      console.error('Unknown error fetching weather:', error);
    }
    throw new Error(`Failed to fetch weather data for ${city}. Please try again later.`);
  }
}