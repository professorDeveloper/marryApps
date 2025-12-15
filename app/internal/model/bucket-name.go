package model

const AvatarBucketName = "blitz"
const AvatarFolderName = "avatars"

type DownloadAvatarRequest struct {
	ObjectName string `json:"object_name" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9/avatar.png"`
}

type DownloadAvatarResponse struct {
	ObjectName string `json:"object_name" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9/avatar.png"`
}
