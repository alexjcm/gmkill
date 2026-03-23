import React from 'react';
import { Box, Text } from 'ink';
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
  const columns = process.stdout.columns ?? 80;

  const isMaven = project.buildType === 'maven';
  const typeColor = isMaven ? 'cyan' : 'green';
  const typeLabel = isMaven ? 'Mvn' : 'Grd';

  // 1. Selector area: " " vs "●" (2 chars)
  // 2. Type area: (Mvn) or (Grd) (5 chars)
  // 3. Submodule count area: [+N] if applicable (up to 5 chars)
  // 4. Size area: " 150.0 MB" (up to 10 chars)
  // 5. Margin spacing between items (1-3 chars)
  // Total non-path space roughly 25-30 chars.
  
  // Safe width for the path box: terminal width - ~30 chars
  // Minimum width defined to avoid negative widths on extremely small terminals
  const minPathWidth = 30; // 15 (size) + 5 (type) + 5 (check) + 5 (submods)
  const maxPathWidth = Math.max(minPathWidth, columns - 30);

  return (
    <Box>
      <Box width={3} flexShrink={0}>
        <Text color={isSelected ? 'green' : undefined}>
          {isSelected ? '● ' : '○ '}
        </Text>
      </Box>

      <Box width={6} flexShrink={0}>
        <Text color={typeColor} dimColor={!isFocused}>
          ({typeLabel})
        </Text>
      </Box>

      <Box width={maxPathWidth} flexGrow={1} marginRight={2}>
        <Text
          dimColor={!isFocused}
          underline={isFocused}
          color={isFocused ? 'white' : undefined}
          wrap="truncate-end"
        >
          {replaceHomeWithTilde(project.rootPath)}
        </Text>
      </Box>

      <Box width={10} flexShrink={0} marginRight={1}>
        {project.submoduleBuildPaths.length > 0 && (
          <Text dimColor color="cyan">
            [+{project.submoduleBuildPaths.length}]
          </Text>
        )}
      </Box>

      {/* 5. Space Freed (15 chars) */}
      <Box width={15} flexShrink={0} justifyContent="flex-end">
        {project.size === null ? (
          <Box flexDirection="row" gap={1}>
            <Spinner type="dots" />
            <Text color="yellow">sizing</Text>
          </Box>
        ) : (
          <Text dimColor={!isFocused}>{formatBytes(project.size)}</Text>
        )}
      </Box>
    </Box>
  );
};
