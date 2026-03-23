import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { Spinner } from '@inkjs/ui';
import { ProjectItem } from './ProjectItem.js';
import { EXIT_CODES } from '../core/constants.js';
import type { Project, ScanStatus } from '../core/types.js';

interface ProjectListProps {
  projects: Project[];
  status: ScanStatus;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAll: () => void;
  onDeleteRequested: () => void;
  isActive: boolean;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  status,
  selectedIds,
  onToggleSelection,
  onToggleAll,
  onDeleteRequested,
  isActive,
}) => {
  const { exit } = useApp();
  const rows = process.stdout.rows ?? 24;
  const [cursor, setCursor] = useState(0);

  // Maximum number of items to display on screen
  const visibleCount = Math.max(5, rows - 7);

  // Clamp cursor if projects list shrinks/changes unexpectedly
  useEffect(() => {
    if (projects.length > 0 && cursor >= projects.length) {
      setCursor(projects.length - 1);
    }
  }, [projects.length, cursor]);

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
      } else if (input === ' ') {
        const p = projects[cursor];
        if (p) onToggleSelection(p.id);
        setCursor((c) => Math.min(projects.length - 1, c + 1)); // auto advance
      } else if (input === 'a') {
        onToggleAll();
      } else if (input === 'd' || input === 'D') {
        // Only trigger delete if items are selected
        if (selectedIds.size > 0) {
          onDeleteRequested();
        }
      } else if (input === 'q' || input === 'Q') {
        // Clean exit
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
    startIndex = Math.max(0, cursor - Math.floor(visibleCount / 2));
    
    // Don't scroll past the bottom
    if (startIndex + visibleCount > projects.length) {
      startIndex = projects.length - visibleCount;
    }
  }

  const visibleProjects = projects.slice(startIndex, startIndex + visibleCount);

  if (projects.length === 0 && status === 'scanning') {
    return (
      <Box marginTop={1} marginLeft={2}>
        <Spinner label="Scanning for Maven/Gradle projects..." />
      </Box>
    );
  }

  if (projects.length === 0 && status === 'done') {
    return (
      <Box marginTop={1} marginLeft={2}>
        <Text color="yellow">No cleanable JVM projects found in home directory.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginTop={1}>
      <Box marginBottom={1} marginLeft={1}>
        <Text bold>Found {projects.length} project(s)</Text>
        {status === 'scanning' && (
          <Box marginLeft={2}>
            <Spinner label="Scanning..." />
          </Box>
        )}
      </Box>

      {visibleProjects.map((project, i) => {
        const globalIndex = startIndex + i;
        return (
          <ProjectItem
            key={project.id}
            project={project}
            isSelected={selectedIds.has(project.id)}
            isFocused={globalIndex === cursor}
          />
        );
      })}

      {/* Padding to keep UI stable if fewer items than visibleCount */}
      {visibleProjects.length < visibleCount && (
        <Box height={visibleCount - visibleProjects.length} />
      )}
    </Box>
  );
};
