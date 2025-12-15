package model

const AvatarBucketName = "blitz"
const AvatarFolderName = "avatars"

type DownloadAvatarRequest struct {
	ObjectName string `json:"object_name" example:"avatar.jpg"`
}

type DownloadAvatarResponse struct {
	ObjectName string `json:"object_name" example:"avatar.jpg"`
}
