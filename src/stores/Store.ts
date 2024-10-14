import { create } from "zustand";

export interface Chats {
  id: string;
  userid: number;
  title: string;
  messages: { role: string; content: string }[];
  createAt: Date;
  lastUpdate: Date;
}

interface MyStore {
  chats: Chats[];
  setChats: (modal: Chats[]) => void;
}

const useMyStore = create<MyStore>((set) => ({
  chats: [],
  setChats: (chats: Chats[]) => set((state) => ({ ...state, chats })),
}));

export default useMyStore;
