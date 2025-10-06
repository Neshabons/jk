import express from 'express';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Инициализация базы данных
const db = new sqlite3.Database('./chat.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initDatabase();
    }
});

// Создание таблиц
function initDatabase() {
    // Таблица пользователей
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            user_key TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating users table:', err);
        } else {
            console.log('Users table ready');
        }
    });
// Таблица заявок
db.run(`
    CREATE TABLE IF NOT EXISTS requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_key TEXT NOT NULL,
        username TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'medium',
        status TEXT NOT NULL DEFAULT 'new',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_key) REFERENCES users (user_key)
    )
`, (err) => {
    if (err) {
        console.error('Error creating requests table:', err);
    } else {
        console.log('Requests table ready');
    }
});
    // Таблица сообщений
    db.run(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_key TEXT NOT NULL,
            username TEXT NOT NULL,
            text TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_key) REFERENCES users (user_key)
        )
    `, (err) => {
        if (err) {
            console.error('Error creating messages table:', err);
        } else {
            console.log('Messages table ready');
        }
    });
}

// Middleware для проверки авторизации
function authenticateToken(req, res, next) {
    const userKey = req.headers['authorization'];
    
    console.log('Auth check:', { userKey: userKey ? 'present' : 'missing' });
    
    if (!userKey) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }

    db.get('SELECT * FROM users WHERE user_key = ?', [userKey], (err, user) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Ошибка базы данных' });
        }
        if (!user) {
            console.log('User not found for key:', userKey);
            return res.status(403).json({ error: 'Неверный ключ пользователя' });
        }
        req.user = user;
        next();
    });
}

// Регистрация пользователя
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    console.log('Registration attempt for:', username);

    if (!username || !password) {
        return res.status(400).json({ error: 'Заполните все поля' });
    }

    if (username.length < 3 || password.length < 3) {
        return res.status(400).json({ error: 'Имя пользователя и пароль должны быть не менее 3 символов' });
    }

    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const userKey = uuidv4();

        db.run(
            'INSERT INTO users (username, password_hash, user_key) VALUES (?, ?, ?)',
            [username, passwordHash, userKey],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Пользователь с таким именем уже существует' });
                    }
                    console.error('Registration error:', err);
                    return res.status(500).json({ error: 'Ошибка базы данных' });
                }

                console.log('User registered successfully:', username);
                res.json({ 
                    success: true,
                    message: 'Регистрация успешна!',
                    userKey: userKey 
                });
            }
        );
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Вход пользователя
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    console.log('Login attempt for:', username);

    if (!username || !password) {
        return res.status(400).json({ error: 'Заполните все поля' });
    }

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) {
            console.error('Login error:', err);
            return res.status(500).json({ error: 'Ошибка базы данных' });
        }

        if (!user) {
            return res.status(400).json({ error: 'Пользователь не найден' });
        }

        try {
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(400).json({ error: 'Неверный пароль' });
            }

            console.log('Login successful for:', username);
            res.json({ 
                success: true,
                message: 'Вход выполнен успешно',
                userKey: user.user_key,
                username: user.username
            });
        } catch (error) {
            console.error('Password comparison error:', error);
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });
});

// Получение сообщений
app.get('/api/messages', authenticateToken, (req, res) => {
    console.log('Fetching messages for user:', req.user.username);

    db.all(
        `SELECT username, text, timestamp 
         FROM messages 
         ORDER BY timestamp ASC 
         LIMIT 100`,
        (err, rows) => {
            if (err) {
                console.error('Error fetching messages:', err);
                return res.status(500).json({ error: 'Ошибка базы данных' });
            }
            res.json(rows);
        }
    );
});

// Отправка сообщения
app.post('/api/messages', authenticateToken, (req, res) => {
    const { text } = req.body;
    const { user_key, username } = req.user;

    console.log('New message from:', username);

    if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'Сообщение не может быть пустым' });
    }

    db.run(
        'INSERT INTO messages (user_key, username, text) VALUES (?, ?, ?)',
        [user_key, username, text.trim()],
        function(err) {
            if (err) {
                console.error('Error saving message:', err);
                return res.status(500).json({ error: 'Ошибка сохранения сообщения' });
            }
            res.json({ 
                success: true,
                message: 'Сообщение отправлено',
                messageId: this.lastID 
            });
        }
    );
});

// Получение информации о пользователе
app.get('/api/user', authenticateToken, (req, res) => {
    res.json({
        username: req.user.username,
        userKey: req.user.user_key
    });
});

// Миграция старых данных из localStorage (опционально)
app.post('/api/migrate', authenticateToken, (req, res) => {
    const { oldMessages } = req.body;
    
    if (!oldMessages || !Array.isArray(oldMessages)) {
        return res.status(400).json({ error: 'Некорректные данные для миграции' });
    }

    let migratedCount = 0;
    
    oldMessages.forEach(msg => {
        db.run(
            'INSERT OR IGNORE INTO messages (user_key, username, text, timestamp) VALUES (?, ?, ?, ?)',
            [req.user.user_key, msg.username, msg.text, new Date(msg.timestamp).toISOString()],
            function(err) {
                if (!err) migratedCount++;
            }
        );
    });

    res.json({ 
        success: true,
        message: `Мигрировано ${migratedCount} сообщений` 
    });
});


// Маршруты для HTML страниц
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'site.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/requests', (req, res) => {
    res.sendFile(path.join(__dirname, 'requests.html'));
});

app.get('/requests.html', (req, res) => {
    res.redirect('/requests');
});
// Если запрашивают index.html - перенаправляем на site.html
app.get('/index.html', (req, res) => {
    res.redirect('/');
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Database: chat.db`);
    console.log(`🔐 API endpoints available at /api/`);
});

// Обработка graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});
// Создание заявки
app.post('/api/requests', authenticateToken, (req, res) => {
    const { title, description, priority = 'medium' } = req.body;
    const { user_key, username } = req.user;

    console.log('New request from:', username);

    if (!title || !description) {
        return res.status(400).json({ error: 'Заполните название и описание' });
    }

    db.run(
        `INSERT INTO requests (user_key, username, title, description, priority, status) 
         VALUES (?, ?, ?, ?, ?, 'new')`,
        [user_key, username, title.trim(), description.trim(), priority],
        function(err) {
            if (err) {
                console.error('Error saving request:', err);
                return res.status(500).json({ error: 'Ошибка сохранения заявки' });
            }
            
            res.json({ 
                success: true,
                message: 'Заявка создана успешно',
                requestId: this.lastID 
            });
        }
    );
});

// Получение всех заявок
app.get('/api/requests', authenticateToken, (req, res) => {
    db.all(
        `SELECT id, username, title, description, priority, status, created_at, updated_at
         FROM requests 
         ORDER BY created_at DESC`,
        (err, rows) => {
            if (err) {
                console.error('Error fetching requests:', err);
                return res.status(500).json({ error: 'Ошибка загрузки заявок' });
            }
            res.json(rows);
        }
    );
});

// Получение заявок текущего пользователя
app.get('/api/my-requests', authenticateToken, (req, res) => {
    const { user_key } = req.user;

    db.all(
        `SELECT id, username, title, description, priority, status, created_at, updated_at
         FROM requests 
         WHERE user_key = ?
         ORDER BY created_at DESC`,
        [user_key],
        (err, rows) => {
            if (err) {
                console.error('Error fetching user requests:', err);
                return res.status(500).json({ error: 'Ошибка загрузки заявок' });
            }
            res.json(rows);
        }
    );
});

// Удаление заявки
app.delete('/api/requests/:id', authenticateToken, (req, res) => {
    const requestId = req.params.id;
    const { user_key } = req.user;

    db.get(
        'SELECT * FROM requests WHERE id = ? AND user_key = ?',
        [requestId, user_key],
        (err, request) => {
            if (err) {
                console.error('Error finding request:', err);
                return res.status(500).json({ error: 'Ошибка базы данных' });
            }

            if (!request) {
                return res.status(404).json({ error: 'Заявка не найдена или у вас нет прав для удаления' });
            }

            db.run(
                'DELETE FROM requests WHERE id = ?',
                [requestId],
                function(err) {
                    if (err) {
                        console.error('Error deleting request:', err);
                        return res.status(500).json({ error: 'Ошибка удаления заявки' });
                    }
                    
                    res.json({ 
                        success: true,
                        message: 'Заявка удалена успешно'
                    });
                }
            );
        }
    );
});

// Обновление статуса заявки (для админов/менеджеров)
app.patch('/api/requests/:id/status', authenticateToken, (req, res) => {
    const requestId = req.params.id;
    const { status } = req.body;

    const allowedStatuses = ['new', 'in-progress', 'completed', 'rejected'];
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: 'Недопустимый статус' });
    }

    db.run(
        'UPDATE requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, requestId],
        function(err) {
            if (err) {
                console.error('Error updating request:', err);
                return res.status(500).json({ error: 'Ошибка обновления заявки' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Заявка не найдена' });
            }
            
            res.json({ 
                success: true,
                message: 'Статус заявки обновлен'
            });
        }
    );
});
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
