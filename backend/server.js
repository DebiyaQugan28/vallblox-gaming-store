const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const midtransClient = require('midtrans-client');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// Midtrans Configuration
const snap = new midtransClient.Snap({
    isProduction: false, // Set to true for production
    serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-YOUR_SERVER_KEY',
    clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-YOUR_CLIENT_KEY'
});

// Database Configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vallblox_store',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let db;

// Initialize Database Connection
async function initializeDatabase() {
    try {
        db = mysql.createPool(dbConfig);
        
        // Test connection
        const connection = await db.getConnection();
        console.log('Database connected successfully');
        connection.release();
        
        // Create tables if they don't exist
        await createTables();
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
}

// Create Database Tables
async function createTables() {
    try {
        // Users table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone_number VARCHAR(20) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Products table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10, 2) NOT NULL,
                image_url VARCHAR(500),
                category VARCHAR(100),
                stock_quantity INT DEFAULT 0,
                transaction_count INT DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Transactions table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS transactions (
                id VARCHAR(100) PRIMARY KEY,
                user_id INT,
                product_id INT,
                product_name VARCHAR(255) NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
                payment_method VARCHAR(50),
                midtrans_order_id VARCHAR(100),
                midtrans_transaction_id VARCHAR(100),
                snap_token VARCHAR(500),
                customer_details JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
            )
        `);

        // Password reset tokens table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                token VARCHAR(255) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                used BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Insert sample products
        await insertSampleProducts();
        
        console.log('Database tables created successfully');
    } catch (error) {
        console.error('Error creating tables:', error);
    }
}

// Insert Sample Products
async function insertSampleProducts() {
    try {
        const [existingProducts] = await db.execute('SELECT COUNT(*) as count FROM products');
        
        if (existingProducts[0].count === 0) {
            const sampleProducts = [
                {
                    name: 'PERMANENT DRAGON',
                    description: 'Permanent Dragon Fruit for Blox Fruits',
                    price: 450000,
                    image_url: 'https://exstore.id/storage/games/wPJToBIYHUdvdQMv7h5zLXDAPpmDeXG4uVqxE2yp.png',
                    category: 'Blox Fruit',
                    stock_quantity: 100,
                    transaction_count: 1552
                },
                {
                    name: 'PERMANENT KITSUNE',
                    description: 'Permanent Kitsune Fruit for Blox Fruits',
                    price: 360000,
                    image_url: 'https://exstore.id/storage/games/BjFapO0E1hiQjD1RW1tB1q6Qb5KZ51Lo5RKG8OAr.png',
                    category: 'Blox Fruit',
                    stock_quantity: 100,
                    transaction_count: 1442
                },
                {
                    name: 'PERMANENT LIGHTNING',
                    description: 'Permanent Lightning Fruit for Blox Fruits',
                    price: 189000,
                    image_url: 'https://exstore.id/storage/games/1XCKOcjLn2bvCaN0enL3i59Mv60WL7E21qAit82J.png',
                    category: 'Blox Fruit',
                    stock_quantity: 100,
                    transaction_count: 1410
                },
                {
                    name: 'PERMANENT BUDDHA',
                    description: 'Permanent Buddha Fruit for Blox Fruits',
                    price: 148500,
                    image_url: 'https://exstore.id/storage/games/dlW8AQXkQfyTGZ99z0cn8Khv7glInQ3XdMbalwOB.png',
                    category: 'Blox Fruit',
                    stock_quantity: 100,
                    transaction_count: 1523
                }
            ];

            for (const product of sampleProducts) {
                await db.execute(`
                    INSERT INTO products (name, description, price, image_url, category, stock_quantity, transaction_count)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [
                    product.name,
                    product.description,
                    product.price,
                    product.image_url,
                    product.category,
                    product.stock_quantity,
                    product.transaction_count
                ]);
            }
            
            console.log('Sample products inserted successfully');
        }
    } catch (error) {
        console.error('Error inserting sample products:', error);
    }
}

// JWT Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'vallblox_secret_key', (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Routes

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// User Registration
app.post('/api/register', async (req, res) => {
    try {
        const { fullName, email, phoneNumber, password } = req.body;

        // Validation
        if (!fullName || !email || !phoneNumber || !password) {
            return res.status(400).json({
                success: false,
                message: 'Semua field harus diisi'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password minimal 6 karakter'
            });
        }

        // Check if user already exists
        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email sudah terdaftar'
            });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert user
        const [result] = await db.execute(`
            INSERT INTO users (full_name, email, phone_number, password_hash)
            VALUES (?, ?, ?, ?)
        `, [fullName, email, phoneNumber, passwordHash]);

        res.status(201).json({
            success: true,
            message: 'Registrasi berhasil',
            userId: result.insertId
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

// User Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email dan password harus diisi'
            });
        }

        // Find user
        const [users] = await db.execute(
            'SELECT id, full_name, email, phone_number, password_hash FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Email atau password salah'
            });
        }

        const user = users[0];

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Email atau password salah'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email 
            },
            process.env.JWT_SECRET || 'vallblox_secret_key',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login berhasil',
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                phoneNumber: user.phone_number,
                token: token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

// Forgot Password
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email harus diisi'
            });
        }

        // Check if user exists
        const [users] = await db.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Email tidak ditemukan'
            });
        }

        // Generate reset token
        const resetToken = jwt.sign(
            { userId: users[0].id, email: email },
            process.env.JWT_SECRET || 'vallblox_secret_key',
            { expiresIn: '1h' }
        );

        // Store reset token in database
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
        await db.execute(`
            INSERT INTO password_reset_tokens (user_id, token, expires_at)
            VALUES (?, ?, ?)
        `, [users[0].id, resetToken, expiresAt]);

        // In a real application, you would send an email here
        // For demo purposes, we'll just return success
        res.json({
            success: true,
            message: 'Link reset password telah dikirim ke email Anda',
            resetToken: resetToken // Remove this in production
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

// Get Products
app.get('/api/products', async (req, res) => {
    try {
        const { category, limit } = req.query;
        
        let query = 'SELECT * FROM products WHERE is_active = TRUE';
        let params = [];
        
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
        
        query += ' ORDER BY transaction_count DESC';
        
        if (limit) {
            query += ' LIMIT ?';
            params.push(parseInt(limit));
        }

        const [products] = await db.execute(query, params);

        res.json({
            success: true,
            products: products
        });

    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

// Create Transaction (Midtrans Integration)
app.post('/api/create-transaction', authenticateToken, async (req, res) => {
    try {
        const { product_id, product_name, price, customer_details } = req.body;
        const userId = req.user.userId;

        // Validate input
        if (!product_id || !product_name || !price) {
            return res.status(400).json({
                success: false,
                message: 'Data produk tidak lengkap'
            });
        }

        // Generate unique order ID
        const orderId = `VALLBLOX-${Date.now()}-${userId}`;

        // Midtrans transaction parameter
        const parameter = {
            transaction_details: {
                order_id: orderId,
                gross_amount: price
            },
            credit_card: {
                secure: true
            },
            item_details: [{
                id: product_id,
                price: price,
                quantity: 1,
                name: product_name
            }],
            customer_details: customer_details || {
                first_name: "Customer",
                email: req.user.email,
                phone: "081234567890"
            }
        };

        // Create transaction with Midtrans
        const transaction = await snap.createTransaction(parameter);

        // Save transaction to database
        await db.execute(`
            INSERT INTO transactions (
                id, user_id, product_id, product_name, amount, 
                midtrans_order_id, snap_token, customer_details, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            orderId,
            userId,
            product_id,
            product_name,
            price,
            orderId,
            transaction.token,
            JSON.stringify(customer_details),
            'pending'
        ]);

        res.json({
            success: true,
            snap_token: transaction.token,
            order_id: orderId
        });

    } catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal membuat transaksi'
        });
    }
});

// Midtrans Notification Handler
app.post('/api/midtrans-notification', async (req, res) => {
    try {
        const notification = req.body;
        const orderId = notification.order_id;
        const transactionStatus = notification.transaction_status;
        const fraudStatus = notification.fraud_status;

        console.log('Midtrans notification:', notification);

        let status = 'pending';

        if (transactionStatus === 'capture') {
            if (fraudStatus === 'challenge') {
                status = 'pending';
            } else if (fraudStatus === 'accept') {
                status = 'completed';
            }
        } else if (transactionStatus === 'settlement') {
            status = 'completed';
        } else if (transactionStatus === 'cancel' || 
                   transactionStatus === 'deny' || 
                   transactionStatus === 'expire') {
            status = 'failed';
        } else if (transactionStatus === 'pending') {
            status = 'pending';
        }

        // Update transaction status
        await db.execute(`
            UPDATE transactions 
            SET status = ?, midtrans_transaction_id = ?, updated_at = CURRENT_TIMESTAMP
            WHERE midtrans_order_id = ?
        `, [status, notification.transaction_id, orderId]);

        // If completed, update product transaction count
        if (status === 'completed') {
            const [transactions] = await db.execute(
                'SELECT product_id FROM transactions WHERE midtrans_order_id = ?',
                [orderId]
            );

            if (transactions.length > 0) {
                await db.execute(`
                    UPDATE products 
                    SET transaction_count = transaction_count + 1,
                        stock_quantity = GREATEST(stock_quantity - 1, 0)
                    WHERE id = ?
                `, [transactions[0].product_id]);
            }
        }

        res.status(200).json({ success: true });

    } catch (error) {
        console.error('Midtrans notification error:', error);
        res.status(500).json({ success: false });
    }
});

// Check Transaction Status
app.get('/api/transaction/:transactionId', async (req, res) => {
    try {
        const { transactionId } = req.params;

        const [transactions] = await db.execute(`
            SELECT t.*, p.name as product_name, p.image_url
            FROM transactions t
            LEFT JOIN products p ON t.product_id = p.id
            WHERE t.id = ? OR t.midtrans_order_id = ?
        `, [transactionId, transactionId]);

        if (transactions.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transaksi tidak ditemukan'
            });
        }

        const transaction = transactions[0];

        res.json({
            success: true,
            transaction: {
                id: transaction.id,
                status: transaction.status,
                product: transaction.product_name,
                amount: transaction.amount,
                date: transaction.created_at,
                paymentMethod: 'Midtrans'
            }
        });

    } catch (error) {
        console.error('Check transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

// Get User Transactions
app.get('/api/user/transactions', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const [transactions] = await db.execute(`
            SELECT t.*, p.name as product_name, p.image_url
            FROM transactions t
            LEFT JOIN products p ON t.product_id = p.id
            WHERE t.user_id = ?
            ORDER BY t.created_at DESC
            LIMIT ? OFFSET ?
        `, [userId, parseInt(limit), offset]);

        const [countResult] = await db.execute(
            'SELECT COUNT(*) as total FROM transactions WHERE user_id = ?',
            [userId]
        );

        res.json({
            success: true,
            transactions: transactions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        });

    } catch (error) {
        console.error('Get user transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint tidak ditemukan'
    });
});

// Initialize database and start server
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`VALLBLOX Server running on port ${PORT}`);
        console.log(`Visit: http://localhost:${PORT}`);
    });
}).catch(error => {
    console.error('Failed to initialize server:', error);
    process.exit(1);
});

module.exports = app;
