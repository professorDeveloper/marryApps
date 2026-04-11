package model

type PrinterSettingType string

const (
	PrinterSettingTypeCategory   PrinterSettingType = "category"
	PrinterSettingTypeCloseCheck PrinterSettingType = "close_check"
)

type PrinterConnectionType string

const (
	PrinterConnectionTypeCable PrinterConnectionType = "cable"
	PrinterConnectionTypeWLAN  PrinterConnectionType = "wlan"
)

type CreatePrinterSettingRequest struct {
	IP                 string   `json:"ip" example:"192.168.1.100"`
	Port               int32    `json:"port" example:"9100"`
	Type               string   `json:"type" example:"category"`
	ConnectionType     string   `json:"connection_type" example:"cable"`
	ConnectedEntityIDs []string `json:"connected_entity_ids,omitempty"`
}

type UpdatePrinterSettingRequest struct {
	IP                 string   `json:"ip" example:"192.168.1.100"`
	Port               int32    `json:"port" example:"9100"`
	Type               string   `json:"type" example:"category"`
	ConnectionType     string   `json:"connection_type" example:"cable"`
	ConnectedEntityIDs []string `json:"connected_entity_ids,omitempty"`
}

type PrinterSettingResponse struct {
	ID                 string   `json:"id"`
	IP                 string   `json:"ip"`
	Port               int32    `json:"port"`
	Type               string   `json:"type"`
	ConnectionType     string   `json:"connection_type"`
	ConnectedEntityIDs []string `json:"connected_entity_ids"`
	CreatedAt          string   `json:"created_at"`
	UpdatedAt          string   `json:"updated_at"`
}
type PrinterSettingCreateSuccessResponse struct {
	Status  string                 `json:"status" example:"success"`
	Message string                 `json:"message" example:"Printer setting created successfully"`
	Data    PrinterSettingResponse `json:"data"`
	Code    int                    `json:"code" example:"201"`
}
