import React, { useState } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import { Spinner } from '@inkjs/ui';
import { ProjectItem } from './ProjectItem.js';
import { formatBytes } from '../utils/format.js';
import { EXIT_CODES } from '../core/constants.js';
import { calcPathWidth } from './columns.js';
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
}) => {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const rows = stdout?.rows ?? 24;
  const columns = stdout?.columns ?? 80;
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

  return (
    <Box flexDirection="column" marginTop={1}>
      {/* 1. Summary Header & Total */}
      <Box paddingX={1} marginBottom={1}>
        {projects.length === 0 && isScanning ? (
          <Box marginLeft={1}>
            <Spinner label="Scanning for Gradle/Maven projects..." />
          </Box>
        ) : projects.length === 0 && status === 'done' ? (
          <Box borderStyle="round" borderColor="yellow" padding={1} width="100%">
            <Text color="yellow">No cleanable JVM projects found in home directory.</Text>
          </Box>
        ) : (
          <Box flexDirection="row" justifyContent="space-between" flexGrow={1}>
            <Box>
              <Text bold>
                Found {projects.length} {projects.length === 1 ? 'project' : 'projects'}
              </Text>
              {isScanning && (
                <Box marginLeft={2}>
                  <Spinner label="Scanning..." />
                </Box>
              )}
            </Box>
            {showTotal && (
              <Box>
                <Text dimColor>Total Liberable: </Text>
                <Text color="cyan" bold>{formatBytes(totalLiberable)}</Text>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* 2. Column Headers */}
      {projects.length > 0 && (
        <Box paddingX={1} flexDirection="column">
          <Box>
            <Box width={3} />
            <Box width={maxPathWidth} flexGrow={1} marginRight={2}><Text color="gray" bold>PROJECT (TYPE)</Text></Box>
            <Box width={8} marginRight={1}><Text color="gray" bold>MODULES</Text></Box>
            <Box width={15} justifyContent="flex-end"><Text color="gray" bold>SIZE</Text></Box>
          </Box>
          {/* Subtle separator */}
          <Box marginTop={0} marginBottom={0}>
            <Text dimColor>{"─".repeat(Math.min(columns - 2, 100))}</Text>
          </Box>
        </Box>
      )}

      {/* 3. Project List */}
      <Box flexDirection="column" paddingX={1} minHeight={visibleCount}>
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
