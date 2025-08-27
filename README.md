# VALLBLOX - Premium Gaming Store

A modern, responsive gaming store website clone inspired by EXSTORE, featuring a sleek black and gold gradient design with integrated payment processing via Midtrans.

## 🎮 Features

### Frontend
- **Modern Design**: Black and gold gradient theme with fancy stroke effects
- **Responsive Layout**: Mobile-first design that works on all devices
- **Interactive UI**: Smooth animations and transitions
- **Product Showcase**: Dynamic product grid with filtering
- **User Authentication**: Login, register, and password reset functionality
- **Shopping Cart**: Add to cart and checkout process
- **Transaction Tracking**: Real-time order status updates

### Backend
- **RESTful API**: Express.js backend with MySQL database
- **Secure Authentication**: JWT-based user authentication
- **Payment Integration**: Midtrans payment gateway integration
- **Database Management**: MySQL with connection pooling
- **Security Features**: Password hashing, rate limiting, CORS protection
- **Transaction Management**: Complete order lifecycle management

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- Midtrans account (for payment processing)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/vallblox-store.git
   cd vallblox-store
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Database Setup**
   ```bash
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE vallblox_store;
   exit
   ```

4. **Environment Configuration**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env file with your configurations
   nano .env
   ```

5. **Configure Midtrans**
   - Sign up at [Midtrans](https://midtrans.com/)
   - Get your Server Key and Client Key
   - Add them to your `.env` file

6. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

7. **Access the application**
   - Open your browser and go to `http://localhost:3000`

## 🛠️ Configuration

### Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=vallblox_store

# JWT
JWT_SECRET=your_jwt_secret

# Midtrans
MIDTRANS_SERVER_KEY=your_server_key
MIDTRANS_CLIENT_KEY=your_client_key
MIDTRANS_IS_PRODUCTION=false
```

### Database Schema

The application automatically creates the following tables:
- `users` - User accounts and profiles
- `products` - Gaming products and services
- `transactions` - Order and payment records
- `password_reset_tokens` - Password reset functionality

## 📱 API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/forgot-password` - Password reset request

### Products
- `GET /api/products` - Get all products
- `GET /api/products?category=blox-fruit` - Get products by category

### Transactions
- `POST /api/create-transaction` - Create new transaction
- `GET /api/transaction/:id` - Get transaction status
- `GET /api/user/transactions` - Get user transaction history
- `POST /api/midtrans-notification` - Midtrans webhook

## 🎨 Design Features

### Color Scheme
- **Primary**: Black (#000000) to Dark Gray (#1a1a1a) gradients
- **Accent**: Gold (#FFD700) to Orange (#FFA500) gradients
- **Text**: White (#ffffff) with gold highlights
- **Borders**: Gold gradient strokes with glow effects

### Typography
- **Headers**: Orbitron (futuristic, gaming-style font)
- **Body**: Rajdhani (clean, modern sans-serif)
- **Weights**: 300-900 for various emphasis levels

### Animations
- Smooth hover transitions
- Fade-in animations on scroll
- Pulse effects for call-to-action buttons
- Slide transitions for carousels

## 💳 Payment Integration

### Midtrans Setup
1. Create a Midtrans account
2. Get your sandbox/production keys
3. Configure webhook URL: `https://yourdomain.com/api/midtrans-notification`
4. Test with provided test cards

### Supported Payment Methods
- Credit/Debit Cards (Visa, Mastercard, JCB)
- Bank Transfer (BCA, BNI, BRI, Mandiri)
- E-Wallets (GoPay, OVO, DANA, LinkAja)
- Convenience Stores (Alfamart, Indomaret)

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: Prevent API abuse
- **CORS Protection**: Cross-origin request security
- **Input Validation**: Sanitize and validate all inputs
- **SQL Injection Prevention**: Parameterized queries

## 📊 Database Structure

### Users Table
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Products Table
```sql
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(500),
    category VARCHAR(100),
    stock_quantity INT DEFAULT 0,
    transaction_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);
```

### Transactions Table
```sql
CREATE TABLE transactions (
    id VARCHAR(100) PRIMARY KEY,
    user_id INT,
    product_id INT,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed'),
    midtrans_order_id VARCHAR(100),
    snap_token VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🚀 Deployment

### Production Deployment

1. **Server Setup**
   ```bash
   # Install PM2 for process management
   npm install -g pm2
   
   # Start application with PM2
   pm2 start server.js --name vallblox-api
   ```

2. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **SSL Certificate**
   ```bash
   # Install Certbot
   sudo apt install certbot python3-certbot-nginx
   
   # Get SSL certificate
   sudo certbot --nginx -d yourdomain.com
   ```

### Environment Setup
- Set `NODE_ENV=production`
- Use production Midtrans keys
- Configure production database
- Set up proper logging
- Enable HTTPS

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Coverage report
npm run test:coverage
```

### Test Accounts
- **Admin**: admin@vallblox.com / admin123
- **Test User**: test@vallblox.com / test123

### Test Cards (Midtrans Sandbox)
- **Success**: 4811 1111 1111 1114
- **Failure**: 4911 1111 1111 1113
- **Challenge**: 4411 1111 1111 1118

## 📈 Performance Optimization

### Frontend
- Image optimization and lazy loading
- CSS and JS minification
- Gzip compression
- Browser caching headers

### Backend
- Database connection pooling
- Query optimization with indexes
- Response caching
- Rate limiting

### Database
- Proper indexing on frequently queried columns
- Connection pooling
- Query optimization
- Regular maintenance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

**Database Connection Error**
```bash
# Check MySQL service
sudo systemctl status mysql

# Restart MySQL
sudo systemctl restart mysql
```

**Midtrans Integration Issues**
- Verify server and client keys
- Check webhook URL configuration
- Ensure proper HTTPS setup for production

**Port Already in Use**
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Getting Help
- 📧 Email: support@vallblox.com
- 💬 Discord: [VALLBLOX Community](https://discord.gg/vallblox)
- 📖 Documentation: [docs.vallblox.com](https://docs.vallblox.com)

## 🎯 Roadmap

### Version 2.0
- [ ] Admin dashboard
- [ ] Inventory management
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Mobile app (React Native)

### Version 2.1
- [ ] Loyalty program
- [ ] Referral system
- [ ] Live chat support
- [ ] Advanced search filters
- [ ] Wishlist functionality

## 🏆 Acknowledgments

- Original design inspiration from EXSTORE
- Midtrans for payment processing
- MySQL for database management
- Express.js community
- All contributors and testers

---

**Made with ❤️ by the VALLBLOX Team**

For more information, visit our [website](https://vallblox.com) or follow us on [social media](https://twitter.com/vallblox).
