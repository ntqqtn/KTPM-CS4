const socket = io('http://localhost:3000');
let historicalData = null;
let selectedDate = null;

const today = new Date().toISOString().split('T')[0];
document.getElementById('datePicker').value = today;

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

async function fetchValue() {
  try {
    const response = await fetch('http://localhost:3000/api/latest-gold-price');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const { data } = await response.json();
    updateTable(data, historicalData);
    document.getElementById('updateTime').textContent = `Cập nhật lúc: ${new Date().toLocaleString('vi-VN')}`;
  } catch (err) {
    console.error('Error fetching prices:', err.message);
    document.getElementById('priceTable').innerHTML = `<tr><td colspan="3">Lỗi: ${err.message}</td></tr>`;
    showToast('Lỗi khi tải dữ liệu', 'error');
  }
}

async function loadHistoricalData() {
  const datePicker = document.getElementById('datePicker').value;
  selectedDate = datePicker;
  if (!datePicker) {
    historicalData = null;
    fetchValue();
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/price-with-date/${datePicker}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const { data } = await response.json();
    historicalData = data.map(item => ({
      gold_type: item.gold_type,
      buy_price: item.buy_price,
      sell_price: item.sell_price,
      updated_at: item.updated_at
    }));
    updateTable(null, historicalData);
  } catch (err) {
    console.error('Error fetching historical data:', err.message);
    historicalData = null;
    updateTable(null, null);
    showToast('Lỗi khi tải dữ liệu lịch sử', 'error');
  }
}

function updateTable(currentData, historicalData) {
  if (!currentData) {
    fetchValue();
  } else {
    renderTable(currentData, historicalData);
  }
}

function renderTable(currentData, historicalData) {
  const tableBody = document.getElementById('priceTable');
  tableBody.innerHTML = '';

  if (!currentData || currentData.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="3">Không có dữ liệu</td></tr>';
    return;
  }

  currentData.forEach((item, index) => {
    const row = document.createElement('tr');
    if (index === 0) row.classList.add('highlight');
    row.innerHTML = `
      <td>${item.gold_type}</td>
      <td>${item.buy_price.toLocaleString('vi-VN')}</td>
      <td>${item.sell_price.toLocaleString('vi-VN')}</td>
    `;
    tableBody.appendChild(row);
  });

  if (historicalData && historicalData.length > 0 && selectedDate !== today) {
    const separatorRow = document.createElement('tr');
    separatorRow.classList.add('separator');
    separatorRow.innerHTML = `<td colspan="3">Giá lịch sử (${new Date(selectedDate).toLocaleDateString('vi-VN')})</td>`;
    tableBody.appendChild(separatorRow);

    historicalData.forEach((item, index) => {
      const row = document.createElement('tr');
      if (index === 0) row.classList.add('highlight');
      row.innerHTML = `
        <td>${item.gold_type}</td>
        <td>${item.buy_price.toLocaleString('vi-VN')}</td>
        <td>${item.sell_price.toLocaleString('vi-VN')}</td>
      `;
      tableBody.appendChild(row);
    });
  }
}

socket.on('gold_update', (data) => {
  console.log('Received gold_update:', data);
  if (data.action === 'add' || data.action === 'delete') {
    fetchValue();
  }
});

fetchValue();