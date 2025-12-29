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
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

// ============================================================================
// TYPES
// ============================================================================

export interface GenericViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any; // Ko'rsatiladigan ma'lumot
  renderContent?: (data: any) => React.ReactNode; // Ma'lumotni qanday chizishni hal qiluvchi funksiya
  fields?: Array<{ key: string; label: string; render?: (value: any) => React.ReactNode }>;
  listItems?: Array<{ id: string; label: string; value?: string }>;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  slideDirection?: 'left' | 'right' | 'up' | 'down';
  position?: 'center' | 'right';
}

// ============================================================================
// TRANSITION COMPONENT
// ============================================================================

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

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Render fields as key-value pairs
 */
function RenderFieldsList({ data, fields }: { data: any; fields: Array<{ key: string; label: string; render?: (value: any) => React.ReactNode }> }) {
  const theme = useTheme();

  return (
    <Stack spacing={2}>
      {fields.map((field) => (
        <Box key={field.key}>
          <Typography
            variant="subtitle2"
            sx={{
              color: theme.palette.text.secondary,
              mb: 0.5,
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            {field.label}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.primary,
              wordBreak: 'break-word',
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
  const theme = useTheme();

  return (
    <Stack spacing={1}>
      {items.map((item, index) => (
        <Box key={item.id}>
          <Paper
            sx={{
              p: 1.5,
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(0, 0, 0, 0.02)',
              border: `1px solid ${theme.palette.divider}`,
              backdropFilter: 'blur(4px)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.04)',
                borderColor: theme.palette.primary.main,
                transform: 'translateX(4px)',
              },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>
                {item.label}
              </Typography>
              {item.value && (
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
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
  renderContent,
  fields,
  listItems,
  maxWidth = 'lg',
  slideDirection = 'left',
  position = 'center',
}: GenericViewModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  //  console.log("Current Mode:", theme.palette.mode);

  // Choose transition based on slideDirection
  const TransitionComponent = slideDirection === 'left' ? SlideLeftTransition : SlideUpTransition;

  // Memoize the content to avoid unnecessary re-renders
  const content = useMemo(() => {
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
              color: theme.palette.text.primary,
              textAlign: 'center',
            }}
          >
            Ma&apos;lumot topilmadi
          </Typography>
        </Box>
      );
    }

    // Priority: renderContent > listItems > fields
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
            color: theme.palette.text.primary,
            textAlign: 'center',
          }}
        >
          Kontent shakli belgilanmadi
        </Typography>
      </Box>
    );
  }, [data, renderContent, fields, listItems, theme.palette.text.primary]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      TransitionComponent={TransitionComponent}
      maxWidth={maxWidth}
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          position: position === 'right' && !isMobile ? 'fixed' : 'relative',
          right: position === 'right' && !isMobile ? 0 : 'auto',
          top: position === 'right' && !isMobile ? 0 : 'auto',
          margin: position === 'right' && !isMobile ? 0 : 'auto',
          height: isMobile ? '100vh' : position === 'right' ? '100vh' : '90vh',
          maxHeight: isMobile ? '100vh' : position === 'right' ? '100vh' : '90vh',
          display: 'flex',
          backgroundColor: theme.vars.palette.background.paper,
          // Light rejim uchun gradient
          backgroundImage: `linear-gradient(135deg, ${theme.vars.palette.background.paper} 0%, #f5f7fa 100%)`,
          // DARK rejim uchun maxsus stil
          [theme.getColorSchemeSelector('dark')]: {
          backgroundImage: `linear-gradient(135deg, ${theme.vars.palette.background.paper} 0%, #1a1a2e 100%)`,
          border: `1px solid ${theme.vars.palette.divider}`,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
         },
    
       // Boshqa stillar (position, height va h.k.)
          flexDirection: 'column',
          borderRadius:
            position === 'right' && !isMobile
              ? 0
              : isMobile
                ? 0
                : theme.spacing(2),
          background:
            theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, #1a1a2e 100%)`
              : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, #f5f7fa 100%)`,
          backdropFilter: 'blur(12px)',
          boxShadow:
            theme.palette.mode === 'dark'
              ? '0 20px 60px rgba(0, 0, 0, 0.8)'
              : '0 20px 60px rgba(0, 0, 0, 0.08)',
          border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
        },
      }}
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(6px)',
          backgroundColor:
            theme.palette.mode === 'dark'
              ? 'rgba(0, 0, 0, 0.8)'
              : 'rgba(0, 0, 0, 0.4)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: theme.spacing(2),
          borderBottom: `1px solid ${theme.palette.divider}`,
          background:
            theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.7)'
              : 'rgba(255, 255, 255, 0.7)',
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
              color: theme.palette.text.primary,
              letterSpacing: '-0.5px',
            }}
          >
            {title}
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          sx={{
            color: theme.palette.text.primary,
            backgroundColor:
              theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.04)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : theme.palette.action.hover,
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
          padding: 2,
          mt: 1,
          flex: 1,
          overflowY: 'auto',
          color: theme.palette.text.primary,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor:
              theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.05)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor:
              theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.2)'
                : theme.palette.divider,
            borderRadius: '4px',
            '&:hover': {
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.3)'
                  : theme.palette.text.secondary,
            },
          },
        }}
      >
        {content}
      </DialogContent>
    </Dialog>
  );
}