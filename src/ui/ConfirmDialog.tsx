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
    <Box marginTop={1} paddingX={1} paddingY={0} borderStyle="round" borderColor="yellow" flexDirection="column">
      <Box gap={1}>
        <Text color="yellow">⚠</Text>
        <Text>
          Delete build folders of{' '}
          <Text bold color="white">{selectedCount}</Text>
          {selectedCount === 1 ? ' project' : ' projects'}?{' '}
          <Text dimColor>({formatBytes(totalSpace)})</Text>
        </Text>
      </Box>
      <Box marginLeft={2}>
        <Text bold color="green">Y/Enter</Text>
        <Text dimColor> to confirm  </Text>
        <Text bold color="red">N/Esc</Text>
        <Text dimColor> to cancel</Text>
      </Box>
    </Box>
  );
};
