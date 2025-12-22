package model

const BucketName = "MaryAI"
const ImageFolderName = "images"
const VideoFolderName = "videos"


type DownloadRequest struct {
	ObjectName string `json:"object_name" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9/{extension}"`
}

type DownloadResponse struct {
	ObjectName string `json:"object_name" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9/{extension}"`
}
