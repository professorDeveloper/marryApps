import { useMemo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';
import { DataTable } from 'src/sections/warehouse/deduction/components/utility-data-table';
import { useGetCategories } from 'src/actions/categories';

import { useDevicesData } from './devices/hooks/useDevicesData';
import { DeviceTableRow } from './devices/components/DeviceTableRow';
import { DeviceFormDialog } from './devices/components/DeviceFormDialog';
import { DeviceDeleteDialog } from './devices/components/DeviceDeleteDialog';
import type { IDevice } from './devices/types';

export function ConnectedDeviceListView() {
  const { t } = useTranslation('menu');

  const { categories } = useGetCategories();
  
  // Create HashMap for efficient category name lookup
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((category) => {
      map.set(category.id, category.name);
    });
    return map;
  }, [categories]);

  const getCategoryName = useCallback((categoryId: string) => {
    return categoryMap.get(categoryId) || categoryId;
  }, [categoryMap]);

  // Detail view state
  const [selectedDevice, setSelectedDevice] = useState<IDevice | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  const handleRowClick = useCallback((device: IDevice) => {
    setSelectedDevice(device);
    setDetailDrawerOpen(true);
  }, []);

  const handleCloseDetailDrawer = useCallback(() => {
    setDetailDrawerOpen(false);
    setSelectedDevice(null);
  }, []);

  const {
    devices,
    devicesLoading,
    modalState,
    deleteDialogOpen,
    deleteTarget,
    handleOpenCreate,
    handleOpenEdit,
    handleCloseModal,
    handleFormSubmit,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
  } = useDevicesData();

  const columns = useMemo(
    () => [
      {
        key: 'ip',
        label: t('devices.ipAddress'),
        width: '1fr',
        sortable: true,
        getValue: (row: any) => row?.ip ?? '',
      },
      {
        key: 'port',
        label: t('devices.port', 'Port'),
        width: '100px',
        sortable: true,
        getValue: (row: any) => row?.port ?? 9100,
      },
      {
        key: 'type',
        label: t('devices.type'),
        width: '120px',
        sortable: true,
        getValue: (row: any) => row?.type || 'close_check',
        renderCell: ({ value }: { value: unknown }) => {
          const type = String(value || 'close_check');
          const displayLabel = type === 'close_check' ? 'Close Check' : type.charAt(0).toUpperCase() + type.slice(1);
          return (
            <Chip
              label={displayLabel}
              size="small"
              variant="outlined"
            />
          );
        },
      },
      {
        key: 'connected_entities',
        label: t('devices.categories'),
        width: '2fr',
        sortable: false,
        filterable: false,
        getValue: (row: any) => {
          // Support both connected_entity_ids array and expanded connected_entities array
          const expanded: Array<{ id: string; name: string }> = row?.connected_entities ?? [];
          const ids: string[] = row?.connected_entity_ids ?? [];
          
          if (expanded.length) {
            return expanded.map((entity) => ({
              id: entity.id,
              name: getCategoryName(entity.id)
            }));
          }
          
          return ids.map((id) => ({
            id,
            name: getCategoryName(id)
          }));
        },
        renderCell: ({ value }: { value: unknown }) => {
          const items = value as Array<{ id: string; name: string }>;
          const displayLimit = 2;
          
          if (items.length <= displayLimit) {
            const categoryNames = items.map((entity) => entity.name).join(', ');
            return (
              <Box sx={{ py: 0.5 }}>
                {categoryNames}
              </Box>
            );
          }
          
          const displayedNames = items.slice(0, displayLimit).map((entity) => entity.name).join(', ');
          const remainingCount = items.length - displayLimit;
          const allNames = items.map((entity) => entity.name).join(', ');
          
          return (
            <Box sx={{ py: 0.5 }} title={allNames}>
              {displayedNames}... +{remainingCount}
            </Box>
          );
        },
      },
      {
        key: 'actions',
        label: t('common.actions'),
        width: '120px',
        sortable: false,
        filterable: false,
        align: 'center' as const,
        renderCell: ({ row }: { row: any }) => (
          <DeviceTableRow
            device={row}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteClick}
          />
        ),
      },
    ],
    [t, handleOpenEdit, handleDeleteClick, getCategoryName]
  );

  return (
    <Box sx={{p:2}}>
      <DataTable
        persistKey="settings-connected-devices-list"
        data={devices}
        getRowId={(row: any) => String(row?.id)}
        columns={columns}
        onRowClick={handleRowClick}
        defaultConfig={{
          order: ['ip', 'port', 'type', 'connected_entities', 'actions'],
          visibility: {
            ip: true,
            port: true,
            type: true,
            connected_entities: true,
            actions: true,
          },
          widths: {
            ip: '1fr',
            port: '100px',
            type: '120px',
            connected_entities: '2fr',
            actions: '120px',
          },
        }}
        onReset={() => {}}
        headerActions={
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={handleOpenCreate}
            size="small"
          >
            {t('common.add')}
          </Button>
        }
      />

      <DeviceFormDialog
        modalState={modalState}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
      />

      <DeviceDeleteDialog
        open={deleteDialogOpen}
        device={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Detail View Drawer */}
      <Drawer
        anchor="right"
        open={detailDrawerOpen}
        onClose={handleCloseDetailDrawer}
      >
        <Box sx={{ width: 400, p: 3 }}>
          {selectedDevice && (
            <>
              <Typography variant="h6" gutterBottom>
                {t('devices.title')} Details
              </Typography>
              
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('devices.ipAddress')}
                  </Typography>
                  <Typography variant="body1">
                    {selectedDevice.ip}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('devices.port', 'Port')}
                  </Typography>
                  <Typography variant="body1">
                    {selectedDevice.port}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('devices.type')}
                  </Typography>
                  <Typography variant="body1">
                    {selectedDevice.type === 'close_check' ? 'Close Check' : selectedDevice.type.charAt(0).toUpperCase() + selectedDevice.type.slice(1)}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('devices.categories')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {selectedDevice.connected_entity_ids.map((entityId) => (
                      <Chip 
                        key={entityId} 
                        label={getCategoryName(entityId)} 
                        size="small" 
                      />
                    ))}
                  </Box>
                </Box>
                
                {selectedDevice.created_at && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body1">
                      {new Date(selectedDevice.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                )}
                
                {selectedDevice.updated_at && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Updated
                    </Typography>
                    <Typography variant="body1">
                      {new Date(selectedDevice.updated_at).toLocaleString()}
                    </Typography>
                  </Box>
                )}
              </Box>
            </>
          )}
        </Box>
      </Drawer>
    </Box>
  );
}
