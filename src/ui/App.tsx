import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Static, Text, useApp, useInput } from 'ink';
import { Scanner } from '../core/scanner.js';
import { calculateSize } from '../core/size.js';
import { cleanProjects } from '../core/cleaner.js';
import { EXIT_CODES } from '../core/constants.js';
import { ProjectList } from './ProjectList.js';
import { StatusBar } from './StatusBar.js';
import { ConfirmDialog } from './ConfirmDialog.js';
import { formatBytes } from '../utils/format.js';
import type { Project, ScanStatus, CleanResult } from '../core/types.js';

interface AppProps {
  onSpaceFreed: (bytes: number) => void;
}

type ExtendedCleanResult = CleanResult & { uniqueKey: string };

export const App: React.FC<AppProps> = ({ onSpaceFreed }) => {
  const { exit } = useApp();
  const [projects, setProjects] = useState<Project[]>([]);
  const [scanStatus, setScanStatus] = useState<ScanStatus>('scanning');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  
  const [cleanResults, setCleanResults] = useState<ExtendedCleanResult[]>([]);
  const [isCleaning, setIsCleaning] = useState(false);

  // Initialize Scanner on mount
  useEffect(() => {
    const scanner = new Scanner();

    scanner.on('project', (project: Project) => {
      setProjects((prev) => {
        const exists = prev.some((p) => p.id === project.id);
        if (exists) return prev;
        return [...prev, project];
      });

      // Calculate size for the project's own build folder
      if (project.buildPath !== null) {
        calculateSize(project.buildPath)
          .then((size) => {
            setProjects((prev) =>
              prev.map((p) =>
                p.id === project.id ? { ...p, size: (p.size ?? 0) + (size ?? 0) } : p,
              ),
            );
          })
          .catch((err) => {
            const msg = `Failed to size root for ${project.rootPath}`;
            import('./logger.js').then(({ logger }) => logger.error(msg, err));
            setProjects((prev) =>
              prev.map((p) => (p.id === project.id ? { ...p, size: p.size ?? 0 } : p)),
            );
          });
      }

      // ALSO calculate size for any submodules already present
      for (const subPath of project.submoduleBuildPaths) {
        calculateSize(subPath)
          .then((size) => {
            setProjects((prev) =>
              prev.map((p) =>
                p.id === project.id ? { ...p, size: (p.size ?? 0) + (size ?? 0) } : p,
              ),
            );
          })
          .catch((err) => {
            const msg = `Failed to size initial submodule ${subPath} of ${project.id}`;
            import('./logger.js').then(({ logger }) => logger.error(msg, err));
            setProjects((prev) =>
              prev.map((p) => (p.id === project.id ? { ...p, size: p.size ?? 0 } : p)),
            );
          });
      }
    });

    scanner.on('submodule', ({ parentId, buildPath }) => {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === parentId
            ? { ...p, submoduleBuildPaths: [...p.submoduleBuildPaths, buildPath] }
            : p,
        ),
      );

      // Start size calculation for the new submodule
      calculateSize(buildPath)
        .then((size) => {
          setProjects((prev) =>
            prev.map((p) =>
              p.id === parentId ? { ...p, size: (p.size ?? 0) + (size ?? 0) } : p,
            ),
          );
        })
        .catch((err) => {
          // Log to development file and ensure spinner stops
          const msg = `Failed to size submodule ${buildPath} of ${parentId}`;
          import('./logger.js').then(({ logger }) => logger.error(msg, err));
          setProjects((prev) =>
            prev.map((p) => (p.id === parentId ? { ...p, size: p.size ?? 0 } : p)),
          );
        });
    });

    scanner.on('done', () => {
      setScanStatus('done');
    });

    scanner.on('error', (_err) => {
      setScanStatus('done');
    });

    scanner.scan();

    return () => {
      scanner.removeAllListeners();
    };
  }, []);

  // Global Ctrl+C handler
  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      process.exitCode = EXIT_CODES.SIGINT;
      exit();
    }
  });

  // Handlers
  const handleToggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === projects.length && projects.length > 0) {
        return new Set(); // Deselect all
      }
      return new Set(projects.map((p) => p.id)); // Select all
    });
  }, [projects]);

  const handleDeleteRequested = useCallback(() => {
    if (selectedIds.size > 0) {
      setConfirmOpen(true);
    }
  }, [selectedIds.size]);

  const handleConfirmCancel = useCallback(() => {
    setConfirmOpen(false);
  }, []);

  const handleConfirmAccept = useCallback(async () => {
    setConfirmOpen(false);
    setIsCleaning(true);

    const selectedProjects = projects.filter((p) => selectedIds.has(p.id));
    const results = await cleanProjects(selectedProjects);
    
    // Calculate total freed in this batch and report it to the caller
    const freedInBatch = results.reduce((acc, r) => acc + (r.freed ?? 0), 0);
    onSpaceFreed(freedInBatch);
    
    // Append to static logs with a unique key to prevent Ink duplicate key warnings
    const resultsWithKeys = results.map(r => ({ ...r, uniqueKey: r.project.id + '-' + Math.random().toString(36).substring(2) }));
    setCleanResults(prev => [...prev, ...resultsWithKeys]);
    
    // Remove successful ones from the list
    const successIds = new Set(results.filter(r => r.freed !== null).map(r => r.project.id));
    
    setProjects(prev => prev.filter(p => !successIds.has(p.id)));
    setSelectedIds(prev => {
      const next = new Set(prev);
      for (const id of successIds) {
        next.delete(id);
      }
      return next;
    });

    setIsCleaning(false);
  }, [projects, selectedIds, onSpaceFreed]);

  // Derived state
  const totalSelectedSpace = useMemo(() => {
    let total = 0;
    for (const p of projects) {
      if (selectedIds.has(p.id) && p.size !== null) {
        total += p.size;
      }
    }
    return total;
  }, [projects, selectedIds]);

  const totalLiberableSpace = useMemo(() => {
    return projects.reduce((acc, p) => acc + (p.size ?? 0), 0);
  }, [projects]);

  // If cleaning is completely done and Ink is unmounting, we just show the static results
  return (
    <>
      <Static items={cleanResults}>
        {(result: ExtendedCleanResult) => {
          if (result.error) {
            return (
              <Box key={result.uniqueKey}>
                <Box width={3}><Text color="red">✖</Text></Box>
                <Box><Text color="red" wrap="truncate-end">{result.project.buildPath}: {result.error.message}</Text></Box>
              </Box>
            );
          }
          return (
            <Box key={result.uniqueKey}>
              <Box width={3}><Text color="green">✔</Text></Box>
              <Box width={15}><Text dimColor>{formatBytes(result.freed ?? 0)}</Text></Box>
              <Box><Text wrap="truncate-end">{result.project.buildPath ?? result.project.rootPath}</Text></Box>
            </Box>
          );
        }}
      </Static>

      {/* Hide the interactive UI if we are in the cleaning phase to prevent accidental keystrokes */}
      {!isCleaning && (
        <Box flexDirection="column" paddingX={1}>
          <ProjectList
            projects={projects}
            status={scanStatus}
            selectedIds={selectedIds}
            onToggleSelection={handleToggleSelection}
            onToggleAll={handleToggleAll}
            onDeleteRequested={handleDeleteRequested}
            isActive={!confirmOpen}
            totalLiberable={totalLiberableSpace}
          />

          <ConfirmDialog
            isOpen={confirmOpen}
            selectedCount={selectedIds.size}
            totalSpace={totalSelectedSpace}
            onConfirm={handleConfirmAccept}
            onCancel={handleConfirmCancel}
          />

          <StatusBar 
            totalFreed={totalSelectedSpace} 
            confirmOpen={confirmOpen} 
          />
        </Box>
      )}
    </>
  );
};
