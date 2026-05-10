import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Static, Text, useApp, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { Scanner } from '../core/scanner.js';
import { calculateSize } from '../core/size.js';
import { cleanProjects } from '../core/cleaner.js';
import { EXIT_CODES } from '../core/constants.js';
import { ProjectList } from './ProjectList.js';
import { StatusBar } from './StatusBar.js';
import { ConfirmDialog } from './ConfirmDialog.js';
import { formatBytes } from '../utils/format.js';
import { palette } from './palette.js';
import type { Project, ScanStatus, CleanResult } from '../core/types.js';

interface AppProps {
  onSpaceFreed: (bytes: number) => void;
  scanRoot?: string;
}

type ExtendedCleanResult = CleanResult & { uniqueKey: string };
type CleanSummaryEntry = {
  uniqueKey: string;
  kind: 'summary';
  attemptedCount: number;
  cleanedCount: number;
  failedCount: number;
  released: number;
};
type CleanLogEntry = ExtendedCleanResult | CleanSummaryEntry;

function isCleanSummaryEntry(entry: CleanLogEntry): entry is CleanSummaryEntry {
  return 'kind' in entry && entry.kind === 'summary';
}

export const App: React.FC<AppProps> = ({ onSpaceFreed, scanRoot }) => {
  const { exit } = useApp();
  const [projects, setProjects] = useState<Project[]>([]);
  const [scanStatus, setScanStatus] = useState<ScanStatus>('scanning');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  
  const [cleanResults, setCleanResults] = useState<CleanLogEntry[]>([]);
  const [isCleaning, setIsCleaning] = useState(false);

  useEffect(() => {
    const scanner = new Scanner(scanRoot);

    scanner.on('project', (project: Project) => {
      setProjects((prev) => {
        const exists = prev.some((p) => p.id === project.id);
        if (exists) return prev;
        return [...prev, project];
      });

      // Calculate size for all directories
      for (const buildPath of project.buildPaths) {
        calculateSize(buildPath)
          .then((size) => {
            setProjects((prev) =>
              prev.map((p) =>
                p.id === project.id ? { ...p, size: (p.size ?? 0) + (size ?? 0) } : p,
              ),
            );
          })
          .catch((err) => {
            const msg = `Failed to size build path ${buildPath} for ${project.rootPath}`;
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
            ? { ...p, buildPaths: [...p.buildPaths, buildPath] }
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
    const cleanedCount = results.filter((r) => r.error === undefined).length;
    const failedCount = results.length - cleanedCount;
    
    // Append to static logs with a unique key to prevent Ink duplicate key warnings
    const batchKey = Math.random().toString(36).substring(2);
    const resultsWithKeys = results.map((r) => ({
      ...r,
      uniqueKey: `${r.project.id}-${batchKey}-${Math.random().toString(36).substring(2)}`,
    }));
    const summaryEntry: CleanSummaryEntry = {
      uniqueKey: `summary-${batchKey}`,
      kind: 'summary',
      attemptedCount: results.length,
      cleanedCount,
      failedCount,
      released: freedInBatch,
    };
    setCleanResults((prev) => [...prev, ...resultsWithKeys, summaryEntry]);
    
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
        {(result: CleanLogEntry) => {
          if (isCleanSummaryEntry(result)) {
            return (
              <Box key={result.uniqueKey}>
                <Box width={3}><Text color={palette.info}>ℹ</Text></Box>
                <Box>
                  <Text color={palette.info} bold>
                    Cleaned {result.cleanedCount}/{result.attemptedCount} {result.attemptedCount === 1 ? 'project' : 'projects'}
                  </Text>
                  <Text>{`  •  Released ${formatBytes(result.released)}`}</Text>
                  {result.failedCount > 0 && (
                    <Text color={palette.warning}>{`  •  ${result.failedCount} failed`}</Text>
                  )}
                </Box>
              </Box>
            );
          }

          if (result.error) {
            return (
              <Box key={result.uniqueKey}>
                <Box width={3}><Text color={palette.danger}>✖</Text></Box>
                <Box><Text color={palette.danger} wrap="truncate-end">{result.project.rootPath}: {result.error.message}</Text></Box>
              </Box>
            );
          }
          return (
              <Box key={result.uniqueKey}>
              <Box width={3}><Text color={palette.success}>✔</Text></Box>
              <Box width={15}><Text>{formatBytes(result.freed ?? 0)}</Text></Box>
              <Box><Text wrap="truncate-end">{result.project.rootPath}</Text></Box>
            </Box>
          );
        }}
      </Static>

      {cleanResults.length > 0 && !isCleaning && (
        <Box paddingX={1}>
          <Text color="gray">{"─".repeat(100)}</Text>
        </Box>
      )}

      {/* Show spinner while cleaning to prevent blank screen and accidental keystrokes */}
      {isCleaning ? (
        <Box marginTop={1} paddingX={2}>
          <Box flexDirection="row" gap={1}>
            <Text color={palette.selection}><Spinner /></Text>
            <Text>Cleaning selected projects…</Text>
          </Box>
        </Box>
      ) : (
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
            isCompact={cleanResults.length > 0}
          />

          <ConfirmDialog
            isOpen={confirmOpen}
            selectedCount={selectedIds.size}
            totalSpace={totalSelectedSpace}
            onConfirm={handleConfirmAccept}
            onCancel={handleConfirmCancel}
          />

          <StatusBar
            selectedSpace={totalSelectedSpace}
            confirmOpen={confirmOpen}
          />
        </Box>
      )}
    </>
  );
};
