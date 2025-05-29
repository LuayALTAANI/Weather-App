"use client";
import { useState } from "react";
import { getWeatherByCity, WeatherData } from "../lib/getWeather";
import WeatherDisplay from "../components/WeatherDisplay"; // Ensure this path is correct

export default function Home() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!city.trim()) {
      setError("Please enter a city name.");
      return;
    }
    setError("");
    setWeather(null);
    setLoading(true);
    try {
      const data = await getWeatherByCity(city);
      setWeather(data);
    } catch (err) {
      console.error("Error fetching weather:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to fetch weather data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="bg-[url('https://www.realsimple.com/thmb/i-rzIY3ReXeexuUtZl5wM_rl6KU=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1407861824-ee2a308b7f134e509f4d3463653d6cfe.jpg')] bg-cover bg-center bg-fixed
        min-h-screen w-screen relative flex flex-col items-center justify-center"
    >
      <div className="absolute inset-0 bg-black opacity-50 z-10"></div>

      <main className=" p-6 max-w-3xl mx-auto w-full relative z-20 flex flex-col items-center justify-center">
        {!city || weather === null ? (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white p-8 rounded-3xl shadow-2xl mb-8 w-full">
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-8 text-center drop-shadow-md">
              Weather App
            </h1>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="space-y-4"
            >
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city (e.g., Toronto, Barrie)"
                className="p-3 w-full text-white bg-white/10 backdrop-blur-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-xl transition-all duration-200"
              />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                disabled={loading}
              >
                {loading ? "Searching..." : "Get Weather"}
              </button>
            </form>

            {error && (
              <p className="mt-6 p-4 bg-red-800/20 text-red-300 rounded-xl shadow-inner text-center">
                {error}
              </p>
            )}
          </div>
        ) : (
          <div className="w-full mb-8">
            <button
              type="submit"
              onClick={() => {
                setCity("");
                setWeather(null);
                setError("");
              }}
              className="w-full bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors duration-200 shadow-md"
            >
              Search Another City
            </button>
          </div>
        )}

        <div className="w-full max-w-3xl">
          {weather && <WeatherDisplay data={weather} city={city} />}
        </div>
      </main>
    </div>
  );
}
