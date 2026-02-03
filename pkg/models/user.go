package models

import "time"

type User struct {
	ID        string    `json:"id" bson:"id"`
	Email     string    `json:"email" bson:"email"`
	Password  string    `json:"-" bson:"password"` // Salted hash
	Name      string    `json:"name" bson:"name"`
	CreatedAt time.Time `json:"created_at" bson:"created_at"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

type AuthResponse struct {
	User  User   `json:"user"`
	Token string `json:"token"`
}
