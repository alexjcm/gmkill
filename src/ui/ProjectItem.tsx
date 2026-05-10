import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { formatBytes } from '../utils/format.js';
import { replaceHomeWithTilde } from '../core/paths.js';
import { COL_CHECK, COL_MODULES, COL_SIZE } from './columns.js';
import { palette } from './palette.js';
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
  let typeColor: string = palette.typeUnknown;
  let typeName = 'unknown';
  
  if (project.buildType === 'maven') {
    typeLabel = 'M'; typeColor = palette.typeMaven; typeName = 'Maven';
  } else if (project.buildType === 'gradle') {
    typeLabel = 'G'; typeColor = palette.typeGradle; typeName = 'Gradle';
  } else if (project.buildType === 'node') {
    typeLabel = 'N'; typeColor = palette.typeNode; typeName = 'Node.js';
  }

  const bgColor = isFocused ? palette.rowFocusedBg : (isSelected ? palette.rowSelectedBg : undefined);
  const moduleCount = project.buildPaths.length;
  const selectionLabel = isSelected ? 'selected' : 'not selected';
  const focusLabel = isFocused ? ', focused' : '';
  const sizeLabel = project.size === null ? 'size pending' : `size ${formatBytes(project.size)}`;
  const moduleLabel = project.buildType === 'node'
    ? `${moduleCount} ${moduleCount === 1 ? 'clean target' : 'clean targets'}`
    : `${moduleCount} ${moduleCount === 1 ? 'module' : 'modules'}`;
  const accessibleLabel = `${project.rootPath}. ${typeName} project. ${moduleLabel}. ${sizeLabel}. ${selectionLabel}${focusLabel}.`;

  return (
    <Box
      backgroundColor={bgColor}
      aria-role="option"
      aria-state={{ selected: isSelected }}
    >
      <Box width={COL_CHECK} flexShrink={0} aria-hidden>
        <Text 
          color={isSelected ? palette.selection : (isFocused ? 'white' : undefined)}
          bold={isSelected || isFocused}
        >
          {isSelected ? '● ' : (isFocused ? '› ' : '○ ')}
        </Text>
      </Box>

      <Box width={maxPathWidth} flexGrow={1} marginRight={2} flexDirection="row">
        <Text
          aria-label={accessibleLabel}
          underline={isFocused}
          color={(isFocused || isSelected) ? 'white' : undefined}
          wrap="truncate-end"
          bold={isFocused}
        >
          {replaceHomeWithTilde(project.rootPath)}
        </Text>
        <Text 
          aria-hidden
          color={(isFocused || isSelected) ? 'white' : typeColor}
          bold
        >
          {`  (${typeLabel})   `}
        </Text>
      </Box>

      <Box width={COL_MODULES} flexShrink={0} marginRight={1}>
        {moduleCount > 1 && (
          <Text 
            aria-hidden
            color={(isFocused || isSelected) ? 'white' : palette.info}
          >
            {project.buildType === 'node' ? `${moduleCount} targets` : `${moduleCount} mods`}
          </Text>
        )}
      </Box>

      <Box width={COL_SIZE} flexShrink={0} justifyContent="flex-end">
        {project.size === null ? (
          <Box flexDirection="row" gap={1} aria-hidden>
            <Text color={palette.info}><Spinner type="dots" /></Text>
            <Text color={palette.warning}>sizing</Text>
          </Box>
        ) : (
          <Text 
            aria-hidden
            color={(isFocused || isSelected) ? 'white' : undefined}
          >
            {formatBytes(project.size)}
          </Text>
        )}
      </Box>
    </Box>
  );
};
