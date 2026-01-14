export async function deleteObject(deleteUrl: string): Promise<void> {
  const response = await fetch(deleteUrl, { method: "DELETE" });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete file: ${response.status}`);
  }
}
