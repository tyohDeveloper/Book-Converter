import { z } from "zod";
import { FileInfoSchema } from "./common";

export const CreateSessionResponseSchema = z.object({
  sessionId: z.string(),
});

export type CreateSessionResponse = z.infer<typeof CreateSessionResponseSchema>;

export const UploadFilesResponseSchema = z.object({
  files: z.array(FileInfoSchema),
});

export type UploadFilesResponse = z.infer<typeof UploadFilesResponseSchema>;

export const ListFilesResponseSchema = z.object({
  files: z.array(FileInfoSchema),
});

export type ListFilesResponse = z.infer<typeof ListFilesResponseSchema>;

export const DeleteFileResponseSchema = z.object({
  success: z.boolean(),
});

export type DeleteFileResponse = z.infer<typeof DeleteFileResponseSchema>;
