import React from 'react';
import { Box, Text, useInput } from 'ink';
import { formatBytes } from '../utils/format.js';
import { palette } from './palette.js';

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
    <Box
      marginTop={1}
      paddingX={1}
      paddingY={0}
      borderStyle="round"
      borderColor={palette.warning}
      flexDirection="column"
      aria-label={`Confirm deletion of ${selectedCount} ${selectedCount === 1 ? 'project' : 'projects'} totaling ${formatBytes(totalSpace)}. Press Y or Enter to confirm. Press N, Q, or Escape to cancel.`}
    >
      <Box gap={1}>
        <Text color={palette.warning} aria-hidden>⚠</Text>
        <Text>
          Delete build folders of{' '}
          <Text bold color={palette.warning}>{selectedCount}</Text>
          {selectedCount === 1 ? ' project' : ' projects'}?{' '}
          <Text color={palette.warning}>({formatBytes(totalSpace)})</Text>
        </Text>
      </Box>
      <Box marginLeft={2} aria-hidden>
        <Text bold color={palette.success}>Y/Enter</Text>
        <Text> to confirm  </Text>
        <Text bold color={palette.danger}>N/Esc</Text>
        <Text> to cancel</Text>
      </Box>
    </Box>
  );
};
