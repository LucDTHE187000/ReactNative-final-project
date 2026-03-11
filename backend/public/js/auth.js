// Authentication JavaScript

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMsg');

    // Validation
    if (!email || !password) {
        showError('Vui lòng điền đầy đủ thông tin');
        return;
    }

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showError(data.message || 'Đăng nhập thất bại');
            return;
        }

        // Lưu token
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirect đến trang danh sách sân
        window.location.href = '/fields.html';
    } catch (error) {
        console.error('Login error:', error);
        showError('Lỗi kết nối, vui lòng thử lại');
    }
}

async function handleRegister(event) {
    event.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorMsg = document.getElementById('errorMsg');

    // Validation
    if (!name || !email || !password || !confirmPassword) {
        showError('Vui lòng điền đầy đủ thông tin');
        return;
    }

    if (password !== confirmPassword) {
        showError('Mật khẩu không khớp');
        return;
    }

    if (password.length < 6) {
        showError('Mật khẩu phải ít nhất 6 ký tự');
        return;
    }

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showError(data.message || 'Đăng ký thất bại');
            return;
        }

        // Đăng ký thành công, redirect đến trang login
        showSuccess('Đăng ký thành công! Chuyển hướng đến đăng nhập...');
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 2000);
    } catch (error) {
        console.error('Register error:', error);
        showError('Lỗi kết nối, vui lòng thử lại');
    }
}

function showError(message) {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.textContent = message;
    errorMsg.classList.add('show');
    errorMsg.classList.remove('success-message');
}

function showSuccess(message) {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.textContent = message;
    errorMsg.classList.add('show', 'success-message');
}
