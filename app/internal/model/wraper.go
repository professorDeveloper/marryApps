package model






type DownloadSuccessResponse struct {
    SuccessResponses[DownloadResponse]
}

type UserSuccessResponse struct {
    SuccessResponses[UserResponse]
}

type MessageSuccessResponse struct {
    SuccessResponses[string]
}

