"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

interface WorkspaceContextValue {
  workspace: string | null;
  setWorkspace: (name: string) => void;
  logout: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspace: null,
  setWorkspace: () => {},
  logout: () => {},
});

export function useWorkspace() {
  return useContext(WorkspaceContext);
}

const STORAGE_KEY = "dincharya.workspace";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspaceState] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setWorkspaceState(stored);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (!workspace) {
      router.replace("/login");
    }
  }, [workspace, loaded, router]);

  const setWorkspace = (name: string) => {
    localStorage.setItem(STORAGE_KEY, name);
    setWorkspaceState(name);
    router.replace("/");
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setWorkspaceState(null);
  };

  if (!loaded) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <WorkspaceContext.Provider value={{ workspace, setWorkspace, logout }}>
      {children}
    </WorkspaceContext.Provider>
  );
}
