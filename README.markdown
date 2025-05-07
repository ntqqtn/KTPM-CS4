# Hệ Thống Quản Lý Giá Vàng

Hệ thống quản lý giá vàng là một ứng dụng web cho phép theo dõi và cập nhật giá vàng theo thời gian thực. Phiên bản tối ưu hóa cải thiện hiệu suất, bảo mật, và khả năng mở rộng so với hệ thống gốc, sử dụng các công nghệ hiện đại như MySQL, Redis, Socket.IO, và Sequelize. Dự án này bao gồm giao diện người dùng (`client.html`) và giao diện quản trị (`admin.html`) để quản lý dữ liệu giá vàng.

## Nội Dung

1. Cách Cài Đặt
2. Các Vấn Đề Chất Lượng Của Hệ Thống Gốc
3. Tối Ưu Hóa Đã Thực Hiện
4. Các Mẫu Thiết Kế Đã Sử Dụng
5. So Sánh Hiệu Năng
6. Công Nghệ Sử Dụng
7. Cách Cài Đặt

### Yêu Cầu

- **Node.js**: Phiên bản 16 trở lên.
- **Redis**: Tải từ https://github.com/tporadowski/redis/releases.
- **MySQL**: Hệ quản trị cơ sở dữ liệu quan hệ.
- **npm**: Công cụ quản lý gói, đi kèm với Node.js.

### Hướng Dẫn Cài Đặt

1. **Clone repository**:

   ```bash
   git clone https://github.com/ntqqtn/KTPM-CS4.git
   cd KTPM-CS4
   ```

2. **Cài đặt các gói phụ thuộc**:

   ```bash
   npm install
   ```

3. **Cấu hình môi trường**:

   - Tạo file `.env` tại thư mục gốc, sao chép nội dung từ file `.env.example`.

   - Chỉnh sửa các thông tin sau trong `.env`:

     ```env
     DB_USER=YOUR_USER        # Thay bằng tên người dùng MySQL
     DB_PASSWORD=YOUR_PASSWORD # Thay bằng mật khẩu MySQL
     ```

4. **Chạy Redis**:

   - Giải nén thư mục Redis đã tải về.

   - Chạy lệnh:

     ```bash
     redis-server
     ```

5. **Khởi chạy ứng dụng**:

   - **Backend**:

     ```bash
     npm start
     ```

   - **Frontend**:

     - Giao diện người dùng: http://localhost:3000/client.html
     - Giao diện quản trị: http://localhost:3000/admin.html
       - Đăng nhập với tài khoản mặc định:
         - Tên đăng nhập: `admin`
         - Mật khẩu: `admin123`

## Các Vấn Đề Chất Lượng Của Hệ Thống Gốc

Hệ thống ban đầu gặp nhiều hạn chế về hiệu suất, bảo mật, và khả năng mở rộng, cụ thể:

### 1. Hiệu Suất

- **Gọi API liên tục**: Hàm `fetchValue` gửi yêu cầu mỗi 2 giây, gây tải lớn cho server và lãng phí tài nguyên.
- **Thiếu cache**: Mọi truy vấn đều gọi trực tiếp SQLite, làm chậm phản hồi khi dữ liệu không thay đổi.
- **Quản lý kết nối kém**: SQLite sử dụng một kết nối chung, dễ gây nghẽn khi có nhiều truy vấn đồng thời.
- **Cơ sở dữ liệu không tối ưu**: Bảng `data` chỉ có khóa chính, thiếu chỉ mục, làm giảm tốc độ truy vấn khi dữ liệu lớn.

### 2. Bảo Mật

- **Nguy cơ SQL Injection**: Hàm `write` sử dụng template string để tạo SQL, dễ bị chèn mã độc.
- **Thiếu xác thực**: API `/add` và `/get/:id` không yêu cầu kiểm tra danh tính, dễ bị lạm dụng.

### 3. Khả Năng Sẵn Sàng

- **Phụ thuộc đơn lẻ**: Chỉ sử dụng SQLite, không có cơ chế dự phòng, dễ mất dịch vụ nếu xảy ra lỗi.
- **Thiếu xử lý lỗi**: Lỗi chỉ được trả về mà không được ghi log hoặc retry, gây khó khăn trong việc xác định nguyên nhân.

### 4. Khả Năng Sửa Đổi

- **Mã nguồn không tách biệt**: Logic API, cơ sở dữ liệu, và giao diện trộn lẫn, khó bảo trì hoặc mở rộng.
- **Thiếu kiểm thử**: Không có unit test hoặc integration test, khó đảm bảo ổn định khi thay đổi mã.

### 5. Khả Năng Mở Rộng

- **Hạn chế quy mô**: Server và SQLite chạy trên một process, dễ quá tải khi số lượng người dùng tăng.
- **SQLite không phù hợp**: Giới hạn về kết nối đồng thời, không đáp ứng được nhu cầu quy mô lớn.

## Tối Ưu Hóa Đã Thực Hiện

### 1. Chuyển từ SQLite sang MySQL

- **Mô tả**: Hệ thống gốc sử dụng SQLite với bảng `data` để lưu cặp key-value. Phiên bản tối ưu hóa chuyển sang MySQL, sử dụng **Sequelize** làm ORM để quản lý dữ liệu giá vàng, thông tin quản trị viên, và phiên đăng nhập.
- **Lợi ích**:
  - MySQL hỗ trợ xử lý khối lượng dữ liệu lớn và truy vấn đồng thời, tăng khả năng mở rộng.
  - Tính năng giao dịch và chỉ mục cải thiện hiệu suất truy vấn.
  - Sequelize cung cấp giao diện an toàn, giảm nguy cơ lỗi SQL injection.

### 2. Tích Hợp Redis Cache

- **Mô tả**: Redis được sử dụng để lưu trữ tạm thời kết quả truy vấn, như giá vàng mới nhất (`latest_gold_prices`, TTL 300 giây) và giá vàng lịch sử (`gold_prices_${date}`, TTL 3600 giây).
- **Lợi ích**:
  - Giảm tải cho MySQL bằng cách hạn chế truy vấn trực tiếp.
  - Tăng tốc độ phản hồi cho các truy vấn lặp lại.
  - TTL đảm bảo dữ liệu luôn mới, tránh hiển thị thông tin lỗi thời.

### 3. Kiểm Tra Dữ Liệu Hợp Lệ

- **Mô tả**: Hệ thống bổ sung kiểm tra đầu vào:
  - Xác thực các trường bắt buộc (`gold_type`, `sell_price`, `buy_price`, `updated_at`) trong API `/api/admin-add`.
  - Kiểm tra định dạng số thực cho giá mua và giá bán.
  - Áp dụng xác thực JWT và giới hạn tối đa 5 phiên đăng nhập.
- **Lợi ích**:
  - Ngăn chặn dữ liệu không hợp lệ hoặc độc hại.
  - Tăng cường bảo mật cho các hành động quản trị.

### 4. Sử Dụng Socket.IO cho Cập Nhật Thời Gian Thực

- **Vấn đề gốc**:
  - Client gửi yêu cầu GET mỗi 2 giây, gây lãng phí tài nguyên và giảm trải nghiệm người dùng khi mạng không ổn định.
- **Cải tiến**:
  - Tích hợp **Socket.IO** để server chủ động gửi cập nhật đến client khi có thay đổi (thêm, cập nhật, xóa giá vàng) thông qua sự kiện `gold_update`.
- **Lợi ích**:
  - Giảm số lượng yêu cầu HTTP, tiết kiệm tài nguyên server.
  - Cung cấp trải nghiệm mượt mà, tức thời cho người dùng.

### 5. Thêm Persistent Layer với ORM

- **Mô tả**: Sử dụng **Sequelize** để định nghĩa các model (`Data`, `Admin`, `RefreshToken`) và tương tác với MySQL. Các hàm như `saveGoldPrice`, `viewLatestGoldPrice`, `viewByDate` thay thế SQL thô.
- **Lợi ích**:
  - Loại bỏ nguy cơ SQL injection.
  - Dễ bảo trì và mở rộng schema dữ liệu.
  - Hỗ trợ giao dịch, chỉ mục, và truy vấn phức tạp.

### 6. Hỗ Trợ CORS

- **Mô tả**: Middleware CORS trong `server.js` cho phép ứng dụng web từ nguồn khác (ví dụ: `http://localhost:3000`) truy cập API, hỗ trợ credentials, phương thức GET/POST/DELETE, và header cụ thể.
- **Lợi ích**:
  - Tăng tính linh hoạt, hỗ trợ tích hợp đa nền tảng.
  - Đảm bảo truy cập API an toàn và được kiểm soát.

### 7. Tăng Cường Bảo Mật với JWT và Refresh Token

- **Mô tả**: Hệ thống gốc không có xác thực. Phiên bản tối ưu triển khai **JWT** và **Refresh Token**:
  - JWT xác thực các API nhạy cảm (`/api/admin-add`, `/api/admin-delete`).
  - Refresh Token duy trì phiên đăng nhập 7 ngày, giới hạn 5 phiên đồng thời.
  - Cookie sử dụng thuộc tính `httpOnly`, `secure`, và `sameSite: 'strict'`.
- **Lợi ích**:
  - Chỉ người dùng được xác thực mới thực hiện hành động quản trị.
  - Ngăn chặn tấn công XSS và CSRF, cân bằng trải nghiệm và bảo mật.

### 8. Ghi Log Bảo Mật với Winston

- **Mô tả**: Sử dụng **Winston** để ghi các sự kiện bảo mật (đăng nhập, đăng xuất, thay đổi mật khẩu, làm mới token) vào file `security.log`, bao gồm thông tin như IP, tên người dùng, và thời gian.
- **Lợi ích**:
  - Hỗ trợ giám sát và phát hiện hoạt động bất thường.
  - Cung cấp dữ liệu để phân tích và cải thiện bảo mật.

## Các Mẫu Thiết Kế Đã Sử Dụng

### 1. Publisher-Subscriber với Redis Pub-Sub

- **Vấn đề gốc**:
  - Socket.IO chỉ hoạt động trong phạm vi một server, không đồng bộ dữ liệu khi hệ thống phân tán trên nhiều server.
- **Cải tiến**:
  - Áp dụng mẫu **Publisher-Subscriber** với **Redis Pub-Sub**:
    - Server quản trị gửi thông điệp cập nhật (thêm, sửa, xóa giá vàng) qua kênh `gold-price-channel`.
    - Các server backend khác (subscriber) nhận thông điệp và sử dụng Socket.IO để đẩy cập nhật đến client.
- **Lợi ích**:
  - Đồng bộ dữ liệu thời gian thực trên kiến trúc phân tán.
  - Tăng khả năng mở rộng khi số lượng server và người dùng tăng.

### 2. Cache-Aside

- **Công nghệ**: Redis
- **Cơ chế**:
  - **Read-Through**: Kiểm tra Redis trước khi truy vấn MySQL. Nếu cache hit, trả dữ liệu từ Redis; nếu cache miss, truy vấn MySQL, lưu vào Redis, và trả về client.
  - **Write-Through**: Xóa cache (`publisher.del`) khi dữ liệu thay đổi để đảm bảo truy vấn tiếp theo lấy dữ liệu mới.
- **Lợi ích**:
  - Giảm độ trễ truy xuất dữ liệu.
  - Giảm tải cho MySQL.
  - Đảm bảo dữ liệu nhất quán.

### 3. Retry

- **Mô tả**: Áp dụng cơ chế retry trong kết nối Redis (`redis.js`) và giao dịch cơ sở dữ liệu (`goldBusiness.js`) để xử lý lỗi tạm thời.
- **Lợi ích**: Tăng độ tin cậy cho các hệ thống phân tán.

### 4. Rate Limiting

- **Mô tả**: Mã nguồn chuẩn bị tích hợp `express-rate-limit` để giới hạn số lượng yêu cầu API, ngăn chặn lạm dụng hoặc tấn công DDoS.
- **Lợi ích**: Tăng cường bảo mật và duy trì hiệu suất server.

## So Sánh Hiệu Năng

### Test POST API `/api/admin-add`

- **Hệ thống gốc (SQLite)**: Xử lý 4,800 yêu cầu trong 60 giây trước khi xảy ra lỗi.
- **Hệ thống tối ưu (MySQL)**: Xử lý 7,200 yêu cầu trong 60 giây mà không gặp lỗi.

### Test GET API `/api/latest-gold-price`

- **Hệ thống tối ưu**: Xử lý 12,000 yêu cầu trong 60 giây mà không gặp lỗi, nhờ Redis cache và tối ưu hóa truy vấn.

## Công Nghệ Sử Dụng

- **MySQL**: Lưu trữ dữ liệu giá vàng, thông tin quản trị viên, và phiên đăng nhập.
- **Sequelize**: ORM để quản lý schema và truy vấn an toàn.
- **Redis**: Cache dữ liệu và hỗ trợ publish-subscribe.
- **Socket.IO**: Cập nhật thời gian thực cho client.
- **JWT và Bcrypt**: Xác thực và mã hóa mật khẩu/token.
- **Express.js**: Framework backend xử lý API và định tuyến.
- **Tailwind CSS**: Giao diện người dùng hiện đại, dễ tùy chỉnh.
- **Toastify**: Hiển thị thông báo trực quan.
- **Winston**: Ghi log sự kiện bảo mật.
- **Cookie-Parser**: Xử lý cookie lưu trữ token.
- **Dotenv**: Quản lý biến môi trường.
