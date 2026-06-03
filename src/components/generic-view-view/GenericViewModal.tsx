import type { Theme, SxProps } from '@mui/material/styles';

import { useMemo, forwardRef, useCallback } from 'react';

import {
  Box,
  Slide,
  Stack,
  Paper,
  Dialog,
  useTheme,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  useMediaQuery,
  type SlideProps,
  CircularProgress,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

export interface GenericViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any;
  renderContent?: (data: any) => React.ReactNode;
  fields?: Array<{ key: string; label: string; render?: (value: any) => React.ReactNode }>;
  listItems?: Array<{ id: string; label: string; value?: string }>;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  slideDirection?: 'left' | 'right' | 'up' | 'down';
  position?: 'center' | 'right';
  loading?: boolean;
  paperSx?: SxProps<Theme>;
}

const SlideUpTransition = forwardRef<unknown, SlideProps>(function Transition(
  { children, ...props },
  ref
) {
  return (
    <Slide direction="up" ref={ref} {...props}>
      {children}
    </Slide>
  );
});

SlideUpTransition.displayName = 'SlideUpTransition';

const SlideLeftTransition = forwardRef<unknown, SlideProps>(function Transition(
  { children, ...props },
  ref
) {
  return (
    <Slide direction="left" ref={ref} {...props}>
      {children}
    </Slide>
  );
});

SlideLeftTransition.displayName = 'SlideLeftTransition';

/**
 * Render fields as key-value pairs
 */
function RenderFieldsList({ data, fields }: { data: any; fields: Array<{ key: string; label: string; render?: (value: any) => React.ReactNode }> }) {

  return (
    <Stack spacing={2}>
      {fields.map((field) => (
        <Box key={field.key}>
          <Typography
            variant="subtitle2"
            sx={{
              color: 'primary.main',
              mb: 0.5,
              fontWeight: 600,
              fontSize: '0.875rem',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {field.label}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.primary',
              wordBreak: 'break-word',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {field.render ? field.render(data[field.key]) : String(data[field.key] ?? '-')}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}

/**
 * Render list items
 */
function RenderListItems({ items }: { items: Array<{ id: string; label: string; value?: string }> }) {
  return (
    <Stack spacing={1}>
      {items.map((item) => (
        <Box key={item.id}>
          <Paper
            sx={{
              p: 1.5,
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: 'var(--surface-2)',
                borderColor: 'var(--border-strong)',
                transform: 'translateX(4px)',
              },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
                {item.label}
              </Typography>
              {item.value && (
                <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'var(--font-mono)' }}>
                  {item.value}
                </Typography>
              )}
            </Box>
          </Paper>
        </Box>
      ))}
    </Stack>
  );
}

export function GenericViewModal({
  isOpen,
  onClose,
  title,
  data,
  loading,
  renderContent,
  fields,
  listItems,
  maxWidth = 'xl',
  slideDirection = 'left',
  position = 'center',
  paperSx,
}: GenericViewModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const TransitionComponent = slideDirection === 'left' ? SlideLeftTransition : SlideUpTransition;

  const content = useMemo(() => {
    if (loading) {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
          }}
        >
          <CircularProgress />
        </Box>
      );
    }

    if (!data) {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
          }}
        >
          <Typography
            variant="body1"
            sx={{
              color: 'text.primary', // Tuzatildi
              textAlign: 'center',
            }}
          >
            Ma&apos;lumot topilmadi
          </Typography>
        </Box>
      );
    }

    if (renderContent) {
      return renderContent(data);
    }

    if (listItems && listItems.length > 0) {
      return <RenderListItems items={listItems} />;
    }

    if (fields && fields.length > 0) {
      return <RenderFieldsList data={data} fields={fields} />;
    }

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
        }}
      >
        <Typography
          variant="body1"
          sx={{
            color: 'text.primary', // Tuzatildi
            textAlign: 'center',
          }}
        >
          Kontent shakli belgilanmadi
        </Typography>
      </Box>
    );
  }, [data, renderContent, fields, listItems, loading]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      TransitionComponent={TransitionComponent}
      maxWidth={false}
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          width: position === 'right' && !isMobile ? '70vw' : '100%',
          maxWidth: position === 'right' && !isMobile ? '70vw' : '100%',
          position: position === 'right' && !isMobile ? 'fixed' : 'relative',
          right: position === 'right' && !isMobile ? 0 : 'auto',
          top: position === 'right' && !isMobile ? 0 : 'auto',
          margin: position === 'right' && !isMobile ? 0 : 'auto',
          height: isMobile ? '100vh' : position === 'right' ? '100vh' : '90vh',
          maxHeight: isMobile ? '100vh' : position === 'right' ? '100vh' : '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius:
            position === 'right' && !isMobile
              ? 1
              : isMobile
                ? 0
                : 2,
          backgroundColor: 'var(--bg)',
          backdropFilter: 'blur(12px)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)',
          ...paperSx,
        },
      }}
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(6px)',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 2,
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              letterSpacing: '-0.5px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {title}
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          sx={{
            color: 'text.primary',
            backgroundColor: 'var(--accent-soft)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: 'var(--accent-soft)',
              transform: 'rotate(90deg)',
            },
          }}
          size="small"
        >
          <Iconify icon="mingcute:close-line" width={20} height={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 2,
          mt: 1,
          flex: 1,
          overflowY: 'auto',
          color: 'text.primary',
          backgroundColor: 'var(--bg)',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'var(--surface)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'var(--accent-soft)',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'var(--accent)',
            },
          },
        }}
      >
        {content}
      </DialogContent>
    </Dialog>
  );
}
