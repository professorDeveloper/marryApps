package pg

type IngredientEventType string

const (
	// Invoice
	InvoiceIn               IngredientEventType = "invoice_in"
	InvoiceUpdateIn         IngredientEventType = "invoice_update_in"
	InvoiceUpdateOut        IngredientEventType = "invoice_update_out"
	InvoiceRestoreIn        IngredientEventType = "invoice_restore_in"
	InvoiceStorageMoveIn    IngredientEventType = "invoice_storage_move_in"
	InvoiceStorageMoveOut   IngredientEventType = "invoice_storage_move_out"
	InvoiceDeleteOut        IngredientEventType = "invoice_delete_out"
	InvoiceDeletedOut       IngredientEventType = "invoice_deleted_out"
	InvoiceStatusRevertOut  IngredientEventType = "invoice_status_revert_out"
	InvoiceStatusReceivedIn IngredientEventType = "invoice_status_received_in"
	InvoiceBatchUpdateIn    IngredientEventType = "invoice_batch_update_in"
	InvoiceBatchUpdateOut   IngredientEventType = "invoice_batch_update_out"
	// Order
	OrderOut IngredientEventType = "order_out"
	// Deduction
	DeductionOut           IngredientEventType = "deduction_out"
	DeductionDraftIn       IngredientEventType = "deduction_draft_in"
	DeductionDeletedIn     IngredientEventType = "deduction_deleted_in"
	DeductionUpdatedIn     IngredientEventType = "deduction_updated_in"
	DeductionItemDeletedIn IngredientEventType = "deduction_item_deleted_in"
	// Transfer
	TransferIn  IngredientEventType = "transfer_in"
	TransferOut IngredientEventType = "transfer_out"
	// Outgoing Invoice
	OutgoingInvoiceOut       IngredientEventType = "outgoing_invoice_out"
	OutgoingInvoiceDeletedIn IngredientEventType = "outgoing_invoice_deleted_in"
	// Separation Act
	SeparationActIn          IngredientEventType = "separation_act_in"
	SeparationActOut         IngredientEventType = "separation_act_out"
	SeparationActOutReversed IngredientEventType = "separation_act_out_reversed"
	SeparationActInReversed  IngredientEventType = "separation_act_in_reversed"
	// Shipment
	ShipmentOut              IngredientEventType = "shipment_out"
	ShipmentStorageChangeIn  IngredientEventType = "shipment_storage_change_in"
	ShipmentStorageChangeOut IngredientEventType = "shipment_storage_change_out"
	ShipmentItemDeletedIn    IngredientEventType = "shipment_item_deleted_in"
	ShipmentItemUpdateReverse IngredientEventType = "shipment_item_update_reverse"
	ShipmentDeactivatedIn   IngredientEventType = "shipment_deactivated_in"
	ShipmentDeletedIn       IngredientEventType = "shipment_deleted_in"
	// Inventory / Manual
	InventoryIn          IngredientEventType = "inventory_in"
	InventoryOut         IngredientEventType = "inventory_out"
	InventorySurplusIn   IngredientEventType = "inventory_surplus_in"
	InventoryShortageOut IngredientEventType = "inventory_shortage_out"
	InventoryItemRemoved IngredientEventType = "inventory_item_removed"
	InventoryItemDeleted IngredientEventType = "inventory_item_deleted"
	ManualIn             IngredientEventType = "manual_in"
	ManualOut            IngredientEventType = "manual_out"
	ManualAdjustment     IngredientEventType = "manual_adjustment"
)

func (e IngredientEventType) IsAdded() bool {
	switch e {
	case InvoiceIn, InvoiceUpdateIn, InvoiceRestoreIn, InvoiceStorageMoveIn,
		TransferIn, OutgoingInvoiceDeletedIn, SeparationActIn, SeparationActOutReversed,
		ShipmentItemUpdateReverse, ShipmentItemDeletedIn, ShipmentStorageChangeIn,
		ShipmentDeactivatedIn, ShipmentDeletedIn, ManualIn:
		return true
	case InventoryIn, InventoryItemRemoved, InventoryItemDeleted:
		return true
	default:
		return false
	}
}

func (e IngredientEventType) IsRemoved() bool {
	switch e {
	case InvoiceUpdateOut, InvoiceStorageMoveOut, OrderOut, DeductionOut,
		TransferOut, OutgoingInvoiceOut, SeparationActOut, SeparationActInReversed,
		ShipmentOut, ManualOut:
		return true
	case InventoryOut, InventorySurplusIn, InventoryShortageOut:
		return true
	default:
		return false
	}
}

func (e IngredientEventType) IsDelta() bool {
	switch e {
	case InventoryIn, InventoryOut, InventorySurplusIn, InventoryShortageOut,
		InventoryItemRemoved, InventoryItemDeleted, ManualAdjustment:
		return true
	default:
		return false
	}
}

func (e IngredientEventType) Category() string {
	switch e {
	case InvoiceIn, InvoiceUpdateIn, InvoiceUpdateOut, InvoiceRestoreIn,
		InvoiceStorageMoveIn, InvoiceStorageMoveOut, InvoiceDeleteOut, InvoiceDeletedOut,
		InvoiceStatusRevertOut, InvoiceStatusReceivedIn, InvoiceBatchUpdateIn, InvoiceBatchUpdateOut:
		return "invoice"
	case OrderOut:
		return "order"
	case DeductionOut, DeductionDraftIn, DeductionDeletedIn, DeductionUpdatedIn, DeductionItemDeletedIn:
		return "deduction"
	case TransferIn, TransferOut:
		return "transfer"
	case OutgoingInvoiceOut, OutgoingInvoiceDeletedIn:
		return "outgoing_invoice"
	case SeparationActIn, SeparationActOut, SeparationActOutReversed, SeparationActInReversed:
		return "separation_act"
	case ShipmentOut, ShipmentStorageChangeIn, ShipmentStorageChangeOut, ShipmentItemDeletedIn,
		ShipmentItemUpdateReverse, ShipmentDeactivatedIn, ShipmentDeletedIn:
		return "shipment"
	case ManualIn, ManualOut, ManualAdjustment:
		return "manual"
	case InventoryIn, InventoryOut, InventorySurplusIn, InventoryShortageOut,
		InventoryItemRemoved, InventoryItemDeleted:
		return "inventory"
	default:
		return "unknown"
	}
}
