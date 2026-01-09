import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Paper,
    Typography,
    TextField,
    MenuItem,
    Select,
    Checkbox,
    Button,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Divider,
    InputAdornment,
    useTheme,
    CssBaseline,
    CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

import { fetcher, endpoints } from 'src/lib/axios';
import { toast } from 'src/components/snackbar';

// --- TYPES ---
interface Ingredient {
    id: string;
    name: string;
    measurement: string;
    brand_id: string;
    group_id: string;
    picture_url: string;
}

interface InvoiceDetail {
    id: string;
    ingredient_id: string;
    quantity: number;
    price: string;
    price_per_unit: string;
}

interface Product extends Ingredient {
    price_per_unit: number;
}

// Narxlarni formatlash uchun yordamchi funksiya (masalan: 10 000)
const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price);
};

const ProductCalculator = () => {
    const { t } = useTranslation('menu');

    // State
    const [ingredients, setIngredients] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]); // O'ng tarafga o'tgan mahsulotlar IDsi
    const [transferredIds, setTransferredIds] = useState<string[]>([]); // Arrow orqali o'tgan mahsulotlar
    const [quantities, setQuantities] = useState<Record<string, number>>({}); // Har bir mahsulot miqdori { id: miqdor }
    const [searchTerm, setSearchTerm] = useState('');
    const [showCalculation, setShowCalculation] = useState(false); // Hisoblash jadvalini ko'rsatish
    const theme = useTheme();

    // API dan ma'lumot olish
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                // Ingredients va Invoice details'ni parallel olish
                const [ingredientsData, invoiceDetailsData] = await Promise.all([
                    fetcher<Ingredient[]>(endpoints.ingredient.list),
                    fetcher<InvoiceDetail[]>(endpoints.invoice.details),
                ]);

                // Invoice details'dan price_per_unit map'i yaratish
                const priceMap = new Map<string, number>();
                if (Array.isArray(invoiceDetailsData)) {
                    invoiceDetailsData.forEach(detail => {
                        priceMap.set(detail.ingredient_id, parseFloat(detail.price_per_unit));
                    });
                }

                // Ingredients va narxlarni merge qilish
                const enrichedIngredients = (Array.isArray(ingredientsData) ? ingredientsData : [])
                    .map(ingredient => ({
                        ...ingredient,
                        price_per_unit: priceMap.get(ingredient.id) || 0,
                    }));

                setIngredients(enrichedIngredients);
            } catch (error) {
                console.error('Error loading data:', error);
                toast.error(t('error.loadFailed'));
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [t]);

    // Chap tarafdagi mahsulotlarni tanlash (Checkbox bosilganda)
    const handleToggle = (id: string) => {
        const currentIndex = selectedIds.indexOf(id);
        const newChecked = [...selectedIds];

        if (currentIndex === -1) {
            newChecked.push(id);
            // Yangi qo'shilganda default miqdor berish (ixtiyoriy)
            setQuantities(prev => ({ ...prev, [id]: 1 }));
        } else {
            newChecked.splice(currentIndex, 1);
            // O'chirilganda miqdorni ham tozalash (ixtiyoriy)
            const newQuantities = { ...quantities };
            delete newQuantities[id];
            setQuantities(newQuantities);
        }

        setSelectedIds(newChecked);
    };

    // Miqdor o'zgarganda (O'ng taraf input)
    const handleQuantityChange = (id: string, value: string) => {
        setQuantities(prev => ({
            ...prev,
            [id]: parseFloat(value) || 0
        }));
    };

    // Arrow-right: Tanlangan mahsulotlarni o'tkazish
    const handleMoveRight = () => {
        if (selectedIds.length > 0) {
            setTransferredIds([...transferredIds, ...selectedIds]);
            setSelectedIds([]);
        }
    };

    // Arrow-left: Barcha mahsulotlarni qaytarish
    const handleMoveLeft = () => {
        setTransferredIds([]);
        setQuantities({});
        setShowCalculation(false);
    };

    // Hisoblash (Bottom Table uchun ma'lumot tayyorlash)
    const calculatedRows = useMemo(() => {
        return transferredIds.map(id => {
            const ingredient = ingredients.find(p => p.id === id);
            if (!ingredient) return null;
            const qty = quantities[id] || 0;
            const total = ingredient.price_per_unit * qty;
            return {
                ...ingredient,
                qty,
                total
            };
        }).filter(row => row !== null) as Array<Product & { qty: number; total: number }>;
    }, [transferredIds, quantities, ingredients]);

    // Jami summa
    const grandTotal = calculatedRows.reduce((acc, row) => acc + row.total, 0);

    return (
        <Box sx={{
            p: 3,
            minHeight: '100vh',
            fontFamily: 'Arial, sans-serif',
        }}>

            {/* --- HEADER TABS --- */}
            <Box sx={{
                mb: 3,
                display: 'flex',
                gap: 4,
                borderBottom: `1px solid ${theme.vars.palette.divider}`,
                pb: 1
            }}>
                <Typography variant="subtitle1" sx={{
                    fontWeight: 'bold',
                    borderBottom: '2px solid',
                    borderColor: 'primary.main',
                    color: 'text.primary'
                }}>
                    {t('calculation.content')}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">{t('calculation.semifinishedProducts')}</Typography>
                <Typography variant="subtitle1" color="text.secondary">{t('calculation.import')}</Typography>
            </Box>



            {/* --- MAIN TRANSFER UI --- */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 1fr 6fr' }, gap: 2, alignItems: 'flex-start' }}>

                {/* LEFT SIDE: AVAILABLE ITEMS */}
                <Box>
                    {/* --- FILTER SECTION --- */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ width: '100%', minWidth: '200px' }}>
                            <TextField
                                fullWidth
                                placeholder={t('calculation.search')}
                                size="small"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', flexGrow: 1 }}>
                            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 auto' }, minWidth: '200px' }}>
                                <Select
                                    fullWidth
                                    displayEmpty
                                    defaultValue=""
                                    size="small"
                                >
                                    <MenuItem value=""><em>{t('calculation.selectGroup')}</em></MenuItem>
                                    <MenuItem value="oshxona">{t('management.group.title')}</MenuItem>
                                </Select>
                            </Box>
                            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 auto' }, minWidth: '150px' }}>
                                <Select
                                    fullWidth
                                    displayEmpty
                                    defaultValue=""
                                    size="small"
                                >
                                    <MenuItem value=""><em>{t('calculation.selectWarehouse')}</em></MenuItem>
                                    <MenuItem value="asosiy">{t('calculation.mainWarehouse')}</MenuItem>
                                </Select>
                            </Box>
                        </Box>
                    </Box>
                    <Paper sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                    }} elevation={1}>
                        {/* Header Row */}
                        <Box sx={{
                            display: 'flex',
                            p: 1.5,
                            bgcolor: 'action.hover',
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            color: 'text.primary'
                        }}>
                            <Box sx={{ width: '40%' }}>{t('calculation.productName')}</Box>
                            <Box sx={{ width: '20%' }}>{t('calculation.unit')}</Box>
                            <Box sx={{ width: '20%' }}>{t('calculation.group')}</Box>
                            <Box sx={{ width: '20%', textAlign: 'center' }}>{t('calculation.price')}</Box>
                        </Box>
                        <Divider />
                        {/* List */}
                        <Box sx={{
                            maxHeight: 400,
                            overflowY: 'auto',
                        }}>
                            {loading ? (
                                <Box sx={{ p: 3, textAlign: 'center' }}>
                                    <CircularProgress size={40} />
                                </Box>
                            ) : ingredients.length === 0 ? (
                                <Typography sx={{
                                    p: 3,
                                    textAlign: 'center',
                                    color: 'text.secondary'
                                }}>
                                    {t('calculation.noProducts')}
                                </Typography>
                            ) : (
                                ingredients
                                    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map((ingredient) => (
                                        <Box
                                            key={ingredient.id}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                p: 1.5,
                                                borderBottom: `1px solid ${theme.vars.palette.divider}`,
                                                '&:hover': {
                                                    bgcolor: 'action.hover'
                                                }
                                            }}
                                        >
                                            <Box sx={{ width: '40%', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Checkbox
                                                    size="small"
                                                    checked={selectedIds.includes(ingredient.id)}
                                                    onChange={() => handleToggle(ingredient.id)}
                                                    sx={{ color: '#27ae60', '&.Mui-checked': { color: '#27ae60' } }}
                                                />
                                                <Typography variant="body2" color="text.primary">
                                                    {ingredient.name}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ width: '20%' }}>
                                                <Typography variant="body2" color="text.secondary">{ingredient.measurement}</Typography>
                                            </Box>
                                            <Box sx={{ width: '20%' }}>
                                                <Typography variant="body2" color="text.secondary">{ingredient.brand_id}</Typography>
                                            </Box>
                                            <Box sx={{ width: '20%', textAlign: 'right' }}>
                                                <Typography variant="body2" fontWeight="bold" color="text.primary">
                                                    {formatPrice(ingredient.price_per_unit)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))
                            )}
                        </Box>
                    </Paper>
                </Box>

                {/* MIDDLE: ARROWS (Transfer buttons) */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'start', height: '100%', pt: 5 }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, gap: 1 }}>
                        <IconButton
                            onClick={handleMoveRight}
                            disabled={selectedIds.length === 0}
                            sx={{
                                bgcolor: selectedIds.length === 0 ? '#ccc' : '#ffe0b2',
                                color: selectedIds.length === 0 ? '#999' : '#f57c00',
                                '&:hover': {
                                    bgcolor: selectedIds.length === 0 ? '#ccc' : '#ffcc80'
                                },
                                borderRadius: '15%',
                                padding: '10px',
                            }}
                            title={t('calculation.selectedProductsTransfer')}
                        >
                            <ChevronRightIcon />
                        </IconButton>
                        <IconButton
                            onClick={handleMoveLeft}
                            disabled={transferredIds.length === 0}
                            sx={{
                                bgcolor: transferredIds.length === 0 ? '#ccc' : '#ffe0b2',
                                color: transferredIds.length === 0 ? '#999' : '#f57c00',
                                '&:hover': {
                                    bgcolor: transferredIds.length === 0 ? '#ccc' : '#ffcc80'
                                },
                                borderRadius: '15%',
                                padding: '10px',
                            }}
                            title={t('calculation.returnAllProducts')}
                        >
                            <ChevronLeftIcon />
                        </IconButton>
                    </Box>
                </Box>

                {/* RIGHT SIDE: SELECTED ITEMS & INPUTS */}
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                            {t('calculation.calculateProductPrice')}
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => setShowCalculation(true)}
                            disabled={transferredIds.length === 0}
                            sx={{
                                bgcolor: transferredIds.length === 0 ? '#ccc' : '#ff9800',
                                textTransform: 'none',
                                '&:hover': {
                                    bgcolor: transferredIds.length === 0 ? '#ccc' : '#f57c00'
                                }
                            }}
                        >
                            {t('calculation.calculate')}
                        </Button>
                    </Box>

                    <Paper sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                    }} elevation={1}>
                        {/* Header Row */}
                        <Box sx={{
                            display: 'flex',
                            p: 1.5,
                            bgcolor: 'action.hover',
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            color: 'text.primary'
                        }}>
                            {/* <Box sx={{ width: '5%', textAlign: 'center' }}><Checkbox size="small" disabled /></Box> */}
                            <Box sx={{ width: '35%' }}>{t('calculation.productName')}</Box>
                            <Box sx={{ width: '30%' }}>{t('calculation.unitOfMeasurement')}</Box>
                            <Box sx={{ width: '30%', textAlign: 'center' }}>{t('calculation.quantity')}</Box>
                        </Box>
                        <Divider />
                        {/* Selected List */}
                        <Box sx={{
                            maxHeight: 400,
                            overflowY: 'auto',
                            minHeight: 200
                        }}>
                            {transferredIds.length === 0 ? (
                                <Typography sx={{
                                    p: 3,
                                    textAlign: 'center',
                                    color: 'text.secondary'
                                }}>
                                    {t('calculation.noProductsSelected')}
                                </Typography>
                            ) : (
                                transferredIds.map(id => {
                                    const ingredient = ingredients.find(p => p.id === id);
                                    if (!ingredient) return null;
                                    return (
                                        <Box
                                            key={id}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                p: 1,
                                                borderBottom: `1px solid ${theme.vars.palette.divider}`
                                            }}
                                        >
                                            <Box sx={{ width: '5%', textAlign: 'center' }}>
                                                <Checkbox
                                                    size="small"
                                                    checked={true}
                                                    onChange={() => {
                                                        setTransferredIds(transferredIds.filter(tid => tid !== id));
                                                        const newQuantities = { ...quantities };
                                                        delete newQuantities[id];
                                                        setQuantities(newQuantities);
                                                    }}
                                                />
                                            </Box>
                                            <Box sx={{ width: '35%' }}>
                                                <Typography variant="body2" color="text.primary">
                                                    {ingredient.name}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ width: '30%' }}>
                                                <Typography variant="body2" color="text.secondary">{ingredient.measurement}</Typography>
                                            </Box>
                                            <Box sx={{ width: '30%' }}>
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    value={quantities[id] || ''}
                                                    onChange={(e) => handleQuantityChange(id, e.target.value)}
                                                    fullWidth
                                                />
                                            </Box>
                                        </Box>
                                    )
                                })
                            )}
                        </Box>
                    </Paper>
                </Box>
            </Box>

            {/* --- BOTTOM CALCULATION TABLE --- */}
            {showCalculation && (
                <Box sx={{ mt: 4 }}>
                    <TableContainer
                        component={Paper}
                        elevation={1}
                        sx={{
                            borderRadius: 2,
                        }}
                    >
                        <Table>
                            <TableHead sx={{ bgcolor: 'action.hover' }}>
                                <TableRow>
                                    <TableCell sx={{ color: 'text.primary' }}>{t('calculation.number')}</TableCell>
                                    <TableCell sx={{ color: 'text.primary' }}>{t('calculation.productName')}</TableCell>
                                    <TableCell sx={{ color: 'text.primary' }}>{t('calculation.quantity')}</TableCell>
                                    <TableCell sx={{ color: 'text.primary' }}>{t('calculation.price')}</TableCell>
                                    <TableCell align="right" sx={{ color: 'text.primary' }}>{t('calculation.totalPrice')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {calculatedRows.map((row, index) => (
                                    <TableRow key={row.id} sx={{ borderBottom: `1px solid ${theme.vars.palette.divider}` }}>
                                        <TableCell sx={{ color: 'text.secondary' }}>{index + 1}</TableCell>
                                        <TableCell sx={{ color: 'text.primary' }}>{row.name}</TableCell>
                                        <TableCell sx={{ color: 'text.primary' }}>{row.qty}</TableCell>
                                        <TableCell sx={{ color: 'text.primary' }}>{formatPrice(row.price_per_unit)}</TableCell>
                                        <TableCell align="right" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                                            {formatPrice(row.total)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {calculatedRows.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                                            {t('calculation.selectProductsForCalculation')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* TOTALS FOOTER */}
                    <Box sx={{
                        mt: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        alignItems: 'flex-end',
                        pr: 2
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '300px' }}>
                            <Typography color="text.secondary" fontWeight="bold">
                                {t('calculation.total')}
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="text.primary">
                                {formatPrice(grandTotal)}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '300px' }}>
                            <Typography color="text.secondary" fontWeight="bold">
                                {t('calculation.markup')}
                            </Typography>
                            <Typography fontWeight="bold" color="text.primary">0</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '300px' }}>
                            <Typography color="text.secondary" fontWeight="bold">
                                {t('calculation.markupPercent')}
                            </Typography>
                            <Typography fontWeight="bold" color="text.primary">0%</Typography>
                        </Box>
                    </Box>
                </Box>
            )}

        </Box>
    );
};

export default ProductCalculator;