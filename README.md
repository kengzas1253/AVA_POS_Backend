# AVA POS Backend API

Backend API สำหรับระบบ AVA POS พัฒนาด้วย NestJS, TypeORM และ PostgreSQL

## เริ่มต้นใช้งาน

### ความต้องการของระบบ

- Node.js
- npm
- PostgreSQL หรือ Docker Desktop

### ติดตั้ง

```bash
npm install
```

สร้างไฟล์ `.env` ที่ root ของโปรเจกต์:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-database-password
DB_DATABASE=AVA_POS_DB

JWT_SECRET=change-this-to-a-random-secret
ACCESS_TOKEN_SECRET=change-this-access-token-secret
REFRESH_TOKEN_SECRET=change-this-refresh-token-secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d
```

เปิด PostgreSQL ด้วย Docker:

```bash
docker compose -f docker/docker-compose.yml up -d
```

รัน Development:

```bash
npm run start:dev
```

Build และรัน Production:

```bash
npm run build
npm run start:prod
```

Base URL:

```text
http://localhost:2021
```

## Authentication

API ที่มีเครื่องหมาย 🔒 ต้องส่ง Access Token ใน header:

```http
Authorization: Bearer <access_token>
```

หากไม่ส่ง token:

```json
{
  "statusCode": 401,
  "message": "Access token is required",
  "error": "Unauthorized"
}
```

หาก token ไม่ถูกต้องหรือหมดอายุ:

```json
{
  "statusCode": 401,
  "message": "Invalid or expired access token",
  "error": "Unauthorized"
}
```

## สรุป API ทั้งหมด

| Method | Endpoint | Auth | รายละเอียด |
| --- | --- | --- | --- |
| GET | `/` | ไม่ต้องใช้ | ตรวจสอบสถานะ API |
| GET | `/test-connect` | ไม่ต้องใช้ | ตรวจสอบการเชื่อมต่อ API |
| POST | `/auth/register` | ไม่ต้องใช้ | สมัครผู้ใช้งาน |
| POST | `/auth/login` | ไม่ต้องใช้ | Login ด้วย username/password |
| POST | `/auth/login-pin` | ไม่ต้องใช้ | Login ด้วย PIN |
| POST | `/auth/refresh` | ไม่ต้องใช้ | ขอ Access Token ใหม่ |
| POST | `/auth/logout` | ไม่ต้องใช้ | Logout และยกเลิก Refresh Token |
| POST | `/pos-devices/register` | ไม่ต้องใช้ | ลงทะเบียนหรืออัปเดตเครื่อง POS |
| GET | `/pos-devices` | ไม่ต้องใช้ | ดูเครื่อง POS ทั้งหมด |
| GET | `/pos-devices/:machine_id` | ไม่ต้องใช้ | ดูเครื่อง POS จาก Machine ID |
| PUT | `/pos-devices/:machine_id` | ไม่ต้องใช้ | แก้ไขเครื่อง POS จาก Machine ID |
| DELETE | `/pos-devices/:machine_id` | ไม่ต้องใช้ | ลบเครื่อง POS จาก Machine ID |
| POST | `/categories` | 🔒 | เพิ่มหมวดหมู่ |
| GET | `/categories` | 🔒 | ดูหมวดหมู่ทั้งหมด |
| GET | `/categories/:id` | 🔒 | ดูหมวดหมู่ตาม ID |
| PUT | `/categories/:id` | 🔒 | แก้ไขหมวดหมู่ |
| DELETE | `/categories/:id` | 🔒 | ลบหมวดหมู่ |
| POST | `/products` | 🔒 | เพิ่มสินค้า |
| GET | `/products` | 🔒 | ดูสินค้าทั้งหมด |
| GET | `/products/:id` | 🔒 | ดูสินค้าตาม ID |
| PUT | `/products/:id` | 🔒 | แก้ไขสินค้า |
| DELETE | `/products/:id` | 🔒 | ลบสินค้า |
| POST | `/images/upload` | 🔒 | อัปโหลดรูปสินค้า |
| DELETE | `/images/:filename` | 🔒 | ลบรูป |
| POST | `/favorite-groups` | 🔒 | เพิ่มกลุ่มรายการโปรด |
| GET | `/favorite-groups` | 🔒 | ดูกลุ่มรายการโปรดทั้งหมด |
| GET | `/favorite-groups/:id` | 🔒 | ดูกลุ่มรายการโปรดตาม ID |
| PUT | `/favorite-groups/:id` | 🔒 | แก้ไขกลุ่มรายการโปรด |
| DELETE | `/favorite-groups/:id` | 🔒 | ลบกลุ่มรายการโปรด |
| POST | `/favorite-items` | 🔒 | เพิ่มสินค้าในรายการโปรด |
| GET | `/favorite-items` | 🔒 | ดูรายการโปรด |
| GET | `/favorite-items/:id` | 🔒 | ดูรายการโปรดตาม ID |
| PUT | `/favorite-items/:id` | 🔒 | แก้ไขรายการโปรด |
| DELETE | `/favorite-items/:id` | 🔒 | ลบรายการโปรด |
| POST | `/pos/scan-product` | 🔒 | สแกนสินค้าจาก Barcode |
| GET | `/pos/products/search?q=...` | 🔒 | ค้นหาจาก Barcode, SKU หรือชื่อ |

## System

### `GET /`

### `GET /test-connect`

ทั้งสอง endpoint ส่งผลลัพธ์รูปแบบเดียวกัน:

```json
{
  "status": "ok",
  "message": "AVA API connected successfully",
  "port": 2021,
  "timestamp": "2026-06-23T05:00:00.000Z"
}
```

## Auth

### `POST /auth/register`

Body:

```json
{
  "username": "cashier01",
  "password": "password123",
  "full_name": "Cashier One",
  "phone_number": "0812345678",
  "role": "cashier",
  "pin_code": "1234",
  "is_active": true
}
```

ฟิลด์ที่จำเป็น: `username`, `password` อย่างน้อย 6 ตัวอักษร, `full_name` และ `pin_code` อย่างน้อย 4 ตัวอักษร

Response:

```json
{
  "status": "ok",
  "message": "User registered successfully",
  "data": {
    "user_id": "uuid",
    "username": "cashier01",
    "full_name": "Cashier One",
    "phone_number": "0812345678",
    "role": "cashier",
    "is_active": true,
    "last_login_at": null,
    "created_at": "2026-06-23T05:00:00.000Z",
    "updated_at": "2026-06-23T05:00:00.000Z"
  }
}
```

### `POST /auth/login`

Body:

```json
{
  "username": "cashier01",
  "password": "password123"
}
```

### `POST /auth/login-pin`

Body:

```json
{
  "pin_code": "1234"
}
```

Login สำเร็จจากทั้งสอง endpoint:

```json
{
  "status": "ok",
  "message": "Login successfully",
  "token": "<access_token>",
  "access_token": "<access_token>",
  "refresh_token": "<refresh_token>",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_expires_in": 2592000,
  "data": {
    "user_id": "uuid",
    "username": "cashier01",
    "full_name": "Cashier One",
    "role": "cashier",
    "is_active": true
  }
}
```

### `POST /auth/refresh`

Body:

```json
{
  "refresh_token": "<refresh_token>"
}
```

Response:

```json
{
  "status": "ok",
  "message": "Token refreshed successfully",
  "access_token": "<new_access_token>",
  "refresh_token": "<new_refresh_token>",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_expires_in": 2592000
}
```

Refresh Token เดิมจะใช้ไม่ได้หลัง refresh สำเร็จ

### `POST /auth/logout`

Body:

```json
{
  "refresh_token": "<refresh_token>"
}
```

Response:

```json
{
  "status": "ok",
  "message": "Logout successfully"
}
```

## POS Devices

### `POST /pos-devices/register`

ถ้า `machine_id` มีอยู่แล้ว ระบบจะอัปเดตข้อมูลเครื่องเดิม

```json
{
  "device_name": "POS Counter 1",
  "machine_id": "550e8400-e29b-41d4-a716-446655440000",
  "hostname": "POS-01",
  "ip_address": "192.168.1.10",
  "os_platform": "win32",
  "os_release": "11",
  "app_version": "1.0.0",
  "printer_name": "Receipt Printer",
  "printer_type": "USB"
}
```

Response:

```json
{
  "status": "ok",
  "message": "POS device registered successfully",
  "data": {
    "id": 1,
    "device_name": "POS Counter 1",
    "machine_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### `GET /pos-devices`

คืนค่า array ของเครื่อง POS ทั้งหมด เรียงตาม `id`

### `GET /pos-devices/:machine_id`

ตัวอย่าง:

```http
GET /pos-devices/550e8400-e29b-41d4-a716-446655440000
```

### `PUT /pos-devices/:machine_id`

ไม่ต้องใช้ access token และส่งเฉพาะ field ที่ต้องการแก้ไขได้

```json
{
  "device_name": "POS Counter 1",
  "hostname": "POS-01",
  "ip_address": "192.168.1.11",
  "os_platform": "win32",
  "os_release": "11",
  "app_version": "1.0.1",
  "printer_name": "Receipt Printer",
  "printer_type": "USB"
}
```

### `DELETE /pos-devices/:machine_id`

ไม่ต้องใช้ access token

```http
DELETE /pos-devices/550e8400-e29b-41d4-a716-446655440000
```

## Categories 🔒

ค่า `status` ที่รองรับ: `ACTIVE`, `INACTIVE`

### `POST /categories`

```json
{
  "category_name": "เครื่องดื่ม",
  "sort_order": 1,
  "status": "ACTIVE"
}
```

### `GET /categories`

คืนค่า array ของหมวดหมู่ พร้อม `product_count` เรียงตาม `sort_order` และ `id`

### `GET /categories/:id`

คืนค่าหมวดหมู่หนึ่งรายการ พร้อม `product_count`

### `PUT /categories/:id`

ส่งเฉพาะฟิลด์ที่ต้องการแก้ไข:

```json
{
  "category_name": "เครื่องดื่มเย็น",
  "sort_order": 2,
  "status": "ACTIVE"
}
```

### `DELETE /categories/:id`

สินค้าที่อยู่ในหมวดที่ถูกลบจะถูกย้ายไปหมวด `General`

```json
{
  "status": "ok",
  "message": "Category deleted successfully",
  "data": {
    "id": "2",
    "moved_product_count": 5,
    "moved_to_category_id": "1",
    "moved_to_category_name": "General"
  }
}
```

หมวด `General` ไม่สามารถเปลี่ยนชื่อหรือลบได้

## Products 🔒

ค่า `price_mode` ที่รองรับ:

- `FIXED_PRICE` ราคาคงที่
- `OPEN_PRICE` ให้ผู้ใช้กำหนดราคาขณะขาย
- `WEIGHT_PRICE` คิดราคาตามน้ำหนัก

ค่า `status`: `ACTIVE`, `INACTIVE`

### `POST /products`

```json
{
  "sku": "CF001",
  "barcode": "8851234567890",
  "product_name": "กาแฟเย็น",
  "category_id": 1,
  "unit_code": "PCS",
  "price_mode": "FIXED_PRICE",
  "cost_price": 30,
  "sale_price": 45,
  "stock_qty": 20,
  "min_stock_qty": 5,
  "track_stock": true,
  "allow_discount": true,
  "image_url": "/images/coffee.png",
  "description": "กาแฟเย็น",
  "status": "ACTIVE"
}
```

ฟิลด์ที่จำเป็นมีเพียง `product_name` ฟิลด์อื่นใช้ค่า default ได้

### `GET /products`

คืนค่า array ของสินค้าทั้งหมดพร้อมข้อมูล `category` เรียงตาม `id`

### `GET /products/:id`

คืนค่าสินค้าหนึ่งรายการพร้อมข้อมูล `category`

### `PUT /products/:id`

ส่งเฉพาะฟิลด์ที่ต้องการแก้ไข โดยใช้ชื่อและรูปแบบเดียวกับ `POST /products`

### `DELETE /products/:id`

```json
{
  "status": "ok",
  "message": "Product deleted successfully",
  "data": {
    "id": "1"
  }
}
```

หมายเหตุ: API จัดการสินค้าสำหรับหลังร้านอาจส่ง `cost_price` แต่ API ฝั่ง POS `/pos/products/search` จะไม่ส่งต้นทุนสินค้า

## Images 🔒

### `POST /images/upload`

ส่งแบบ `multipart/form-data` โดยใช้ชื่อ field ว่า `file`

```bash
curl -X POST http://localhost:2021/images/upload \
  -H "Authorization: Bearer <access_token>" \
  -F "file=@coffee.png"
```

รองรับ JPG, JPEG, PNG และ WEBP ขนาดสูงสุด 5 MB

Response:

```json
{
  "message": "Image uploaded successfully",
  "filename": "1750654800000.png",
  "path": "C:\\path\\to\\Images\\1750654800000.png",
  "url": "/images/1750654800000.png",
  "size": 123456,
  "mimetype": "image/png"
}
```

ไฟล์ที่อัปโหลดเรียกดูได้จาก:

```text
http://localhost:2021/images/1750654800000.png
```

### `DELETE /images/:filename`

```http
DELETE /images/1750654800000.png
```

## Favorite Groups 🔒

### `POST /favorite-groups`

```json
{
  "group_name": "สินค้าขายดี",
  "icon": "/images/best-seller.png",
  "sort_order": 1
}
```

### `GET /favorite-groups`

คืนค่า array ของกลุ่ม พร้อม `icon`, `items` และข้อมูล `product` ของแต่ละรายการ

ตัวอย่าง:

```json
[
  {
    "id": "1",
    "group_name": "สินค้าขายดี",
    "icon": "/images/best-seller.png",
    "sort_order": 1,
    "items": []
  }
]
```

`icon` เป็นข้อความความยาวไม่เกิน 2048 ตัวอักษร ใช้เก็บชื่อไอคอนหรือ URL และไม่บังคับ

### `GET /favorite-groups/:id`

คืนค่ากลุ่มหนึ่งรายการ พร้อม `icon` และ `items`

### `PUT /favorite-groups/:id`

```json
{
  "group_name": "เมนูแนะนำ",
  "icon": "star",
  "sort_order": 2
}
```

ส่ง `"icon": null` เพื่อล้างไอคอนเดิม

### `DELETE /favorite-groups/:id`

เมื่อลบกลุ่ม รายการสินค้าในกลุ่มจะถูกลบตาม

## Favorite Items 🔒

### `POST /favorite-items`

```json
{
  "favorite_group_id": 1,
  "product_id": 8,
  "sort_order": 1
}
```

สินค้าหนึ่งรายการไม่สามารถอยู่ซ้ำในกลุ่มเดียวกันได้

### `GET /favorite-items`

ดูทั้งหมด:

```http
GET /favorite-items
```

กรองตามกลุ่ม:

```http
GET /favorite-items?favorite_group_id=1
```

ผลลัพธ์มีข้อมูล `favorite_group` และ `product`

### `GET /favorite-items/:id`

คืนค่ารายการหนึ่งรายการพร้อมข้อมูลกลุ่มและสินค้า

### `PUT /favorite-items/:id`

```json
{
  "favorite_group_id": 2,
  "product_id": 8,
  "sort_order": 3
}
```

ส่งเฉพาะฟิลด์ที่ต้องการแก้ไขได้

### `DELETE /favorite-items/:id`

```json
{
  "status": "ok",
  "message": "Favorite item deleted successfully",
  "data": {
    "id": "1"
  }
}
```

## POS 🔒

### `POST /pos/scan-product`

ค้นหาสินค้า `ACTIVE` ด้วย Barcode

Body:

```json
{
  "barcode": "8851234567890",
  "machine_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

สินค้าราคาคงที่:

```json
{
  "success": true,
  "product": {
    "id": 1,
    "name": "กาแฟเย็น",
    "product_type": "FIXED_PRICE",
    "sale_price": 45,
    "stock_qty": 20
  }
}
```

สินค้าชั่งน้ำหนัก:

```json
{
  "success": true,
  "code": "WEIGHT_REQUIRED",
  "product": {
    "id": 8,
    "barcode": "2000001",
    "name": "หมูสด",
    "product_type": "WEIGHT",
    "unit": "kg",
    "price_per_unit": 180
  }
}
```

สินค้าเปิดราคา:

```json
{
  "success": true,
  "code": "PRICE_REQUIRED",
  "product": {
    "id": 5,
    "barcode": "2000005",
    "name": "สินค้าเปิดราคา",
    "product_type": "OPEN_PRICE",
    "unit": "PCS"
  }
}
```

ไม่พบสินค้า:

```json
{
  "success": false,
  "code": "PRODUCT_NOT_FOUND",
  "message": "Barcode 8851234567890 Not registered in the system."
}
```

### `GET /pos/products/search?q=...`

ค้นหาเฉพาะสินค้า `ACTIVE` จาก Barcode, SKU หรือชื่อสินค้า โดย exact match จะแสดงก่อน

ตัวอย่าง:

```http
GET /pos/products/search?q=กาแฟ
GET /pos/products/search?q=CF001
GET /pos/products/search?q=8851234567890
```

`q` จำเป็นต้องมีค่าและยาวไม่เกิน 255 ตัวอักษร

พบหลายรายการ:

```json
{
  "status": "success",
  "keyword": "กาแฟ",
  "total": 2,
  "data": [
    {
      "product_id": 1,
      "barcode": "8851234567890",
      "sku": "CF001",
      "name": "กาแฟเย็น",
      "product_type": "NORMAL",
      "price_mode": "FIXED_PRICE",
      "price": 45,
      "track_stock": true,
      "stock_qty": 20,
      "image_url": "/images/coffee.png"
    },
    {
      "product_id": 2,
      "barcode": "8851234567891",
      "sku": "CF002",
      "name": "กาแฟร้อน",
      "product_type": "NORMAL",
      "price_mode": "FIXED_PRICE",
      "price": 40,
      "track_stock": true,
      "stock_qty": 15,
      "image_url": "/images/coffee-hot.png"
    }
  ]
}
```

พบสินค้าราคาคงที่หนึ่งรายการ:

```json
{
  "status": "success",
  "total": 1,
  "auto_select": true,
  "data": [
    {
      "product_id": 1,
      "barcode": "8851234567890",
      "sku": "CF001",
      "name": "กาแฟเย็น",
      "product_type": "NORMAL",
      "price_mode": "FIXED_PRICE",
      "price": 45,
      "track_stock": true,
      "stock_qty": 20
    }
  ]
}
```

พบสินค้าชั่งน้ำหนักหนึ่งรายการ:

```json
{
  "status": "success",
  "action": "WEIGHT_REQUIRED",
  "data": {
    "product_id": 8,
    "barcode": "2000001",
    "name": "หมูสด",
    "product_type": "WEIGHT",
    "price_mode": "WEIGHT_PRICE",
    "unit": "kg",
    "price_per_unit": 180
  }
}
```

พบสินค้าเปิดราคาหนึ่งรายการ:

```json
{
  "status": "success",
  "action": "OPEN_PRICE_REQUIRED",
  "data": {
    "product_id": 5,
    "name": "เบียร์ช้างเย็นเป็นวุ้น",
    "price_mode": "OPEN_PRICE",
    "default_price": 62
  }
}
```

ไม่พบสินค้า:

```json
{
  "status": "not_found",
  "message": "No products found."
}
```

API search สำหรับ POS จะไม่ส่ง `cost_price`

## Validation และ Error

ระบบเปิดใช้ ValidationPipe โดย:

- ตัด field ที่ไม่ได้ประกาศใน DTO ออก
- แปลง query/body เป็นชนิดข้อมูลที่กำหนดเมื่อทำได้
- ตรวจสอบ required field, enum, UUID, IP address และช่วงตัวเลข

ตัวอย่าง Validation Error:

```json
{
  "message": [
    "q should not be empty"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

HTTP status ที่พบได้:

| Status | ความหมาย |
| --- | --- |
| 200 | สำเร็จ |
| 201 | สร้างข้อมูลสำเร็จ |
| 400 | ข้อมูลไม่ถูกต้องหรือ reference ไม่มีอยู่ |
| 401 | ไม่มี Access Token, token ผิด หรือหมดอายุ |
| 404 | ไม่พบข้อมูลหรือ endpoint |
| 409 | ข้อมูลซ้ำหรือไม่สามารถลบข้อมูลที่กำลังถูกใช้งาน |

## หมายเหตุด้านความปลอดภัย

- ห้าม commit ไฟล์ `.env`
- Production ควรกำหนด `JWT_SECRET`, `ACCESS_TOKEN_SECRET` และ `REFRESH_TOKEN_SECRET` เป็นค่าสุ่มที่คาดเดายาก
- ไม่ควรส่ง `cost_price` ไปยัง POS client
- Endpoint จัดการข้อมูลหลังร้านควรใช้ Access Token เสมอ
