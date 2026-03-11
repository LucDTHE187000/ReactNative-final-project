// Fields Page JavaScript

let allFields = [];

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadFields();
});

function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
        window.location.href = '/login.html';
        return;
    }

    try {
        const userData = JSON.parse(user);
        document.getElementById('userName').textContent = 'Xin chào, ' + userData.name;
    } catch (e) {
        console.error('Error parsing user data:', e);
    }
}

async function loadFields() {
    try {
        const response = await fetch('/api/fields');
        allFields = await response.json();
        renderFields(allFields);
    } catch (error) {
        console.error('Error loading fields:', error);
        document.getElementById('fieldsGrid').innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #FB8500;">Lỗi tải dữ liệu sân bóng</p>';
    }
}

function renderFields(fields) {
    const fieldsGrid = document.getElementById('fieldsGrid');
    const noResults = document.getElementById('noResults');

    if (fields.length === 0) {
        fieldsGrid.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';
    fieldsGrid.innerHTML = fields.map(field => {
        const imageUrl = field.image ? field.image : '/images/default.jpg';
        const price = field.pricePerHour || 0;
        const rating = 4.0; // Default rating
        const ratingCount = 15; // Default count

        return `
            <div class="field-card" onclick="goToBooking('${field._id}')">
                <div class="field-image">
                    <img src="${imageUrl}" alt="${field.name}" onerror="this.src='/images/default.jpg'">
                </div>
                <div class="field-info">
                    <span class="field-type">${field.type}</span>
                    <h3 class="field-name">${field.name}</h3>
                    <div class="field-location">${field.location}</div>
                    <div class="field-rating">
                        <span class="stars">★ ${rating}</span>
                        <span class="rating-count">(${ratingCount})</span>
                    </div>
                    <div class="field-footer">
                        <div>
                            <div class="field-price">${price.toLocaleString('vi-VN')}₫</div>
                            <span class="price-unit">/giờ</span>
                        </div>
                        <button class="btn-book">Đặt sân</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function filterFields() {
    const searchValue = document.getElementById('searchInput').value.toLowerCase();
    const typeValue = document.getElementById('typeFilter').value;

    const filtered = allFields.filter(field => {
        const matchSearch = field.name.toLowerCase().includes(searchValue) || 
                           field.location.toLowerCase().includes(searchValue);
        const matchType = typeValue === '' || field.type === typeValue;
        return matchSearch && matchType;
    });

    renderFields(filtered);
}

function goToBooking(fieldId) {
    window.location.href = `/booking.html?id=${fieldId}`;
}

function handleLogout() {
    if (confirm('Bạn chắc chắn muốn đăng xuất?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    }
}
