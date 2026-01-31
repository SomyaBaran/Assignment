import express from "express";
import "dotenv/config";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "./db";

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;
const saltrounds = 10;


// 1 
app.post("/auth/signup", async (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;

    if (!username || !email || !password) {
        return res.status(400).json({
            error: "Missing fields"
        });
    }

    try {
        const existing = await prisma.user.findUnique({
            where: { email }
        });

        if (!existing) {
            return res.status(409).json({
                msg: "Email exists"
            });
        }

        const hashed = await bcrypt.hash(password, saltrounds);
        await prisma.user.create({
            data: {
                username,
                email,
                password: hashed
            }
        });

        return res.status(201).json({
            msg: "User created successfully"
        });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Server error" });
    }
});


// 2
app.post("/auth/signin", async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    if (!email || !password) {
        return res.status(400).json({
            error: "Missing fields"
        });
    }


    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({
                msg: "Invalid credentials"
            });
        }
        const ok = await bcrypt.compare(password, user.password)
        if (!ok) {
            return res.status(401).json({
                msg: "Invalid credentials"
            });
        }

        const token = jwt.sign(
            { id: user.id },
            JWT_SECRET
        );

        return res.status(200).json({ token });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Server error"
        });
    }
});

// 3
app.post("/courses", async (req, res) => {
    const title = req.body.title;
    const description = req.body.description;
    const amount = req.body.amount;
    const adminId = req.body.adminId;

    if (!title || !description || !amount || !adminId) {
        return res.status(400).json({
            error: "Missing fields"
        });
    }

    try {
        const course = await prisma.course.create({
            data: {
                title,
                description,
                amount,
                adminId
            }
        });

        return res.status(201).json({
            id: course.id,
            title: course.title
        });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            err: "Server error"
        });
    }
});


// 4 
app.get("/courses", async (req, res) => {
    try {
        const courses = await prisma.course.findMany({
            include: {
                admin: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        return res.status(200).json(courses);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            error: "Server error"
        });
    }
});

// 5
app.post("/courses/:courseId/lectures", async (req, res) => {
    const courseId = req.params.courseId;
    const title = req.body.title;
    const videoUrl = req.body.videoUrl;
    const order = req.body.order;

    if (!title || !videoUrl || !order) {
        return res.status(400).json({
            msg: "Missing fields"
        });
    }


    try {
        await prisma.lecture.create({
            data: {
                title,
                videoUrl,
                order,
                courseId
            }
        });
        return res.status(201).json({
            msg: "Course added successfully"
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            error: "Server error"
        });
    }
});

// 6


