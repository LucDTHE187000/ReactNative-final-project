// Booking Page JavaScript

let currentField = {};
let selectedDate = null;
let selectedStartTime = null;
let selectedEndTime = null;
let currentMonth = new Date();
let bookedSlots = [];

document.addEventListener("DOMContentLoaded", function () {
  checkAuth();
  loadField();
  initializeCalendar();
  initializeTimeGrid();

  document.querySelectorAll('input[name="service"]').forEach((cb) => {
    cb.addEventListener("change", updateSummary);
  });
});

function checkAuth() {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (!token || !user) {
    window.location.href = "/login.html";
    return;
  }

  const userData = JSON.parse(user);
  document.getElementById("userName").textContent =
    "Xin chào, " + userData.name;
}

async function loadField() {
  const params = new URLSearchParams(window.location.search);
  const fieldId = params.get("id");

  if (!fieldId) {
    window.location.href = "/fields.html";
    return;
  }

  try {
    const response = await fetch(`/api/fields/${fieldId}`);
    currentField = await response.json();

    document.getElementById("fieldName").textContent = currentField.name;
    document.getElementById("summaryField").textContent = currentField.name;

    renderPriceSchedule();
  } catch (error) {
    console.error(error);
    alert("Lỗi tải sân");
  }
}

function renderPriceSchedule() {
  const priceSchedule = currentField.priceSchedule || [];
  const container = document.getElementById("priceSchedule");

  if (priceSchedule.length === 0) {
    container.innerHTML = `
        <div class="price-item">
            <div class="price-time">Giá thường</div>
            <div class="price-amount">${currentField.pricePerHour.toLocaleString("vi-VN")}</div>
            <div class="price-unit">đ/giờ</div>
        </div>
    `;

    return;
  }

  container.innerHTML = priceSchedule
    .map(
      (schedule) => `
        <div class="price-item">
            <div class="price-time">${schedule.startHour}:00 - ${schedule.endHour}:00</div>
            <div class="price-amount">${schedule.price.toLocaleString("vi-VN")}</div>
            <div class="price-unit">đ/giờ</div>
        </div>
  `,
    )
    .join("");
}

function initializeCalendar() {
  renderCalendar();
}

function renderCalendar() {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  document.getElementById("monthYear").textContent =
    `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarGrid = document.getElementById("calendarGrid");
  calendarGrid.innerHTML = "";

  const dayHeaders = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  dayHeaders.forEach((day) => {
    const header = document.createElement("div");
    header.className = "calendar-day-header";
    header.textContent = day;
    calendarGrid.appendChild(header);
  });

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.className = "calendar-day disabled";
    calendarGrid.appendChild(empty);
  }

  const today = new Date();

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);

    const dayEl = document.createElement("div");
    dayEl.className = "calendar-day";
    dayEl.textContent = day;

    if (dateObj < today && dateObj.toDateString() !== today.toDateString()) {
      dayEl.classList.add("disabled");
    } else {
      dayEl.onclick = () => selectDate(dateObj);
    }

    if (
      selectedDate &&
      dateObj.toDateString() === selectedDate.toDateString()
    ) {
      dayEl.classList.add("selected");
    }

    calendarGrid.appendChild(dayEl);
  }
}

function selectDate(date) {
  selectedDate = date;
  selectedStartTime = null;
  selectedEndTime = null;

  const formattedDate = formatDate(date);

  document.getElementById("displayDate").textContent = formattedDate;
  document.getElementById("summaryDate").textContent = formattedDate;

  document.getElementById("durationDisplay").style.display = "none";
  document.getElementById("summaryTime").textContent = "Chưa chọn";

  renderCalendar();
  loadBookedSlots();
  initializeTimeGrid();
  updateSummary();
}

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

async function loadBookedSlots() {
  if (!selectedDate) return;

  try {
    const dateStr = formatDate(selectedDate);

    const response = await fetch(
      `/api/bookings/by-date?date=${dateStr}&field=${currentField._id}`,
    );

    if (response.ok) {
      const bookings = await response.json();

      bookedSlots = [];

      bookings.forEach((b) => {
        for (let h = b.startHour; h < b.endHour; h++) {
          bookedSlots.push(h);
        }
      });

      initializeTimeGrid();
    }
  } catch (error) {
    console.error(error);
  }
}

function isHourBooked(hour) {
  return bookedSlots.includes(hour);
}

function initializeTimeGrid() {
  const timeGrid = document.getElementById("timeGrid");
  timeGrid.innerHTML = "";

  for (let hour = 6; hour < 23; hour++) {
    const btn = document.createElement("button");

    btn.className = "time-button";
    btn.textContent = `${String(hour).padStart(2, "0")}:00`;

    if (isHourBooked(hour)) {
      btn.classList.add("booked");
      btn.disabled = true;
    }

    btn.onclick = () => selectTime(hour);

    if (
      selectedStartTime !== null &&
      selectedEndTime !== null &&
      hour >= selectedStartTime &&
      hour < selectedEndTime
    ) {
      btn.classList.add("selected");
    }

    timeGrid.appendChild(btn);
  }
}

function selectTime(hour) {
  if (isHourBooked(hour)) {
    alert("Khung giờ này đã được đặt");
    return;
  }

  if (selectedStartTime === null) {
    selectedStartTime = hour;
    selectedEndTime = null;
  } else if (selectedEndTime === null) {
    if (hour <= selectedStartTime) {
      alert("Giờ kết thúc phải lớn hơn giờ bắt đầu");
      return;
    }

    for (let h = selectedStartTime; h < hour; h++) {
      if (isHourBooked(h)) {
        alert("Khoảng giờ chứa slot đã được đặt");
        selectedStartTime = null;
        selectedEndTime = null;
        initializeTimeGrid();
        return;
      }
    }

    selectedEndTime = hour;
  } else {
    selectedStartTime = hour;
    selectedEndTime = null;
  }

  let timeRange = "Chưa chọn";

  if (selectedStartTime !== null && selectedEndTime !== null) {
    const startStr = `${String(selectedStartTime).padStart(2, "0")}:00`;
    const endStr = `${String(selectedEndTime).padStart(2, "0")}:00`;

    timeRange = `${startStr} - ${endStr}`;

    const duration = selectedEndTime - selectedStartTime;

    document.getElementById("duration").textContent = duration + " giờ";

    document.getElementById("durationDisplay").style.display = "block";
  }

  document.getElementById("summaryTime").textContent = timeRange;
  document.getElementById("selectedTime").textContent = timeRange;

  initializeTimeGrid();

  updateSummary();
  updateCheckoutButton();
}

function getPriceForHour(hour) {
  if (!currentField.priceSchedule || currentField.priceSchedule.length === 0) {
    return currentField.pricePerHour;
  }

  for (let schedule of currentField.priceSchedule) {
    if (hour >= schedule.startHour && hour < schedule.endHour) {
      return schedule.price;
    }
  }

  return currentField.pricePerHour;
}

function updateSummary() {
  const summaryServices = document.getElementById("summaryServices");
  summaryServices.innerHTML = "";

  const serviceCheckboxes = document.querySelectorAll(
    'input[name="service"]:checked',
  );

  let servicesPrice = 0;

  serviceCheckboxes.forEach((cb) => {
    const name = cb
      .closest(".service-item")
      .querySelector(".service-name").textContent;

    const price = parseInt(cb.dataset.price);

    servicesPrice += price;

    const row = document.createElement("div");
    row.className = "summary-item";

    row.innerHTML = `
      <span>${name}</span>
      <strong>${price.toLocaleString("vi-VN")} đ</strong>
    `;

    summaryServices.appendChild(row);
  });

  if (selectedStartTime === null || selectedEndTime === null) {
    document.getElementById("summaryFieldPrice").textContent = "Chưa chọn";
    document.getElementById("summaryTotal").textContent =
      servicesPrice.toLocaleString("vi-VN") + " đ";

    return;
  }

  let duration = selectedEndTime - selectedStartTime;

  document.getElementById("duration").textContent = duration + " giờ";

  const summaryDuration = document.getElementById("summaryDuration");
  if (summaryDuration) {
    summaryDuration.textContent = duration + " giờ";
  }

  let fieldTotal = 0;

  for (let h = selectedStartTime; h < selectedEndTime; h++) {
    fieldTotal += getPriceForHour(h);
  }

  const pricePerHour = getPriceForHour(selectedStartTime);

  document.getElementById("summaryFieldPrice").textContent =
    pricePerHour.toLocaleString("vi-VN") + " đ";

  const total = fieldTotal + servicesPrice;

  document.getElementById("summaryTotal").textContent =
    total.toLocaleString("vi-VN") + " đ";
}

function updateCheckoutButton() {
  const btn = document.getElementById("checkoutBtn");

  const isValid =
    selectedDate && selectedStartTime !== null && selectedEndTime !== null;

  btn.disabled = !isValid;
}

async function goToPayment() {
  if (!selectedDate || selectedStartTime === null || selectedEndTime === null) {
    alert("Vui lòng chọn ngày và giờ");
    return;
  }

  const token = localStorage.getItem("token");

  const services = [];

  document.querySelectorAll('input[name="service"]:checked').forEach((cb) => {
    const serviceName = cb
      .closest(".service-item")
      .querySelector(".service-name").textContent;

    services.push({
      name: serviceName,
      price: parseInt(cb.dataset.price),
    });
  });

  let duration = selectedEndTime - selectedStartTime;

  let fieldPrice = 0;

  for (let h = selectedStartTime; h < selectedEndTime; h++) {
    fieldPrice += getPriceForHour(h);
  }

  let servicesPrice = 0;
  services.forEach((s) => (servicesPrice += s.price));

  const total = fieldPrice + servicesPrice;

  const payload = {
    fieldName: currentField.name,
    field: currentField._id,
    date: formatDate(selectedDate),
    startHour: selectedStartTime,
    endHour: selectedEndTime,
    totalPrice: total,
    services: services,
  };

  try {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Đặt sân thất bại");
      return;
    }

    sessionStorage.setItem(
      "bookingData",
      JSON.stringify({
        bookingId: data.booking._id,
        orderCode: data.orderCode,
        fieldName: currentField.name,
        fieldId: currentField._id,
        date: formatDate(selectedDate),
        startHour: selectedStartTime,
        endHour: selectedEndTime,
        duration: duration,
        fieldPrice: fieldPrice,
        services: services,
        servicesPrice: servicesPrice,
        total: total,
      }),
    );

    window.location.href = "/payment.html";
  } catch (err) {
    console.error(err);
    alert("Không kết nối được server");
  }
}

function handleLogout() {
  if (confirm("Bạn chắc chắn muốn đăng xuất?")) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/";
  }
}
