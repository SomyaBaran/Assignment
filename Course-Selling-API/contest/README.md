import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "./db";

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET!;

interface AuthRequest extends express.Request {
  userId?: string;
  role?: "STUDENT" | "INSTRUCTOR";
}

function authMiddleware(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Unauthorized" });

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: "STUDENT" | "INSTRUCTOR";
    };
    req.userId = decoded.userId;
    req.role = decoded.role;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function requireRole(role: "STUDENT" | "INSTRUCTOR") {
  return (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
    if (req.role !== role) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

app.post("/auth/signup", async (req, res) => {
  const { email, password, name, role } = req.body;
  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, password: hashed, name, role }
  });

  res.json({ id: user.id });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET
  );

  res.json({ token });
});

app.post("/courses", authMiddleware, requireRole("INSTRUCTOR"), async (req: AuthRequest, res) => {
  const { title, description, price } = req.body;

  const course = await prisma.course.create({
    data: {
      title,
      description,
      price,
      instructorId: req.userId!
    }
  });

  res.json(course);
});

app.get("/courses", async (_req, res) => {
  const courses = await prisma.course.findMany();
  res.json(courses);
});

app.get("/courses/:id", async (req, res) => {
  const course = await prisma.course.findUnique({
    where: { id: req.params.id },
    include: { lessons: true }
  });
  res.json(course);
});

app.patch("/courses/:id", authMiddleware, requireRole("INSTRUCTOR"), async (req: AuthRequest, res) => {
  const course = await prisma.course.findUnique({ where: { id: req.params.id } });
  if (!course || course.instructorId !== req.userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const updated = await prisma.course.update({
    where: { id: req.params.id },
    data: req.body
  });

  res.json(updated);
});

app.delete("/courses/:id", authMiddleware, requireRole("INSTRUCTOR"), async (req: AuthRequest, res) => {
  const course = await prisma.course.findUnique({ where: { id: req.params.id } });
  if (!course || course.instructorId !== req.userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await prisma.course.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

app.post("/lessons", authMiddleware, requireRole("INSTRUCTOR"), async (req: AuthRequest, res) => {
  const { title, content, courseId } = req.body;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.instructorId !== req.userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const lesson = await prisma.lesson.create({
    data: { title, content, courseId }
  });

  res.json(lesson);
});

app.get("/courses/:courseId/lessons", async (req, res) => {
  const lessons = await prisma.lesson.findMany({
    where: { courseId: req.params.courseId }
  });
  res.json(lessons);
});

app.post("/purchases", authMiddleware, requireRole("STUDENT"), async (req: AuthRequest, res) => {
  const { courseId } = req.body;

  const purchase = await prisma.purchase.create({
    data: {
      userId: req.userId!,
      courseId
    }
  });

  res.json(purchase);
});

app.get("/users/:id/purchases", authMiddleware, async (req: AuthRequest, res) => {
  if (req.userId !== req.params.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const purchases = await prisma.purchase.findMany({
    where: { userId: req.params.id },
    include: { course: true }
  });

  res.json(purchases);
});

app.listen(3000);
