import { getSessionId } from '../session';

export function viewFile(fileId: string): void {
  const sessionId = getSessionId();
  window.open(`/api/files/${fileId}/view?session=${sessionId}`, '_blank');
}
