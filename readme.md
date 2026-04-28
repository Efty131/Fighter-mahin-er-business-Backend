# Fighter Mahin Business Backend

Node.js + Express + MongoDB Atlas backend for the Fighter Mahin platform — merch store, online academy, blog, and order management.

## Running the server

```bash
node index.js        # standard
npm run dev          # nodemon (auto-restart)
```

Base URL (local): `http://localhost:4002`

---

## Authentication

Cookies are HTTP-only. All protected routes require a valid session cookie set at login.

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| `POST` | `/auth/register` | Public | Register a new user |
| `POST` | `/auth/login` | Public | Login — sets HTTP-only cookie |
| `GET` | `/auth/logout` | Public | Logout — clears cookie |

---

## Products (Merch Store)

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| `GET` | `/api/products` | Public | Get all products |
| `GET` | `/api/products/search` | Public | Search products by query |
| `GET` | `/api/products/category/:category` | Public | Get products by category |
| `GET` | `/api/products/slug/:slug` | Public | Get single product by slug |
| `PUT` | `/api/products/update/:name` | Admin | Update a product by name |
| `POST` | `/upload` | Admin | Upload a new product with images |

---

## Courses (Online Academy)

### Public

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| `GET` | `/api/courses` | Public | Get all published courses |
| `GET` | `/api/courses/:id` | Public | Get single course by ID or slug |

### Admin — Course Management

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| `POST` | `/api/courses` | Admin | Create a new course (multipart: `thumbnail` + `videos`) |
| `PUT` | `/api/courses/:id` | Admin | Update course details / append videos |
| `DELETE` | `/api/courses/:id` | Admin | Delete course + all Cloudinary assets |

### Admin — Video Management

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| `POST` | `/api/courses/:id/videos` | Admin | Add a new video to an existing course |
| `PATCH` | `/api/courses/:id/videos/reorder` | Admin | Bulk reorder videos — body: `{ order: [{ videoId, order }] }` |
| `PATCH` | `/api/courses/:id/videos/:videoId` | Admin | Update video metadata or custom thumbnail |
| `DELETE` | `/api/courses/:id/videos/:videoId` | Admin | Delete a single video + its Cloudinary assets |

#### Course create/update form fields (multipart/form-data)

| Field | Type | Notes |
|-------|------|-------|
| `title` | string | Required |
| `description` | string | Required |
| `price` | number | Defaults to `0` |
| `category` | string | Defaults to `General` |
| `level` | string | Defaults to `Beginner` |
| `status` | `draft` \| `published` | Defaults to `published` |
| `slug` | string | Optional, must be unique |
| `thumbnail` | file (image) | Course cover image |
| `videos` | file[] (video) | Up to 10 video files |
| `videoTitle_0`, `videoTitle_1` … | string | Title for each uploaded video |
| `videoDescription_0` … | string | Description for each video |
| `videoIsFree_0` … | `"true"` \| `"false"` | Mark video as free preview |

---

## Orders

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| `POST` | `/api/orders/checkout` | Auth | Place a new order |
| `GET` | `/api/orders/myorders` | Auth | Get logged-in user's order history |
| `GET` | `/api/orders/admin/summary` | Admin | Dashboard stats / order summary |
| `GET` | `/api/orders/admin/all` | Admin | Get all orders (paginated) |
| `GET` | `/api/orders/admin/:id` | Admin | Get single order detail |
| `PATCH` | `/api/orders/admin/:id` | Admin | Update order status |

---

## Enrollments

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| `GET` | `/api/enrollments/myenrollments` | Auth | Get all courses the user is enrolled in |
| `GET` | `/api/enrollments/check/:courseId` | Auth | Check if user is enrolled in a course |
| `POST` | `/api/enrollments` | Auth | Enroll in a course — body: `{ courseId, orderId }` |
| `PATCH` | `/api/enrollments/progress` | Auth | Update video progress — body: `{ enrollmentId, videoUrl, isCompleted }` |

---

## Articles / Blog

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| `GET` | `/api/articles` | Public | Get paginated list of published articles |
| `GET` | `/api/articles/:slug` | Public | Get single article by slug |
| `POST` | `/api/articles/:id/like` | Auth | Toggle like on an article (rate limited: 3/min) |
| `POST` | `/api/articles` | Admin | Create a new article |
| `PUT` | `/api/articles/:id` | Admin | Update an article |
| `DELETE` | `/api/articles/:id` | Admin | Delete an article |

---

## File Uploads (Cloudinary)

All upload routes are admin-only and rate limited to **10 requests/minute per IP**.

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| `POST` | `/api/upload/image` | Admin | Upload a single image — field: `image`, body: `{ folder }` |
| `POST` | `/api/upload/video` | Admin | Upload a single video — field: `video`, body: `{ folder }` |
| `POST` | `/api/upload/multiple` | Admin | Upload multiple files — field: `files[]`, body: `{ folder }` |
| `DELETE` | `/api/upload/:publicId` | Admin | Delete a file from Cloudinary — query: `?type=image\|video` |

---

## Access levels

| Level | Requirement |
|-------|-------------|
| Public | No auth needed |
| Auth | Valid session cookie (any logged-in user) |
| Admin | Valid session cookie + `role: "admin"` |
