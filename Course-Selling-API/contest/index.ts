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
