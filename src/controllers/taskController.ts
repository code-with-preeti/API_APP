import { Request, Response } from "express";
import prisma from "../prismaClient";

export const getTasks = async (
  req: Request & { user?: any },
  res: Response
) => {
  const tasks = await prisma.task.findMany({
    where: { userId: req.user.userId },
  });

  res.json(tasks);
};

export const createTask = async (
  req: Request & { user?: any },
  res: Response
) => {
  const { title } = req.body;

  const task = await prisma.task.create({
    data: {
      title,
      userId: req.user.userId,
    },
  });

  res.json(task);
};

export const deleteTask = async (
  req: Request & { user?: any },
  res: Response
) => {
  const id = Number(req.params.id);

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task || task.userId !== req.user.userId) {
    return res.status(404).json({ message: "Task not found" });
  }

  await prisma.task.delete({ where: { id } });

  res.json({ message: "Task deleted" });
};
