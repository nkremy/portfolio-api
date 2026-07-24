import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import db from '../db/database'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt'

const router = Router()

// ─── POST /auth/register ────────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  const { email, password } : {email:string , password: string} = req.body

  // 1. Validation basique
  if (!email || !password) {
    res.status(400).json({ error: 'Email et mot de passe requis' })
    return
  }

  if (password.length < 8) {
    res.status(400).json({ error: 'Le mot de passe doit faire au moins 8 caractères' })
    return
  }

  // 2. Vérifier que l'email n'est pas déjà utilisé
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existingUser) {
    res.status(409).json({ error: 'Cet email est déjà utilisé' })
    return
  }

  // 3. Hasher le mot de passe
  const passwordHash = await bcrypt.hash(password, 12)

  // 4. Insérer l'utilisateur
  const insertUser = db.prepare(`
    INSERT INTO users (email, password_hash) VALUES (?, ?)
  `)
  const result = insertUser.run(email, passwordHash)
  const userId = result.lastInsertRowid as number

  // 5. Générer les tokens
  const payload = { userId, email }
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  // 6. Stocker le hash du refresh token en base (jamais le token brut)
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  db.prepare(`
    INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)
  `).run(userId, tokenHash, expiresAt)

  // 7. Placer le refresh token dans un cookie HttpOnly
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours en millisecondes
  })

  // 8. Retourner l'access token
  res.status(201).json({
    accessToken,
    user: { id: userId, email }
  })
})

// ─── POST /auth/login ────────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body

  // 1. Validation basique
  if (!email || !password) {
    res.status(400).json({ error: 'Email et mot de passe requis' })
    return
  }

  // 2. Chercher l'utilisateur
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as
    | { id: number; email: string; password_hash: string }
    | undefined

  if (!user) {
    res.status(401).json({ error: 'Identifiants invalides' })
    return
  }

  // 3. Vérifier le mot de passe
  const passwordMatch = await bcrypt.compare(password, user.password_hash)
  if (!passwordMatch) {
    res.status(401).json({ error: 'Identifiants invalides' })
    return
  }

  // 4. Générer les tokens
  const payload = { userId: user.id, email: user.email }
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  // 5. Stocker le hash du refresh token
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  db.prepare(`
    INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)
  `).run(user.id, tokenHash, expiresAt)

  // 6. Cookie + réponse
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  })

  res.json({
    accessToken,
    user: { id: user.id, email: user.email }
  })
})

// ─── POST /auth/refresh ──────────────────────────────────────────────────────
router.post('/refresh', (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken

  // 1. Cookie présent ?
  if (!refreshToken) {
    res.status(401).json({ error: 'Refresh token manquant' })
    return
  }

  // 2. Vérifier la signature JWT
  let payload: { userId: number; email: string }
  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    res.status(401).json({ error: 'Refresh token invalide ou expiré' })
    return
  }

  // 3. Vérifier que le token existe en base et n'est pas révoqué
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
  const storedToken = db.prepare(`
    SELECT * FROM refresh_tokens
    WHERE token_hash = ? AND revoked = 0 AND expires_at > datetime('now')
  `).get(tokenHash) as { id: number } | undefined

  if (!storedToken) {
    res.status(401).json({ error: 'Refresh token révoqué ou expiré' })
    return
  }

  // 4. Émettre un nouvel access token
  const accessToken = generateAccessToken({ userId: payload.userId, email: payload.email })

  res.json({ accessToken })
})

// ─── POST /auth/logout ───────────────────────────────────────────────────────
router.post('/logout', (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken

  // 1. Si cookie présent, révoquer le token en base
  if (refreshToken) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
    db.prepare(`
      UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?
    `).run(tokenHash)
  }

  // 2. Effacer le cookie côté navigateur
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  })

  res.json({ message: 'Déconnecté avec succès' })
})

export default router