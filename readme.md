# Fighter-mahin-er-business-Backend

Run command for this server:
`node index.js`
`npm run dev` (For nodemon)

## API Endpoints

### Authentication
- `POST /auth/register` : Register a new user
- `POST /auth/login` : Login user
- `GET /auth/logout` : Logout user
- `GET /auth/profile` : Get logged-in user profile (Protected)

### Products (Merch Store)
- `GET /api/products/` : Get all products
- `GET /api/products/search` : Search products
- `GET /api/products/category/:category` : Get products by category
- `PUT /api/products/update/:name` : Update a product (Protected, Admin Only)
- `POST /upload` : Upload a new product (Protected, Admin Only)

### Courses (Online Academy)
- `GET /api/courses/` : Basic hello text (More endpoints coming soon)

### Orders
- `GET /api/orders/` : Basic hello text (More endpoints coming soon)

### Enrollments
- `GET /api/enrollments/` : Basic hello text (More endpoints coming soon)