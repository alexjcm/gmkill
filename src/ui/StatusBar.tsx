import React from 'react';
import { Box, Text } from 'ink';
import { formatBytes } from '../utils/format.js';

interface StatusBarProps {
  totalFreed: number;
  confirmOpen: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({ totalFreed, confirmOpen }) => {
  return (
    <Box marginTop={1} flexDirection="column">
      <Box paddingX={1} backgroundColor="gray">
        <Box flexGrow={1} gap={2}>
          <Box>
            <Text color="black" bold>{' Selected: '}</Text>
            <Text color="green" bold>{formatBytes(totalFreed)}</Text>
          </Box>
        </Box>

        <Box>
          {confirmOpen ? (
            <Text color="black">
              <Text bold>ENTER</Text> confirm • <Text bold>ESC</Text> cancel
            </Text>
          ) : (
            <Text color="black">
              <Text bold>↑↓</Text> move • <Text bold>SPACE/ENTER</Text> select •{' '}
              <Text bold>D</Text> delete • <Text bold>Q</Text> quit
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  );
};
