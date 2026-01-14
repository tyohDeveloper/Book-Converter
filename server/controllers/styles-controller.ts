import { Router } from "express";
import { defaultBookStylePresets, getPresetById, BookStylePresetSchema } from "@shared/contracts/book-style-preset";

const router = Router();

router.get("/styles/presets", (_req, res) => {
  res.json({ presets: defaultBookStylePresets });
});

router.get("/styles/presets/:id", (req, res) => {
  const preset = getPresetById(req.params.id);
  if (!preset) {
    return res.status(404).json({ error: "Preset not found" });
  }
  res.json({ preset });
});

router.post("/styles/validate", (req, res) => {
  const result = BookStylePresetSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: "Invalid preset", details: result.error.issues });
  }
  res.json({ valid: true, preset: result.data });
});

export const stylesRouter = router;
