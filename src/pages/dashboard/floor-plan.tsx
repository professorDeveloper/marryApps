import { useSearchParams } from 'react-router';

import { Box, Container } from '@mui/material';

import { CONFIG } from 'src/global-config';
import { useGetHall } from 'src/actions/halls';
import { useGetCafeTablesByHall } from 'src/actions/cafe-tables';

import { FloorPlanEditor } from 'src/components/floor-plan-editor';

const metadata = { title: `Floor Plan Editor | ${CONFIG.appName}` };

export default function FloorPlanPage() {
    const [searchParams] = useSearchParams();
    const hallId = searchParams.get('hallId');
    const { hall, hallLoading } = useGetHall(hallId || '');
    const { tables, tablesLoading } = useGetCafeTablesByHall(hallId || '');

    return (
        <>
            <title>{metadata.title}</title>

            <Container maxWidth={false} disableGutters sx={{ height: 'calc(100vh - 64px)' }}>
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {hallId && hall ? (
                        <Box key={hallId} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            {/* <Box sx={{ p: 2, backgroundColor: 'background.default', borderBottom: '1px solid divider' }}>
                                <Box component="h6">
                                    Hall: <strong>{hall.name}</strong> ({hall.width}px × {hall.height}px)
                                </Box>
                            </Box> */}
                            <Box sx={{ flex: 1, overflow: 'hidden' }}>
                                <FloorPlanEditor hallWidth={hall.width} hallHeight={hall.height} hallId={hall.id} cafeTables={tables} />
                            </Box>
                        </Box>
                    ) : (
                        <FloorPlanEditor />
                    )}
                </Box>
            </Container>
        </>
    );
}
