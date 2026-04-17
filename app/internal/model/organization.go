package model

import "time"

type CreateBranchRequest struct {
	Name     *string `json:"name"`
	NameI18n *string `json:"name_i18n"`
	Address  *string `json:"address"`
	Phone    *string `json:"phone"`
}

type UpdateBranchRequest struct {
	Name     *string `json:"name"`
	NameI18n *string `json:"name_i18n"`
	Address  *string `json:"address"`
	Phone    *string `json:"phone"`
}

type BranchResponse struct {
	ID        string     `json:"id"`
	Name      *string    `json:"name"`
	NameI18n  *string    `json:"name_i18n"`
	Address   *string    `json:"address"`
	Phone     *string    `json:"phone"`
	CreatedAt *time.Time `json:"created_at"`
	UpdatedAt *time.Time `json:"updated_at"`
}

type CreateStorageRequest struct {
	Name       *string `json:"name"`
	NameI18n   *string `json:"name_i18n"`
	PictureUrl *string `json:"picture_url"`
	ColorCode  *string `json:"color_code"`
}

type UpdateStorageRequest struct {
	Name       *string `json:"name"`
	NameI18n   *string `json:"name_i18n"`
	PictureUrl *string `json:"picture_url"`
	ColorCode  *string `json:"color_code"`
	Uz         *string `json:"uz,omitempty"`
	Ru         *string `json:"ru,omitempty"`
	En         *string `json:"en,omitempty"`
}

type StorageResponse struct {
	ID         string     `json:"id"`
	Name       *string    `json:"name"`
	BranchID   string     `json:"branch_id"`
	NameI18n   *string    `json:"name_i18n"`
	PictureUrl *string    `json:"picture_url"`
	ColorCode  *string    `json:"color_code"`
	Uz         *string    `json:"uz,omitempty"`
	Ru         *string    `json:"ru,omitempty"`
	En         *string    `json:"en,omitempty"`
	CreatedAt  *time.Time `json:"created_at"`
	UpdatedAt  *time.Time `json:"updated_at"`
}

type CreateDepartmentRequest struct {
	Name       *string `json:"name"`
	NameI18n   *string `json:"name_i18n"`
	ColorCode  *string `json:"color_code"`
	PictureUrl *string `json:"picture_url"`
	StorageID  string  `json:"storage_id"`
}

type UpdateDepartmentRequest struct {
	Name       *string `json:"name"`
	NameI18n   *string `json:"name_i18n"`
	ColorCode  *string `json:"color_code"`
	PictureUrl *string `json:"picture_url"`
	StorageID  *string `json:"storage_id"`
	Uz         *string `json:"uz,omitempty"`
	Ru         *string `json:"ru,omitempty"`
	En         *string `json:"en,omitempty"`
}

type StorageListFilter struct {
	Search    string
	SortBy    string
	SortOrder string
}

type PaginatedStoragesResponse struct {
	Status     string            `json:"status" example:"success"`
	Message    string            `json:"message" example:"Storages retrieved successfully"`
	Data       []StorageResponse `json:"data"`
	Pagination PaginationMeta    `json:"pagination"`
	Code       int               `json:"code" example:"200"`
}

type DepartmentResponse struct {
	ID         string     `json:"id"`
	Name       *string    `json:"name"`
	NameI18n   *string    `json:"name_i18n"`
	ColorCode  *string    `json:"color_code"`
	PictureUrl *string    `json:"picture_url"`
	StorageID  string     `json:"storage_id"`
	Uz         *string    `json:"uz,omitempty"`
	Ru         *string    `json:"ru,omitempty"`
	En         *string    `json:"en,omitempty"`
	CreatedAt  *time.Time `json:"created_at"`
	UpdatedAt  *time.Time `json:"updated_at"`
}

type DepartmentListFilter struct {
	Search    string `json:"search,omitempty"`
	StorageID string `json:"storage_id,omitempty"`
	SortBy    string `json:"sort_by,omitempty"`
	SortOrder string `json:"sort_order,omitempty"`
}

type PaginatedDepartmentsResponse struct {
	Status     string               `json:"status" example:"success"`
	Message    string               `json:"message" example:"Departments retrieved successfully"`
	Data       []DepartmentResponse `json:"data"`
	Pagination PaginationMeta       `json:"pagination"`
	Code       int                  `json:"code" example:"200"`
}

type CreateHallRequest struct {
	Name     *string `json:"name"`
	BranchID string  `json:"branch_id"`
	NameI18n *string `json:"name_i18n"`
	Width    *int32  `json:"width,omitempty"`
	Height   *int32  `json:"height,omitempty"`
}

type UpdateHallRequest struct {
	Name     *string `json:"name"`
	BranchID *string `json:"branch_id"`
	NameI18n *string `json:"name_i18n"`
	Width    *int32  `json:"width,omitempty"`
	Height   *int32  `json:"height,omitempty"`
}

type HallResponse struct {
	ID        string     `json:"id"`
	BranchID  string     `json:"branch_id"`
	Name      *string    `json:"name"`
	NameI18n  *string    `json:"name_i18n"`
	Width     int32      `json:"width"`
	Height    int32      `json:"height"`
	CreatedAt *time.Time `json:"created_at"`
	UpdatedAt *time.Time `json:"updated_at"`
}

type HallListFilter struct {
	Search    string `json:"search,omitempty"`
	SortBy    string `json:"sort_by,omitempty"`
	SortOrder string `json:"sort_order,omitempty"`
}

type PaginatedHallsResponse struct {
	Status     string         `json:"status" example:"success"`
	Message    string         `json:"message" example:"Halls retrieved successfully"`
	Data       []HallResponse `json:"data"`
	Pagination PaginationMeta `json:"pagination"`
	Code       int            `json:"code" example:"200"`
}

type CreateTranslationRequest struct {
	Uz *string `json:"uz" example:"Salom"`
	Ru *string `json:"ru" example:"Привет"`
	En *string `json:"en" example:"Hello"`
}

type UpdateTranslationRequest struct {
	Uz *string `json:"uz,omitempty" example:"Salom"`
	Ru *string `json:"ru,omitempty" example:"Привет"`
	En *string `json:"en,omitempty" example:"Hello"`
}

type TranslationResponse struct {
	ID        string     `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	Uz        *string    `json:"uz,omitempty" example:"Salom"`
	Ru        *string    `json:"ru,omitempty" example:"Привет"`
	En        *string    `json:"en,omitempty" example:"Hello"`
	CreatedAt *time.Time `json:"created_at,omitempty" example:"2022-01-01T00:00:00Z"`
	UpdatedAt *time.Time `json:"updated_at,omitempty" example:"2022-01-01T00:00:00Z"`
}

type CreateIngredientGroupRequest struct {
	Name       *string `json:"name" example:"Vegetables"`
	NameI18n   *string `json:"name_i18n,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	PictureUrl *string `json:"picture_url,omitempty" example:"https://example.com/vegetables.jpg"`
	ColorCode  *string `json:"color_code,omitempty" example:"#FF5733"`
}

type UpdateIngredientGroupRequest struct {
	Name       *string `json:"name,omitempty" example:"Vegetables"`
	NameI18n   *string `json:"name_i18n,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	PictureUrl *string `json:"picture_url,omitempty" example:"https://example.com/vegetables.jpg"`
	ColorCode  *string `json:"color_code,omitempty" example:"#FF5733"`
}

type IngredientGroupResponse struct {
	ID         string     `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	Name       *string    `json:"name,omitempty" example:"Vegetables"`
	NameI18n   *string    `json:"name_i18n,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	PictureUrl *string    `json:"picture_url,omitempty" example:"https://example.com/vegetables.jpg"`
	ColorCode  *string    `json:"color_code,omitempty" example:"#FF5733"`
	BranchID   *string    `json:"branch_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	CreatedAt  *time.Time `json:"created_at,omitempty" example:"2022-01-01T00:00:00Z"`
	UpdatedAt  *time.Time `json:"updated_at,omitempty" example:"2022-01-01T00:00:00Z"`
}

type CreateIngredientRequest struct {
	Name        *string `json:"name" example:"Tomato"`
	NameI18n    *string `json:"name_i18n,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	GroupID     *string `json:"group_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Measurement *string `json:"measurement,omitempty" example:"kg"`
	PictureUrl  *string `json:"picture_url,omitempty" example:"https://example.com/tomato.jpg"`
	ColorCode   *string `json:"color_code,omitempty" example:"#FF5733"`
}

type UpdateIngredientRequest struct {
	Name         *string `json:"name,omitempty" example:"Tomato"`
	NameI18n     *string `json:"name_i18n,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	GroupID      *string `json:"group_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Measurement  *string `json:"measurement,omitempty" example:"kg"`
	PictureUrl   *string `json:"picture_url,omitempty" example:"https://example.com/tomato.jpg"`
	ColorCode    *string `json:"color_code,omitempty" example:"#FF5733"`
	BrandID      *string `json:"brand_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	PricePerUnit *string `json:"price_per_unit,omitempty" example:"100.00"`
}

type IngredientResponse struct {
	ID           string     `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	Name         *string    `json:"name,omitempty" example:"Tomato"`
	NameI18n     *string    `json:"name_i18n,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	GroupID      *string    `json:"group_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Measurement  *string    `json:"measurement,omitempty" example:"kg"`
	PictureUrl   *string    `json:"picture_url,omitempty" example:"https://example.com/tomato.jpg"`
	ColorCode    *string    `json:"color_code,omitempty" example:"#FF5733"`
	BrandID      *string    `json:"brand_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	PricePerUnit *string    `json:"price_per_unit,omitempty" example:"100.00"`
	CreatedAt    *time.Time `json:"created_at,omitempty" example:"2022-01-01T00:00:00Z"`
	UpdatedAt    *time.Time `json:"updated_at,omitempty" example:"2022-01-01T00:00:00Z"`
}

type CreateIngredientStockRequest struct {
	IngredientID *string `json:"ingredient_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	Quantity     *string `json:"quantity" example:"100"`
	BranchID     *string `json:"branch_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	StorageID    *string `json:"storage_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
}

type UpdateIngredientStockRequest struct {
	Quantity *string `json:"quantity,omitempty" example:"100"`
}

type IngredientStockFilter struct {
	IngredientID   *string `json:"ingredient_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	IngredientName *string `json:"ingredient_name,omitempty" example:"Tomato"`
	Search         *string `json:"search,omitempty" example:"tomato"`
	StorageID      *string `json:"storage_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	Measurement    *string `json:"measurement,omitempty" example:"kg"`
	SortBy         *string `json:"sort_by,omitempty" example:"created_at"`
	SortOrder      *string `json:"sort_order,omitempty" example:"desc"`
}

type IngredientStockResponse struct {
	ID           string     `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	IngredientID string     `json:"ingredient_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	Quantity     string     `json:"quantity" example:"100"`
	BranchID     *string    `json:"branch_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	StorageID    *string    `json:"storage_id,omitempty" example:"123e4567-e89b-12d3-a456-426614174000"`
	CreatedAt    *time.Time `json:"created_at,omitempty" example:"2022-01-01T00:00:00Z"`
	UpdatedAt    *time.Time `json:"updated_at,omitempty" example:"2022-01-01T00:00:00Z"`
}

type GetIngredientReportRequest struct {
	StorageID    string     `json:"storage_id"`
	Start        *time.Time `json:"start,omitempty"`
	End          *time.Time `json:"end,omitempty"`
	IngredientID *string    `json:"ingredient_id,omitempty"`
	Limit        int32      `json:"limit"`
	Offset       int32      `json:"offset"`
}

type IngredientReportTotals struct {
	TotalCount       int64  `json:"total_count"`
	TotalAddedAmount string `json:"total_added_amount"`
	TotalRemovedAmount string `json:"total_removed_amount"`
}

type IngredientReportResponse struct {
	Items  []IngredientReportItem `json:"items"`
	Totals IngredientReportTotals `json:"totals"`
}

type IngredientReportItem struct {
	IngredientID   string  `json:"ingredient_id"`
	IngredientName string  `json:"ingredient_name"`
	Measurement    *string `json:"measurement,omitempty"`
	PictureUrl     *string `json:"picture_url,omitempty"`
	ColorCode      *string `json:"color_code,omitempty"`

	BeginQty string `json:"begin_qty"`
	EndQty   string `json:"end_qty"`

	CostStart string `json:"cost_start"`
	CostEnd   string `json:"cost_end"`

	BeginAmount string `json:"begin_amount"`
	EndAmount   string `json:"end_amount"`

	AddedQty       string `json:"added_qty"`
	RemovedQty     string `json:"removed_qty"`
	AddedAmount    string `json:"added_amount"`
	RemovedAmount  string `json:"removed_amount"`

	InvoiceInQty     string `json:"invoice_in_qty"`
	InvoiceInAmount  string `json:"invoice_in_amount"`
	InvoiceOutQty    string `json:"invoice_out_qty"`
	InvoiceOutAmount string `json:"invoice_out_amount"`

	OrderOutQty    string `json:"order_out_qty"`
	OrderOutAmount string `json:"order_out_amount"`

	DeductionOutQty    string `json:"deduction_out_qty"`
	DeductionOutAmount string `json:"deduction_out_amount"`

	TransferInQty     string `json:"transfer_in_qty"`
	TransferInAmount  string `json:"transfer_in_amount"`
	TransferOutQty    string `json:"transfer_out_qty"`
	TransferOutAmount string `json:"transfer_out_amount"`

	OutgoingInvoiceInQty     string `json:"outgoing_invoice_in_qty"`
	OutgoingInvoiceInAmount  string `json:"outgoing_invoice_in_amount"`
	OutgoingInvoiceOutQty    string `json:"outgoing_invoice_out_qty"`
	OutgoingInvoiceOutAmount string `json:"outgoing_invoice_out_amount"`

	SeparationActInQty     string `json:"separation_act_in_qty"`
	SeparationActInAmount  string `json:"separation_act_in_amount"`
	SeparationActOutQty    string `json:"separation_act_out_qty"`
	SeparationActOutAmount string `json:"separation_act_out_amount"`

	ShipmentInQty     string `json:"shipment_in_qty"`
	ShipmentInAmount  string `json:"shipment_in_amount"`
	ShipmentOutQty    string `json:"shipment_out_qty"`
	ShipmentOutAmount string `json:"shipment_out_amount"`

	ManualInQty     string `json:"manual_in_qty"`
	ManualInAmount  string `json:"manual_in_amount"`
	ManualOutQty    string `json:"manual_out_qty"`
	ManualOutAmount string `json:"manual_out_amount"`

	InventoryInQty     string `json:"inventory_in_qty"`
	InventoryInAmount  string `json:"inventory_in_amount"`
	InventoryOutQty    string `json:"inventory_out_qty"`
	InventoryOutAmount string `json:"inventory_out_amount"`
}

type GetIngredientReportMovementsRequest struct {
	StorageID    string     `json:"storage_id"`
	IngredientID string     `json:"ingredient_id"`
	Start        *time.Time `json:"start,omitempty"`
	End          *time.Time `json:"end,omitempty"`
	Limit        int32      `json:"limit"`
	Offset       int32      `json:"offset"`
}

type IngredientStockMovementResponse struct {
	ID           string     `json:"id"`
	EventType    string     `json:"event_type"`
	QtyIn        string     `json:"qty_in"`
	QtyOut       string     `json:"qty_out"`
	StockBefore  string     `json:"stock_before"`
	StockAfter   string     `json:"stock_after"`
	PricePerUnit string     `json:"price_per_unit"`
	SourceType   *string    `json:"source_type,omitempty"`
	SourceID     *string    `json:"source_id,omitempty"`
	CreatedAt    *time.Time `json:"created_at,omitempty"`
}
