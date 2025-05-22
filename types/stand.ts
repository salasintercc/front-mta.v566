import { StandOption as ServiceStandOption, StandItem as ServiceStandItem, StandOptionItem as ServiceStandOptionItem } from "@/services/stand-option-service"

export type { ServiceStandOption as StandOption, ServiceStandItem as StandItem, ServiceStandOptionItem as StandOptionItem }

export interface StandConfig {
  _id: string
  user: string | { _id: string; username: string; email: string; fullName?: string; company?: string }
  event: string | { _id: string; title: string }
  standOption: string | { _id: string; title: string }
  configData: Record<string, any>
  totalPrice: number
  priceBreakdown: Record<string, number>
  isSubmitted: boolean
  isPaid: boolean
  paymentStatus: "pending" | "processing" | "completed" | "cancelled"
  createdAt: string
  updatedAt: string
}

export interface StandConfigurationResponse {
  label: string
  option?: string
  price: number
  optionLabel?: string
}

export interface StandConfigurationState {
  [standOptionId: string]: {
    [itemId: string]: StandConfigurationResponse
  }
}

export interface StandConfigurationData {
  configData: Record<string, any>
  totalPrice?: number
  priceBreakdown?: Record<string, number>
  isSubmitted?: boolean
  paymentStatus?: "pending" | "processing" | "completed" | "cancelled"
} 