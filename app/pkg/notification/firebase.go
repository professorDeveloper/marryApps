package notification

import (
	"context"
	"log"
	"strconv"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/messaging"
	"google.golang.org/api/option"
)

type FCMClient struct {
	Client *messaging.Client
}

func NewFirebaseService(ctx context.Context, rootPath *string) (*firebase.App, error) {
	opts := []option.ClientOption{option.WithCredentialsFile(*rootPath + "mana-notification-service.json")}

	firebaseApp, err := firebase.NewApp(ctx, nil, opts...)
	if err != nil {
		return nil, err
	}

	return firebaseApp, nil
}

func NewFCMClient(ctx context.Context, rootPath *string) (*FCMClient, error) {
	firebaseApp, err := NewFirebaseService(ctx, rootPath)
	if err != nil {
		return nil, err
	}

	client, err := firebaseApp.Messaging(ctx)
	if err != nil {
		return nil, err
	}
	return &FCMClient{
		Client: client,
	}, nil
}

// PushNotification is a generic notification utility method for infrastructure-level push operations
func (c *FCMClient) PushNotification(title, body, firebaseToken string, orderId *int, status *string) (string, error) {
	if c.Client == nil {
		log.Println("Firebase client is not initialized")
		return "", nil
	}

	data := map[string]string{}
	if orderId != nil {
		data["order_id"] = strconv.Itoa(*orderId)
	}
	if status != nil {
		data["order_status"] = *status
	}
	return c.Client.Send(context.Background(), &messaging.Message{
		Notification: &messaging.Notification{
			Title: title,
			Body:  body,
		},
		Data:  data,
		Token: firebaseToken,
	})
}
