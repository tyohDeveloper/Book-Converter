import { Router, Request, Response } from "express";
import { fileManager } from "../../lib/file-manager/file-manager";
import { asyncHandler } from "../../common/errors/error-middleware";
import { FileNotFoundError, ValidationError } from "../../common/errors/specific-errors";
import { getSessionId, respond } from "../../common/http";

export const fileRouter = Router();

fileRouter.get(
  "/files",
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const files = await fileManager.getFiles(sessionId);

    res.setHeader("Content-Type", "application/json");
    res.write('{"files":[');

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (i > 0) res.write(",");
      res.write(
        JSON.stringify({
          id: f.id,
          name: f.originalName,
          size: f.size,
          uploadedAt: f.uploadedAt,
          isOutput: f.isOutput,
          outputType: f.outputType,
          mimeType: f.mimeType,
        })
      );
    }

    res.write("]}");
    res.end();
  })
);

fileRouter.delete(
  "/files/:fileId",
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileId } = req.params;

    const success = await fileManager.deleteFile(sessionId, fileId);
    if (!success) {
      throw new FileNotFoundError(fileId);
    }
    respond(res, { success: true });
  })
);

fileRouter.get(
  "/files/:fileId/download",
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileId } = req.params;

    const file = await fileManager.getFile(sessionId, fileId);
    if (!file) {
      throw new FileNotFoundError(fileId);
    }

    await fileManager.streamToResponse(sessionId, fileId, res);
  })
);

fileRouter.get(
  "/files/:fileId/view",
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = (req.query.session as string) || getSessionId(req);
    const { fileId } = req.params;

    const file = await fileManager.getFile(sessionId, fileId);
    if (!file) {
      throw new FileNotFoundError(fileId);
    }

    const isViewable = file.mimeType === "text/html" || 
                        file.mimeType === "application/xhtml+xml" || 
                        file.mimeType === "application/pdf" ||
                        file.mimeType === "text/css";
    
    if (!isViewable) {
      throw new ValidationError("Only HTML, XHTML, PDF, and CSS files can be viewed inline");
    }

    await fileManager.streamToResponse(sessionId, fileId, res, true);
  })
);

fileRouter.delete(
  "/files",
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    await fileManager.clearSession(sessionId);
    respond(res, { success: true });
  })
);

fileRouter.put(
  "/files/:fileId/content",
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileId } = req.params;
    const { content } = req.body;

    if (typeof content !== 'string') {
      throw new ValidationError("Content must be a string");
    }

    const file = await fileManager.getFile(sessionId, fileId);
    if (!file) {
      throw new FileNotFoundError(fileId);
    }

    const isEditable = file.mimeType === "text/html" || file.mimeType === "application/xhtml+xml";
    
    if (!isEditable) {
      throw new ValidationError("Only HTML and XHTML files can be edited");
    }

    const updated = await fileManager.updateFileContent(sessionId, fileId, content);
    respond(res, { success: true, file: { id: updated.id, name: updated.originalName, size: updated.size } });
  })
);

fileRouter.patch(
  "/files/:fileId/rename",
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileId } = req.params;
    const { name } = req.body;

    if (typeof name !== 'string' || !name.trim()) {
      throw new ValidationError("Name must be a non-empty string");
    }

    const file = await fileManager.getFile(sessionId, fileId);
    if (!file) {
      throw new FileNotFoundError(fileId);
    }

    const updated = await fileManager.renameFile(sessionId, fileId, name);
    respond(res, { success: true, file: { id: updated.id, name: updated.originalName, size: updated.size } });
  })
);
