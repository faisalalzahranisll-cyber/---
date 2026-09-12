// البيانات الأساسية وحالة النظام
let driverData = JSON.parse(localStorage.getItem('driverData')) || null;
let activeIncident = JSON.parse(localStorage.getItem('activeIncident')) || null;
let closedIncidents = JSON.parse(localStorage.getItem('closedIncidents')) || [];

document.addEventListener("DOMContentLoaded", () => {
    checkDriverStatus();
    renderRescueView();
    renderCompanyView();
    renderProfileView();

    // مزامنة وتحديث تلقائي كل ثانية بين الواجهات
    setInterval(() => {
        activeIncident = JSON.parse(localStorage.getItem('activeIncident')) || null;
        closedIncidents = JSON.parse(localStorage.getItem('closedIncidents')) || [];
        renderDriverTimeline();
        renderRescueView();
        renderCompanyView();
    }, 1000);
});

// التنقل بين الأقسام
function switchTab(tab) {
    document.getElementById('btnDriverTab').classList.toggle('active', tab === 'driver');
    document.getElementById('btnRescueTab').classList.toggle('active', tab === 'rescue');
    document.getElementById('btnCompanyTab').classList.toggle('active', tab === 'company');

    document.getElementById('driverView').classList.toggle('hidden', tab !== 'driver' && tab !== 'profile');
    document.getElementById('rescueView').classList.toggle('hidden', tab !== 'rescue');
    document.getElementById('companyView').classList.toggle('hidden', tab !== 'company');
    document.getElementById('profileView').classList.toggle('hidden', tab !== 'profile');

    if (tab === 'company') renderCompanyView();
    if (tab === 'profile') renderProfileView();
    if (tab === 'rescue') renderRescueView();
}

// حفظ بيانات السائق
function saveDriverInfo(e) {
    e.preventDefault();
    driverData = {
        name: document.getElementById('driverNameInput').value,
        plate: document.getElementById('plateInput').value,
        truck: document.getElementById('truckInput').value
    };
    localStorage.setItem('driverData', JSON.stringify(driverData));
    checkDriverStatus();
}

// التحقق من حالة السائق
function checkDriverStatus() {
    if (!driverData) {
        document.getElementById('setupFormCard').classList.remove('hidden');
        document.getElementById('driverDashboard').classList.add('hidden');
        return;
    }

    document.getElementById('setupFormCard').classList.add('hidden');
    document.getElementById('driverDashboard').classList.remove('hidden');

    const firstName = driverData.name.split(' ')[0];
    document.getElementById('welcomeDriverName').innerText = `مرحباً، ${firstName}`;
    document.getElementById('welcomeTruckInfo').innerText = `${driverData.truck} — 6 ساعات قيادة اليوم`;
    document.getElementById('displayPlateTag').innerHTML = driverData.plate.replace(' ', '<br>');

    renderDriverTimeline();
}

// التحكم بالنافذة المنبثقة
function openEmergencyModal() {
    document.getElementById('emergencyModal').classList.remove('hidden');
}

function closeEmergencyModal() {
    document.getElementById('emergencyModal').classList.add('hidden');
}

// إنشاء بلاغ جديد
function createReport(title, severity) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    activeIncident = {
        id: Date.now(),
        driverName: driverData.name,
        plate: driverData.plate,
        truck: driverData.truck,
        title: title,
        severity: severity,
        statusStep: 1, 
        assignedUnit: '',
        history: [{ step: 'بانتظار فريق', time: timeStr }]
    };

    localStorage.setItem('activeIncident', JSON.stringify(activeIncident));
    closeEmergencyModal();
    renderDriverTimeline();
    renderRescueView();
    renderCompanyView();
}

// عرض الخط الزمني للبلاغ النشط
function renderDriverTimeline() {
    const sosArea = document.getElementById('sosButtonArea');
    const tracker = document.getElementById('activeIncidentTracker');

    if (!activeIncident) {
        sosArea.classList.remove('hidden');
        tracker.classList.add('hidden');
        return;
    }

    sosArea.classList.add('hidden');
    tracker.classList.remove('hidden');

    document.getElementById('incidentTitle').innerText = activeIncident.title;
    
    const tagPill = document.getElementById('incidentTag');
    const badgeSeverity = document.getElementById('incidentStatusBadge');

    badgeSeverity.innerText = activeIncident.severity;
    badgeSeverity.className = `status-badge ${activeIncident.severity === 'حرجة' ? 'critical' : (activeIncident.severity === 'عالية' ? 'high' : 'normal')}`;

    if (activeIncident.statusStep === 1) {
        tagPill.innerText = "بانتظار فريق";
        tagPill.className = "status-pill orange";
    } else if (activeIncident.statusStep === 2) {
        tagPill.innerText = "تم قبول المهمة";
        tagPill.className = "status-pill orange";
    } else if (activeIncident.statusStep === 3) {
        tagPill.innerText = "الفريق في الطريق";
        tagPill.className = "status-pill orange";
    } else if (activeIncident.statusStep === 4) {
        tagPill.innerText = "وصل الفريق للموقع";
        tagPill.className = "status-pill green";
    }

    const unitEl = document.getElementById('assignedUnitText');
    if (activeIncident.assignedUnit) {
        unitEl.classList.remove('hidden');
        unitEl.innerText = `— تم التكليف: ${activeIncident.assignedUnit}`;
    } else {
        unitEl.classList.add('hidden');
    }

    const timelineContainer = document.getElementById('driverTimeline');
    timelineContainer.innerHTML = activeIncident.history.map((item, index) => {
        const isLast = index === activeIncident.history.length - 1;
        return `
            <div class="timeline-step">
                <div class="timeline-step-info">
                    <h4>${item.step}</h4>
                    <span>${item.time}</span>
                </div>
                <div class="timeline-marker">
                    <div class="dot-green"></div>
                    ${!isLast ? '<div class="line-connector"></div>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

// دالة عرض محطة ساسكو ثابته
function findNearestGasStation() {
    const resultBox = document.getElementById('gasResultBox');
    const statusText = document.getElementById('gasStatusText');

    resultBox.classList.remove('hidden');
    statusText.style.color = "#2ec4b6";
    statusText.innerHTML = `📍 <strong>أقرب محطة:</strong> محطة ساسكو 12 كم`;
}

// عرض واجهة الإنقاذ
function renderRescueView() {
    const activeList = document.getElementById('rescueActiveList');
    const closedList = document.getElementById('rescueClosedList');
    
    document.getElementById('activeCount').innerText = activeIncident ? 1 : 0;

    if (!activeIncident) {
        activeList.innerHTML = `<p style="color: #6c7a89; font-size: 13px; text-align: center;">لا توجد بلاغات نشطة حالياً.</p>`;
    } else {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
        
        let actionBtnHTML = '';
        if (activeIncident.statusStep === 1) {
            actionBtnHTML = `<button class="action-btn yellow" onclick="updateRescueStatus(2, 'تم قبول المهمة', 'أمن الطرق — الوحدة 1')">قبول المهمة</button>`;
        } else if (activeIncident.statusStep === 2) {
            actionBtnHTML = `
                <button class="action-btn yellow" disabled>تم قبول المهمة</button>
                <button class="action-btn yellow" onclick="updateRescueStatus(3, 'الفريق في الطريق')">تحديث: الفريق في الطريق</button>
            `;
        } else if (activeIncident.statusStep === 3) {
            actionBtnHTML = `
                <button class="action-btn yellow" disabled>الفريق في الطريق</button>
                <button class="action-btn yellow" onclick="updateRescueStatus(4, 'وصل الفريق للموقع')">تحديث: وصلنا للموقع</button>
            `;
        } else if (activeIncident.statusStep === 4) {
            actionBtnHTML = `
                <button class="action-btn green" disabled>وصلنا للموقع</button>
                <button class="action-btn red" onclick="closeIncident()">إغلاق البلاغ</button>
            `;
        }

        activeList.innerHTML = `
            <div class="rescue-card">
                <div class="rescue-card-top">
                    <span class="status-badge ${activeIncident.severity === 'حرجة' ? 'critical' : (activeIncident.severity === 'عالية' ? 'high' : 'normal')}">${activeIncident.severity}</span>
                    <span class="time-stamp">${timeStr}</span>
                </div>
                <h2>${activeIncident.title}</h2>
                <p style="font-size: 13px; color: #a0aec0; margin: 6px 0;">${activeIncident.driverName} • ${activeIncident.plate} • ${activeIncident.truck}</p>
                <p style="font-size: 12px; color: #6c7a89;">الجهة المسؤولة المتوقعة: أمن الطرق، الإسعاف، الدفاع المدني</p>
                <div class="rescue-actions">
                    ${actionBtnHTML}
                </div>
            </div>
        `;
    }

    if (closedIncidents.length === 0) {
        closedList.innerHTML = `<p style="color: #6c7a89; font-size: 13px; text-align: center;">لا توجد بلاغات مغلقة مؤخراً.</p>`;
    } else {
        closedList.innerHTML = closedIncidents.map(inc => `
            <div class="closed-item">
                <span style="font-size: 14px; font-weight: bold; color: #fff;">${inc.title} — ${inc.driverName.split(' ')[0]}</span>
                <span class="closed-badge">تم إغلاق البلاغ</span>
            </div>
        `).join('');
    }
}

// تحديث حالة البلاغ
function updateRescueStatus(step, stepText, unit = '') {
    if (!activeIncident) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    activeIncident.statusStep = step;
    if (unit) activeIncident.assignedUnit = unit;
    
    activeIncident.history.push({ step: stepText, time: timeStr });
    localStorage.setItem('activeIncident', JSON.stringify(activeIncident));

    renderDriverTimeline();
    renderRescueView();
    renderCompanyView();
}

// إغلاق وتخزين البلاغ
function closeIncident() {
    if (!activeIncident) return;

    closedIncidents.unshift(activeIncident);
    localStorage.setItem('closedIncidents', JSON.stringify(closedIncidents));

    activeIncident = null;
    localStorage.removeItem('activeIncident');

    renderDriverTimeline();
    renderRescueView();
    renderCompanyView();
}

// عرض واجهة الشركة
function renderCompanyView() {
    document.getElementById('companyActiveCount').innerText = activeIncident ? 1 : 0;
    document.getElementById('companyClosedCount').innerText = closedIncidents.length;

    const companyClosedList = document.getElementById('companyClosedList');
    if (closedIncidents.length === 0) {
        companyClosedList.innerHTML = `<p style="color: #6c7a89; font-size: 13px; text-align: center;">لا توجد بلاغات مكتملة في الأرشيف.</p>`;
    } else {
        companyClosedList.innerHTML = closedIncidents.map(inc => `
            <div class="closed-item">
                <div>
                    <strong style="display:block; font-size:14px; color:#fff;">${inc.title}</strong>
                    <span style="font-size:12px; color:#8b98a5;">السائق: ${inc.driverName} (${inc.plate})</span>
                </div>
                <span class="closed-badge">مكتمل</span>
            </div>
        `).join('');
    }
}

// عرض الملف الشخصي
function renderProfileView() {
    if (!driverData) return;
    document.getElementById('profName').innerText = driverData.name;
    document.getElementById('profPlate').innerText = driverData.plate;
    document.getElementById('profTruck').innerText = driverData.truck;
}

// مسح البيانات
function resetDriverData() {
    if (confirm("هل أنت متأكد من مسح البيانات وإعادة التجربة من جديد؟")) {
        localStorage.clear();
        driverData = null;
        activeIncident = null;
        closedIncidents = [];
        switchTab('driver');
        checkDriverStatus();
    }
}