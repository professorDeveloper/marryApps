import { useState } from 'react';

import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';
import {
  DataGrid,
  GridColDef,
  GridRowSelectionModel,
  gridClasses,
} from '@mui/x-data-grid';

import { useBoolean } from 'minimal-shared/hooks';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { EmptyContent } from 'src/components/empty-content';
import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';
import { DashboardContent } from 'src/layouts/dashboard';
import { RouterLink } from 'src/routes/components';

import { SharedTableToolbar } from 'src/sections/shared-table';

// ----------------------------------------------------------------------

type Props = {
  // Data props
  data: any[];
  columns: GridColDef[];
  loading: boolean;
  
  // Page header props
  heading: string;
  links: { name: string; href?: string }[];
  createLink?: string;
  createText?: string;
  
  // Optional
  children?: React.ReactNode;
};

export function SharedDataGrid({ 
  data, 
  columns, 
  loading, 
  heading, 
  links, 
  createLink, 
  createText = "Create New",
  children 
}: Props) {
  const theme = useTheme();
  const confirmDialog = useBoolean();
  
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>();

  const handleDeleteRows = () => {
    toast.success("Delete success!");
    setSelectedRows(undefined);
    confirmDialog.onFalse();
  };

  return (
    <DashboardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      <CustomBreadcrumbs
        heading={heading}
        links={links}
        action={
          createLink && (
            <Button
              component={RouterLink}
              href={createLink}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              {createText}
            </Button>
          )
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card
        sx={{
          height: { xs: 800, md: 2 },
          flexGrow: { md: 1 },
          display: { md: 'flex' },
          flexDirection: { md: 'column' },
        }}
      >
        <DataGrid
          rows={data}
          columns={columns}
          loading={loading}
          checkboxSelection
          disableRowSelectionOnClick
          getRowId={(row) => row.id}
          
          pageSizeOptions={[5, 10, 20, { value: -1, label: 'All' }]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          
          onRowSelectionModelChange={(newSelection) => setSelectedRows(newSelection)}
          rowSelectionModel={selectedRows}
          
          slots={{
            toolbar: () => (
              <SharedTableToolbar 
                 numSelected={Array.isArray(selectedRows) ? selectedRows.length : 0} 
                 onDelete={confirmDialog.onTrue}
              >
                {children}
              </SharedTableToolbar>
            ),
            noRowsOverlay: () => <EmptyContent title="No Data" />,
            noResultsOverlay: () => <EmptyContent title="No results found" />,
          }}

          sx={{
            [`& .${gridClasses.cell}`]: {
              display: 'flex',
              alignItems: 'center',
            },
          }}
        />
      </Card>

      <ConfirmDialog
        open={confirmDialog.value}
        onClose={confirmDialog.onFalse}
        title="Delete"
        content={
            <>
              Are you sure want to delete <strong> {Array.isArray(selectedRows) ? selectedRows.length : 0} </strong> items?
            </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteRows}
          >
            Delete
          </Button>
        }
      />
    </DashboardContent>
  );
}