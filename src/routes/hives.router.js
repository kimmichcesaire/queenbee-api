import { Router } from "express";
import { hives } from "../data/hives.js";

export const hivesRouter = Router();

// GET /api/hives            
// GET /api/hives?site_id=X 
hivesRouter.get("/", (req, res) => {

  const { site_id } = req.query;


  if (!site_id) {
    return res.json(hives);
  }


  res.json(hives.filter((hive) => hive.site_id === site_id));
});
