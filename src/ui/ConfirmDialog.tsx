import React from 'react';
import { Box, Text, useInput } from 'ink';
import { formatBytes } from '../utils/format.js';

interface ConfirmDialogProps {
  isOpen: boolean;
  selectedCount: number;
  totalSpace: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  selectedCount,
  totalSpace,
  onConfirm,
  onCancel,
}) => {
  useInput(
    (input, key) => {
      if (key.return) {
        onConfirm();
      } else if (key.escape || input.toLowerCase() === 'q' || input.toLowerCase() === 'n') {
        onCancel();
      } else if (input.toLowerCase() === 'y') {
        onConfirm();
      }
    },
    { isActive: isOpen }
  );

  if (!isOpen) {
    return null;
  }

  return (
    <Box marginTop={1} padding={1} borderStyle="round" borderColor="red" flexDirection="column">
      <Text bold color="red">
        ⚠ DIRECTORY DELETION WARNING
      </Text>
      <Box marginTop={1}>
        <Text>
          You are about to completely delete the build folders of{' '}
          <Text bold color="white">{selectedCount}</Text> projects.
        </Text>
      </Box>
      <Box>
        <Text>
          Estimated space to be freed: <Text bold color="green">{formatBytes(totalSpace)}</Text>
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Proceed? (Y/Enter to confirm, N/Esc to cancel)</Text>
      </Box>
    </Box>
  );
};
