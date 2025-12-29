/**
 * GenericViewModal - REAL WORLD IMPLEMENTATION EXAMPLES
 * 10+ Turli page'da ishlatiladigan actual misollar
 * 
 * ⚠️ NOTE: Bu fayllar DOKUMENTATSYON MAQSADIDA. 
 * Haqiqiy code uchun har bir page'dagi example'larni alohida file'da implement qiling.
 * 
 * Example usage:
 * - See category-list-view.tsx for Category integration
 * - See semifinished-list-view.tsx for Semifinished integration
 * - See meals-list-view.tsx for Meals integration
 * - See INTEGRATION_GUIDE.md for complete documentation
 */

/**
 * EXAMPLE 1: CATEGORY PAGE PATTERN
 * ============================================================================
 * 
 * import type { ICategory } from 'src/types/category';
 * import { useGenericViewModal } from 'src/hooks/use-generic-view-modal';
 * import { formatDate, formatStatus } from 'src/components/generic-view-view/modal-formatters';
 * import { GenericViewModal, SpecificationsTable } from 'src/components/generic-view-view';
 * 
 * function CategoryListViewExample() {
 *   const { isOpen, selectedData, openModal, closeModal } = useGenericViewModal<ICategory>();
 * 
 *   function renderCategorySpecifications(category: ICategory) {
 *     const specs = [
 *       { label: 'Nomi', value: category.name || '-' },
 *       { label: 'Status', value: formatStatus(category.status).label || '-' },
 *       { label: 'Yaratilgan', value: formatDate(category.createdAt) },
 *     ];
 *     return <SpecificationsTable rows={specs} />;
 *   }
 * 
 *   return (
 *     <GenericViewModal
 *       isOpen={isOpen}
 *       onClose={closeModal}
 *       title={selectedData?.name}
 *       data={selectedData}
 *       renderContent={renderCategorySpecifications}
 *     />
 *   );
 * }
 */

/**
 * EXAMPLE 2: PRODUCT PAGE PATTERN
 * ============================================================================
 * 
 * import type { IProductItem } from 'src/types/product';
 * import { useGenericViewModal } from 'src/hooks/use-generic-view-modal';
 * import { formatPrice, formatQuantity, formatDate } from '.../modal-formatters';
 * import { GenericViewModal, SpecificationsTable } from '.../generic-view-view';
 * 
 * function ProductListViewExample() {
 *   const { isOpen, selectedData, openModal, closeModal } = useGenericViewModal<IProductItem>();
 * 
 *   function renderProductSpecifications(product: IProductItem) {
 *     const specs = [
 *       { label: 'Nomi', value: product.name },
 *       { label: 'Narxi', value: formatPrice(product.price) },
 *       { label: 'Miqdori', value: formatQuantity(product.available) },
 *     ];
 *     return <SpecificationsTable rows={specs} />;
 *   }
 * 
 *   return (
 *     <GenericViewModal {...props} renderContent={renderProductSpecifications} />
 *   );
 * }
 */

/**
 * EXAMPLE 3: SEMIFINISHED PAGE PATTERN
 * ============================================================================
 * 
 * Exactly same as Product, but with ISemifinishedItem type
 * 
 * See: src/sections/semifinished/semifinished-list-view.tsx
 */

/**
 * EXAMPLE 4: MEALS PAGE PATTERN
 * ============================================================================
 * 
 * Exactly same as Semifinished pattern
 * 
 * See: src/sections/meals/meals-list-view.tsx
 */

/**
 * EXAMPLE 5: CUSTOM RENDER FUNCTION
 * ============================================================================
 * 
 * import { Box, Typography } from '@mui/material';
 * 
 * function renderCustomContent(data: any) {
 *   return (
 *     <Box sx={{ p: 2 }}>
 *       <Typography variant="h6">{data.name}</Typography>
 *       <Typography variant="body2">Status: {data.status}</Typography>
 *     </Box>
 *   );
 * }
 * 
 * <GenericViewModal
 *   renderContent={renderCustomContent}
 *   ...
 * />
 */

/**
 * EXAMPLE 6: RENDER MODES
 * ============================================================================
 * 
 * Mode 1: renderContent (PRIORITY 1)
 * <GenericViewModal renderContent={(data) => <Custom />} />
 * 
 * Mode 2: listItems (PRIORITY 2)
 * <GenericViewModal listItems={[{id: '1', label: 'Item', value: 'Val'}]} />
 * 
 * Mode 3: fields (PRIORITY 3)
 * <GenericViewModal fields={[{key: 'name', label: 'Nomi'}]} />
 */

/**
 * EXAMPLE 7: FORMATTERS USAGE
 * ============================================================================
 * 
 * import {
 *   formatDate,          // Tarikh: "29 dekabr' 2024"
 *   formatDateTime,      // Tarikh + vaqt
 *   formatPrice,         // Narx: "1 234 567 so'm"
 *   formatQuantity,      // Miqdor: "9 999"
 *   formatStatus,        // Status + color
 *   formatPhoneNumber,   // "+998 (90) 123-45-67"
 *   formatEmail,         // Email
 *   formatUnit,          // "kg", "dona", "paket"
 *   formatArray,         // Array -> "item1, item2"
 *   truncateText,        // "Long text..." (chop)
 * } from '.../modal-formatters';
 * 
 * const specs = [
 *   { label: 'Tarikh', value: formatDate(data.createdAt) },
 *   { label: 'Narxi', value: formatPrice(data.price) },
 *   { label: 'Status', value: formatStatus(data.status).label },
 * ];
 */

/**
 * EXAMPLE 8: RESPONSIVE DESIGN
 * ============================================================================
 * 
 * // Desktop: Right side, slide left
 * <GenericViewModal
 *   slideDirection="left"
 *   position="right"
 *   maxWidth="sm"
 * />
 * 
 * // Mobile: Auto fullscreen
 * // (automatically handled by component)
 */

/**
 * EXAMPLE 9: CONDITIONAL FIELDS
 * ============================================================================
 * 
 * function renderWithConditions(product: any) {
 *   const specs = [
 *     { label: 'Nomi', value: product.name },
 *   ];
 * 
 *   if (product.priceSale) {
 *     specs.push({ label: 'Chegirma', value: formatPrice(product.priceSale) });
 *   }
 * 
 *   if (product.description) {
 *     specs.push({ label: 'Tasnifi', value: product.description });
 *   }
 * 
 *   return <SpecificationsTable rows={specs} />;
 * }
 */

/**
 * EXAMPLE 10: ANIMATION OPTIONS
 * ============================================================================
 * 
 * slideDirection: 'left' | 'right' | 'up' | 'down'
 * position: 'center' | 'right'
 * 
 * Desktop right: slideDirection="left", position="right"
 * Desktop center: slideDirection="up", position="center"
 * Mobile: auto fullscreen
 */

/**
 * INTEGRATION CHECKLIST
 * ============================================================================
 * 
 * ☑️ Imports:
 *    - useGenericViewModal hook
 *    - GenericViewModal component
 *    - SpecificationsTable component
 *    - Needed formatters
 * 
 * ☑️ Hook setup:
 *    - const { isOpen, selectedData, openModal, closeModal } = useGenericViewModal<YourType>();
 * 
 * ☑️ Render function:
 *    - Create renderYourItemSpecifications(item) function
 *    - Return <SpecificationsTable rows={specs} />
 * 
 * ☑️ Table action:
 *    - Add onClick={() => openModal(params.row)} to View action
 * 
 * ☑️ Modal JSX:
 *    - Add <GenericViewModal ... /> before closing </> or function
 */

export const INTEGRATION_EXAMPLES = {
    category: 'See: src/sections/category/category-list-view.tsx',
    semifinished: 'See: src/sections/semifinished/semifinished-list-view.tsx',
    meals: 'See: src/sections/meals/meals-list-view.tsx',
    documentation: 'See: INTEGRATION_GUIDE.md',
};
