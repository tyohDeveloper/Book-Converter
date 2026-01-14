import { useState, useEffect, useRef, useCallback } from "react";
import { analyzeStructure } from "@/lib/file-manager/analyze-structure";
import { listFiles } from "@/lib/file-manager/list-files";
import type { ManagedFile, StructureResult } from "@/lib/file-manager/types";

export function useStructureAnalysis(fileIds: string[]) {
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [results, setResults] = useState<StructureResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, Record<string, boolean>>>({});
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const allFiles = await listFiles();
        const matchedFiles = allFiles.filter(f => fileIds.includes(f.id));
        setFiles(matchedFiles);

        if (matchedFiles.length > 0) {
          const structureResults = await analyzeStructure(matchedFiles.map(f => f.id), controller.signal);
          setResults(structureResults);

          const expanded: Record<string, Record<string, boolean>> = {};
          structureResults.forEach(r => {
            expanded[r.fileId] = { metadata: true, pages: false, fonts: false, images: false };
          });
          setExpandedSections(expanded);

          if (structureResults.length > 0) {
            setSelectedFileId(structureResults[0].fileId);
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message || "Failed to analyze structure");
        }
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    };

    loadData();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fileIds.join(',')]);

  const toggleSection = useCallback((fileId: string, section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [fileId]: { ...prev[fileId], [section]: !prev[fileId]?.[section] }
    }));
  }, []);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const selectedResult = results.find(r => r.fileId === selectedFileId);

  return {
    files,
    results,
    loading,
    error,
    expandedSections,
    selectedFileId,
    setSelectedFileId,
    selectedResult,
    toggleSection,
    cancel,
  };
}
