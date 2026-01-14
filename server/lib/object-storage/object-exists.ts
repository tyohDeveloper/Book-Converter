export async function objectExists(headUrl: string): Promise<boolean> {
  const response = await fetch(headUrl, { method: "HEAD" });
  return response.ok;
}
