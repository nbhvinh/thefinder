# Phase 0 — Schema Design + Project Setup

Mục tiêu Phase 0: có schema chạy được (4 bảng) + project Spring Boot khởi tạo xong, entity map đúng với DDL. Chưa cần logic nghiệp vụ (đó là Phase 1+).

---

## 1. Database Schema (PostgreSQL DDL)

### Quyết định thiết kế (đọc trước khi copy code)

- **`post_type` gộp chung LOST/FOUND/STOLEN vào 1 bảng `posts`**, phân biệt bằng enum column. Lý do: field chung ~90% (title, description, time, location, images), tách 3 bảng sẽ phải duplicate schema và JOIN khi hiển thị feed chung.
- **`category` quan hệ 1–nhiều** với post (mỗi post 1 category) — đơn giản hơn many-to-many, đủ dùng cho MVP. Nếu sau này cần tag đa dạng, thêm bảng `post_category` sau, không phải sửa gì lớn.
- Dùng `TIMESTAMP WITH TIME ZONE` cho mọi cột thời gian — tránh bug lệch giờ khi deploy khác timezone.
- Đánh index trên các cột hay filter/search (`type`, `status`, `category_id`, `user_id`) — vì Phase 2 sẽ search/filter ngay, chuẩn bị trước đỡ phải ALTER TABLE sau.

```sql
-- =========================================
-- ENUM TYPES
-- =========================================
CREATE TYPE post_type AS ENUM ('LOST', 'FOUND', 'STOLEN');
CREATE TYPE post_status AS ENUM ('OPEN', 'RESOLVED', 'CLOSED');

-- =========================================
-- USERS
-- =========================================
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    avatar_url      VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================
-- CATEGORIES (seed sẵn data, không cho user tự tạo)
-- =========================================
CREATE TABLE categories (
    id      BIGSERIAL PRIMARY KEY,
    name    VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO categories (name) VALUES
    ('Balo/Túi xách'), ('Ví/Giấy tờ'), ('Điện thoại'), ('Laptop/Máy tính'),
    ('Bút/Văn phòng phẩm'), ('Trang sức'), ('Chìa khóa'), ('Thú cưng'), ('Khác');

-- =========================================
-- POSTS (bảng trung tâm)
-- =========================================
CREATE TABLE posts (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id     BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    type            post_type NOT NULL,
    status          post_status NOT NULL DEFAULT 'OPEN',
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    location        VARCHAR(500),
    event_time      TIMESTAMPTZ,        -- thời điểm mất/nhặt được đồ
    contact_info    VARCHAR(255),       -- thông tin liên hệ / địa điểm nhận (nếu khác user profile)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_category ON posts(category_id);
CREATE INDEX idx_posts_user ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- =========================================
-- POST IMAGES (1 post - nhiều ảnh)
-- =========================================
CREATE TABLE post_images (
    id          BIGSERIAL PRIMARY KEY,
    post_id     BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    url         VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_images_post ON post_images(post_id);
```

**Ghi chú cho Phase sau (không tạo bảng vội, chỉ để hình dung trước):**
- Phase 3 sẽ thêm `claim_reports` + `claim_images` (FK tới `posts`)
- Phase 4 sẽ thêm `evidences` (FK tới `posts`, chỉ dùng khi `type = STOLEN`) và `reports` (báo cáo vi phạm)

---

## 2. Cấu trúc project Spring Boot

```
thefinder/
├── pom.xml
├── src/main/java/com/thefinder/
│   ├── thefinderApplication.java
│   ├── config/
│   │   └── SecurityConfig.java
│   ├── entity/
│   │   ├── User.java
│   │   ├── Category.java
│   │   ├── Post.java
│   │   ├── PostImage.java
│   │   └── enums/
│   │       ├── PostType.java
│   │       └── PostStatus.java
│   ├── repository/
│   │   ├── UserRepository.java
│   │   ├── CategoryRepository.java
│   │   └── PostRepository.java
│   ├── dto/
│   │   ├── PostCreateRequest.java
│   │   └── PostResponse.java
│   ├── service/
│   │   └── PostService.java
│   ├── controller/
│   │   └── PostController.java
│   └── exception/
│       └── GlobalExceptionHandler.java
└── src/main/resources/
    └── application.properties
```

---

## 3. Entity classes (JPA)

```java
// entity/enums/PostType.java
package com.nbhv.thefinder.entity.enums;

public enum PostType {
    LOST, FOUND, STOLEN
}
```

```java
// entity/enums/PostStatus.java
package com.nbhv.thefinder.entity.enums;

public enum PostStatus {
    OPEN, RESOLVED, CLOSED
}
```

```java
// entity/User.java
package com.nbhv.thefinder.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    private String phone;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    // getters/setters
}
```

```java
// entity/Category.java
package com.nbhv.thefinder.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    // getters/setters
}
```

```java
// entity/Post.java
package com.nbhv.thefinder.entity;

import com.nbhv.thefinder.entity.enums.PostStatus;
import com.nbhv.thefinder.entity.enums.PostType;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "posts")
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PostType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PostStatus status = PostStatus.OPEN;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String location;

    @Column(name = "event_time")
    private OffsetDateTime eventTime;

    @Column(name = "contact_info")
    private String contactInfo;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PostImage> images = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    // getters/setters
}
```

```java
// entity/PostImage.java
package com.nbhv.thefinder.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "post_images")
public class PostImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Column(nullable = false)
    private String url;

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private OffsetDateTime uploadedAt;

    @PrePersist
    protected void onCreate() {
        uploadedAt = OffsetDateTime.now();
    }

    // getters/setters
}
```

**Lưu ý khi tự chỉnh:**
- Nếu dùng Lombok (`@Data`, `@Getter/@Setter`), thêm dependency `lombok` vào pom.xml và bỏ getters/setters tay — giảm boilerplate đáng kể, khuyên dùng.
- `fetch = FetchType.LAZY` trên các `@ManyToOne` để tránh load thừa dữ liệu (N+1 query problem) — quan trọng, đừng đổi thành EAGER trừ khi có lý do rõ.

---

## 4. Repository (Spring Data JPA)

```java
// repository/PostRepository.java
package com.nbhv.thefinder.repository;

import com.nbhv.thefinder.entity.Post;
import com.nbhv.thefinder.entity.enums.PostType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByType(PostType type);
    List<Post> findByCategoryId(Long categoryId);
    List<Post> findByTitleContainingIgnoreCase(String keyword);
}
```

Tương tự cho `UserRepository extends JpaRepository<User, Long>` và `CategoryRepository extends JpaRepository<Category, Long>`.

---

## 5. `application.properties`

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/thefinder
spring.datasource.username=postgres
spring.datasource.password=your_password
spring.datasource.driver-class-name=org.postgresql.Driver

spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

server.port=8080
```

**Về `ddl-auto=validate`:** cố tình để `validate` chứ không phải `update`/`create` — nghĩa là cậu tự chạy file DDL ở mục 1 để tạo bảng bằng tay (hoặc qua Flyway/Liquibase sau này), Hibernate chỉ kiểm tra entity có khớp bảng không. Lý do: `update` dễ sinh ra schema linh tinh khi entity thay đổi, khó kiểm soát so với việc chủ động viết migration.

---

## 6. `pom.xml` — dependencies cần thêm

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>
    <!-- Thêm khi vào Phase 1 (auth): spring-boot-starter-security -->
    <!-- Thêm khi vào Phase 5 (quên mật khẩu): spring-boot-starter-mail -->
</dependencies>
```

---

## 7. Checklist hoàn thành Phase 0

- [ ] Cài PostgreSQL, tạo database `thefinder`
- [ ] Chạy DDL ở mục 1, kiểm tra 4 bảng + 9 category đã seed
- [ ] Khởi tạo project qua start.spring.io với dependencies ở mục 6
- [ ] Copy entity classes vào đúng package, sửa `application.properties` với thông tin DB thật
- [ ] Chạy `mvn spring-boot:run` — app start không lỗi là coi như xong Phase 0 (chưa cần endpoint nào chạy được, chỉ cần Hibernate validate schema pass)

Khi xong, Phase 1 sẽ thêm Spring Security + endpoint đăng ký/đăng nhập + CRUD Post cơ bản.
