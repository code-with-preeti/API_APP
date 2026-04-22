import { Request, Response } from "express";
import prisma from "../prismaClient";
import { getApiHistory } from "../services/apiHistoryService";
import { calculateUptime } from "../services/uptimeService";
import { HttpMethod, Prisma } from "@prisma/client";

// ----------------- CREATE API -----------------
export const createAPI = async (req: Request & { user?: any }, res: Response) => {
  const { name, url, method, headers, body } = req.body;
  try {
    const normalizedMethod =
      typeof method === "string" ? method.trim().toUpperCase() : undefined;
    const methodEnum = normalizedMethod
      ? (HttpMethod as Record<string, HttpMethod>)[normalizedMethod]
      : undefined;

    const data: Prisma.MonitoredAPICreateInput = {
      name: String(name ?? "").trim(),
      url: String(url ?? "").trim(),
      status: "unknown",
      user: { connect: { id: req.user.userId } },
      ...(methodEnum ? { method: methodEnum } : {}),
      ...(headers !== undefined ? { headers } : {}),
      ...(body !== undefined ? { body } : {}),
    };

    const api = await prisma.monitoredAPI.create({
      data,
    });
    res.status(201).json(api);
  } catch (err) {
    res.status(500).json({ message: "Error creating monitored API", error: err });
  }
};

// ----------------- GET ALL APIs -----------------
export const getAPIs = async (req: Request & { user?: any }, res: Response) => {
  try {
    const apis = await prisma.monitoredAPI.findMany({
      where: { userId: req.user.userId },
    });
    res.json(apis);
  } catch (err) {
    res.status(500).json({ message: "Error fetching monitored APIs", error: err });
  }
};

// ----------------- DELETE API -----------------
export const deleteAPI = async (req: Request & { user?: any }, res: Response) => {
  const { id } = req.params;
  try {
    const api = await prisma.monitoredAPI.findUnique({
      where: { id: parseInt(id) },
    });

    if (!api || api.userId !== req.user.userId)
      return res.status(404).json({ message: "API not found" });

    await prisma.monitoredAPI.delete({ where: { id: parseInt(id) } });
    res.json({ message: "API deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting monitored API", error: err });
  }
};

// ----------------- GET API HISTORY -----------------
export const getApiHistoryController = async (req: Request & { user?: any }, res: Response) => {
  const apiId = Number(req.params.id);
  try {
    const api = await prisma.monitoredAPI.findUnique({ where: { id: apiId } });
    if (!api || api.userId !== req.user.userId) {
      return res.status(404).json({ message: "API not found" });
    }

    const history = await getApiHistory(apiId);
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: "Error fetching API history", error: err });
  }
};

// ----------------- GET API UPTIME -----------------
export const getUptimeController = async (req: Request & { user?: any }, res: Response) => {
  const apiId = Number(req.params.id);
  try {
    const api = await prisma.monitoredAPI.findUnique({ where: { id: apiId } });
    if (!api || api.userId !== req.user.userId) {
      return res.status(404).json({ message: "API not found" });
    }

    const uptime = await calculateUptime(apiId);
    res.json({ apiId, uptime });
  } catch (err) {
    res.status(500).json({ message: "Error calculating uptime", error: err });
  }
};
