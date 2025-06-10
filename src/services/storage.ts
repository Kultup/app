// @ts-ignore
const ipcRenderer = (window as any).electron?.ipcRenderer || (window as any).api?.ipcRenderer;

export interface Request {
  id: string;
  name: string;
  city: string;
  requestType: string;
  status: 'new' | 'in-progress' | 'completed';
  createdAt: string;
  archived?: boolean;
}

export const storageService = {
  async getRequests(): Promise<Request[]> {
    if (!ipcRenderer) throw new Error('IPC is not available');
    return await ipcRenderer.invoke('get-requests');
  },

  async saveRequests(requests: Request[]): Promise<void> {
    if (!ipcRenderer) throw new Error('IPC is not available');
    await ipcRenderer.invoke('save-requests', requests);
  },

  async addRequest(request: Omit<Request, 'id' | 'createdAt'>): Promise<Request> {
    if (!ipcRenderer) throw new Error('IPC is not available');
    return await ipcRenderer.invoke('add-request', request);
  },

  async updateRequest(id: string, updates: Partial<Request>): Promise<Request> {
    if (!ipcRenderer) throw new Error('IPC is not available');
    return await ipcRenderer.invoke('update-request', id, updates);
  },

  async removeRequest(id: string): Promise<void> {
    if (!ipcRenderer) throw new Error('IPC is not available');
    await ipcRenderer.invoke('remove-request', id);
  }
}; 