import express from "express";
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();
app.use(express.json());

///////////// USERS //////////////

// create users
app.post("/user", async (req: Request, res: Response) => {
  try {
    const email: string = req.body.email;
    const name: string = req.body.name;

    const user = await prisma.user.create({
      data: {
        email,
        name
      }
    });

    res.status(201).json(user);
  } catch (err: any) {
    res.status(500).json({
      error: err.message
    });
  }
});

// get users by id
app.get("/users/:id", async (req: Request<{ id: string }>, res: Response) => {
  const user = await prisma.user.findUnique({
    where: {
      id: req.params.id
    }
  });

  if (!user) {
    return res.status(404).json({
      error: "User not found"
    });
  }

  res.json(user);
});

///////////// PROJECTS //////////////

app.post("/projects", async (req: Request, res: Response) => {
  try {
    const title: string = req.body.title;
    const description: string | undefined = req.body.description;
    const userId: string = req.body.userId;

    const project = await prisma.project.create({
      data: {
        title,
        description,
        userId
      }
    });

    res.status(201).json(project);
  } catch (err: any) {
    return res.status(500).json({
      error: err.message
    });
  }
});

// get all projects (filtered by user id)
app.get("/projects", async (req: Request, res: Response) => {
  const userId = req.query.userId as string | undefined;

  const projects = await prisma.project.findMany({
    where: userId ? { userId } : {}
  });

  res.json(projects);
});

// Get project with its tasks
app.get("/projects/:id", async (req: Request<{ id: string }>, res: Response) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: { tasks: true }
  });

  if (!project) {
    return res.status(404).json({
      error: "Project not found"
    });
  }

  res.json(project);
});

///////////// TASKS //////////////

// create tasks
app.post("/tasks", async (req: Request<{ id: string }>, res: Response) => {
  try {
    const title: string = req.body.title;
    const description: string | undefined = req.body.description;
    const status: string = req.body.status;
    const priority: string = req.body.priority;
    const projectId: string = req.body.projectId;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        projectId
      }
    });

    res.status(201).json(task);
  } catch (err: any) {
    return res.status(500).json({
      error: err.message
    });
  }
});

// get task by ID
app.get("/tasks/:id", async (req: Request<{ id: string }>, res: Response) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.id }
  });

  if (!task) {
    return res.status(404).json({
      error: "Task not found"
    });
  }

  res.json(task);
});

// update task
app.patch("/tasks/:id", async (req: Request<{ id: string }>, res: Response) => {
  try {
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: req.body
    });

    res.json(task);
  } catch (err: any) {
    return res.status(500).json({
      error: err.message
    });
  }
});

// delete task
app.delete("/tasks/:id", async (req: Request<{ id: string }>, res: Response) => {
  try {
    await prisma.task.delete({
      where: { id: req.params.id }
    });

    res.status(204).send();
  } catch (err: any) {
    return res.status(500).json({
      error: err.message
    });
  }
});

// get tasks by project
app.get("/projects/:projectId/tasks", async (req: Request, res: Response) => {
  const tasks = await prisma.task.findMany({
    where: { projectId: req.params.projectId as string }
  });

  res.json(tasks);
});

app.listen(3000, () => {
  console.log("Port is listening on 3000");
});
