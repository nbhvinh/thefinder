# The Finder

*(Dự án hiện tại đang ở phase 2 và đang tiếp tục được phát triển)*

Backend REST API cho nền tảng hỗ trợ đăng tin **mất đồ**, **tìm thấy đồ** và **bị trộm**. Người dùng có thể đăng ký, đăng nhập, tạo bài đăng, tìm kiếm/lọc bài đăng và tải ảnh minh hoạ cho bài viết.

## Công nghệ

- Java 17, Spring Boot 4
- Spring Web, Spring Data JPA, Spring Security
- PostgreSQL
- Maven Wrapper
- Lombok

## Chức năng hiện có

- Đăng ký, đăng nhập và đăng xuất bằng HTTP session.
- Mật khẩu được mã hoá bằng BCrypt.
- Tạo và xem bài đăng thuộc các loại `LOST`, `FOUND`, `STOLEN`.
- Tìm kiếm, lọc và phân trang bài đăng theo từ khoá, loại, danh mục, địa điểm và trạng thái.
- Tải tối đa 4 ảnh cho mỗi bài đăng; hỗ trợ `.jpg`, `.jpeg`, `.png`, `.webp`.
- Phục vụ ảnh đã tải tại `/images/posts/**`.

## Yêu cầu môi trường

- JDK 17+
- PostgreSQL

## Cài đặt và chạy dự án

1. Tạo cơ sở dữ liệu PostgreSQL:

   ```sql
   CREATE DATABASE thefinder;
   ```

2. Khởi tạo bảng, enum và dữ liệu danh mục bằng script trong [phase0-schema-setup.md](phase0-schema-setup.md). Chạy phần SQL ở mục **Database Schema**.

3. Cập nhật thông tin kết nối trong `src/main/resources/application.properties`:

   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/thefinder
   spring.datasource.username=postgres
   spring.datasource.password=your_password
   ```

4. Chạy ứng dụng:

   ```bash
   ./mvnw spring-boot:run
   ```

   Trên Windows:

   ```bat
   mvnw.cmd spring-boot:run
   ```

API chạy mặc định tại `http://localhost:8080`.

> Cấu hình hiện tại sử dụng `spring.jpa.hibernate.ddl-auto=validate`, vì vậy schema phải được tạo trước khi khởi động ứng dụng.

## API

### Xác thực

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Đăng ký tài khoản |
| `POST` | `/api/auth/login` | Đăng nhập, tạo session |
| `POST` | `/api/auth/logout` | Đăng xuất, huỷ session |

Ví dụ đăng ký:

```json
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "Nguyễn Văn A",
  "phone": "0900000000"
}
```

Ví dụ đăng nhập:

```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

Khi gọi từ Postman hoặc frontend, cần giữ cookie session trả về sau khi đăng nhập để tạo bài đăng hay tải ảnh.

### Bài đăng

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/api/posts` | Tạo bài đăng — yêu cầu đăng nhập |
| `GET` | `/api/posts` | Tìm kiếm, lọc và phân trang bài đăng |
| `GET` | `/api/posts/all` | Lấy toàn bộ bài đăng |
| `GET` | `/api/posts/{id}` | Xem chi tiết bài đăng |
| `POST` | `/api/posts/{id}/images` | Tải ảnh cho bài đăng — chỉ tác giả bài đăng |

Ví dụ tạo bài đăng:

```json
POST /api/posts
{
  "type": "LOST",
  "title": "Mất ví màu đen",
  "description": "Ví có giấy tờ tuỳ thân.",
  "location": "Đại học ...",
  "eventTime": "2026-08-27T08:30:00+07:00",
  "contactInfo": "0900000000",
  "categoryId": 2
}
```

Các giá trị enum:

- `type`: `LOST`, `FOUND`, `STOLEN`
- `status`: `OPEN`, `RESOLVED`, `CLOSED`

Ví dụ tìm kiếm có phân trang:

```text
GET /api/posts?keyword=ví&type=LOST&categoryId=2&location=Hà%20Nội&status=OPEN&page=0&size=10&sort=createdAt,desc
```

Các tham số lọc đều không bắt buộc: `keyword`, `type`, `categoryId`, `location`, `status`. Mặc định trả 10 bản ghi/trang, sắp xếp theo `createdAt` giảm dần.

### Tải ảnh

Gửi request `multipart/form-data` đến `/api/posts/{id}/images` với field tên `files`. Mỗi bài đăng có tối đa 4 ảnh, mỗi file tối đa 5 MB; tổng request tối đa 20 MB.

```bash
curl -X POST http://localhost:8080/api/posts/1/images \
  -b cookies.txt \
  -F "files=@/path/to/image.jpg"
```

Ảnh được lưu mặc định trong `./uploads/posts` và được truy cập qua đường dẫn như `/images/posts/{filename}`.

## Cấu trúc chính

```text
src/main/java/com/nbhv/thefinder/
├── config/          # Security và static resources
├── controller/      # REST endpoints
├── dto/             # Request/response models
├── entity/          # JPA entities và enum
├── repo/            # Spring Data repositories
├── service/         # Nghiệp vụ bài đăng và ảnh
└── specification/   # Điều kiện tìm kiếm động
```

## Kiểm thử

```bash
./mvnw test
```

## Ghi chú phát triển

- Endpoint `/api/posts/**` đang được Spring Security cho phép truy cập ở tầng HTTP; việc yêu cầu đăng nhập cho tạo bài và tải ảnh được kiểm tra bằng session trong controller.
- Không commit mật khẩu cơ sở dữ liệu thật vào repository. Khi triển khai, nên truyền cấu hình database qua biến môi trường hoặc file cấu hình riêng.
