const socket = io('http://localhost:3000');
const loginForm = document.getElementById('login-form');
const goldForm = document.getElementById('gold-form');
const registerAdminForm = document.getElementById('register-admin-form');
const changePasswordForm = document.getElementById('change-password-form');
const loginSection = document.getElementById('login-section');
const mainSection = document.getElementById('main-section');
const changePasswordSection = document.getElementById('change-password-section');
const changePasswordMessage = document.getElementById('change-password-message');
const logoutBtn = document.getElementById('logout-btn');
const registerAdminBtn = document.getElementById('register-admin-btn');
const changePasswordBtn = document.getElementById('change-password-btn');
const registerModal = document.getElementById('register-modal');
const closeModal = document.getElementsByClassName('close');
let currentUsername = null;

loginSection.style.display = 'block';
mainSection.style.display = 'none';
changePasswordSection.style.display = 'none';

function showToast(message, type = 'success') {
  Toastify({
    text: message,
    duration: 3000,
    gravity: 'top',
    position: 'right',
    style: {
      background: type === 'success' ? '#4caf50' : '#f44336'
    }
  }).showToast();
}

function showSection(sectionToShow) {
  loginSection.style.display = 'none';
  mainSection.style.display = 'none';
  changePasswordSection.style.display = 'none';
  sectionToShow.style.display = 'block';
}

async function checkLogin() {
  try {
    const res = await fetch('http://localhost:3000/api/check-auth', {
      method: 'GET',
      credentials: 'include'
    });
    if (res.ok) {
      showSection(mainSection);
      fetchValue();
    } else {
      showSection(loginSection);
      document.cookie = 'jwt_token=; Max-Age=0; path=/;';
      document.cookie = 'refresh_token=; Max-Age=0; path=/;';
    }
  } catch (err) {
    console.error('Error checking login:', err.message);
    showSection(loginSection);
    document.cookie = 'jwt_token=; Max-Age=0; path=/;';
    document.cookie = 'refresh_token=; Max-Age=0; path=/;';
  }
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  try {
    const res = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `HTTP ${res.status}`);
    }
    if (data.mustChangePassword) {
      currentUsername = data.username;
      document.getElementById('change-username').value = currentUsername;
      changePasswordMessage.textContent = 'Bạn cần thay đổi mật khẩu mặc định trước khi tiếp tục.';
      showSection(changePasswordSection);
      showToast(data.message, 'error');
    } else {
      currentUsername = username;
      showToast(data.message);
      checkLogin();
    }
  } catch (err) {
    console.error('Error logging in:', err.message);
    showToast(`Lỗi đăng nhập: ${err.message}`, 'error');
  }
});

registerAdminBtn.addEventListener('click', () => {
  registerModal.style.display = 'block';
});

changePasswordBtn.addEventListener('click', () => {
  if (!currentUsername) {
    showToast('Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại', 'error');
    return;
  }
  document.getElementById('change-username').value = currentUsername;
  changePasswordMessage.textContent = 'Nhập mật khẩu cũ và mật khẩu mới để thay đổi.';
  showSection(changePasswordSection);
});

for (let i = 0; i < closeModal.length; i++) {
  closeModal[i].addEventListener('click', () => {
    registerModal.style.display = 'none';
    registerAdminForm.reset();
  });
}

window.addEventListener('click', (event) => {
  if (event.target == registerModal) {
    registerModal.style.display = 'none';
    registerAdminForm.reset();
  }
});

registerAdminForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('new-username').value;
  const password = document.getElementById('new-password').value;
  try {
    const res = await fetch('http://localhost:3000/api/register-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include'
    });
    if (!res.ok) {
      const { message } = await res.json();
      throw new Error(message || `HTTP ${res.status}`);
    }
    const { message } = await res.json();
    showToast(message);
    registerAdminForm.reset();
    registerModal.style.display = 'none';
  } catch (err) {
    console.error('Error registering admin:', err.message);
    showToast(`Lỗi đăng ký: ${err.message}`, 'error');
  }
});

changePasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('change-username').value;
  const oldPassword = document.getElementById('old-password').value;
  const newPassword = document.getElementById('new-password').value;
  try {
    const res = await fetch('http://localhost:3000/api/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, oldPassword, newPassword }),
      credentials: 'include'
    });
    if (!res.ok) {
      const { message } = await res.json();
      throw new Error(message || `HTTP ${res.status}`);
    }
    const { message } = await res.json();
    showToast(message);
    changePasswordForm.reset();
    showSection(loginSection);
    document.cookie = 'jwt_token=; Max-Age=0; path=/;';
    document.cookie = 'refresh_token=; Max-Age=0; path=/;';
  } catch (err) {
    console.error('Error changing password:', err.message);
    showToast(`Lỗi thay đổi mật khẩu: ${err.message}`, 'error');
  }
});

logoutBtn.addEventListener('click', async () => {
  try {
    const res = await fetch('http://localhost:3000/api/logout', {
      method: 'POST',
      credentials: 'include'
    });
    if (!res.ok) {
      const { message } = await res.json();
      throw new Error(message || `HTTP ${res.status}`);
    }
    const { message } = await res.json();
    showToast(message);
    currentUsername = null;
    checkLogin();
  } catch (err) {
    console.error('Error logging out:', err.message);
    showToast(`Lỗi đăng xuất: ${err.message}`, 'error');
  }
});

async function fetchValue() {
  try {
    const res = await fetch('http://localhost:3000/api/latest-gold-price', {
      credentials: 'include'
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const { data } = await res.json();
    renderTable(data);
  } catch (err) {
    console.error('Error fetching prices:', err.message);
    document.getElementById('priceTable').innerHTML = `<tr><td colspan="5">Lỗi: ${err.message}</td></tr>`;
    showToast('Lỗi khi tải dữ liệu', 'error');
  }
}

function renderTable(data) {
  const tableBody = document.getElementById('priceTable');
  tableBody.innerHTML = '';
  if (!data || data.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5">Không có dữ liệu</td></tr>';
    return;
  }
  data.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.gold_type}</td>
      <td>${item.buy_price.toLocaleString('vi-VN')}</td>
      <td>${item.sell_price.toLocaleString('vi-VN')}</td>
      <td>${new Date(item.updated_at).toLocaleString('vi-VN')}</td>
      <td>
        <button onclick="enableEdit(this)" class="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2">Cập nhật</button>
        <button onclick="deleteGoldType('${item.gold_type}')" class="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Xóa</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

goldForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const gold_type = document.getElementById('gold_type').value.toUpperCase();
  const buy_price = parseFloat(document.getElementById('buy_price').value);
  const sell_price = parseFloat(document.getElementById('sell_price').value);
  const updated_at = new Date().toISOString();
  console.log('Sending data:', { gold_type, buy_price, sell_price, updated_at });
  if (!gold_type || isNaN(buy_price) || isNaN(sell_price)) {
    showToast('Vui lòng nhập đầy đủ và đúng định dạng dữ liệu', 'error');
    return;
  }
  try {
    const res = await fetch('http://localhost:3000/api/admin-add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ gold_type, buy_price, sell_price, updated_at }),
      credentials: 'include'
    });
    if (!res.ok) {
      const { message } = await res.json();
      throw new Error(message || `HTTP ${res.status}`);
    }
    const { message } = await res.json();
    showToast(message);
    goldForm.reset();
    fetchValue();
  } catch (err) {
    console.error('Error submitting form:', err.message);
    showToast(`Lỗi: ${err.message}`, 'error');
  }
});

socket.on('gold_update', (data) => {
  console.log('Received gold_update:', data);
  if (data.action === 'add' || data.action === 'delete') {
    fetchValue();
  }
});

function enableEdit(button) {
  const row = button.parentElement.parentElement;
  const cells = row.getElementsByTagName('td');
  const gold_type = cells[0].innerText;
  const buy_price = parseFloat(cells[1].innerText.replace(/[^0-9.-]+/g, ''));
  const sell_price = parseFloat(cells[2].innerText.replace(/[^0-9.-]+/g, ''));
  const updated_at = cells[3].innerText;
  cells[0].innerHTML = `<input type="text" class="edit-input" value="${gold_type}" />`;
  cells[1].innerHTML = `<input type="number" step="0.01" class="edit-input" value="${buy_price}" />`;
  cells[2].innerHTML = `<input type="number" step="0.01" class="edit-input" value="${sell_price}" />`;
  cells[3].innerHTML = updated_at;
  cells[4].innerHTML = `
    <button onclick="saveEdit(this)" class="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 mr-2">Lưu</button>
    <button onclick="deleteGoldType('${gold_type}')" class="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Xóa</button>
  `;
}

async function saveEdit(button) {
  const row = button.parentElement.parentElement;
  const cells = row.getElementsByTagName('td');
  const inputs = row.getElementsByTagName('input');
  const gold_type = inputs[0].value.toUpperCase();
  const buy_price = parseFloat(inputs[1].value);
  const sell_price = parseFloat(inputs[2].value);
  const updated_at = new Date().toISOString();
  try {
    const res = await fetch('http://localhost:3000/api/admin-add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ gold_type, buy_price, sell_price, updated_at }),
      credentials: 'include'
    });
    if (!res.ok) {
      const { message } = await res.json();
      throw new Error(message || `HTTP ${res.status}`);
    }
    const { message } = await res.json();
    showToast(message);
    fetchValue();
  } catch (err) {
    console.error('Error saving edit:', err.message);
    showToast(`Lỗi: ${err.message}`, 'error');
  }
}

async function deleteGoldType(gold_type) {
  if (!confirm(`Bạn có chắc chắn muốn xóa tất cả dữ liệu của ${gold_type}?`)) {
    return;
  }
  try {
    const res = await fetch('http://localhost:3000/api/admin-delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ gold_type }),
      credentials: 'include'
    });
    if (!res.ok) {
      const { message } = await res.json();
      throw new Error(message || `HTTP ${res.status}`);
    }
    const { message } = await res.json();
    showToast(message);
    fetchValue();
  } catch (err) {
    console.error('Error deleting gold type:', err.message);
    showToast(`Lỗi: ${err.message}`, 'error');
  }
}

checkLogin();