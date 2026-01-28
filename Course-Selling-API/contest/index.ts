import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "./db";

const app = express();
app.use(express.json());
const JWT_SECRET = "mysecretpassword";
const saltrounds = 10;


// Register a user
app.post("/auth/signup", async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;
    const role = req.body.role;

    const hashed = await bcrypt.hash(password, saltrounds);
    const user = await prisma.user.create({
        data: {
            email,
            password: hashed,
            name,
            role
        }
    });

    res.json({
        id: user.id
    });
});

// Login and return JWT
app.post("/auth/login", async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        return res.status(401).json({
            error: "Invalid credentials"
        });
    }

    const passwordCheck = await bcrypt.compare(password, user.password);
    if (!passwordCheck) {
        return res.status(401).json({
            error: "Invalid credentials"
        });
    }

    const token = jwt.sign(
        {
            userId: user.id,
            role: user.role
        },
        JWT_SECRET
    );

    res.json({
        token
    });
});

// Only INSTRUCTOR can create courses
app.post("/courses", async (req, res) => {
    const title = req.body.title;
    const description = req.body.description;
    const price = req.body.price;

    const course = await prisma.course.create({
        data: {
            title,
            description,
            price
        }
    });

    res.json(course);
});

// Public endpoint
app.get("/courses", async (req, res) => {
    const courses = await prisma.course.findMany();
    res.json(courses);
});

// Get course with all lessons
app.get("/courses/:id", async (req, res) => {
    const course = await prisma.course.findUnique({
        where: { id: req.params.id },
        include: { lessons: true }
    });

    res.json(course);
});

// Only course instructor
app.patch("/courses/:id", async (req, res) => {
    const course = await prisma.course.findUnique({
        where: { id: req.params.id }
    });

    if (!course || course.instructorId !== (req as any).userId) {
        return res.status(403).json({
            error: "course not found for you!"
        });
    }

    const updated = await prisma.course.update({
        where: { id: req.params.id },
        data: req.body
    });

    res.json(updated);
});

// Only course instructor
app.delete("/courses/:id", async (req, res) => {

    const course = await prisma.course.findUnique({
        where: { id: req.params.id }
    });

    if (!course || course.instructorId !== (req as any).userId) {
        return res.status(401).json({
            error: "Forbidden"
        });
    }

    await prisma.course.delete({
        where: { id: req.params.id }
    });
    res.json({
        success: true
    });
});

//////// LESSONS ////////////
app.post("/lessons", async (req, res) => {
    const title = req.body.title;
    const content = req.body.content;
    const courseId = req.body.courseId;

    if (!title || !content || !courseId) {
        return res.status(400).json({
            error: "Missing fields"
        });
    }
    const course = await prisma.courseId.findUnique({
        where: { id: courseId }
    });
    if (!course) {
        return res.status(404).json({
            error: "Course not found"
        });
    }
    if (course.instructorId !== req.userId) {
        return res.status(403).json({
            error: "Not authorized"
        });
    }
    const lesson = await prisma.lesson.create({
        data: {
            title,
            content,
            courseId
        }
    });
    res.status(201).json(lesson);
})
app.get("/courses/:courseId/lessons", async (req, res) => {
    const courseId = req.params.courseId;
    const lessons = await prisma.lesson.findMany({
        where: { courseId },
        orderBy: { createdAt: "asc" }
    });

    res.json(lessons);
});


//////// PURCHASE ////////////
//     const existingPurchase = await prisma.purchase.findFirst({
//         where: { courseId, userId: req.userId },
//     });
//     if (existingPurchase) return res.status(400).json({ error: "Course already purchased" });

//     const purchase = await prisma.purchase.create({
//         data: {
//             courseId,
//             userId: req.userId!,
//         },
//     });

//     res.status(201).json(purchase);
// });
app.post("/purchases", async (req, res) => {
    const courseId = req.body.courseId;
    if (!courseId) {
        return res.status(400).json({
            error: "CourseId is required"
        });
    }

    if (req.role !== "STUDENT") {
        return res.status(403).json({
            error: "Only students can purchase courses"
        });
    }

    const course = await prisma.course.findUnique({
        where: { id: courseId }
    });

    if (!course) {
        return res.status(404).json({
            error: "Course not found"
        });
    }

    const existingPurchase = await prisma.purchase.findFirst({
        where: {
            courseId,
            userId: req.userId
        }
    });
    if (existingPurchase) {
        return res.status(400).json({
            error: "Course already purchased"
        });
    }

    
})