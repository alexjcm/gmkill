import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { Spinner } from '@inkjs/ui';
import { formatBytes } from '../utils/format.js';
import { replaceHomeWithTilde } from '../core/paths.js';
import type { Project } from '../core/types.js';

interface ProjectItemProps {
  project: Project;
  isSelected: boolean;
  isFocused: boolean;
}

export const ProjectItem: React.FC<ProjectItemProps> = ({
  project,
  isSelected,
  isFocused,
}) => {
  const isMaven = project.buildType === 'maven';
  const typeLabel = isMaven ? 'M' : 'G';
  const typeColor = isMaven ? 'cyan' : 'green';
  const { stdout } = useStdout();
  const columns = stdout?.columns ?? 80;

  // Column widths (must match headers in ProjectList)
  const COL_CHECK = 3;
  const COL_MODULES = 8;
  const COL_SIZE = 15;
  const MIN_PATH_WIDTH = 40;

  const maxPathWidth = Math.max(MIN_PATH_WIDTH, columns - (COL_CHECK + COL_MODULES + COL_SIZE + 5));

  const rowColor = isSelected ? 'green' : (isFocused ? 'white' : undefined);

  return (
    <Box>
      <Box width={COL_CHECK} flexShrink={0}>
        <Text color={isSelected ? 'green' : (isFocused ? 'white' : undefined)} bold={isSelected || isFocused}>
          {isSelected ? '● ' : (isFocused ? '› ' : '○ ')}
        </Text>
      </Box>

      <Box width={maxPathWidth} flexGrow={1} marginRight={2} flexDirection="row">
        <Text
          dimColor={!isFocused && !isSelected}
          underline={isFocused}
          color={rowColor}
          wrap="truncate-end"
          bold={isSelected}
        >
          {replaceHomeWithTilde(project.rootPath)}
        </Text>
        <Text color={isSelected ? 'green' : typeColor} dimColor={!isFocused && !isSelected} bold>
          {`  (${typeLabel})`}
        </Text>
      </Box>

      <Box width={COL_MODULES} flexShrink={0} marginRight={1}>
        {/* Only show count if it's a multi-module project (Total > 1) */}
        {(project.submoduleBuildPaths.length + (project.buildPath ? 1 : 0)) > 1 && (
          <Text dimColor={!isSelected} color={isSelected ? 'green' : 'cyan'}>
            {`${project.submoduleBuildPaths.length + (project.buildPath ? 1 : 0)} mods`}
          </Text>
        )}
      </Box>

      <Box width={COL_SIZE} flexShrink={0} justifyContent="flex-end">
        {project.size === null ? (
          <Box flexDirection="row" gap={1}>
            <Spinner type="dots" />
            <Text color="yellow">sizing</Text>
          </Box>
        ) : (
          <Text color={rowColor} dimColor={!isFocused && !isSelected}>
            {formatBytes(project.size)}
          </Text>
        )}
      </Box>
    </Box>
  );
};
