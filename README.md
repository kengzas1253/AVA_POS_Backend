# AVA POS Backend

Backend API สำหรับระบบ AVA POS พัฒนาด้วย NestJS, TypeORM และ PostgreSQL

## สิ่งที่ต้องติดตั้ง

- Node.js
- npm
- Docker Desktop
- Git

## ติดตั้งโปรเจกต์

```bash
git clone https://github.com/kengzas1253/AVA_POS_Backend.git
cd AVA_POS_Backend
npm install
```

## การสร้างไฟล์ `.env`

สร้างไฟล์ชื่อ `.env` ไว้ที่ root ของโปรเจกต์ ซึ่งเป็นตำแหน่งเดียวกับ `package.json`

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=avapos@2026
DB_DATABASE=AVA_POS_DB

JWT_SECRET=change-this-to-a-random-secret
ACCESS_TOKEN_SECRET=change-this-access-token-secret
REFRESH_TOKEN_SECRET=change-this-refresh-token-secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

ควรเปลี่ยนค่า secret และ password ให้เหมาะกับ environment ที่ใช้งานจริง

> ห้ามนำไฟล์ `.env` ขึ้น Git เพราะมีรหัสผ่านและข้อมูลลับ โดยโปรเจกต์ได้เพิ่ม `.env` ไว้ใน `.gitignore` แล้ว

ตรวจสอบว่า Git ignore ไฟล์ `.env` ถูกต้อง:

```bash
git check-ignore -v .env
```

## เปิด PostgreSQL

```bash
cd docker
docker compose up -d
cd ..
```

ตรวจสอบ container:

```bash
docker compose -f docker/docker-compose.yml ps
```

## รันโปรเจกต์

Development mode:

```bash
npm run start:dev
```

Build และรัน production:

```bash
npm run build
npm run start:prod
```

## การนำงานขึ้น GitHub

ตรวจสอบไฟล์ก่อน commit:

```bash
git status
```

เพิ่มไฟล์ทั้งหมดที่ไม่ถูก `.gitignore`:

```bash
git add .
```

ตรวจสอบอีกครั้งว่าไม่มี `.env` หรือ `docker/db` อยู่ในรายการ:

```bash
git status
```

สร้าง commit และ push:

```bash
git commit -m "Update project"
git push origin main
```

หากเป็นการ push ครั้งแรก:

```bash
git push -u origin main
```

หากเผลอเพิ่ม `.env` เข้า staging ให้เอาออกก่อน commit โดยไฟล์จริงจะยังอยู่ในเครื่อง:

```bash
git rm --cached .env
```

หาก `.env` เคยถูก push ขึ้น GitHub แล้ว ควรเปลี่ยนรหัสผ่านและ secret ทั้งหมดทันที
