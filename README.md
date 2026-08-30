# The Finder

> Dự án hiện đang ở **Phase 3 — Claim/phiếu hỗ trợ nhận và trao trả đồ** và vẫn đang được phát triển.

The Finder là nền tảng web hỗ trợ cộng đồng đăng tin **mất đồ**, **tìm thấy đồ** hoặc **bị trộm**. Ngoài việc tìm kiếm bài đăng, người dùng đã có thể gửi phiếu claim kèm thông tin nhận dạng và ảnh minh chứng để phối hợp trao trả món đồ.

## Tính năng hiện có

### Tài khoản

- Đăng ký, đăng nhập và đăng xuất bằng HTTP session.
- Mật khẩu được mã hóa bằng BCrypt.
- Xem thông tin tài khoản và các bài viết cá nhân.

### Bài đăng

- Tạo bài đăng thuộc các loại `LOST`, `FOUND`, `STOLEN`.
- Xem danh sách và chi tiết bài đăng.
- Tìm kiếm, lọc và phân trang theo từ khóa, loại, danh mục, địa điểm và trạng thái.
- Tải tối đa 4 ảnh cho mỗi bài đăng.

### Claim — Phase 3

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
│   ├── phase0-schema-setup.md
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

Tạo database PostgreSQL:

```sql
CREATE DATABASE thefinder;
```

Chạy phần SQL trong [`thefinder backend/phase0-schema-setup.md`](thefinder%20backend/phase0-schema-setup.md) để tạo schema nền và dữ liệu danh mục.

Phase 3 cần thêm hai bảng claim sau:

```sql
CREATE TABLE claim_reports (
    id              BIGSERIAL PRIMARY KEY,
    post_id         BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    claimant_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description     TEXT,
    meet_time       TIMESTAMP,
    meet_location   VARCHAR(500),
    status          VARCHAR(255) NOT NULL DEFAULT 'SUBMITTED',
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_claim_reports_post ON claim_reports(post_id);
CREATE INDEX idx_claim_reports_claimant ON claim_reports(claimant_id);

CREATE TABLE claim_images (
    id                BIGSERIAL PRIMARY KEY,
    claim_report_id   BIGINT NOT NULL REFERENCES claim_reports(id) ON DELETE CASCADE,
    image_url         VARCHAR(500) NOT NULL
);

CREATE INDEX idx_claim_images_report ON claim_images(claim_report_id);
```

Các trạng thái claim hiện có: `SUBMITTED`, `PENDING`, `REVIEWING`, `CONFIRMED`, `REJECTED`. `REVIEWING` được giữ lại để tương thích với dữ liệu cũ.

### 2. Chạy backend

Cập nhật kết nối PostgreSQL trong `thefinder backend/src/main/resources/application.properties`, sau đó chạy:

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
| `POST` | `/api/auth/logout` | Đăng xuất và hủy session |

### Bài đăng

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/api/posts` | Tạo bài đăng — yêu cầu đăng nhập |
| `GET` | `/api/posts` | Tìm kiếm, lọc và phân trang |
| `GET` | `/api/posts/all` | Lấy toàn bộ bài đăng |
| `GET` | `/api/posts/mine` | Lấy bài đăng của người dùng hiện tại |
| `GET` | `/api/posts/{id}` | Xem chi tiết bài đăng |
| `POST` | `/api/posts/{id}/images` | Tải ảnh — chỉ tác giả bài đăng |

Ví dụ tìm kiếm:

```text
GET /api/posts?keyword=ví&type=LOST&categoryId=2&location=Hà%20Nội&status=OPEN&page=0&size=10&sort=createdAt,desc
```

Các bộ lọc đều không bắt buộc. Mặc định API trả 10 bản ghi mỗi trang và sắp xếp theo `createdAt` giảm dần.

### Claim

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/api/posts/{postId}/claims` | Tạo claim — yêu cầu đăng nhập |
| `POST` | `/api/claims/{claimId}/images` | Tải ảnh minh chứng — chỉ người tạo claim |
| `POST` | `/api/claims/{claimId}/confirm` | Xác nhận claim — chỉ chủ bài viết |

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

## Trạng thái phát triển

Phase 3 đã có domain model và luồng xác nhận claim cốt lõi. Các API lấy danh sách claim đã gửi/đã nhận, chuyển trạng thái review/reject và hủy claim đang là phần cần hoàn thiện để đồng bộ đầy đủ với giao diện frontend hiện có.

Không commit thông tin đăng nhập cơ sở dữ liệu thật. Khi triển khai, nên đưa cấu hình database và đường dẫn upload sang biến môi trường hoặc file cấu hình riêng.
