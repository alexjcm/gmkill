import React from 'react';
import { Box, Text, useIsScreenReaderEnabled } from 'ink';
import { formatBytes } from '../utils/format.js';
import { palette } from './palette.js';

interface StatusBarProps {
  selectedSpace: number;
  confirmOpen: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({ selectedSpace, confirmOpen }) => {
  const isScreenReaderEnabled = useIsScreenReaderEnabled();

  return (
    <Box marginTop={1} flexDirection="column">
      <Box paddingX={1}>
        <Text bold>{' Selected: '}</Text>
        <Text color={palette.selection} bold>{formatBytes(selectedSpace)}</Text>
      </Box>

      <Box paddingX={1} backgroundColor={palette.footerBg}>
        {confirmOpen ? (
          <Text color="white">Waiting for confirmation…</Text>
        ) : isScreenReaderEnabled ? (
          <Text color="white">
            Arrow keys move. G jumps to bottom. Lowercase g jumps to top. Space and Enter toggle selection. A toggles all. D deletes selected projects. Q quits.
          </Text>
        ) : (
          <Text color="white">
            <Text bold color="white">↑↓</Text> move • <Text bold color="white">g/G</Text> top/bottom •{' '}
            <Text bold color="white">SPACE</Text> select • <Text bold color="white">a</Text> all •{' '}
            <Text bold color="white">D</Text> delete • <Text bold color="white">Q</Text> quit
          </Text>
        )}
      </Box>
    </Box>
  );
};
