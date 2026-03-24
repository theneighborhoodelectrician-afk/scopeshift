import { z } from "zod";

export const generateScenarioSchema = z.object({
  mode: z.enum(["random", "targeted"]),
  category: z.string().optional(),
  difficulty_mode: z.enum(["guided_mode", "field_mode", "ride_along_mode"]),
  coach_mode: z.enum(["off", "light", "full"]),
  preset_id: z.string().uuid().optional()
});

export const sendMessageSchema = z.object({
  message: z.string().min(1)
});
