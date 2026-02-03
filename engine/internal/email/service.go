package email

import (
	"fmt"
	"net/smtp"
	"os"
)

type Service struct {
	host     string
	port     string
	username string
	password string
}

func NewService() *Service {
	return &Service{
		host:     "smtp.gmail.com",
		port:     "587",
		username: os.Getenv("SMTP_EMAIL"),
		password: os.Getenv("SMTP_PASSWORD"), // App Password
	}
}

func (s *Service) SendShareNotification(toEmail, fileName, ownerName string) error {
	if s.username == "" || s.password == "" {
		fmt.Printf("Email configurations not found. Skipping email to %s\n", toEmail)
		return nil
	}

	subject := fmt.Sprintf("Subject: %s shared a file with you on UpStack\n", ownerName)
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"
	body := fmt.Sprintf(`
		<html>
		<body style="font-family: Arial, sans-serif; color: #333;">
			<h2 style="color: #2563eb;">Hello!</h2>
			<p><strong>%s</strong> has shared a file with you on UpStack.</p>
			<p>File name: <strong>%s</strong></p>
			<p>You can access it now in your "Shared with me" section.</p>
			<br/>
			<p>Happy Syncing,<br/>The UpStack Team</p>
		</body>
		</html>
	`, ownerName, fileName)

	msg := []byte(subject + mime + body)
	auth := smtp.PlainAuth("", s.username, s.password, s.host)

	addr := fmt.Sprintf("%s:%s", s.host, s.port)
	if err := smtp.SendMail(addr, auth, s.username, []string{toEmail}, msg); err != nil {
		return fmt.Errorf("failed to send email: %v", err)
	}

	return nil
}
