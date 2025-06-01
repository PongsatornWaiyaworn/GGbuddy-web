package utils

import (
	"net/smtp"
)

func SendEmail(to string, otp string) error {
	from := "pongsatorn291047@gmail.com"
	password := "ojwhicmgzfvrcgfg" // App Password

	smtpHost := "smtp.gmail.com"
	smtpPort := "587"

	subject := "Your OTP Code"
	body := "Your OTP is: " + otp

	message := []byte("Subject: " + subject + "\r\n\r\n" + body)
	auth := smtp.PlainAuth("", from, password, smtpHost)
	err := smtp.SendMail(smtpHost+":"+smtpPort, auth, from, []string{to}, message)
	return err
}
