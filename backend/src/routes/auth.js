import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { readJson, writeJson } from '../store/fileStore.js';
import { requireAuth } from '../middleware/auth.js';
import { dbConnected } from '../config/db.js';

const router = Router();
const USERS_FILE = 'users.json';

function signToken(user) {
  const id = user._id?.toString?.() || user.id;
  return jwt.sign(
    { id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function publicUser(user) {
  return {
    id: user._id?.toString?.() || user.id,
    name: user.name,
    email: user.email,
  };
}

async function findUserByEmail(email) {
  if (dbConnected) {
    const mongoUser = await User.findOne({ email });
    if (mongoUser) return mongoUser;
  }

  const users = await readJson(USERS_FILE, []);
  return users.find((u) => u.email === email) || null;
}

async function findUserById(id) {
  if (dbConnected && id && !String(id).startsWith('user_')) {
    try {
      const mongoUser = await User.findById(id);
      if (mongoUser) return mongoUser;
    } catch {
      // Invalid ObjectId — fall through to file lookup
    }
  }

  const users = await readJson(USERS_FILE, []);
  return users.find((u) => u.id === id) || null;
}

async function emailTaken(email) {
  if (await findUserByEmail(email)) return true;
  return false;
}

async function migrateFileUserToMongo(fileUser) {
  if (!dbConnected || !fileUser?.email) return fileUser;

  const existing = await User.findOne({ email: fileUser.email });
  if (existing) return existing;

  return User.create({
    name: fileUser.name,
    email: fileUser.email,
    passwordHash: fileUser.passwordHash,
  });
}

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    if (await emailTaken(normalizedEmail)) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    if (dbConnected) {
      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
      });

      const token = signToken(user);
      return res.status(201).json({ token, user: publicUser(user) });
    }

    const users = await readJson(USERS_FILE, []);
    const user = {
      id: `user_${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    users.push(user);
    await writeJson(USERS_FILE, users);

    const token = signToken(user);
    return res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    let user = await findUserByEmail(normalizedEmail);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (dbConnected && user.id && !user._id) {
      user = await migrateFileUserToMongo(user);
    }

    const token = signToken(user);
    return res.json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(publicUser(user));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load profile', details: err.message });
  }
});

export default router;
