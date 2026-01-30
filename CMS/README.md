<!-- # CMS:  28-Jan-2026

**Time Limit:** 2.5 hours

**Tools Allowed:** Google, Official Documentation, Stack Overflow (**NO AI tools**)

---

## Tech Stack (Mandatory)

- **Runtime:** Bun
- **Language:** TypeScript
- **Framework:** Express
- **Validation:** Zod
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Auth:** JWT (Access Token only)

---

## Objective

Build a backend API for a **Course Platform** where:

- Users can sign up and log in
- Users can **create courses** (course admin / instructor)
- Courses contain **multiple lectures**
- Users can **enroll in courses** (many-to-many)
- Users can **purchase a subscription**
- Enrollment + payment must happen inside a **database transaction**

---

## Data Modeling Rules

- Use **Prisma**
- You **ARE allowed**:
    - `1:many`
    - `many:many` using an **explicit join table**
- You **MUST use transactions** for enrollment + payment
- Soft deletes are **NOT required**

---

## Database Models

### 1. User

Represents platform users.

```tsx
User
-id (PK)
- name
-email (unique)
- password
- createdAt
// should I add role in here or not ???
```

### 2. Course

Represents a course created by a user (admin/instructor).

```tsx
Course
-id (PK)
- title
- description
- amount
-adminId (FK →User.id)
- createdAt
```

**Relationship**

- One user → many courses (admin)
- One course → one admin

---

### 3. Lecture

Represents a lecture inside a course.

```tsx
Lecture
-id (PK)
- title
- videoUrl
-courseId (FK →Course.id)
- order
```

**Relationship**

- One course → many lectures

---

### 4. Enrollment (Many-to-Many)

Tracks which user is enrolled in which course.

```tsx
Enrollment
-id (PK)
-userId (FK →User.id)
-courseId (FK →Course.id)
- enrolledAt
```

**Constraints**

- `(userId, courseId)` must be **unique**
- A user can enroll in many courses
- A course can have many users

---

### 5. Subscription (Payments)

Tracks course purchase/payment.

```tsx
Subscription
-id (PK)
-userId (FK →User.id)
-courseId (FK →Course.id)
- amount
-status (SUCCESS |FAILED)
- createdAt
```

---

## Authentication Rules

- JWT required for **all routes except signup & signin**
- Token must be sent via:
    
    ```
    Authorization: Bearer <token>
    ```
    

---

## API Endpoints

---

## Auth Routes

### 1. Signup

**POST** `/auth/signup`

### Request

```json
{
"name":"Rahul",
"email":"rahul@test.com",
"password":"123456"
}
```

### Success Response (201)

```json
{
"message":"User created successfully"
}
```

### Errors

- `400` – Invalid input
- `409` – Email already exists

---

### 2. Signin

**POST** `/auth/signin`

### Request

```json
{
"email":"rahul@test.com",
"password":"123456"
}
```

### Success Response (200)

```json
{
"token":"jwt_token_here"
}
```

### Errors

- `401` – Invalid credentials

---

## Course Routes

### 3. Create Course (Admin)

**POST** `/courses`

### Auth Required

### Request

```json
{
"title":"Backend with Node.js",
"description":"Learn backend from scratch"
}
```

### Success Response (201)

```json
{
"id":"course_id",
"title":"Backend with Node.js"
}
```

### Errors

- `401` – Unauthorized
- `400` – Invalid input

---

### 4. Get All Courses

**GET** `/courses`

### Response (200)

```json
[
{
"id":"course_id",
"title":"Backend with Node.js",
"admin":{
"id":"user_id",
"name":"Rahul"
}
}
]
```

---

## Lecture Routes

### 5. Add Lecture to Course

**POST** `/courses/:courseId/lectures`

### Auth Required

Only course admin can add lectures.

### Request

```json
{
"title":"Introduction",
"videoUrl":"https://video.com/1",
"order":1
}
```

### Success Response (201)

```json
{
"message":"Lecture added successfully"
}
```

### Errors

- `403` – Not course admin
- `404` – Course not found

---

### 6. Get Course Lectures

**GET** `/courses/:courseId/lectures`
- Admin or enrolled students can view the lecture

### Response (200)

```json
[
{
"id":"lecture_id",
"title":"Introduction",
"order":1
}
]
```

---

## Enrollment & Payment (IMPORTANT)

### 7. Purchase Course (Transaction Required)

**POST** `/courses/:courseId/purchase`

### Auth Required

### Logic (MUST FOLLOW)

Inside **Prisma Transaction**:

1. Create **Subscription** with status `SUCCESS`
2. Create **Enrollment**
3. If any step fails → rollback

### Request

```json
{
"amount":999
}
```

### Success Response (201)

```json
{
"message":"Course purchased successfully"
}
```

### Errors

- `400` – Already enrolled
- `404` – Course not found
- `500` – Transaction failed

---

## Enrollment Routes

### 8. Get My Enrolled Courses

**GET** `/me/courses`

### Auth Required

### Response (200)

```json
[
{
"courseId":"course_id",
"title":"Backend with Node.js",
"enrolledAt":"2026-01-01T10:00:00Z"
}
]
```

---

## Subscription Routes

### 9. Get My Payments

**GET** `/me/subscriptions`

### Auth Required

### Response (200)

```json
[
{
"courseId":"course_id",
"amount":999,
"status":"SUCCESS",
"createdAt":"2026-01-01T10:00:00Z"
}
]
``` -->