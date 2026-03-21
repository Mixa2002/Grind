import { Router, Request, Response } from "express";
import prisma from "../prisma.js";
import { transformTask } from "../utils/transform.js";

const router = Router();

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const VALID_DAYS = new Set(DAY_NAMES);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const VALID_SOURCES = new Set(["day", "week", "month"]);

// GET /api/tasks
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const dateParam = typeof req.query.date === "string" ? req.query.date : undefined;

  if (!dateParam) {
    const tasks = await prisma.task.findMany({
      where: { userId },
      include: { completions: true },
      orderBy: { startTime: "asc" },
    });
    res.json(tasks.map(transformTask));
    return;
  }

  // Compute weekday name from the date string
  const dayIndex = new Date(dateParam + "T00:00:00").getDay();
  const dayName = DAY_NAMES[dayIndex];

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      OR: [
        { repeatable: false, date: dateParam },
        { repeatable: true, repeatDays: { has: dayName } },
      ],
    },
    include: { completions: true },
    orderBy: { startTime: "asc" },
  });

  res.json(tasks.map(transformTask));
});

// POST /api/tasks
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { title, date, startTime, duration, hardness, repeatable, repeatDays, source } = req.body as {
    title: unknown;
    date: unknown;
    startTime: unknown;
    duration: unknown;
    hardness: unknown;
    repeatable: unknown;
    repeatDays: unknown;
    source: unknown;
  };

  // Validation
  if (!title || typeof title !== "string") {
    res.status(400).json({ error: "Title is required" });
    return;
  }
  const trimmedTitle = title.trim().slice(0, 200);
  if (trimmedTitle.length === 0) {
    res.status(400).json({ error: "Title is required" });
    return;
  }
  if (typeof date === "string" && date.length > 0 && !DATE_RE.test(date)) {
    res.status(400).json({ error: "Date must be in YYYY-MM-DD format" });
    return;
  }
  if (startTime === undefined || startTime === null || typeof startTime !== "number" || !Number.isInteger(startTime) || startTime < 0 || startTime > 1439) {
    res.status(400).json({ error: "startTime must be an integer between 0 and 1439" });
    return;
  }
  if (typeof duration !== "number" || !Number.isInteger(duration) || duration < 5 || duration > 180) {
    res.status(400).json({ error: "Duration must be between 5 and 180 minutes" });
    return;
  }
  if (typeof hardness !== "number" || !Number.isInteger(hardness) || hardness < 1 || hardness > 5) {
    res.status(400).json({ error: "Hardness must be between 1 and 5" });
    return;
  }
  if (!VALID_SOURCES.has(source as string)) {
    res.status(400).json({ error: "Source must be 'day', 'week', or 'month'" });
    return;
  }

  const validRepeatDays: string[] = [];
  if (Array.isArray(repeatDays)) {
    for (const d of repeatDays) {
      if (typeof d === "string" && VALID_DAYS.has(d as typeof DAY_NAMES[number])) {
        validRepeatDays.push(d);
      }
    }
  }

  const task = await prisma.task.create({
    data: {
      userId,
      title: trimmedTitle,
      date: typeof date === "string" ? date : "",
      startTime,
      duration,
      hardness,
      repeatable: repeatable === true,
      repeatDays: validRepeatDays,
      source: source as string,
    },
    include: { completions: true },
  });

  res.status(201).json(transformTask(task));
});

// PATCH /api/tasks/:id
router.patch("/:id", async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const id = req.params.id as string;

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const body = req.body as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.trim().length === 0) {
      res.status(400).json({ error: "Title must be a non-empty string" });
      return;
    }
    data.title = (body.title as string).trim().slice(0, 200);
  }
  if (body.date !== undefined) {
    if (typeof body.date !== "string" || (body.date.length > 0 && !DATE_RE.test(body.date))) {
      res.status(400).json({ error: "Date must be in YYYY-MM-DD format" });
      return;
    }
    data.date = body.date;
  }
  if (body.startTime !== undefined) {
    if (typeof body.startTime !== "number" || !Number.isInteger(body.startTime) || body.startTime < 0 || body.startTime > 1439) {
      res.status(400).json({ error: "startTime must be an integer between 0 and 1439" });
      return;
    }
    data.startTime = body.startTime;
  }
  if (body.duration !== undefined) {
    if (typeof body.duration !== "number" || !Number.isInteger(body.duration) || body.duration < 5 || body.duration > 180) {
      res.status(400).json({ error: "Duration must be between 5 and 180 minutes" });
      return;
    }
    data.duration = body.duration;
  }
  if (body.hardness !== undefined) {
    if (typeof body.hardness !== "number" || !Number.isInteger(body.hardness) || body.hardness < 1 || body.hardness > 5) {
      res.status(400).json({ error: "Hardness must be between 1 and 5" });
      return;
    }
    data.hardness = body.hardness;
  }
  if (body.repeatable !== undefined) {
    data.repeatable = body.repeatable === true;
  }
  if (body.repeatDays !== undefined) {
    if (!Array.isArray(body.repeatDays)) {
      res.status(400).json({ error: "repeatDays must be an array" });
      return;
    }
    data.repeatDays = (body.repeatDays as string[]).filter((d) => typeof d === "string" && VALID_DAYS.has(d as typeof DAY_NAMES[number]));
  }
  if (body.source !== undefined) {
    if (!VALID_SOURCES.has(body.source as string)) {
      res.status(400).json({ error: "Source must be 'day', 'week', or 'month'" });
      return;
    }
    data.source = body.source;
  }

  const task = await prisma.task.update({
    where: { id },
    data,
    include: { completions: true },
  });

  res.json(transformTask(task));
});

// DELETE /api/tasks/:id
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const id = req.params.id as string;

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  await prisma.task.delete({ where: { id } });
  res.status(204).send();
});

// POST /api/tasks/:id/completions
router.post("/:id/completions", async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const id = req.params.id as string;
  const { date, done } = req.body as { date: unknown; done: unknown };

  if (typeof date !== "string" || !DATE_RE.test(date)) {
    res.status(400).json({ error: "Date must be in YYYY-MM-DD format" });
    return;
  }
  if (typeof done !== "boolean") {
    res.status(400).json({ error: "done must be a boolean" });
    return;
  }

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  if (done) {
    await prisma.taskCompletion.upsert({
      where: { taskId_date: { taskId: id, date } },
      update: { done: true },
      create: { taskId: id, date, done: true },
    });
  } else {
    await prisma.taskCompletion.deleteMany({
      where: { taskId: id, date },
    });
  }

  const task = await prisma.task.findUniqueOrThrow({
    where: { id },
    include: { completions: true },
  });

  res.json(transformTask(task));
});

export default router;
