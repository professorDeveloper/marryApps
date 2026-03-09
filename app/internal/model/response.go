package model

type StandardResponse[T any] struct {
	Status  string `json:"status" example:"success" description:"Response status: success or error"`
	Message string `json:"message" example:"Operation completed successfully" description:"Descriptive message about the operation"`
	Data    T      `json:"data" description:"Response data"`
	Code    int    `json:"code" example:"200" description:"HTTP status code"`
}

type SuccessData[T any] struct {
	Status  string `json:"status" example:"success"`
	Message string `json:"message" example:"Operation completed successfully"`
	Data    T      `json:"data"`
	Code    int    `json:"code" example:"200"`
}

type ErrorData struct {
	Status  string `json:"status" example:"error"`
	Message string `json:"message" example:"An error occurred"`
	Error   string `json:"error" example:"detailed error message"`
	Code    int    `json:"code" example:"400"`
}

type PaginatedResponse[T any] struct {
	Status     string `json:"status" example:"success"`
	Message    string `json:"message" example:"Data retrieved successfully"`
	Data       T      `json:"data"`
	Pagination struct {
		Total      int32 `json:"total" example:"100"`
		Limit      int32 `json:"limit" example:"20"`
		Offset     int32 `json:"offset" example:"0"`
		TotalPages int32 `json:"total_pages" example:"5"`
	} `json:"pagination"`
	Code int `json:"code" example:"200"`
}


func NewSuccessResponse[T any](message string, data T, code int) StandardResponse[T] {
	return StandardResponse[T]{
		Status:  "success",
		Message: message,
		Data:    data,
		Code:    code,
	}
}

func NewErrorResponse(message string, errorDetails string, code int) ErrorData {
	return ErrorData{
		Status:  "error",
		Message: message,
		Error:   errorDetails,
		Code:    code,
	}
}

func NewPaginatedResponse[T any](message string, data T, total, limit, offset int32, code int) PaginatedResponse[T] {
	resp := PaginatedResponse[T]{
		Status:  "success",
		Message: message,
		Data:    data,
		Code:    code,
	}
	resp.Pagination.Total = total
	resp.Pagination.Limit = limit
	resp.Pagination.Offset = offset
	if limit > 0 {
		resp.Pagination.TotalPages = (total + limit - 1) / limit
	}
	return resp
}
