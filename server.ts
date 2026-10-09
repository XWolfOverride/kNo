import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Database file path
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

interface UserRecord {
  id: string;
  username: string;
  name: string;
  passwordHash: string;
  salt: string;
  role: 'admin' | 'user';
  disabled?: boolean;
  createdAt: string;
}

interface ItemUrlRecord {
  id?: string;
  url: string;
  description: string;
}

interface ItemRecord {
  id: string;
  userId: string;
  title: string;
  categories: string[];
  rawCategories?: string;
  urls?: ItemUrlRecord[];
  content?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface DatabaseSchema {
  users: UserRecord[];
  items: ItemRecord[];
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function normalizeCategoryPath(raw: string): string {
  return raw
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean)
    .join('/');
}

function parseCategories(input: string | string[]): string[] {
  if (Array.isArray(input)) {
    return input.map(normalizeCategoryPath).filter(Boolean);
  }
  if (!input) return [];
  return input
    .split(',')
    .map((item) => normalizeCategoryPath(item.trim()))
    .filter(Boolean);
}

// In-memory token store: token -> userId
const sessions = new Map<string, { userId: string; expiresAt: number }>();

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function getInitialDb(): DatabaseSchema {
  return {
    users: [],
    items: [],
  };
}

function loadDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    const initial = getInitialDb();
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }

  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const data = JSON.parse(raw);
    // Ensure boot user exists and migrate existing users
    data.users = data.users || [];
    for (const u of data.users) {
      if (!u.role) {
        u.role = 'user';
      }
      if (typeof u.disabled !== 'boolean') {
        u.disabled = false;
      }
    }

    return data;
  } catch (err) {
    console.error('Error reading db.json, recreating initial:', err);
    const initial = getInitialDb();
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

function saveDatabase(db: DatabaseSchema) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

// Auth Middleware
function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No autorizado: token faltante' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const session = sessions.get(token);

  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    res.status(401).json({ error: 'Sesión expirada o no válida' });
    return;
  }

  const db = loadDatabase();
  const user = db.users.find((u) => u.id === session.userId);
  if (!user) {
    res.status(401).json({ error: 'Usuario no encontrado' });
    return;
  }

  if (user.disabled) {
    sessions.delete(token);
    res.status(403).json({ error: 'Esta cuenta ha sido deshabilitada por un administrador' });
    return;
  }

  (req as any).user = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role || 'user',
    disabled: !!user.disabled,
  };

  next();
}

// Admin Middleware
function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  authMiddleware(req, res, () => {
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Acceso denegado: se requieren permisos de administrador' });
      return;
    }
    next();
  });
}

/* ================= AUTH & SETUP ROUTES ================= */

// GET /api/auth/setup-status (Check if system needs first-run bootstrap)
app.get('/api/auth/setup-status', (_req: Request, res: Response) => {
  const db = loadDatabase();
  const needsSetup = !db.users || db.users.length === 0;
  res.json({ needsSetup });
});

// POST /api/auth/setup (First-run initial admin bootstrap wizard)
app.post('/api/auth/setup', (req: Request, res: Response) => {
  const db = loadDatabase();
  if (db.users && db.users.length > 0) {
    res.status(403).json({ error: 'El sistema ya ha sido inicializado. Esta acción no está permitida.' });
    return;
  }

  const { username, password, name } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    return;
  }

  const cleanUsername = String(username).trim().toLowerCase();
  if (cleanUsername.length < 3) {
    res.status(400).json({ error: 'El nombre de usuario debe tener al menos 3 caracteres' });
    return;
  }

  if (String(password).length < 4) {
    res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });
    return;
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(String(password), salt);
  const initialAdmin: UserRecord = {
    id: `usr_${crypto.randomBytes(8).toString('hex')}`,
    username: cleanUsername,
    name: name ? String(name).trim() : cleanUsername,
    passwordHash,
    salt,
    role: 'admin',
    disabled: false,
    createdAt: new Date().toISOString(),
  };

  db.users = [initialAdmin];
  saveDatabase(db);

  const token = generateToken();
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7;
  sessions.set(token, { userId: initialAdmin.id, expiresAt });

  res.status(201).json({
    token,
    user: {
      id: initialAdmin.id,
      username: initialAdmin.username,
      name: initialAdmin.name,
      role: initialAdmin.role,
      disabled: initialAdmin.disabled,
      createdAt: initialAdmin.createdAt,
    },
  });
});

// POST /api/auth/login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    return;
  }

  const db = loadDatabase();
  const cleanUsername = String(username).trim().toLowerCase();
  const user = db.users.find((u) => u.username.toLowerCase() === cleanUsername);

  if (!user) {
    res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    return;
  }

  if (user.disabled) {
    res.status(403).json({ error: 'Esta cuenta ha sido deshabilitada por un administrador' });
    return;
  }

  const hash = hashPassword(String(password), user.salt);
  if (hash !== user.passwordHash) {
    res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    return;
  }

  const token = generateToken();
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days
  sessions.set(token, { userId: user.id, expiresAt });

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role || 'user',
      disabled: !!user.disabled,
      createdAt: user.createdAt,
    },
  });
});

// Self registration is disabled - manual admin onboarding required
app.post('/api/auth/register', (_req: Request, res: Response) => {
  res.status(403).json({
    error: 'El autoregistro público está desactivado. Un administrador debe dar de alta tu cuenta.',
  });
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, (req: Request, res: Response) => {
  res.json({ user: (req as any).user });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    sessions.delete(token);
  }
  res.json({ success: true });
});

/* ================= ADMIN USER MANAGEMENT ROUTES ================= */

// GET /api/admin/users
app.get('/api/admin/users', adminMiddleware, (_req: Request, res: Response) => {
  const db = loadDatabase();
  const safeUsers = db.users.map((u) => ({
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role || 'user',
    disabled: !!u.disabled,
    createdAt: u.createdAt,
  }));

  res.json({ users: safeUsers });
});

// POST /api/admin/users (Create user manually)
app.post('/api/admin/users', adminMiddleware, (req: Request, res: Response) => {
  const { username, password, name, role } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    return;
  }

  const cleanUsername = String(username).trim().toLowerCase();
  if (cleanUsername.length < 3) {
    res.status(400).json({ error: 'El nombre de usuario debe tener al menos 3 caracteres' });
    return;
  }

  if (String(password).length < 4) {
    res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });
    return;
  }

  const db = loadDatabase();
  if (db.users.some((u) => u.username.toLowerCase() === cleanUsername)) {
    res.status(409).json({ error: 'Ese nombre de usuario ya está registrado' });
    return;
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(String(password), salt);
  const newUser: UserRecord = {
    id: `usr_${crypto.randomBytes(8).toString('hex')}`,
    username: cleanUsername,
    name: name ? String(name).trim() : cleanUsername,
    passwordHash,
    salt,
    role: role === 'admin' ? 'admin' : 'user',
    disabled: false,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDatabase(db);

  res.status(201).json({
    user: {
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      role: newUser.role,
      disabled: newUser.disabled,
      createdAt: newUser.createdAt,
    },
  });
});

// PATCH /api/admin/users/:id/status (Disable / Enable user)
app.patch('/api/admin/users/:id/status', adminMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const { disabled } = req.body;
  const currentAdmin = (req as any).user;

  if (typeof disabled !== 'boolean') {
    res.status(400).json({ error: 'El campo "disabled" booleano es requerido' });
    return;
  }

  if (currentAdmin.id === id && disabled) {
    res.status(400).json({ error: 'No puedes deshabilitar tu propia cuenta de administrador' });
    return;
  }

  const db = loadDatabase();
  const user = db.users.find((u) => u.id === id);

  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  user.disabled = disabled;
  saveDatabase(db);

  // If user is disabled, invalidate their active sessions
  if (disabled) {
    for (const [token, session] of sessions.entries()) {
      if (session.userId === id) {
        sessions.delete(token);
      }
    }
  }

  res.json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      disabled: user.disabled,
      createdAt: user.createdAt,
    },
  });
});

// POST /api/admin/users/:id/reset-password
app.post('/api/admin/users/:id/reset-password', adminMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password || String(password).length < 4) {
    res.status(400).json({ error: 'La nueva contraseña debe tener al menos 4 caracteres' });
    return;
  }

  const db = loadDatabase();
  const user = db.users.find((u) => u.id === id);

  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  const salt = crypto.randomBytes(16).toString('hex');
  user.salt = salt;
  user.passwordHash = hashPassword(String(password), salt);
  saveDatabase(db);

  res.json({ success: true, message: 'Contraseña actualizada con éxito' });
});

// DELETE /api/admin/users/:id
app.delete('/api/admin/users/:id', adminMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const currentAdmin = (req as any).user;

  if (currentAdmin.id === id) {
    res.status(400).json({ error: 'No puedes eliminar tu propia cuenta de administrador en sesión' });
    return;
  }

  const db = loadDatabase();
  const index = db.users.findIndex((u) => u.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  const targetUser = db.users[index];
  if (targetUser.role === 'admin') {
    const adminCount = db.users.filter((u) => u.role === 'admin').length;
    if (adminCount <= 1) {
      res.status(400).json({ error: 'No se puede eliminar el único administrador del sistema' });
      return;
    }
  }

  db.users.splice(index, 1);
  saveDatabase(db);

  // Invalidate any active session for the deleted user
  for (const [token, session] of sessions.entries()) {
    if (session.userId === id) {
      sessions.delete(token);
    }
  }

  res.json({ success: true, message: 'Usuario eliminado correctamente', deletedId: id });
});

// POST /api/admin/reset-to-setup (Clear users to test or trigger First-Run Setup wizard)
app.post('/api/admin/reset-to-setup', adminMiddleware, (_req: Request, res: Response) => {
  const db = loadDatabase();
  db.users = [];
  sessions.clear();
  saveDatabase(db);
  res.json({ success: true, message: 'Usuarios eliminados. Sistema reiniciado al asistente de primer uso.' });
});

/* ================= ITEMS ROUTES ================= */

// GET /api/items
app.get('/api/items', authMiddleware, (req: Request, res: Response) => {
  const db = loadDatabase();
  const { category, search } = req.query;

  // In kNo, authenticated users access the knowledge base items
  let items = [...db.items];

  if (category && typeof category === 'string') {
    const catTarget = category.toLowerCase().trim();
    items = items.filter((item) =>
      item.categories.some((c) => {
        const cLower = c.toLowerCase();
        return cLower === catTarget || cLower.startsWith(catTarget + '/');
      })
    );
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    items = items.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(q);
      const contentMatch = (item.content || item.notes || '').toLowerCase().includes(q);
      const catMatch = item.categories.some((c) => c.toLowerCase().includes(q));
      const urlMatch = item.urls?.some(
        (u) => u.url.toLowerCase().includes(q) || u.description.toLowerCase().includes(q)
      );
      return titleMatch || contentMatch || catMatch || urlMatch;
    });
  }

  // Sort newest first
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ items });
});

// Helper to sanitize urls input
function sanitizeUrls(rawUrls: any): ItemUrlRecord[] {
  if (!Array.isArray(rawUrls)) return [];
  return rawUrls
    .filter((u) => u && typeof u === 'object' && (u.url || u.description))
    .map((u) => ({
      id: u.id || `url_${crypto.randomBytes(4).toString('hex')}`,
      url: String(u.url || '').trim(),
      description: String(u.description || '').trim(),
    }))
    .filter((u) => u.url.length > 0 || u.description.length > 0);
}

// POST /api/items
app.post('/api/items', authMiddleware, (req: Request, res: Response) => {
  const { title, categories, urls, content, notes } = req.body;

  if (!title || !String(title).trim()) {
    res.status(400).json({ error: 'El título es obligatorio' });
    return;
  }

  const parsedCats = parseCategories(categories || '');
  const parsedUrls = sanitizeUrls(urls);
  const markdownContent = content !== undefined ? String(content) : (notes ? String(notes) : '');
  const now = new Date().toISOString();

  const newItem: ItemRecord = {
    id: `item_${crypto.randomBytes(8).toString('hex')}`,
    userId: (req as any).user.id,
    title: String(title).trim(),
    categories: parsedCats,
    rawCategories: typeof categories === 'string' ? categories : parsedCats.join(', '),
    urls: parsedUrls,
    content: markdownContent,
    notes: markdownContent,
    createdAt: now,
    updatedAt: now,
  };

  const db = loadDatabase();
  db.items.unshift(newItem);
  saveDatabase(db);

  res.status(201).json({ item: newItem });
});

// PUT /api/items/:id
app.put('/api/items/:id', authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, categories, urls, content, notes } = req.body;

  if (!title || !String(title).trim()) {
    res.status(400).json({ error: 'El título es obligatorio' });
    return;
  }

  const db = loadDatabase();
  const index = db.items.findIndex((it) => it.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Elemento no encontrado' });
    return;
  }

  const parsedCats = parseCategories(categories || '');
  const parsedUrls = urls !== undefined ? sanitizeUrls(urls) : db.items[index].urls;
  const existing = db.items[index];

  const markdownContent = content !== undefined 
    ? String(content) 
    : (notes !== undefined ? String(notes) : (existing.content || existing.notes || ''));

  const updated: ItemRecord = {
    ...existing,
    title: String(title).trim(),
    categories: parsedCats,
    rawCategories: typeof categories === 'string' ? categories : parsedCats.join(', '),
    urls: parsedUrls,
    content: markdownContent,
    notes: markdownContent,
    updatedAt: new Date().toISOString(),
  };

  db.items[index] = updated;
  saveDatabase(db);

  res.json({ item: updated });
});

// DELETE /api/items/:id
app.delete('/api/items/:id', authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = loadDatabase();
  const index = db.items.findIndex((it) => it.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Elemento no encontrado' });
    return;
  }

  db.items.splice(index, 1);
  saveDatabase(db);

  res.json({ success: true, deletedId: id });
});

/* ================= DEV & STATIC SERVING ================= */

async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`kNo server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
