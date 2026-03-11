// JavaScript for SportBooking Landing Page

// Khi trang load, lấy danh sách sân
document.addEventListener('DOMContentLoaded', function() {
    loadFieldTypes();
});

// Lấy danh sách các loại sân từ API
async function loadFieldTypes() {
    try {
        const response = await fetch('/api/fields');
        const fields = await response.json();
        
        // Group fields by type
        const fieldsByType = {};
        fields.forEach(field => {
            if (!fieldsByType[field.type]) {
                fieldsByType[field.type] = [];
            }
            fieldsByType[field.type].push(field);
        });

        // Render field types
        const fieldTypesContainer = document.getElementById('fieldTypes');
        fieldTypesContainer.innerHTML = '';

        const typeIcons = {
            'Sân 5': '⚽',
            'Sân 7': '⚽',
            'Sân 11': '⚽'
        };

        Object.keys(fieldsByType).sort().forEach(type => {
            const count = fieldsByType[type].length;
            const icon = typeIcons[type] || '⚽';

            const card = document.createElement('div');
            card.className = 'field-type-card';
            card.innerHTML = `
                <div class="field-type-image">${icon}</div>
                <div class="field-type-info">
                    <div class="field-type-name">${type}</div>
                    <div class="field-type-count">${count} sân có sẵn</div>
                </div>
            `;
            card.onclick = () => {
                // Lưu type vào localStorage để dùng ở trang danh sách
                localStorage.setItem('selectedFieldType', type);
                goFieldsByType();
            };

            fieldTypesContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading fields:', error);
        // Fallback - show default field types
        showDefaultFieldTypes();
    }
}

function showDefaultFieldTypes() {
    const fieldTypes = ['Sân 5', 'Sân 7', 'Sân 11'];
    const fieldTypesContainer = document.getElementById('fieldTypes');
    fieldTypesContainer.innerHTML = '';

    const typeIcons = {
        'Sân 5': '⚽',
        'Sân 7': '⚽',
        'Sân 11': '⚽'
    };

    fieldTypes.forEach(type => {
        const card = document.createElement('div');
        card.className = 'field-type-card';
        card.innerHTML = `
            <div class="field-type-image">${typeIcons[type]}</div>
            <div class="field-type-info">
                <div class="field-type-name">${type}</div>
                <div class="field-type-count">Xem chi tiết</div>
            </div>
        `;
        card.onclick = () => {
            localStorage.setItem('selectedFieldType', type);
            goFieldsByType();
        };

        fieldTypesContainer.appendChild(card);
    });
}

// Navigation functions
function goLogin() {
    window.location.href = '/login.html';
}

function goRegister() {
    window.location.href = '/register.html';
}

function goFieldsByType() {
    window.location.href = '/fields.html';
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});
