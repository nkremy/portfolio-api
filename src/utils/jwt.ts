import jwt from 'jsonwebtoken'

export interface TokenPayload {
  userId: number
  email: string
}

export function generateAccessToken(payload: TokenPayload): string {
  const secret = process.env.JWT_ACCESS_SECRET
  if (!secret) throw new Error('JWT_ACCESS_SECRET manquant')
  return jwt.sign(payload, secret, { expiresIn: '15m' })
}

export function generateRefreshToken(payload: TokenPayload): string {
  const secret = process.env.JWT_REFRESH_SECRET
  if (!secret) throw new Error('JWT_REFRESH_SECRET manquant')
  return jwt.sign(payload, secret, { expiresIn: '7d' })
}

export function verifyAccessToken(token: string): TokenPayload {
  const secret = process.env.JWT_ACCESS_SECRET
  if (!secret) throw new Error('JWT_ACCESS_SECRET manquant')
  return jwt.verify(token, secret) as TokenPayload
}

export function verifyRefreshToken(token: string): TokenPayload {
  const secret = process.env.JWT_REFRESH_SECRET
  if (!secret) throw new Error('JWT_REFRESH_SECRET manquant')
  return jwt.verify(token, secret) as TokenPayload
}