package otp

import (
	"bytes"
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"
)

type Message struct {
	SmsID int    `json:"smsid"`
	Phone string `json:"phone"`
	Text  string `json:"text"`
}

type Service struct {
	Service int `json:"service"`
}

type SendOTPPayload struct {
	Username  string `json:"username"`
	SecretKey string `json:"secretkey"`
	Phone     string `json:"phone"`
	Text      string `json:"text"`
	ApiUrl    string
}

type Payload struct {
	Username string  `json:"username"`
	Utime    int64   `json:"utime"`
	Phone    string  `json:"phone"`
	Token    string  `json:"X-Access-Token"`
	Service  Service `json:"service"`
	Message  Message `json:"message"`
}

func generateToken(username, secretKey string) (string, int64) {
	fmt.Println("username", username, secretKey)
	utime := time.Now().Unix()
	fmt.Println("utime", utime)
	hash := md5.Sum([]byte(strings.Join([]string{"TransmitSMS", username, secretKey, strconv.FormatInt(utime, 10)}, " ")))
	token := hex.EncodeToString(hash[:])
	fmt.Println("token", token)
	return token, utime
}

func SendSMS(payload SendOTPPayload) error {
	token, uTime := generateToken(payload.Username, payload.SecretKey)
	p := Payload{
		Utime:    uTime,
		Username: payload.Username,
		Service:  Service{Service: 2},
		Message:  Message{SmsID: 1, Phone: payload.Phone, Text: payload.Text},
	}

	data, err := json.Marshal(p)
	if err != nil {
		return fmt.Errorf("json encoding error: %w", err)
	}

	req, err := http.NewRequest("POST", payload.ApiUrl, bytes.NewBuffer(data))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Access-Token", token)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == 200 || resp.StatusCode == 400 {
		var result map[string]interface{}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return fmt.Errorf("failed to parse response: %w", err)
		}
		fmt.Printf("SMS response: %+v\n", result)
		return nil
	}

	return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
}
