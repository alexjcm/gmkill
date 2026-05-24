import React, { useState } from 'react';
import { Box, Text, useInput, useApp, useWindowSize } from 'ink';
import Spinner from 'ink-spinner';
import { ProjectItem } from './ProjectItem.js';
import { formatBytes } from '../utils/format.js';
import { EXIT_CODES } from '../core/constants.js';
import { calcPathWidth, COL_CHECK, COL_MODULES, COL_SIZE } from './columns.js';
import { palette } from './palette.js';
import type { Project, ScanStatus } from '../core/types.js';

interface ProjectListProps {
  projects: Project[];
  status: ScanStatus;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAll: () => void;
  onDeleteRequested: () => void;
  isActive: boolean;
  totalLiberable: number;
  isLinkedWorkspace?: boolean;
  isCompact?: boolean;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  status,
  selectedIds,
  onToggleSelection,
  onToggleAll,
  onDeleteRequested,
  isActive,
  totalLiberable,
  isLinkedWorkspace = false,
  isCompact = false,
}) => {
  const { exit } = useApp();
  const windowSize = useWindowSize();
  const rows = windowSize.rows || 24;
  const columns = windowSize.columns || 80;
  const [cursor, setCursor] = useState(0);

  // Compute once here and pass down — avoids N useStdout listeners in ProjectItem rows.
  const maxPathWidth = calcPathWidth(columns);

  // Maximum number of items to display on screen
  const visibleCount = Math.max(5, rows - 10);

  const activeCursor = projects.length === 0 ? 0 : Math.min(cursor, projects.length - 1);

  useInput(
    (input, key) => {
      if (projects.length === 0 && input !== 'q') return;

      if (key.upArrow || input === 'k') {
        setCursor((c) => Math.max(0, c - 1));
      } else if (key.downArrow || input === 'j') {
        setCursor((c) => Math.min(projects.length - 1, c + 1));
      } else if (input === 'g') {
        setCursor(0);
      } else if (input === 'G') {
        setCursor(projects.length - 1);
      } else if (input === ' ' || key.return) {
        const p = projects[activeCursor];
        if (p) onToggleSelection(p.id);
        if (input === ' ') {
          setCursor((c) => Math.min(projects.length - 1, c + 1));
        }
      } else if (input === 'a') {
        onToggleAll();
      } else if (input === 'd' || input === 'D') {
        if (selectedIds.size > 0) {
          onDeleteRequested();
        }
      } else if (input === 'q' || input === 'Q') {
        process.exitCode = EXIT_CODES.SUCCESS;
        exit();
      }
    },
    { isActive: isActive }
  );

  // Calculate slice of projects to display
  let startIndex = 0;
  if (projects.length > visibleCount) {
    // Keep cursor roughly in the middle if possible
    startIndex = Math.max(0, activeCursor - Math.floor(visibleCount / 2));

    // Don't scroll past the bottom
    if (startIndex + visibleCount > projects.length) {
      startIndex = projects.length - visibleCount;
    }
  }

  const visibleProjects = projects.slice(startIndex, startIndex + visibleCount);
  const isScanning = status === 'scanning';
  // Only show total once at least one size has been resolved
  const showTotal = totalLiberable > 0;
  const listMinHeight = projects.length === 0
    ? undefined
    : Math.min(visibleCount, Math.max(visibleProjects.length, 3));

  return (
    <Box flexDirection="column" marginTop={isCompact ? 0 : 1}>
      {/* 1. Summary Header & Total */}
      <Box paddingX={1} marginBottom={isCompact ? 0 : 1}>
        {projects.length === 0 && isScanning ? (
            <Box marginLeft={1}>
              <Box flexDirection="row" gap={1}>
              <Text color={palette.info}><Spinner /></Text>
              <Text>Scanning for Java/Node.js projects...</Text>
            </Box>
          </Box>
        ) : projects.length === 0 && status === 'done' ? (
          <Box borderStyle="round" borderColor={palette.warning} padding={1} width="100%">
            <Text color={palette.warning}>No cleanable Node.js, Gradle, or Maven projects found.</Text>
          </Box>
        ) : (
          <Box flexDirection="row" justifyContent="space-between" flexGrow={1}>
            <Box>
              <Text>
                Found {projects.length} {projects.length === 1 ? 'project' : 'projects'}
                {isLinkedWorkspace && (
                  <Text color="gray">{' (running from linked workspace)'}</Text>
                )}
              </Text>
              {isScanning && (
                <Box marginLeft={2}>
                  <Box flexDirection="row" gap={1}>
                    <Text color={palette.info}><Spinner /></Text>
                    <Text>Scanning...</Text>
                  </Box>
                </Box>
              )}
            </Box>
            {showTotal && (
              <Box>
                <Text>Total Liberable: </Text>
                <Text color={palette.info}>{formatBytes(totalLiberable)}</Text>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* 2. Column Headers */}
      {projects.length > 0 && (
        <Box paddingX={1} flexDirection="column" aria-hidden>
          <Box aria-hidden>
            <Box width={COL_CHECK} />
            <Box width={maxPathWidth} flexGrow={1} marginRight={2}><Text bold>PROJECT (TYPE)</Text></Box>
            <Box width={COL_MODULES} marginRight={1}><Text bold>MODULES</Text></Box>
            <Box width={COL_SIZE} justifyContent="flex-end"><Text bold>SIZE</Text></Box>
          </Box>
          {/* Subtle separator */}
          <Box marginTop={0} marginBottom={0}>
            <Text color="gray">{"─".repeat(Math.min(columns - 2, 100))}</Text>
          </Box>
        </Box>
      )}

      {/* 3. Project List */}
      <Box
        flexDirection="column"
        paddingX={1}
        minHeight={listMinHeight}
        aria-role="listbox"
        aria-state={{ multiselectable: true, busy: isScanning }}
        aria-label={`Cleanable projects. ${projects.length} ${projects.length === 1 ? 'project' : 'projects'} found.${isLinkedWorkspace ? ' Running from linked workspace.' : ''}`}
      >
        {visibleProjects.map((project, i) => {
          const globalIndex = startIndex + i;
          return (
            <ProjectItem
              key={project.id}
              project={project}
              isSelected={selectedIds.has(project.id)}
              isFocused={isActive && globalIndex === activeCursor}
              maxPathWidth={maxPathWidth}
            />
          );
        })}
      </Box>
    </Box>
  );
};
