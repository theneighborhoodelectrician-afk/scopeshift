import { z } from "zod";

export const presetSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  difficulty_mode: z.enum(["guided_mode", "field_mode", "ride_along_mode"]),
  coach_mode: z.enum(["off", "light", "full"])
});
