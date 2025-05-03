const socket = io('http://localhost:3000');
        const form = document.getElementById('gold-form');

        async function fetchValue() {
            try {
                const response = await fetch('http://localhost:3000/api/latest-gold-price');
                if (!response.ok) {
                    throw new Error(`Failed to fetch latest prices: ${response.status} ${response.statusText}`);
                }
                const data = await response.json();
                console.log("data_latest_price", data.data);
                renderTable(data.data);
            } catch (error) {
                console.error('Error in fetchValue:', error);
                document.getElementById('priceTable').innerHTML = '<tr><td colspan="5">Lỗi khi tải dữ liệu: ' + error.message + '</td></tr>';
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
                    <td>${item.buy_price}</td>
                    <td>${item.sell_price}</td>
                    <td>${new Date(item.updated_at).toLocaleString('vi-VN')}</td>
                    <td>
                        <button onclick="enableEdit(this)" class="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2">Update</button>
                        <button onclick="deleteGoldType('${item.gold_type}')" class="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Xóa</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }

        fetchValue();

        // Gửi dữ liệu form lên server qua fetch
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const gold_type = document.getElementById('gold_type').value.toUpperCase();
            const buy_price = parseFloat(document.getElementById('buy_price').value);
            const sell_price = parseFloat(document.getElementById('sell_price').value);
            const updated_at = new Date().toISOString();

            try {
                const res = await fetch('http://localhost:3000/api/admin-add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ gold_type, buy_price, sell_price, updated_at })
                });

                if (!res.ok) {
                    throw new Error(`Failed to submit data: ${res.status} ${res.statusText}`);
                }

                const result = await res.json();
                alert(result.message);
            } catch (error) {
                console.error('Error in form submit:', error);
                alert('Lỗi khi gửi dữ liệu: ' + error.message);
            }
        });

        // Nhận dữ liệu mới từ server qua socket
        socket.on('gold_update', (data) => {
            console.log('Received gold_update:', data);
            fetchValue(); // Tải lại bảng khi nhận được cập nhật
        });

        // Hàm kích hoạt chế độ chỉnh sửa
        function enableEdit(button) {
            const row = button.parentElement.parentElement;
            const cells = row.getElementsByTagName('td');

            const gold_type = cells[0].innerText;
            const buy_price = cells[1].innerText;
            const sell_price = cells[2].innerText;
            const updated_at = cells[3].innerText;

            cells[0].innerHTML = `<input type="text" class="edit-input" value="${gold_type}" />`;
            cells[1].innerHTML = `<input type="number" step="0.01" class="edit-input" value="${buy_price}" />`;
            cells[2].innerHTML = `<input type="number" step="0.01" class="edit-input" value="${sell_price}" />`;
            cells[3].innerHTML = updated_at;
            cells[4].innerHTML = `
                <button onclick="saveEdit(this)" class="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 mr-2">Save</button>
                <button onclick="deleteGoldType('${gold_type}')" class="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Xóa</button>
            `;
        }

        // Hàm lưu dữ liệu sau khi chỉnh sửa
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
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ gold_type, buy_price, sell_price, updated_at })
                });

                if (!res.ok) {
                    throw new Error(`Failed to save data: ${res.status} ${res.statusText}`);
                }

                const result = await res.json();
                alert(result.message);

                cells[0].innerHTML = gold_type;
                cells[1].innerHTML = buy_price;
                cells[2].innerHTML = sell_price;
                cells[3].innerHTML = new Date(updated_at).toLocaleString('vi-VN');
                cells[4].innerHTML = `
                    <button onclick="enableEdit(this)" class="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2">Update</button>
                    <button onclick="deleteGoldType('${gold_type}')" class="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Xóa</button>
                `;
            } catch (error) {
                console.error('Error in saveEdit:', error);
                alert('Lỗi khi cập nhật dữ liệu: ' + error.message);
            }
        }

        // Hàm xóa loại vàng
        async function deleteGoldType(gold_type) {
            if (confirm(`Bạn có chắc chắn muốn xóa tất cả dữ liệu của ${gold_type}? Hành động này không thể hoàn tác.`)) {
                try {
                    const res = await fetch('http://localhost:3000/delete-gold-type', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ gold_type })
                    });

                    if (!res.ok) {
                        const text = await res.text(); // Lấy phản hồi gốc để gỡ lỗi
                        console.error('Delete response:', text);
                        throw new Error(`Failed to delete: ${res.status} ${res.statusText}`);
                    }

                    const result = await res.json();
                    alert(result.message);
                } catch (error) {
                    console.error('Error in deleteGoldType:', error);
                    alert('Lỗi khi xóa dữ liệu: ' + error.message);
                }
            }
        }