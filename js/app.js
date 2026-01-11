// BİR-OBS Frontend Application Logic

// Mock User Data
const USERS = {
    students: [
        { id: '220408019', pass: '123' } // Demo user
    ],
    advisors: [
        { id: 'admin', pass: 'admin' }
    ]
};

// Global State
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on a protected page but not logged in
    const path = window.location.pathname;
    const userRole = localStorage.getItem('userRole');

    // Very basic route protection (just for demo)
    if ((path.includes('dashboard') || path.includes('course-selection')) && !userRole) {
        window.location.href = 'index.html';
    }
});

// LOGIN PAGE FUNCTIONS
function setRole(role) {
    // UI Update
    document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${role}`).classList.add('active');

    // Logic Update
    document.getElementById('selectedRole').value = role;

    // Text Update
    const label = document.getElementById('label-userId');
    if (label) label.textContent = role === 'student' ? 'Öğrenci Numarası' : 'Akademisyen ID';
}

async function handleLogin(event) {
    event.preventDefault();

    const role = document.getElementById('selectedRole').value;
    const userId = document.getElementById('userId').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, password, role })
        });

        // Parse JSON safely
        const data = await response.json().catch(() => ({}));

        if (response.ok && data.status === 'success') {
            loginSuccess(role, userId);
        } else {
            // Server returned 401 or handled error
            alert(data.message || 'Hatalı kullanıcı adı veya şifre!');
        }

    } catch (e) {
        console.error("Network Error:", e);
        alert('Sunucuya bağlanılamadı! Lütfen run_backend.bat dosyasını çalıştırın.');
    }
}

// PASSWORD CHANGE LOGIC
async function handlePasswordChange(event) {
    event.preventDefault();

    const currentPass = document.getElementById('current-password').value;
    const newPass = document.getElementById('new-password').value;
    const confirmPass = document.getElementById('confirm-password').value;
    const userId = localStorage.getItem('userId');

    if (newPass !== confirmPass) {
        alert("Yeni şifreler uyuşmuyor!");
        return;
    }

    try {
        const response = await fetch('/api/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userId, oldPassword: currentPass, newPassword: newPass })
        });

        if (response.status === 404) {
            alert("Sunucu güncellenmedi! Lütfen 'run_backend.bat' penceresini kapatıp tekrar açın.");
            return;
        }

        const data = await response.json().catch(() => ({}));

        if (response.ok && data.status === 'success') {
            alert("Şifreniz başarıyla güncellendi!");
            document.getElementById('change-password-form').reset();
        } else {
            alert(data.message || "İşlem başarısız.");
        }
    } catch (e) {
        console.error(e);
        alert("Sunucuya bağlanılamadı.");
    }
}

function loginSuccess(role, userId) {
    localStorage.setItem('userRole', role);
    localStorage.setItem('userId', userId);

    if (role === 'student') {
        window.location.href = 'dashboard.html';
    } else {
        window.location.href = 'advisor.html';
    }
}

// MOCK COURSE DATA
const COURSES = [
    { code: 'CENG301', name: 'Computer Networks', instructor: 'Dr. Ali', credit: 6, type: 'compulsory' },
    { code: 'CENG303', name: 'Software Engineering', instructor: 'Dr. Veli', credit: 6, type: 'compulsory' },
    { code: 'MATH201', name: 'Linear Algebra', instructor: 'Dr. Ayşe', credit: 5, type: 'elective' },
    { code: 'ENG102', name: 'Academic English', instructor: 'Inst. John', credit: 3, type: 'elective' },
    { code: 'HIST101', name: 'History of Republic', instructor: 'Dr. Fatma', credit: 2, type: 'compulsory' }
];

// Load from LocalStorage or empty
let selectedCourses = JSON.parse(localStorage.getItem('selectedCourses')) || [];
let approvalStatus = localStorage.getItem('approvalStatus') || 'none'; // none, pending, approved

// COURSE SELECTION LOGIC
function initCourseSelection() {
    renderDashboardCourses(); // If on dashboard

    const tableBody = document.getElementById('available-courses-list');
    if (!tableBody) return; // Not on course selection page

    // Render Available Courses
    renderAvailableCourses();
    updateBasketUI();
}

function renderAvailableCourses() {
    const listContainer = document.getElementById('available-courses-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    // Get Filter States
    const showCompulsory = document.getElementById('filter-compulsory') ? document.getElementById('filter-compulsory').checked : true;
    const showElective = document.getElementById('filter-elective') ? document.getElementById('filter-elective').checked : true;

    COURSES.forEach(course => {
        // Filter Logic
        if (course.type === 'compulsory' && !showCompulsory) return;
        if (course.type === 'elective' && !showElective) return;

        // Check if already selected
        const isSelected = selectedCourses.some(c => c.code === course.code);

        const card = document.createElement('div');
        card.className = 'course-card';
        card.innerHTML = `
            <div class="course-info">
                <h4>${course.code} - ${course.name}</h4>
                <div class="course-meta">
                    <span>👨‍🏫 ${course.instructor}</span>
                    <span>⭐️ ${course.credit} ECTS</span>
                    <span>📌 ${course.type === 'compulsory' ? 'Zorunlu' : 'Seçmeli'}</span>
                </div>
            </div>
            <button class="add-btn ${isSelected ? 'disabled' : ''}" 
                    onclick="addToBasket('${course.code}')" 
                    ${isSelected ? 'disabled' : ''}>
                +
            </button>
        `;
        listContainer.appendChild(card);
    });
}

function addToBasket(courseCode) {
    const course = COURSES.find(c => c.code === courseCode);
    if (course && !selectedCourses.find(c => c.code === courseCode)) {
        selectedCourses.push(course);
        saveData();
        renderAvailableCourses();
        updateBasketUI();
    }
}

function removeFromBasket(courseCode) {
    selectedCourses = selectedCourses.filter(c => c.code !== courseCode);
    saveData();
    renderAvailableCourses();
    updateBasketUI();
}

function updateBasketUI() {
    const basketList = document.getElementById('basket-list');
    const totalDisplay = document.getElementById('total-credits');

    basketList.innerHTML = '';

    let total = 0;

    selectedCourses.forEach(course => {
        total += course.credit;
        const li = document.createElement('li');
        li.className = 'basket-item';
        li.innerHTML = `
            <span><b>${course.code}</b> (${course.credit})</span>
            <button class="remove-btn" onclick="removeFromBasket('${course.code}')">&times;</button>
        `;
        basketList.appendChild(li);
    });

    totalDisplay.textContent = total;

    // Check Limit (Example limit 30)
    if (total > 30) {
        totalDisplay.style.color = 'red';
        // alert('Warning: You have exceeded the 30 ECTS limit!'); 
        // Alert can be annoying, visual cue is enough + text color
    } else {
        totalDisplay.style.color = 'inherit';
    }
}

function sendForApproval() {
    if (selectedCourses.length === 0) {
        alert("Lütfen en az bir ders seçiniz.");
        return;
    }

    approvalStatus = 'pending';
    localStorage.setItem('approvalStatus', approvalStatus);

    alert("Dersler danışman onayına gönderildi!");
    window.location.href = 'dashboard.html';
}

function saveData() {
    localStorage.setItem('selectedCourses', JSON.stringify(selectedCourses));
}

// Render Dashboard Table from LocalStorage
function renderDashboardCourses() {
    const tbody = document.querySelector('#dashboard-courses-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (selectedCourses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Henüz ders seçilmedi.</td></tr>';
        return;
    }

    selectedCourses.forEach(course => {
        // Determine Status Badge
        let badge = '';
        if (approvalStatus === 'approved') {
            badge = '<span class="status-badge status-approved">Onaylandı</span>';
        } else if (approvalStatus === 'pending') {
            badge = '<span class="status-badge status-pending">Danışman Onayı Bekliyor</span>';
        } else {
            badge = '<span class="status-badge" style="background:#eee; color:#666;">Taslak</span>';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${course.code}</td>
            <td>${course.name}</td>
            <td>${course.credit}</td>
            <td>${badge}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Initialize on page load
// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // ... existing auth check ...
    initCourseSelection();
    updateSidebar(); // Fix sidebar for advisors
});

function logout() {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    window.location.href = 'index.html';
}

// SHARED: Sidebar Logic
function updateSidebar() {
    const role = localStorage.getItem('userRole'); // Note: It is userRole not role
    const path = window.location.pathname;

    // Only run if user is an advisor
    if (role === 'advisor') {
        const sidebarRoleText = document.querySelector('.sidebar-header span');
        if (sidebarRoleText) sidebarRoleText.textContent = 'Danışman';

        const navLinks = document.querySelector('.nav-links');
        if (navLinks) {
            navLinks.innerHTML = `
                <li><a href="advisor.html" class="${path.includes('advisor.html') ? 'active' : ''}">👥 Öğrenciler</a></li>
                <li><a href="schedule.html" class="${path.includes('schedule.html') ? 'active' : ''}">📅 Ders Programı</a></li>
                <li><a href="settings.html" class="${path.includes('settings.html') ? 'active' : ''}">⚙️ Ayarlar</a></li>
            `;
        }

        // Update Profile Info for Advisor
        const profileName = document.querySelector('.user-info-mini p');
        const profileDept = document.querySelector('.user-info-mini span');
        if (profileName) profileName.textContent = "Dr. Danışman";
        if (profileDept) profileDept.textContent = "Bilgisayar Müh.";
    }
}

// ADVISOR LOGIC
function approveStudent(studentId) {
    if (confirm('Are you sure you want to approve this student\'s registration?')) {
        alert('Student ' + studentId + ' approved successfully.');
        // In real app: API interaction
        location.reload();
    }
}

function rejectStudent(studentId) {
    const reason = prompt('Please enter rejection reason:');
    if (reason) {
        alert('Registration rejected. Notification sent to student.');
        location.reload();
    }
}
