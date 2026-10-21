import React, { useState, useEffect, useMemo } from 'react';
import { 
  Cloud, Sun, CloudRain, CloudLightning, Wind, Droplets, 
  Search, Star, RefreshCw, Thermometer, MapPin, AlertCircle,
  Eye, Compass, ArrowUp, ArrowDown, Sparkles
} from 'lucide-react';

interface City {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

interface CurrentWeather {
  temperature_2m: number;
  relative_humidity_2m: number;
  wind_speed_10m: number;
  weather_code: number;
  time: string;
  apparent_temperature?: number;
}

interface DailyWeather {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
}

interface WeatherData {
  current: CurrentWeather;
  daily: DailyWeather;
}

const CITIES: City[] = [
  { id: 'hanoi', name: 'Hà Nội', lat: 21.0285, lon: 105.8542 },
  { id: 'haiphong', name: 'Hải Phòng', lat: 20.8449, lon: 106.6881 },
  { id: 'hue', name: 'Huế', lat: 16.4637, lon: 107.5909 },
  { id: 'danang', name: 'Đà Nẵng', lat: 16.0544, lon: 108.2022 },
  { id: 'nhatrang', name: 'Nha Trang', lat: 12.2388, lon: 109.1967 },
  { id: 'dalat', name: 'Đà Lạt', lat: 11.9404, lon: 108.4583 },
  { id: 'hcm', name: 'TP. Hồ Chí Minh', lat: 10.8231, lon: 106.6297 },
  { id: 'cantho', name: 'Cần Thơ', lat: 10.0452, lon: 105.7469 },
];


const getWeatherTheme = (code: number) => {
  switch (code) {
    case 0:
      return { 
        desc: 'Trời quang đãng', 
        icon: <Sun className="w-12 h-12 text-amber-400 animate-spin-slow" />,
        bg: 'from-amber-900/40 via-slate-900 to-slate-950',
        cardBg: 'border-amber-500/20 bg-amber-500/5',
        accent: 'text-amber-400'
      };
    case 1:
    case 2:
    case 3:
      return { 
        desc: 'Nhiều mây / Ít mây', 
        icon: <Cloud className="w-12 h-12 text-sky-300" />,
        bg: 'from-sky-950/50 via-slate-900 to-slate-950',
        cardBg: 'border-sky-500/20 bg-sky-500/5',
        accent: 'text-sky-400'
      };
    case 45:
    case 48:
      return { 
        desc: 'Có sương mù', 
        icon: <Cloud className="w-12 h-12 text-slate-300" />,
        bg: 'from-slate-800/60 via-slate-900 to-slate-950',
        cardBg: 'border-slate-500/20 bg-slate-500/5',
        accent: 'text-slate-300'
      };
    case 51: case 53: case 55: case 61: case 63: case 65:
      return { 
        desc: 'Mưa rào / Mưa nhẹ', 
        icon: <CloudRain className="w-12 h-12 text-blue-400 animate-bounce-slow" />,
        bg: 'from-blue-950/60 via-slate-900 to-slate-950',
        cardBg: 'border-blue-500/20 bg-blue-500/5',
        accent: 'text-blue-400'
      };
    case 95: case 96: case 99:
      return { 
        desc: 'Dông sét nguy hiểm', 
        icon: <CloudLightning className="w-12 h-12 text-purple-400" />,
        bg: 'from-purple-950/60 via-slate-900 to-slate-950',
        cardBg: 'border-purple-500/20 bg-purple-500/5',
        accent: 'text-purple-400'
      };
    default:
      return { 
        desc: 'Thời tiết bình thường', 
        icon: <Sun className="w-12 h-12 text-yellow-400" />,
        bg: 'from-slate-900 via-slate-900 to-slate-950',
        cardBg: 'border-slate-700/50 bg-slate-800/30',
        accent: 'text-blue-400'
      };
  }
};

const removeVietnameseTones = (str: string) => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};

export default function App() {
  const [selectedCity, setSelectedCity] = useState<City | null>(null); //thành phố đang chọn
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null); //dữ liệu từ api
  const [loading, setLoading] = useState<boolean>(false); //quản lý sự cố mạng
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<'C' | 'F'>('C'); 
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>(() => { //thành phố yêu thích
    const saved = localStorage.getItem('favorite_cities');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('favorite_cities', JSON.stringify(favorites));
  }, [favorites]);

  const fetchWeather = async (city: City) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FHo_Chi_Minh&forecast_days=7`
      );
      if (!response.ok) throw new Error('Không thể tải dữ liệu thời tiết.');
      const data = await response.json();
      setWeatherData(data);
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCity = (city: City) => {
    setSelectedCity(city);
    fetchWeather(city);
  };

  const toggleFavorite = (e: React.MouseEvent, cityId: string) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(cityId) ? prev.filter(id => id !== cityId) : [...prev, cityId]
    );
  };

  const convertTemp = (tempC: number) => {
    if (unit === 'F') return Math.round((tempC * 9/5) + 32);
    return Math.round(tempC);
  };

  const filteredCities = useMemo(() => {
    return CITIES.filter(city => 
      removeVietnameseTones(city.name).includes(removeVietnameseTones(searchTerm))
    );
  }, [searchTerm]);

  const currentTheme = weatherData 
    ? getWeatherTheme(weatherData.current.weather_code)
    : getWeatherTheme(-1);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentTheme.bg} text-slate-100 p-4 md:p-8 font-sans transition-all duration-700`}>
      <div className="max-w-6xl mx-auto">

        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                Weather Forecast Pro
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">Thời tiết Việt Nam thời gian thực • Open-Meteo API</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-md self-start md:self-auto">
            <span className="text-xs text-slate-400 px-2 font-medium">Đơn vị:</span>
            <button
              onClick={() => setUnit('C')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${unit === 'C' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:text-white'}`}
            >
              °C
            </button>
            <button
              onClick={() => setUnit('F')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${unit === 'F' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:text-white'}`}
            >
              °F
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          <div className="md:col-span-4 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 flex flex-col gap-4 shadow-2xl">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm thành phố (ví dụ: Da Nang)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[460px] pr-1 custom-scrollbar">
              {filteredCities.map(city => {
                const isSelected = selectedCity?.id === city.id;
                const isFav = favorites.includes(city.id);
                return (
                  <div
                    key={city.id}
                    onClick={() => handleSelectCity(city)}
                    className={`group flex items-center justify-between p-3.5 rounded-2xl cursor-pointer border transition-all duration-300 ${
                      isSelected 
                        ? 'bg-blue-600/20 border-blue-500/60 text-white shadow-lg shadow-blue-500/10 scale-[1.02]' 
                        : 'bg-slate-950/30 border-slate-800/60 hover:bg-slate-800/40 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'}`}>
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-sm">{city.name}</span>
                    </div>
                    <button
                      onClick={(e) => toggleFavorite(e, city.id)}
                      className="p-1.5 rounded-xl hover:bg-slate-800/80 text-slate-500 hover:text-amber-400 transition"
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-8 flex flex-col gap-6">
            
            {!selectedCity && (
              <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-12 text-center text-slate-400 flex flex-col items-center justify-center min-h-[420px]">
                <div className="p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 mb-4 animate-bounce">
                  <Cloud className="w-12 h-12 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Chưa chọn thành phố</h3>
                <p className="text-sm text-slate-400 max-w-sm">Chọn một thành phố ở danh sách bên trái để khám phá thời tiết chi tiết nhé!</p>
              </div>
            )}

            {loading && (
              <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-12 text-center text-slate-400 flex flex-col items-center justify-center min-h-[420px]">
                <RefreshCw className="w-10 h-10 text-blue-400 animate-spin mb-4" />
                <p className="text-sm font-medium">Đang kết nối dữ liệu Open-Meteo...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-950/20 backdrop-blur-xl border border-red-900/40 rounded-3xl p-12 text-center text-red-200 flex flex-col items-center justify-center min-h-[420px]">
                <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                <p className="font-semibold mb-4">{error}</p>
                <button
                  onClick={() => selectedCity && fetchWeather(selectedCity)}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-red-600/20"
                >
                  <RefreshCw className="w-4 h-4" /> Thử lại ngay
                </button>
              </div>
            )}

            {selectedCity && !loading && !error && weatherData && (
              <>
                <div className={`backdrop-blur-2xl border rounded-3xl p-6 md:p-8 shadow-2xl transition-all duration-500 ${currentTheme.cardBg}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-slate-200 border border-white/10 mb-3">
                        Thời tiết hiện tại
                      </span>
                      <h2 className="text-3xl md:text-4xl font-black text-white">{selectedCity.name}</h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Cập nhật: {new Date(weatherData.current.time).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-900/40 rounded-2xl border border-white/10 shadow-inner">
                      {currentTheme.icon}
                    </div>
                  </div>

                  <div className="my-6 flex items-baseline gap-2">
                    <span className="text-6xl md:text-7xl font-black text-white tracking-tight">
                      {convertTemp(weatherData.current.temperature_2m)}
                    </span>
                    <span className={`text-3xl font-extrabold ${currentTheme.accent}`}>°{unit}</span>
                  </div>

                  <p className="text-lg font-semibold text-slate-200 mb-6">
                    {currentTheme.desc}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-6 border-t border-slate-800/80">
                    <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-3.5 flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                        <Droplets className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Độ ẩm</p>
                        <p className="text-sm font-bold text-white">{weatherData.current.relative_humidity_2m}%</p>
                      </div>
                    </div>

                    <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-3.5 flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400">
                        <Wind className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Tốc độ gió</p>
                        <p className="text-sm font-bold text-white">{weatherData.current.wind_speed_10m} <span className="text-xs font-normal">km/h</span></p>
                      </div>
                    </div>

                    <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-3.5 flex items-center gap-3 col-span-2 md:col-span-1">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                        <Thermometer className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Cảm nhận như</p>
                        <p className="text-sm font-bold text-white">
                          {convertTemp(weatherData.current.apparent_temperature ?? weatherData.current.temperature_2m)}°{unit}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-2xl">
                  <h3 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">
                    <span>Dự báo 7 ngày tới</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-2.5">
                    {weatherData.daily.time.map((dateStr, index) => {
                      const dateObj = new Date(dateStr);
                      const dayName = index === 0 ? 'Hôm nay' : dateObj.toLocaleDateString('vi-VN', { weekday: 'short' });
                      const formattedDate = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                      const theme = getWeatherTheme(weatherData.daily.weather_code[index]);
                      const maxTemp = convertTemp(weatherData.daily.temperature_2m_max[index]);
                      const minTemp = convertTemp(weatherData.daily.temperature_2m_min[index]);

                      return (
                        <div 
                          key={dateStr} 
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/30 border border-slate-800/50 hover:bg-slate-800/40 hover:border-slate-700 transition-all duration-300"
                        >
                          <div className="w-28">
                            <p className="font-bold text-xs text-slate-200">{dayName}</p>
                            <p className="text-[10px] text-slate-500">{formattedDate}</p>
                          </div>
                          
                          <div className="flex items-center gap-2.5">
                            <div className="scale-75">
                              {theme.icon}
                            </div>
                            <span className="text-xs text-slate-400 hidden sm:inline font-medium">{theme.desc}</span>
                          </div>

                          <div className="flex items-center gap-2 text-xs font-bold">
                            <span className="text-white flex items-center gap-0.5">
                              <ArrowUp className="w-3 h-3 text-red-400" /> {maxTemp}°
                            </span>
                            <span className="text-slate-500">/</span>
                            <span className="text-slate-400 flex items-center gap-0.5">
                              <ArrowDown className="w-3 h-3 text-blue-400" /> {minTemp}°
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}