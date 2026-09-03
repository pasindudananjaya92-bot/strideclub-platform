import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { getOrCreateUser } from '../db/users.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: {
    id: number;
    uid: string;
    email: string;
    displayName: string | null;
    photoUrl: string | null;
  };
}

/** Demo user when no Firebase session (matches Supabase users.id = 1) */
export const DEMO_DB_USER = {
  id: 1,
  uid: 'demo-user',
  email: 'demo@strideclub.local',
  displayName: 'Pasiya Max ⚡',
  photoUrl: null as string | null,
};

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;

    const dbUser = await getOrCreateUser(
      decodedToken.uid,
      decodedToken.email || 'runner@runningclub.local',
      decodedToken.name || decodedToken.email?.split('@')[0] || 'Runner',
      decodedToken.picture || null
    );
    req.dbUser = dbUser;

    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid authentication session' });
  }
};

/**
 * Auth if token present; otherwise continue as demo user (id: 1).
 * Use for Log Run so anonymous/demo sessions can still write to Supabase.
 */
export const optionalAuthOrDemo = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.dbUser = DEMO_DB_USER;
    return next();
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;

    const dbUser = await getOrCreateUser(
      decodedToken.uid,
      decodedToken.email || 'runner@runningclub.local',
      decodedToken.name || decodedToken.email?.split('@')[0] || 'Runner',
      decodedToken.picture || null
    );
    req.dbUser = dbUser;
    return next();
  } catch (error) {
    console.warn('Token invalid — falling back to demo user id=1');
    req.dbUser = DEMO_DB_USER;
    return next();
  }
};
 
