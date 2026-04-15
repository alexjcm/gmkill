import React from 'react';
import { Box, Text } from 'ink';
import { formatBytes } from '../utils/format.js';

interface StatusBarProps {
  selectedSpace: number;
  confirmOpen: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({ selectedSpace, confirmOpen }) => {
  return (
    <Box marginTop={1} flexDirection="column">
      <Box paddingX={1} backgroundColor="gray">
        <Box flexGrow={1} gap={2}>
          <Box>
            <Text color="black" bold>{' Selected: '}</Text>
            <Text color="green" bold>{formatBytes(selectedSpace)}</Text>
          </Box>
        </Box>

        <Box>
          {confirmOpen ? (
            <Text color="black" dimColor>Waiting for confirmation…</Text>
          ) : (
            <Text color="black">
              <Text bold>↑↓</Text> move • <Text bold>g/G</Text> top/bottom •{' '}
              <Text bold>SPACE</Text> select • <Text bold>a</Text> all •{' '}
              <Text bold>D</Text> delete • <Text bold>Q</Text> quit
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  );
};
