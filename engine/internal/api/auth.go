package api

import (
	"errors"
	"os"
	"time"

	"github.com/Selasie5/upstack/engine/internal/metadata"
	"github.com/Selasie5/upstack/pkg/models"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	store metadata.Store
}

func NewAuthService(store metadata.Store) *AuthService {
	return &AuthService{store: store}
}

func (s *AuthService) Register(req models.RegisterRequest) (models.User, string, error) {
	if _, exists := s.store.GetUserByEmail(req.Email); exists {
		return models.User{}, "", errors.New("user already exists")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return models.User{}, "", err
	}

	user := models.User{
		ID:        req.Email, // Simplify ID as email for MVP or use UUID
		Email:     req.Email,
		Password:  string(hashedPassword),
		Name:      req.Name,
		CreatedAt: time.Now(),
	}

	if err := s.store.UpsertUser(user); err != nil {
		return models.User{}, "", err
	}

	token, err := s.generateToken(user)
	return user, token, err
}

func (s *AuthService) Login(req models.LoginRequest) (models.User, string, error) {
	user, exists := s.store.GetUserByEmail(req.Email)
	if !exists {
		return models.User{}, "", errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return models.User{}, "", errors.New("invalid credentials")
	}

	token, err := s.generateToken(user)
	return user, token, err
}

func (s *AuthService) generateToken(user models.User) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "upstack-secret-key-12345"
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":   user.ID,
		"email": user.Email,
		"exp":   time.Now().Add(time.Hour * 72).Unix(),
	})

	return token.SignedString([]byte(secret))
}

func (s *AuthService) VerifyToken(tokenString string) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "upstack-secret-key-12345"
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})

	if err != nil || !token.Valid {
		return "", errors.New("invalid token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", errors.New("invalid claims")
	}

	return claims["sub"].(string), nil
}
