// Global Variables
let currentSlide = 0;
const slides = document.querySelectorAll('.carousel-slide');
let isLoggedIn = false;
let currentUser = null;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeCarousel();
    initializeForms();
    initializeAnimations();
    initializeMobileMenu();
});

// Carousel Functions
function initializeCarousel() {
    if (slides.length > 0) {
        showSlide(0);
        // Auto-play carousel
        setInterval(nextSlide, 5000);
    }
}

function showSlide(index) {
    const track = document.getElementById('carouselTrack');
    if (track && slides.length > 0) {
        currentSlide = (index + slides.length) % slides.length;
        track.style.transform = `translateX(-${currentSlide * 100}%)`;
        
        // Update active slide
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === currentSlide);
        });
    }
}

function nextSlide() {
    showSlide(currentSlide + 1);
}

function prevSlide() {
    showSlide(currentSlide - 1);
}

// Modal Functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Add animation
        const modalContent = modal.querySelector('.modal-content');
        modalContent.style.animation = 'fadeInUp 0.3s ease forwards';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function switchModal(fromModalId, toModalId) {
    closeModal(fromModalId);
    setTimeout(() => openModal(toModalId), 100);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            closeModal(modal.id);
        }
    });
}

// Form Initialization
function initializeForms() {
    // Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register Form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Forgot Password Form
    const forgotForm = document.getElementById('forgotForm');
    if (forgotForm) {
        forgotForm.addEventListener('submit', handleForgotPassword);
    }
    
    // Transaction Form
    const transactionForm = document.getElementById('transactionForm');
    if (transactionForm) {
        transactionForm.addEventListener('submit', handleTransactionCheck);
    }
}

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password'),
        rememberMe: formData.get('rememberMe') === 'on'
    };
    
    try {
        showLoading(e.target.querySelector('.submit-btn'));
        
        // Simulate API call
        const response = await simulateLogin(loginData);
        
        if (response.success) {
            isLoggedIn = true;
            currentUser = response.user;
            
            // Store in localStorage if remember me is checked
            if (loginData.rememberMe) {
                localStorage.setItem('vallblox_user', JSON.stringify(currentUser));
            }
            
            showSuccess('Login berhasil! Selamat datang kembali.');
            closeModal('loginModal');
            updateUIForLoggedInUser();
        } else {
            showError(response.message || 'Login gagal. Periksa email dan password Anda.');
        }
    } catch (error) {
        showError('Terjadi kesalahan. Silakan coba lagi.');
        console.error('Login error:', error);
    } finally {
        hideLoading(e.target.querySelector('.submit-btn'));
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const registerData = {
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        phoneNumber: formData.get('phoneNumber'),
        password: formData.get('password')
    };
    
    // Validation
    if (!validateRegisterData(registerData)) {
        return;
    }
    
    try {
        showLoading(e.target.querySelector('.submit-btn'));
        
        // Simulate API call
        const response = await simulateRegister(registerData);
        
        if (response.success) {
            showSuccess('Registrasi berhasil! Silakan login dengan akun baru Anda.');
            closeModal('registerModal');
            setTimeout(() => openModal('loginModal'), 1000);
        } else {
            showError(response.message || 'Registrasi gagal. Silakan coba lagi.');
        }
    } catch (error) {
        showError('Terjadi kesalahan. Silakan coba lagi.');
        console.error('Register error:', error);
    } finally {
        hideLoading(e.target.querySelector('.submit-btn'));
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    
    if (!validateEmail(email)) {
        showError('Masukkan email yang valid.');
        return;
    }
    
    try {
        showLoading(e.target.querySelector('.submit-btn'));
        
        // Simulate API call
        const response = await simulateForgotPassword(email);
        
        if (response.success) {
            showSuccess('Link reset password telah dikirim ke email Anda.');
            closeModal('forgotModal');
        } else {
            showError(response.message || 'Email tidak ditemukan.');
        }
    } catch (error) {
        showError('Terjadi kesalahan. Silakan coba lagi.');
        console.error('Forgot password error:', error);
    } finally {
        hideLoading(e.target.querySelector('.submit-btn'));
    }
}

// Transaction Functions
async function handleTransactionCheck(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const transactionId = formData.get('transactionId');
    
    if (!transactionId.trim()) {
        showError('Masukkan ID transaksi yang valid.');
        return;
    }
    
    try {
        showLoading(e.target.querySelector('.submit-btn'));
        
        // Simulate API call to check transaction
        const response = await simulateTransactionCheck(transactionId);
        
        const resultDiv = document.getElementById('transactionResult');
        if (resultDiv) {
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = generateTransactionResult(response);
        }
        
    } catch (error) {
        showError('Terjadi kesalahan saat mengecek transaksi.');
        console.error('Transaction check error:', error);
    } finally {
        hideLoading(e.target.querySelector('.submit-btn'));
    }
}

// Midtrans Integration
async function initiateMidtransPayment(productData) {
    try {
        // This would typically call your backend API
        const response = await fetch('/api/create-transaction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser?.token}`
            },
            body: JSON.stringify({
                product_id: productData.id,
                product_name: productData.name,
                price: productData.price,
                customer_details: {
                    first_name: currentUser?.fullName || 'Guest',
                    email: currentUser?.email || 'guest@vallblox.com',
                    phone: currentUser?.phoneNumber || '081234567890'
                }
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.snap_token) {
            // Initialize Midtrans Snap
            window.snap.pay(data.snap_token, {
                onSuccess: function(result) {
                    showSuccess('Pembayaran berhasil! Pesanan Anda sedang diproses.');
                    console.log('Payment success:', result);
                },
                onPending: function(result) {
                    showInfo('Pembayaran pending. Silakan selesaikan pembayaran Anda.');
                    console.log('Payment pending:', result);
                },
                onError: function(result) {
                    showError('Pembayaran gagal. Silakan coba lagi.');
                    console.log('Payment error:', result);
                },
                onClose: function() {
                    console.log('Payment popup closed');
                }
            });
        } else {
            throw new Error(data.message || 'Failed to create transaction');
        }
    } catch (error) {
        showError('Gagal memproses pembayaran. Silakan coba lagi.');
        console.error('Midtrans payment error:', error);
    }
}

// Product Purchase Handler
function handleProductPurchase(productElement) {
    if (!isLoggedIn) {
        showError('Silakan login terlebih dahulu untuk melakukan pembelian.');
        openModal('loginModal');
        return;
    }
    
    const productData = {
        id: productElement.dataset.productId,
        name: productElement.querySelector('h3').textContent,
        price: parseInt(productElement.querySelector('.price').textContent.replace(/[^\d]/g, '')),
        image: productElement.querySelector('img').src
    };
    
    // Show confirmation modal
    showPurchaseConfirmation(productData);
}

function showPurchaseConfirmation(productData) {
    const confirmationHTML = `
        <div class="purchase-confirmation">
            <h3>Konfirmasi Pembelian</h3>
            <div class="product-summary">
                <img src="${productData.image}" alt="${productData.name}">
                <div>
                    <h4>${productData.name}</h4>
                    <p class="price">Rp ${productData.price.toLocaleString('id-ID')}</p>
                </div>
            </div>
            <div class="confirmation-buttons">
                <button onclick="proceedToPayment(${JSON.stringify(productData).replace(/"/g, '"')})" class="confirm-btn">
                    Lanjut Pembayaran
                </button>
                <button onclick="closeConfirmation()" class="cancel-btn">Batal</button>
            </div>
        </div>
    `;
    
    // Create and show confirmation modal
    const confirmationModal = document.createElement('div');
    confirmationModal.className = 'modal';
    confirmationModal.id = 'purchaseConfirmation';
    confirmationModal.innerHTML = `
        <div class="modal-content">
            ${confirmationHTML}
        </div>
    `;
    
    document.body.appendChild(confirmationModal);
    openModal('purchaseConfirmation');
}

function proceedToPayment(productData) {
    closeConfirmation();
    initiateMidtransPayment(productData);
}

function closeConfirmation() {
    const modal = document.getElementById('purchaseConfirmation');
    if (modal) {
        closeModal('purchaseConfirmation');
        setTimeout(() => modal.remove(), 300);
    }
}

// Utility Functions
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateRegisterData(data) {
    if (!data.fullName.trim()) {
        showError('Nama lengkap harus diisi.');
        return false;
    }
    
    if (!validateEmail(data.email)) {
        showError('Email tidak valid.');
        return false;
    }
    
    if (!data.phoneNumber.trim()) {
        showError('Nomor telepon harus diisi.');
        return false;
    }
    
    if (data.password.length < 6) {
        showError('Password minimal 6 karakter.');
        return false;
    }
    
    return true;
}

function showLoading(button) {
    if (button) {
        button.disabled = true;
        button.textContent = 'Loading...';
    }
}

function hideLoading(button) {
    if (button) {
        button.disabled = false;
        // Restore original text based on button context
        if (button.closest('#loginForm')) {
            button.textContent = 'Sign In';
        } else if (button.closest('#registerForm')) {
            button.textContent = 'Create Account';
        } else if (button.closest('#forgotForm')) {
            button.textContent = 'Reset Password';
        } else if (button.closest('#transactionForm')) {
            button.textContent = 'Cek Status';
        }
    }
}

// Notification Functions
function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showInfo(message) {
    showNotification(message, 'info');
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add notification styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        z-index: 3000;
        background: ${type === 'success' ? 'linear-gradient(135deg, #4CAF50, #45a049)' : 
                    type === 'error' ? 'linear-gradient(135deg, #f44336, #da190b)' : 
                    'linear-gradient(135deg, #2196F3, #0b7dda)'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        animation: slideInRight 0.3s ease forwards;
        max-width: 350px;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Add notification animations to CSS
const notificationStyles = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 15px;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Mobile Menu Functions
function initializeMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', toggleMobileMenu);
    }
}

function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    
    if (navMenu && mobileToggle) {
        navMenu.classList.toggle('active');
        mobileToggle.classList.toggle('active');
    }
}

// Animation Functions
function initializeAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.product-card, .category-item, .info-item');
    animateElements.forEach(el => observer.observe(el));
}

// Update UI for logged in user
function updateUIForLoggedInUser() {
    const authButtons = document.querySelector('.auth-buttons');
    if (authButtons && currentUser) {
        authButtons.innerHTML = `
            <div class="user-menu">
                <span class="user-name">Hi, ${currentUser.fullName}</span>
                <button class="btn-logout" onclick="handleLogout()">Logout</button>
            </div>
        `;
    }
}

function handleLogout() {
    isLoggedIn = false;
    currentUser = null;
    localStorage.removeItem('vallblox_user');
    
    // Restore auth buttons
    const authButtons = document.querySelector('.auth-buttons');
    if (authButtons) {
        authButtons.innerHTML = `
            <button class="btn-login" onclick="openModal('loginModal')">Masuk</button>
            <button class="btn-register" onclick="openModal('registerModal')">Daftar</button>
        `;
    }
    
    showSuccess('Logout berhasil. Terima kasih telah menggunakan VALLBLOX!');
}

// Check for stored user on page load
function checkStoredUser() {
    const storedUser = localStorage.getItem('vallblox_user');
    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            isLoggedIn = true;
            updateUIForLoggedInUser();
        } catch (error) {
            localStorage.removeItem('vallblox_user');
        }
    }
}

// Initialize stored user check
document.addEventListener('DOMContentLoaded', checkStoredUser);

// Simulation Functions (Replace with actual API calls)
async function simulateLogin(loginData) {
    return new Promise((resolve) => {
        setTimeout(() => {
            if (loginData.email === 'admin@vallblox.com' && loginData.password === 'admin123') {
                resolve({
                    success: true,
                    user: {
                        id: 1,
                        fullName: 'Admin VALLBLOX',
                        email: loginData.email,
                        phoneNumber: '081234567890',
                        token: 'fake-jwt-token'
                    }
                });
            } else {
                resolve({
                    success: false,
                    message: 'Email atau password salah'
                });
            }
        }, 1000);
    });
}

async function simulateRegister(registerData) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                message: 'Registrasi berhasil'
            });
        }, 1000);
    });
}

async function simulateForgotPassword(email) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                message: 'Link reset password telah dikirim'
            });
        }, 1000);
    });
}

async function simulateTransactionCheck(transactionId) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const statuses = ['pending', 'processing', 'completed', 'failed'];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
            
            resolve({
                success: true,
                transaction: {
                    id: transactionId,
                    status: randomStatus,
                    product: 'PERMANENT DRAGON',
                    amount: 450000,
                    date: new Date().toLocaleDateString('id-ID'),
                    paymentMethod: 'Midtrans'
                }
            });
        }, 1000);
    });
}

function generateTransactionResult(response) {
    if (!response.success) {
        return `<p style="color: #f44336;">Transaksi tidak ditemukan.</p>`;
    }
    
    const { transaction } = response;
    const statusColors = {
        pending: '#FFA500',
        processing: '#2196F3',
        completed: '#4CAF50',
        failed: '#f44336'
    };
    
    const statusTexts = {
        pending: 'Menunggu Pembayaran',
        processing: 'Sedang Diproses',
        completed: 'Selesai',
        failed: 'Gagal'
    };
    
    return `
        <div class="transaction-details">
            <h4>Detail Transaksi</h4>
            <div class="detail-row">
                <span>ID Transaksi:</span>
                <span>${transaction.id}</span>
            </div>
            <div class="detail-row">
                <span>Produk:</span>
                <span>${transaction.product}</span>
            </div>
            <div class="detail-row">
                <span>Jumlah:</span>
                <span>Rp ${transaction.amount.toLocaleString('id-ID')}</span>
            </div>
            <div class="detail-row">
                <span>Tanggal:</span>
                <span>${transaction.date}</span>
            </div>
            <div class="detail-row">
                <span>Status:</span>
                <span style="color: ${statusColors[transaction.status]}; font-weight: bold;">
                    ${statusTexts[transaction.status]}
                </span>
            </div>
            <div class="detail-row">
                <span>Metode Pembayaran:</span>
                <span>${transaction.paymentMethod}</span>
            </div>
        </div>
    `;
}

// Add buy button event listeners
document.addEventListener('DOMContentLoaded', function() {
    const buyButtons = document.querySelectorAll('.buy-btn');
    buyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productCard = this.closest('.product-card');
            handleProductPurchase(productCard);
        });
    });
});

// Navigation handlers
document.addEventListener('DOMContentLoaded', function() {
    // Transaction check navigation
    const transactionLinks = document.querySelectorAll('a[href="#transactions"]');
    transactionLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            openModal('transactionModal');
        });
    });
});

// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});
