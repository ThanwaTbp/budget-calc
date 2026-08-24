// ดึงข้อมูลสภาพอากาศจาก Open-Meteo (ฟรี ไม่ต้องใช้ API key) — เรียกจาก Route Handler ฝั่งเซิร์ฟเวอร์เท่านั้น
// error ทุกกรณีต้องแปลงเป็นข้อความไทยก่อน throw ห้ามหลุด error ดิบภาษาอังกฤษออกไป
import type { ICurrentWeather, IDailyWeather, IHourlyWeather, IWeatherForecast, IWeatherLocation } from '@/types/weather'

const REQUEST_TIMEOUT_MS = 10000
// อากาศเปลี่ยนบ่อย cache ไว้แค่ 15 นาที
const FORECAST_CACHE_REVALIDATE_SECONDS = 900
// พิกัดเมืองไม่เปลี่ยน cache ได้นานถึง 1 วัน
const SEARCH_CACHE_REVALIDATE_SECONDS = 86400

const FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast'
const GEOCODING_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search'

interface IOpenMeteoCurrent {
  temperature_2m: number
  relative_humidity_2m: number
  apparent_temperature: number
  precipitation: number
  weather_code: number
  wind_speed_10m: number
}

interface IOpenMeteoDaily {
  time: string[]
  weather_code: number[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  precipitation_probability_max: number[]
  precipitation_sum: number[]
}

interface IOpenMeteoHourly {
  time: string[]
  temperature_2m: number[]
  weather_code: number[]
  precipitation_probability: number[]
}

interface IOpenMeteoForecastResponse {
  current?: IOpenMeteoCurrent
  daily?: IOpenMeteoDaily
  hourly?: IOpenMeteoHourly
}

interface IOpenMeteoGeocodingResult {
  id: number
  name: string
  admin1?: string
  country?: string
  latitude: number
  longitude: number
}

interface IOpenMeteoGeocodingResponse {
  results?: IOpenMeteoGeocodingResult[]
}

async function fetchJson<T>(url: string, cacheRevalidateSeconds: number, errorMessage: string): Promise<T> {
  let response: Response

  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      next: { revalidate: cacheRevalidateSeconds },
    })
  } catch {
    throw new Error('เชื่อมต่อบริการพยากรณ์อากาศไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
  }

  if (!response.ok) {
    throw new Error(errorMessage)
  }

  return (await response.json()) as T
}

// แปลง daily response แบบ array-parallel (daily.time[], daily.weather_code[], ...) เป็น array ของ IDailyWeather
function toDailyWeatherList(daily: IOpenMeteoDaily): IDailyWeather[] {
  return daily.time.map((date, index) => ({
    date,
    weatherCode: daily.weather_code[index],
    temperatureMax: daily.temperature_2m_max[index],
    temperatureMin: daily.temperature_2m_min[index],
    precipitationProbability: daily.precipitation_probability_max[index],
    precipitationSum: daily.precipitation_sum[index],
  }))
}

// แปลง hourly response แบบ array-parallel เป็น array ของ IHourlyWeather
function toHourlyWeatherList(hourly: IOpenMeteoHourly): IHourlyWeather[] {
  return hourly.time.map((time, index) => ({
    time,
    temperature: hourly.temperature_2m[index],
    weatherCode: hourly.weather_code[index],
    precipitationProbability: hourly.precipitation_probability[index],
  }))
}

function toCurrentWeather(current: IOpenMeteoCurrent): ICurrentWeather {
  return {
    temperature: current.temperature_2m,
    apparentTemperature: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    precipitation: current.precipitation,
    weatherCode: current.weather_code,
    windSpeed: current.wind_speed_10m,
  }
}

// ดึงพยากรณ์อากาศปัจจุบัน + รายวัน 16 วัน + รายชั่วโมง ของพิกัดที่ระบุ
export async function fetchForecast(latitude: number, longitude: number): Promise<IWeatherForecast> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    timezone: 'Asia/Bangkok',
    forecast_days: '16',
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum',
    hourly: 'temperature_2m,weather_code,precipitation_probability',
  })

  const data = await fetchJson<IOpenMeteoForecastResponse>(
    `${FORECAST_ENDPOINT}?${params.toString()}`,
    FORECAST_CACHE_REVALIDATE_SECONDS,
    'ดึงข้อมูลพยากรณ์อากาศไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
  )

  if (!data.current || !data.daily || !data.hourly) {
    throw new Error('ข้อมูลพยากรณ์อากาศที่ได้รับไม่ครบถ้วน กรุณาลองใหม่อีกครั้ง')
  }

  return {
    current: toCurrentWeather(data.current),
    daily: toDailyWeatherList(data.daily),
    hourly: toHourlyWeatherList(data.hourly),
  }
}

// ค้นหาเมืองด้วยชื่อภาษาไทย/อังกฤษ คำค้นว่างไม่ต้องยิง API คืน [] ทันที
export async function searchLocations(query: string): Promise<IWeatherLocation[]> {
  const trimmedQuery = query.trim()
  if (trimmedQuery === '') return []

  const params = new URLSearchParams({ name: trimmedQuery, count: '8', language: 'th' })

  const data = await fetchJson<IOpenMeteoGeocodingResponse>(
    `${GEOCODING_ENDPOINT}?${params.toString()}`,
    SEARCH_CACHE_REVALIDATE_SECONDS,
    'ค้นหาเมืองไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
  )

  if (!data.results) return []

  return data.results.map((result) => ({
    id: result.id,
    name: result.name,
    admin1: result.admin1 ?? '',
    country: result.country ?? '',
    latitude: result.latitude,
    longitude: result.longitude,
  }))
}
