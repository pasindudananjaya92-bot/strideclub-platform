import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { getOrCreateUser } from '../db/users.ts';
import { isAdminEmail } from '../lib/admin.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: {
    id: number;
    uid: string;
    email: string;
    displayName: string | null;
    photoUrl: string | null;
  };
  isAdmin?: boolean;
}

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
    req.isAdmin = isAdminEmail(dbUser.email || decodedToken.email);

    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid authentication session' });
  }
};

/**
 * Optional auth: real user if token valid, else demo-user.
 */
export const optionalAuthOrDemo = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  const useDemoUser = async () => {
    const demo = await getOrCreateUser(
      'demo-user',
      'demo@strideclub.local',
      'Pasiya Max ⚡',
      null
    );
    req.dbUser = {
      id: demo.id,
      uid: demo.uid,
      email: demo.email,
      displayName: demo.displayName ?? 'Pasiya Max ⚡',
      photoUrl: demo.photoUrl ?? null,
    };
    req.isAdmin = false;
  };

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    try {
      await useDemoUser();
      return next();
    } catch (error) {
      console.error('Failed to resolve demo user:', error);
      return res.status(500).json({
        error: 'Demo user could not be resolved in database. Check DATABASE_URL and public.users.',
      });
    }
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
    req.isAdmin = isAdminEmail(dbUser.email || decodedToken.email);
    return next();
  } catch (error) {
    console.warn('Token invalid — falling back to demo user by uid');
    try {
      await useDemoUser();
      return next();
    } catch (demoErr) {
      console.error('Demo fallback failed:', demoErr);
      return res.status(401).json({ error: 'Unauthorized: Invalid authentication session' });
    }
  }
};

/** Block non-admins (use after requireAuth). */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};
 
