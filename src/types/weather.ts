// Data model ของฟีเจอร์สภาพอากาศ (Weather) — ห้ามแก้โครงสร้างโดยไม่อัปเดต docs/SPEC.md ตามไปด้วย
export interface IWeatherLocation {
  id: number
  name: string
  admin1: string
  country: string
  latitude: number
  longitude: number
}

export interface IDailyWeather {
  date: string // 'yyyy-MM-dd'
  weatherCode: number
  temperatureMax: number
  temperatureMin: number
  precipitationProbability: number
  precipitationSum: number
}

export interface IHourlyWeather {
  time: string // ISO
  temperature: number
  weatherCode: number
  precipitationProbability: number
}

export interface ICurrentWeather {
  temperature: number
  apparentTemperature: number
  humidity: number
  precipitation: number
  weatherCode: number
  windSpeed: number
}

export interface IWeatherForecast {
  current: ICurrentWeather
  daily: IDailyWeather[]
  hourly: IHourlyWeather[]
}

// ระดับเตือนสภาพอากาศ ใช้ร่วมกันทั้งหน้าสภาพอากาศและหน้าวางแผนงาน (ดูเกณฑ์ใน docs/SPEC.md)
export type WeatherAlertLevel = 'severe' | 'caution' | 'normal'
