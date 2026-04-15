import React from 'react';
import { Box, Text } from 'ink';
import { Spinner } from '@inkjs/ui';
import { formatBytes } from '../utils/format.js';
import { replaceHomeWithTilde } from '../core/paths.js';
import { COL_CHECK, COL_MODULES, COL_SIZE } from './columns.js';
import type { Project } from '../core/types.js';

interface ProjectItemProps {
  project: Project;
  isSelected: boolean;
  isFocused: boolean;
  maxPathWidth: number;
}

export const ProjectItem: React.FC<ProjectItemProps> = ({
  project,
  isSelected,
  isFocused,
  maxPathWidth,
}) => {
  let typeLabel = 'U';
  let typeColor = 'white';
  
  if (project.buildType === 'maven') {
    typeLabel = 'M'; typeColor = 'cyan';
  } else if (project.buildType === 'gradle') {
    typeLabel = 'G'; typeColor = 'green';
  } else if (project.buildType === 'node') {
    typeLabel = 'N'; typeColor = 'yellow';
  }

  const bgColor = isFocused ? '#2A2A2A' : undefined;
  const moduleCount = project.buildPaths.length;

  return (
    <Box backgroundColor={bgColor}>
      <Box width={COL_CHECK} flexShrink={0}>
        <Text 
          color={isSelected ? 'green' : (isFocused ? 'white' : undefined)}
          bold={isSelected || isFocused}
        >
          {isSelected ? '● ' : (isFocused ? '› ' : '○ ')}
        </Text>
      </Box>

      <Box width={maxPathWidth} flexGrow={1} marginRight={2} flexDirection="row">
        <Text
          dimColor={!isFocused && !isSelected}
          underline={isFocused}
          color={isFocused ? 'white' : (isSelected ? 'green' : undefined)}
          wrap="truncate-end"
          bold={isFocused}
        >
          {replaceHomeWithTilde(project.rootPath)}
        </Text>
        <Text 
          color={isSelected ? 'green' : typeColor} 
          dimColor={!isFocused && !isSelected} 
          bold
        >
          {`  (${typeLabel})   `}
        </Text>
      </Box>

      <Box width={COL_MODULES} flexShrink={0} marginRight={1}>
        {moduleCount > 1 && (
          <Text 
            dimColor={!isSelected && !isFocused} 
            color={isSelected ? 'green' : 'cyan'}
          >
            {project.buildType === 'node' ? `${moduleCount} targets` : `${moduleCount} mods`}
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
          <Text 
            color={isFocused ? 'white' : (isSelected ? 'green' : undefined)}
            dimColor={!isFocused && !isSelected}
          >
            {formatBytes(project.size)}
          </Text>
        )}
      </Box>
    </Box>
  );
};
