// แปลง WMO weather code เป็นคำอธิบายไทย/ไอคอน/ระดับเตือน — pure function ล้วน ไม่แตะ React เพื่อให้ทดสอบได้อิสระ
// ตารางต้องตรงกับ docs/SPEC.md หัวข้อ 'ฟีเจอร์สภาพอากาศ (Weather)' เป๊ะ ห้ามเดาเอง
import type { WeatherAlertLevel } from '@/types/weather'

export type WeatherIconName =
  | 'Sun'
  | 'CloudSun'
  | 'Cloud'
  | 'CloudFog'
  | 'CloudDrizzle'
  | 'CloudRain'
  | 'Snowflake'
  | 'CloudLightning'

interface IWeatherCodeMeta {
  description: string
  icon: WeatherIconName
}

const UNKNOWN_WEATHER_META: IWeatherCodeMeta = { description: 'ไม่ทราบสภาพอากาศ', icon: 'Cloud' }

// คีย์เป็น weather code ของ WMO ค่าเป็นคำอธิบายไทย + ไอคอนคู่กันตามตารางใน SPEC
const WEATHER_CODE_META: Record<number, IWeatherCodeMeta> = {
  0: { description: 'ท้องฟ้าแจ่มใส', icon: 'Sun' },
  1: { description: 'มีเมฆบางส่วน', icon: 'CloudSun' },
  2: { description: 'มีเมฆเป็นส่วนมาก', icon: 'Cloud' },
  3: { description: 'มีเมฆมาก', icon: 'Cloud' },
  45: { description: 'หมอก', icon: 'CloudFog' },
  48: { description: 'หมอก', icon: 'CloudFog' },
  51: { description: 'ฝนละออง', icon: 'CloudDrizzle' },
  53: { description: 'ฝนละออง', icon: 'CloudDrizzle' },
  55: { description: 'ฝนละออง', icon: 'CloudDrizzle' },
  56: { description: 'ฝนละอองเยือกแข็ง', icon: 'CloudDrizzle' },
  57: { description: 'ฝนละอองเยือกแข็ง', icon: 'CloudDrizzle' },
  61: { description: 'ฝนตก', icon: 'CloudRain' },
  63: { description: 'ฝนตก', icon: 'CloudRain' },
  65: { description: 'ฝนตก', icon: 'CloudRain' },
  66: { description: 'ฝนเยือกแข็ง', icon: 'CloudRain' },
  67: { description: 'ฝนเยือกแข็ง', icon: 'CloudRain' },
  71: { description: 'หิมะตก', icon: 'Snowflake' },
  73: { description: 'หิมะตก', icon: 'Snowflake' },
  75: { description: 'หิมะตก', icon: 'Snowflake' },
  77: { description: 'เม็ดหิมะ', icon: 'Snowflake' },
  80: { description: 'ฝนซู่', icon: 'CloudRain' },
  81: { description: 'ฝนซู่', icon: 'CloudRain' },
  82: { description: 'ฝนซู่', icon: 'CloudRain' },
  85: { description: 'หิมะซู่', icon: 'Snowflake' },
  86: { description: 'หิมะซู่', icon: 'Snowflake' },
  95: { description: 'พายุฝนฟ้าคะนอง', icon: 'CloudLightning' },
  96: { description: 'พายุฝนฟ้าคะนองมีลูกเห็บ', icon: 'CloudLightning' },
  99: { description: 'พายุฝนฟ้าคะนองมีลูกเห็บ', icon: 'CloudLightning' },
}

// code พายุฝนฟ้าคะนอง — เข้าเกณฑ์ severe เสมอไม่ว่าโอกาสฝนเท่าไหร่
const SEVERE_STORM_CODES = new Set([95, 96, 99])
// code ฝนตก/ฝนซู่ — เข้าเกณฑ์ caution เสมอไม่ว่าโอกาสฝนเท่าไหร่
const CAUTION_RAIN_CODES = new Set([61, 62, 63, 64, 65, 66, 67, 80, 81, 82])

export function getWeatherDescription(code: number): string {
  return WEATHER_CODE_META[code]?.description ?? UNKNOWN_WEATHER_META.description
}

export function getWeatherIconName(code: number): WeatherIconName {
  return WEATHER_CODE_META[code]?.icon ?? UNKNOWN_WEATHER_META.icon
}

// เกณฑ์เตือนตาม docs/SPEC.md — severe ต้องเช็คก่อน caution เสมอ (severe ครอบคลุมกว่า)
export function getWeatherAlertLevel(code: number, precipitationProbability: number): WeatherAlertLevel {
  if (SEVERE_STORM_CODES.has(code) || precipitationProbability >= 80) {
    return 'severe'
  }

  if (precipitationProbability >= 60 || CAUTION_RAIN_CODES.has(code)) {
    return 'caution'
  }

  return 'normal'
}
