const socket = io('http://localhost:3000');
        let historicalData = null;
        let selectedDate = null;

        // Đặt ngày hiện tại mặc định cho datePicker
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('datePicker').value = today;

        async function fetchValue() {
            try {
                const todayResponse = await fetch('http://localhost:3000/api/latest-gold-price');
                const todayData = await todayResponse.json();
                console.log("todayData", todayData);
                const currentData = todayData.data.map(item => ({
                    gold_type: item.gold_type,
                    buy_price: item.buy_price,
                    sell_price: item.sell_price,
                    updated_at: item.updated_at
                }));

                updateTable(currentData, historicalData);
                document.getElementById('updateTime').textContent = `Cập nhật lúc: ${new Date().toLocaleString('vi-VN')}`;
            } catch (error) {
                console.error('Error:', error);
                document.getElementById('priceTable').innerHTML = '<tr><td colspan="3">Lỗi khi tải dữ liệu</td></tr>';
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
                const data = await response.json();
                console.log("data vs ngàyngày",data)

                historicalData = data.data.map(item => ({
                    gold_type: item.gold_type,
                    buy_price: item.buy_price,
                    sell_price: item.sell_price,
                    updated_at: item.updated_at
                }));

                updateTable(null, historicalData);
            } catch (error) {
                console.error('Error:', error);
                historicalData = null;
                updateTable(null, null);
            }
        }

        function updateTable(currentData, historicalData) {
            let currentPrices = currentData;
            if (!currentPrices) {
                fetchValue();
            } else {
                renderTable(currentPrices, historicalData);
            }
        }

        function renderTable(currentData, historicalData) {
            const tableBody = document.getElementById('priceTable');
            tableBody.innerHTML = '';

            if (!currentData || currentData.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="3">Không có dữ liệu</td></tr>';
                return;
            }

            // Hiển thị dữ liệu hiện tại
            currentData.forEach((item, index) => {
                const row = document.createElement('tr');
                if (index === 0) row.classList.add('highlight');
                row.innerHTML = `
                    <td>${item.gold_type}</td>
                    <td>${item.buy_price}</td>
                    <td>${item.sell_price}</td>
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
                        <td>${item.buy_price}</td>
                        <td>${item.sell_price}</td>
                    `;
                    tableBody.appendChild(row);
                });
            }
        }

        socket.on('gold_update', (data) => {
            console.log('Received gold_update:', data);
            fetchValue();
        });

        fetchValue();