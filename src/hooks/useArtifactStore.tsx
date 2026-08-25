"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ArtifactType = "code" | "markdown" | "html" | "svg" | "diagram";
export type ArtifactTab = "code" | "preview";

export interface Artifact {
  id: string;
  title: string;
  language: string;
  content: string;
  type?: ArtifactType;
}

interface ArtifactContextType {
  artifact: Artifact | null;
  isOpen: boolean;
  activeTab: ArtifactTab;
  isFullScreen: boolean;
  openArtifact: (artifact: Artifact) => void;
  closeArtifact: () => void;
  setActiveTab: (tab: ArtifactTab) => void;
  toggleFullScreen: () => void;
  updateContent: (content: string) => void;
}

const ArtifactContext = createContext<ArtifactContextType | null>(null);

export function ArtifactProvider({ children }: { children: ReactNode }) {
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ArtifactTab>("code");
  const [isFullScreen, setIsFullScreen] = useState(false);

  const openArtifact = useCallback((art: Artifact) => {
    setArtifact(art);
    setIsOpen(true);
    // If HTML or SVG or markdown, default to preview or code intelligently
    if (art.type === "html" || art.language === "html" || art.type === "svg") {
      setActiveTab("preview");
    } else {
      setActiveTab("code");
    }
  }, []);

  const closeArtifact = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleFullScreen = useCallback(() => {
    setIsFullScreen((prev) => !prev);
  }, []);

  const updateContent = useCallback((newContent: string) => {
    setArtifact((prev) => (prev ? { ...prev, content: newContent } : null));
  }, []);

  const value = useMemo(
    () => ({
      artifact,
      isOpen,
      activeTab,
      isFullScreen,
      openArtifact,
      closeArtifact,
      setActiveTab,
      toggleFullScreen,
      updateContent,
    }),
    [
      artifact,
      isOpen,
      activeTab,
      isFullScreen,
      openArtifact,
      closeArtifact,
      toggleFullScreen,
      updateContent,
    ],
  );

  return (
    <ArtifactContext.Provider value={value}>
      {children}
    </ArtifactContext.Provider>
  );
}

export function useArtifactStore() {
  const context = useContext(ArtifactContext);
  if (!context) {
    throw new Error("useArtifactStore must be used within an ArtifactProvider");
  }
  return context;
}
