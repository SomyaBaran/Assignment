# Assesment

# Appointment Booking System — Slot-Based Booking

## Duration

**2 – 2.5 hours**

---

## Tech Stack (Mandatory)

- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Zod for request validation

---

## Objective

Build a role-based appointment booking backend where:

- Service providers create services of a specific type
- Providers define weekly availability for their services
- Users can fetch services by type
- Users can view derived slots for a given date
- Users can book appointments using slot IDs

---

## Authentication & Authorization

### Authentication

JWT based authentication.

Header:

```
Authorization: Bearer <jwt>
```

### Roles

- `USER`
- `SERVICE_PROVIDER`

### Data Models (Expected)

---

### User

- `id`
- `name`
- `email` (unique)
- `passwordHash`
- `role` (`USER | SERVICE_PROVIDER`)
- `createdAt`

---

### Service

- `id`
- `name`
- `type`
- `providerId` (User)
- `durationMinutes`
- `createdAt`

### Service Type (Enum)

```tsx
MEDICAL
HOUSE_HELP
BEAUTY
FITNESS
EDUCATION
OTHER
```

---

### Availability

Weekly recurring availability for a service.

- `id`
- `serviceId`
- `dayOfWeek` (0 = Sunday, 6 = Saturday)
- `startTime` (`HH:MM`)
- `endTime` (`HH:MM`)

---

### Appointment

- `id`
- `userId`
- `serviceId`
- `date` (`YYYY-MM-DD`)
- `startTime` (`HH:MM`)
- `endTime` (`HH:MM`)
- `slotId` (unique)  // but no slots table  `slotId` format: `<serviceId>_<YYYY-MM-DD>_<HH:MM>`
- `status` (`BOOKED | CANCELLED`)
- `createdAt`

---

## Global Time & Slot Constraints

### Time Format Rules

- `HH:MM` (24-hour)
- Minutes allowed: `00` or `30` only
- Any other minute value is invalid

### Slot Duration Rules

- Minimum duration: **30 minutes**
- Maximum duration: **120 minutes**
- Must be a multiple of 30

### Date & Time Rules

- Booking past dates or times is forbidden
- `startTime < endTime` always

---

## Slot Generation Rules

- Slots are derived dynamically per service and date
- Slots are never stored in the database
- Slot validity requires:
    - Full containment within availability window
    - Exact alignment with service duration
    - No overlap with existing booked appointments

---

## API Routes (8 Total)

---

## 1. Register

**POST** `/auth/register`

### Request Body

```json
{
"name":"Dr Smith",
"email":"dr@clinic.com",
"password":"password123",
"role":"SERVICE_PROVIDER"
}
```

### Success

**201 Created**

```json
{
"message":"User created Successfully with id {userId}"
}
```

### Errors

- `400` Invalid input (Zod)
- `409` Email already exists
- `500` Internal server error

---

## 2. Login

**POST** `/auth/login`

### Success

**200 OK**

```json
{
"token":"jwt-token"
}
```

### Errors

- `400` Invalid input
- `401` Invalid credentials
- `500` Internal server error

---

## 3. Create Service (Service Provider Only)

**POST** `/services`

### Request Body

```json
{
"name":"Physiotherapy",
"type":"MEDICAL",
"durationMinutes":30
}
```

### Constraints

- `type` must be a valid enum
- `durationMinutes` must be 30–120
- Must be a multiple of 30

### Success

**201 Created**

```json
{
"id":"uuid",
"name":"Physiotherapy",
"type":"MEDICAL",
"durationMinutes":30
}
```

### Errors

- `400` Invalid input
- `403` Forbidden (wrong role)
- `500` Internal server error

---

## 4. Set Availability (Service Provider Only)

**POST** `/services/:serviceId/availability`

### Request Body

```json
{
"dayOfWeek":4,
"startTime":"09:00",
"endTime":"12:00"
}
```

### Constraints

- `dayOfWeek` must be 0–6 (0-sunday , 6-saturday)
- Time format rules apply
- Availability must not overlap existing availability for the service

### Success

**201 Created**

### Errors

- `400` Invalid input or time format
- `403` Service does not belong to provider
- `404` Service not found
- `409` Overlapping availability
- `500` Internal server error

---

## 5. Get Services (Filter by Type)

**GET** `/services`

### Query Parameters (Optional)

- `type=MEDICAL`

### Success

**200 OK**

```json
[
  {
    "id": "uuid",
    "name": "Physiotherapy",
    "type": "MEDICAL",
    "durationMinutes": 30,
    "providerName": "Dr Smith"
  }
]
```

### Errors

- `400` Invalid service type
- `500` Internal server error

---

## 6. Get Slots for a Service (Derived)

**GET** `/services/:serviceId/slots?date=YYYY-MM-DD`

### Success

**200 OK**

```json
{
  "serviceId": "uuid",
  "date": "2026-02-06",
  "slots": [
    {
      "slotId": "uuid_2026-02-06_09:00",
      "startTime": "09:00",
      "endTime": "09:30"
    }
  ]
}
```

### Errors

- `400` Invalid date or format
- `404` Service not found
- `500` Internal server error

---

## 7. Book Appointment (User Only)

**POST** `/appointments`

### Request Body

```json
{
"slotId":"uuid_2026-02-06_09:00"
}
```

### Mandatory Booking Logic

- Parse `slotId`
- Re-derive slot
- Validate availability
- Ensure slot is not booked
- Create appointment in a transaction
- Enforce unique `slotId`
- Service Provider can’t book its own service

### Success

**201 Created**

```json
{
"id":"uuid",
"slotId":"uuid_2026-02-06_09:00",
"status":"BOOKED"
}
```

### Errors

- `400` Invalid slotId or time
- `401` Unauthorized
- `403` Forbidden
- `409` Slot already booked
- `500` Internal server error

---

## 8. Get My Appointments

**GET** `/appointments/me`

### Success

**200 OK**

```json
[
  {
    "serviceName": "Physiotherapy",
    "type": "MEDICAL",
    "date": "2026-02-06",
    "startTime": "09:00",
    "endTime": "09:30",
    "status": "BOOKED"
  }
]
```

### Errors

- `401` Unauthorized
- `500` Internal server error

## Bonus (HARD)

### 9. Provider Daily Schedule

**GET** `/providers/me/schedule?date=YYYY-MM-DD`

### Authorization

- JWT required
- Role must be `SERVICE_PROVIDER`

---

### Description

Fetch the provider’s complete schedule for a specific date, grouped by service.

This includes all booked appointments for services owned by the provider.

---

### Mandatory Logic

1. Extract provider ID from JWT
2. Validate date format (`YYYY-MM-DD`)
3. Fetch all services owned by the provider
4. Fetch all appointments for those services on the given date
5. Sort appointments by `startTime`
6. Group appointments by service

---

### Success Response

**200 OK**

```json
{
  "date": "2026-02-06",
  "services": [
    {
      "serviceId": "uuid",
      "serviceName": "Physiotherapy",
      "appointments": [
        {
          "appointmentId": "uuid",
          "userName": "Rahul",
          "startTime": "09:00",
          "endTime": "09:30",
          "status": "BOOKED"
        }
      ]
    }
  ]
}
```




