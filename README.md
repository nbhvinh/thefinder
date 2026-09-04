# The Finder

> Dự án vẫn đang được phát triển.

The Finder là nền tảng web hỗ trợ cộng đồng đăng tin **mất đồ**, **tìm thấy đồ** hoặc **bị trộm**. Ngoài việc tìm kiếm bài đăng, người dùng đã có thể gửi phiếu claim kèm thông tin nhận dạng và ảnh minh chứng để phối hợp trao trả món đồ.

## Tính năng hiện có

### Tài khoản

- Đăng ký, đăng nhập và đăng xuất bằng HTTP session.
- Mật khẩu được mã hóa bằng BCrypt.
- Xem thông tin tài khoản và các bài viết cá nhân.
- Cài đặt tài khoản: thay đổi tên người dùng, số điện thoại và mật khẩu sau khi xác minh mật khẩu hiện tại.
- Hồ sơ công khai cho phép chủ tài khoản chọn hiển thị số điện thoại, Messenger và Zalo.

### Bài đăng

- Tạo bài đăng thuộc các loại `LOST`, `FOUND`, `STOLEN`.
- Xem danh sách và chi tiết bài đăng.
- Tìm kiếm, lọc và phân trang theo từ khóa, loại, danh mục, địa điểm và trạng thái.
- Giao diện danh sách có điều hướng trang, tổng số bài và tự trở về trang đầu khi thay đổi bộ lọc.
- Tải tối đa 4 ảnh cho mỗi bài đăng.

### Polish

- Hoàn thiện phân trang từ API đến giao diện.
- Thêm trang cài đặt tài khoản tại `/settings`.
- Hỗ trợ tạo nhanh bài đăng bằng popup ở trang chủ, có xem trước, tải ảnh và mở rộng sang trang soạn đầy đủ mà vẫn giữ bản nháp tạm thời.
- Có thể mở hồ sơ tác giả từ bài đăng, tìm người dùng theo tên và nhận gợi ý liên hệ từ các claim đang được kiểm tra.
- Tinh chỉnh responsive cho sidebar, hồ sơ và card bài đăng trên màn hình nhỏ.
- Hỗ trợ công khai có chọn lọc số điện thoại, link Messenger và link Zalo trên hồ sơ người dùng.
- Không triển khai bản đồ; địa điểm tiếp tục được lưu dưới dạng văn bản.

### Claim

- Gửi claim cho một bài đăng đang ở trạng thái `OPEN`.
- Cung cấp mô tả nhận dạng, thời gian và địa điểm gặp mặt.
- Tải tối đa 3 ảnh minh chứng cho mỗi claim.
- Không cho phép chủ bài viết tự claim bài của mình hoặc một người gửi nhiều claim đang chờ cho cùng bài viết.
- Chủ bài viết có thể xác nhận claim. Claim được chuyển sang `CONFIRMED`, các claim đang chờ khác chuyển sang `REJECTED` và bài viết chuyển sang `RESOLVED`.
- Frontend đã có giao diện tạo claim, danh sách claim gửi/nhận, thông báo và trang hồ sơ. Một số thao tác danh sách claim vẫn đang được hoàn thiện ở backend.

## Công nghệ

### Backend

- Java 17, Spring Boot 4
- Spring Web, Spring Data JPA, Spring Security, Bean Validation
- PostgreSQL
- Maven Wrapper, Lombok

### Frontend

- React 19, React Router
- Vite 8
- Tailwind CSS 4
- Axios, Lucide React

## Cấu trúc dự án

```text
thefinder/
├── README.md
├── thefinder backend/
│   ├── pom.xml
│   ├── mvnw, mvnw.cmd
│   ├── database.sql            # Khởi tạo toàn bộ PostgreSQL schema và dữ liệu nền
│   └── src/main/
│       ├── java/com/nbhv/thefinder/
│       │   ├── config/          # Security, CORS và static resources
│       │   ├── controller/      # REST endpoints
│       │   ├── dto/             # Request/response models
│       │   ├── entity/          # JPA entities và enum
│       │   ├── exception/       # Xử lý lỗi API
│       │   ├── repo/            # Spring Data repositories
│       │   ├── service/         # Nghiệp vụ bài đăng, claim và ảnh
│       │   └── specification/   # Điều kiện tìm kiếm động
│       └── resources/application.properties
└── thefinder-web/
    ├── package.json
    └── src/
        ├── api/
        ├── components/
        ├── context/
        ├── pages/
        └── routes/
```

## Yêu cầu môi trường

- JDK 17+
- PostgreSQL
- Node.js tương thích với Vite 8 và npm

## Cài đặt và chạy

### 1. Chuẩn bị cơ sở dữ liệu

Đảm bảo PostgreSQL đang chạy, sau đó tạo database rỗng và chạy file khởi tạo duy nhất từ thư mục gốc của dự án:

```bash
createdb -U postgres thefinder
psql -U postgres -d thefinder -f "thefinder backend/database.sql"
```

Nếu lệnh `createdb` không có sẵn, có thể tạo database bằng `psql`:

```bash
psql -U postgres -d postgres -c "CREATE DATABASE thefinder;"
psql -U postgres -d thefinder -f "thefinder backend/database.sql"
```

Nhập mật khẩu của tài khoản PostgreSQL khi được hỏi. Nếu username hoặc tên database khác, thay `postgres` và `thefinder` trong các lệnh trên cho phù hợp. File [`database.sql`](thefinder%20backend/database.sql) tạo toàn bộ bảng, khóa ngoại, index và dữ liệu danh mục cần thiết; chỉ chạy trên database mới, rỗng.

Nếu cần làm lại database phát triển từ đầu (toàn bộ dữ liệu cũ sẽ bị xóa):

```bash
dropdb -U postgres thefinder
createdb -U postgres thefinder
psql -U postgres -d thefinder -f "thefinder backend/database.sql"
```

### 2. Chạy backend

Mặc định backend kết nối tới `jdbc:postgresql://localhost:5432/thefinder` bằng username `postgres` và password `123456`. Có thể sửa `thefinder backend/src/main/resources/application.properties`, hoặc nên truyền biến môi trường mà không sửa file:

```bash
export DB_URL=jdbc:postgresql://localhost:5432/thefinder
export DB_USERNAME=postgres
export DB_PASSWORD=mat_khau_postgresql
```

Sau đó chạy:

```bash
cd "thefinder backend"
./mvnw spring-boot:run
```

Trên Windows:

```bat
cd "thefinder backend"
mvnw.cmd spring-boot:run
```

Backend chạy mặc định tại `http://localhost:8080`.

> Dự án dùng `spring.jpa.hibernate.ddl-auto=validate`, vì vậy toàn bộ schema phải tồn tại trước khi backend khởi động.

Nếu database được tạo trước khi có tính năng tùy chọn liên hệ Phase 5, chạy migration một lần:

```bash
psql -U postgres -d thefinder -f "thefinder backend/database-migrations/phase5_contact_preferences.sql"
```

### 3. Chạy frontend

Mở terminal khác tại thư mục gốc:

```bash
cd thefinder-web
npm install
npm run dev
```

Mở địa chỉ do Vite hiển thị, thường là `http://localhost:5173`. Backend đã cho phép CORS từ các cổng `localhost` và `127.0.0.1` trong môi trường phát triển.

## API chính

### Xác thực

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Đăng ký tài khoản |
| `POST` | `/api/auth/login` | Đăng nhập và tạo session |
| `GET` | `/api/auth/me` | Lấy người dùng hiện tại |
| `PUT` | `/api/auth/me` | Đổi tên, số điện thoại và tùy chọn đổi mật khẩu |
| `POST` | `/api/auth/logout` | Đăng xuất và hủy session |

### Người dùng và liên hệ

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `GET` | `/api/users/search?query=...` | Tìm người dùng theo tên |
| `GET` | `/api/users/{id}` | Xem hồ sơ và thông tin liên hệ được công khai |
| `GET` | `/api/users/{id}/posts` | Lấy bài đăng công khai của người dùng |
| `GET` | `/api/users/contacts` | Gợi ý liên hệ từ claim đang được kiểm tra |

### Bài đăng

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/api/posts` | Tạo bài đăng - yêu cầu đăng nhập |
| `GET` | `/api/posts` | Tìm kiếm, lọc và phân trang |
| `GET` | `/api/posts/all` | Lấy toàn bộ bài đăng |
| `GET` | `/api/posts/mine` | Lấy bài đăng của người dùng hiện tại |
| `GET` | `/api/posts/{id}` | Xem chi tiết bài đăng |
| `POST` | `/api/posts/{id}/images` | Tải ảnh - chỉ tác giả bài đăng |

Ví dụ tìm kiếm:

```text
GET /api/posts?keyword=ví&type=LOST&categoryId=2&location=Hà%20Nội&status=OPEN&page=0&size=10&sort=createdAt,desc
```

Các bộ lọc đều không bắt buộc. Mặc định API trả 10 bản ghi mỗi trang và sắp xếp theo `createdAt` giảm dần.

### Claim

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/api/posts/{postId}/claims` | Tạo claim - yêu cầu đăng nhập |
| `POST` | `/api/claims/{claimId}/images` | Tải ảnh minh chứng - chỉ người tạo claim |
| `POST` | `/api/claims/{claimId}/confirm` | Xác nhận claim - chỉ chủ bài viết |

Ví dụ tạo claim:

```json
POST /api/posts/1/claims
{
  "description": "Tôi có thể mô tả chính xác vật dụng bên trong ví.",
  "meetTime": "2026-09-01T15:30:00",
  "meetLocation": "Cổng chính trường đại học"
}
```

`description` phải dài từ 10 đến 2000 ký tự, `meetTime` phải ở tương lai và `meetLocation` không vượt quá 500 ký tự.

Sau khi tạo claim, tải ảnh bằng request `multipart/form-data` với field `files`:

```bash
curl -X POST http://localhost:8080/api/claims/1/images \
  -b cookies.txt \
  -F "files=@/path/to/evidence.jpg"
```

### Quy định tải ảnh

- Định dạng hỗ trợ: `.jpg`, `.jpeg`, `.png`, `.webp`.
- Mỗi file tối đa 5 MB; tổng request tối đa 20 MB.
- Mỗi bài đăng tối đa 4 ảnh; mỗi claim tối đa 3 ảnh.
- Ảnh được lưu trong `./uploads/posts` và `./uploads/claims` tính từ thư mục chạy backend.
- Ảnh được phục vụ tại `/images/posts/**` và `/images/claims/**`.

Khi gọi API từ Postman hoặc frontend, cần gửi lại cookie session nhận được sau khi đăng nhập (`withCredentials: true` với Axios).

## Kiểm thử và kiểm tra frontend

Backend:

```bash
cd "thefinder backend"
./mvnw test
```

Frontend:

```bash
cd thefinder-web
npm run lint
npm run build
```

## Các phase phát triển

### Phase 0 - Setup

- Khởi tạo Spring Boot, PostgreSQL và cấu hình JPA với `spring.jpa.hibernate.ddl-auto=validate`.
- Schema ban đầu gồm 4 bảng `users`, `categories`, `posts` và `post_images`, cùng khóa ngoại và index phục vụ truy vấn bài đăng.
- Tạo JPA entities và Spring Data repositories tương ứng.
- Đây là phạm vi lịch sử của Phase 0. Schema hiện tại đã được mở rộng thành 8 bảng: thêm `claim_reports`, `claim_images`, `reports` và `notifications` ở các phase sau.

### Phase 1 - Auth và Post Create/Read

- Xác thực dựa trên HTTP session: đăng ký, đăng nhập, lấy người dùng hiện tại, đăng xuất và gửi lại cookie bằng `withCredentials: true`.
- Mật khẩu được hash bằng BCrypt; backend không lưu mật khẩu thô.
- Tạo bài đăng thuộc `LOST`, `FOUND` hoặc `STOLEN`, xem danh sách và xem chi tiết bài đăng.
- Quyền cập nhật và xóa bài đăng chưa nằm trong Phase 1; hai thao tác này được bổ sung ở Phase 4.

### Phase 2 - Search/filter và upload ảnh

- Upload tối đa 4 ảnh cho mỗi bài đăng, lưu trên local disk và phục vụ qua `/images/posts/**`.
- File được kiểm tra đồng thời MIME type, phần mở rộng (`jpg`, `jpeg`, `png`, `webp`) và giới hạn 5 MB mỗi ảnh; tổng multipart request tối đa 20 MB.
- Search/filter bài đăng theo keyword, loại bài, category, location và status bằng Spring Data JPA Specification.
- Kết quả hỗ trợ sắp xếp và phân trang. Khi lọc category `Khác`, hệ thống lấy cả bài chưa được phân loại.
- **Comment:** từng nằm trong kế hoạch dưới dạng tính năng optional nhưng đã được lược bỏ vì chưa cần thiết và sẽ làm schema/nghiệp vụ phức tạp hơn.

### Phase 3 - Claim report (“Đã tìm thấy? Báo lại”)

- Thêm `ClaimReport` và `ClaimImage`; mỗi claim bắt buộc có từ 1 đến 3 ảnh minh chứng.
- Có API tạo claim, lấy claim đã gửi/đã nhận, lấy claim theo bài viết, nhận kiểm tra, từ chối, hủy và xác nhận hoàn tất.
- Không cho chủ bài tự claim, không cho gửi claim trùng khi vẫn còn claim hoạt động và không nhận claim khi bài viết không còn `OPEN`.
- Claim mới có trạng thái `SUBMITTED`. Thao tác “Tôi sẽ kiểm tra” chuyển claim sang `PENDING`; `REVIEWING` được giữ để tương thích dữ liệu cũ.
- Luồng confirm chạy trong service có `@Transactional`, không dùng database trigger: claim được chọn thành `CONFIRMED`, các claim hoạt động khác (`SUBMITTED`, `PENDING`, `REVIEWING`) thành `REJECTED`, sau đó bài viết thành `RESOLVED`.
- Các thay đổi quan trọng của claim đều phát notification cho bên liên quan.

### Phase 4 - Quản trị và hoàn thiện vòng đời bài đăng

- **Edit post:** chỉ chủ bài được sửa trong 60 phút đầu. Năm field cho phép sửa là title, description, location, category và type.
- **Delete post:** chỉ chủ bài được hard delete; ảnh trên disk được dọn và dữ liệu liên quan được cascade theo schema.
- **Report:** người dùng có thể báo cáo bài của người khác theo `ReportReason`; unique constraint ngăn một tài khoản report cùng một bài nhiều lần.
- **Admin:** dùng field `role` trên `User`, không tạo bảng admin riêng. Admin có thể xem report chờ xử lý, bác report hoặc duyệt để ẩn bài vi phạm.
- **Blacklist:** dùng field `blacklisted` trên `User`. Admin có thể tìm, thêm hoặc gỡ tài khoản khỏi blacklist; tài khoản bị blacklist bị chặn đăng nhập và các API liên quan.
- **Notification:** hỗ trợ report đã gửi, bài bị ẩn và toàn bộ sự kiện chính của claim; người dùng có thể xem và đánh dấu đã đọc.
- **Comment:** tiếp tục được lược bỏ khỏi phạm vi vì cần thêm thay đổi database, kiểm duyệt và vòng đời nội dung riêng.

### Phase 5 - Polish

- Hoàn thiện phân trang từ backend đến frontend: chuyển trang, tổng số bài và reset về trang đầu khi đổi bộ lọc.
- Rà soát responsive cho navigation, sidebar, form, card, modal và trang hồ sơ.
- Thêm lightbox ảnh tỷ lệ 16:9: ảnh dùng `object-contain`, chuyển qua lại khi có nhiều ảnh và animation mở/đóng về thumbnail.
- Thêm popup tạo bài nhanh ở trang chủ, upload ảnh, xem trước và mở rộng sang trang tạo bài đầy đủ. Bản nháp cùng file ảnh chỉ giữ trong RAM và mất khi reload hoặc hủy.
- Thêm cài đặt tài khoản: đổi tên, số điện thoại và mật khẩu sau khi xác minh mật khẩu hiện tại.
- Thêm hồ sơ người dùng, tìm kiếm theo tên và điều hướng tới hồ sơ khi bấm tên tác giả bài đăng.
- Thêm thông tin liên hệ gồm số điện thoại, Messenger và Zalo. Quyền hiển thị mặc định được bật và chủ tài khoản có thể tắt riêng từng mục.
- Mục Liên hệ trên sidebar gợi ý các bên của claim đang ở `PENDING`/`REVIEWING`, tức sau thao tác “Tôi sẽ kiểm tra”; claim đã `CONFIRMED` không còn được gợi ý.
- **Quên mật khẩu qua email:** có trong đề xuất ban đầu nhưng đã được lược bỏ, thay bằng Cài đặt tài khoản vì không cần SMTP và reset-token infrastructure.
- **Bản đồ cho location:** có trong đề xuất ban đầu dưới dạng optional nhưng đã được lược bỏ; location tiếp tục là văn bản.

Không commit thông tin đăng nhập cơ sở dữ liệu thật. Khi triển khai, nên đưa cấu hình database và đường dẫn upload sang biến môi trường hoặc file cấu hình riêng.
