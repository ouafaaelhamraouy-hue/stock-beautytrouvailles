'use client';

import { Box, useTheme } from '@mui/material';
import { Icon } from '@phosphor-icons/react';
import { forwardRef } from 'react';

interface NavIconProps {
  icon: Icon;
  active?: boolean;
  collapsed?: boolean;
  size?: number;
}

export const NavIcon = forwardRef<HTMLDivElement, NavIconProps>(
  ({ icon: IconComponent, collapsed = false, size }, ref) => {
    const theme = useTheme();
    
    // Size: 22px when collapsed, 24px when expanded
    const iconSize = size || (collapsed ? 22 : 24);

    return (
      <Box
        ref={ref}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          // Color is controlled by parent ListItemIcon via CSS
          // This ensures hover states work correctly
          color: 'inherit',
          transition: theme.transitions.create('color', {
            duration: theme.transitions.duration.shorter,
          }),
        }}
      >
        <IconComponent
          size={iconSize}
          weight="regular"
          color="currentColor"
        />
      </Box>
    );
  }
);

NavIcon.displayName = 'NavIcon';
