export interface User {
  id?: string
  _id?: string
  username: string
  email: string
  role: string
  isActive: boolean
  isDeleted?: boolean
  cargo?: string
  empresa?: string
}
