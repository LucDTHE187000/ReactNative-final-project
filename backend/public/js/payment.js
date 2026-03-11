// Function to populate payment details
function populatePaymentDetails() {
  const bookingDetails = JSON.parse(sessionStorage.getItem("bookingData"));

  if (!bookingDetails) {
    alert("Không tìm thấy thông tin đặt sân!");
    window.location.href = "/booking";
    return;
  }

  document.getElementById("orderCode").textContent =
    bookingDetails.orderCode || "N/A";

  document.getElementById("detailField").textContent =
    bookingDetails.fieldName || "N/A";

  document.getElementById("detailDate").textContent =
    bookingDetails.date || "N/A";

  document.getElementById("detailTime").textContent =
    bookingDetails.startHour && bookingDetails.endHour
      ? `${bookingDetails.startHour}:00 - ${bookingDetails.endHour}:00`
      : "N/A";

  document.getElementById("detailDuration").textContent =
    bookingDetails.duration ? `${bookingDetails.duration} giờ` : "N/A";

  // Giá sân
  document.getElementById("breakdownFieldPrice").textContent =
    bookingDetails.fieldPrice
      ? `${bookingDetails.fieldPrice.toLocaleString("vi-VN")} đ`
      : "N/A";

  // Hiển thị dịch vụ
  const breakdownServices = document.getElementById("breakdownServices");
  breakdownServices.innerHTML = "";

  let serviceTotal = 0;

  if (bookingDetails.services && bookingDetails.services.length > 0) {
    bookingDetails.services.forEach((service) => {
      const item = document.createElement("div");
      item.className = "breakdown-item";

      item.innerHTML = `
        <span class="breakdown-label">${service.name}</span>
        <span class="breakdown-price">${service.price.toLocaleString("vi-VN")} đ</span>
      `;

      breakdownServices.appendChild(item);

      serviceTotal += Number(service.price);
    });
  }

  // Tổng tiền
  const total = Number(bookingDetails.fieldPrice || 0) + serviceTotal;

  document.getElementById("breakdownTotal").textContent =
    `${total.toLocaleString("vi-VN")} đ`;

  // 🔥 lưu lại total chuẩn
  bookingDetails.total = total;

  sessionStorage.setItem("bookingData", JSON.stringify(bookingDetails));
}

// Function to handle payment
function handlePay() {
  const selectedMethod = document.querySelector('input[name="method"]:checked');

  if (!selectedMethod) {
    alert("Vui lòng chọn phương thức thanh toán!");
    return;
  }

  const bookingDetails = JSON.parse(sessionStorage.getItem("bookingData"));

  if (!bookingDetails) {
    alert("Không có dữ liệu booking!");
    return;
  }

  const amount = bookingDetails.total || bookingDetails.totalPrice || 0;

  const order =
    bookingDetails.orderCode ||
    bookingDetails.bookingId ||
    "BOOKING" + Date.now();

  // QR Payment
  if (selectedMethod.value === "qr") {
    window.location.href = `/payment/qr?amount=${amount}&order=${order}`;
  }

  // ATM
  else if (selectedMethod.value === "atm") {
    window.location.href = `/payment/atm?amount=${amount}&order=${order}`;
  }

  // International
  else if (selectedMethod.value === "international") {
    window.location.href = `/payment/international?amount=${amount}&order=${order}`;
  }
}

// Function to go back
function goBack() {
  window.location.href = "/booking";
}

document.addEventListener("DOMContentLoaded", populatePaymentDetails);
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "/login.html";
}
async function confirmPayment() {

  const bookingDetails = JSON.parse(sessionStorage.getItem("bookingData"));

  if (!bookingDetails || !bookingDetails.bookingId) {
    alert("Không tìm thấy booking!");
    return;
  }

  const token = localStorage.getItem("token");

  try {

    const res = await fetch(`/api/bookings/${bookingDetails.bookingId}/confirm`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Thanh toán thất bại");
      return;
    }

    alert("Thanh toán thành công!");

    sessionStorage.removeItem("bookingData");

    window.location.href = "/booking.html";

  } catch (err) {
    console.error(err);
    alert("Lỗi server");
  }

}