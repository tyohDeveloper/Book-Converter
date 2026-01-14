import { Router } from "express";
import { epubRouter } from "./epub-routes";
import { docxRouter } from "./docx-routes";
import { htmlRouter } from "./html-routes";
import { pdfRouter } from "./pdf-routes";

export const conversionRouter = Router();

conversionRouter.use(epubRouter);
conversionRouter.use(docxRouter);
conversionRouter.use(htmlRouter);
conversionRouter.use(pdfRouter);
