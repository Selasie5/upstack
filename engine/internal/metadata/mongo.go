package metadata

import (
	"context"
	"time"

	"github.com/Selasie5/upstack/pkg/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoStore struct {
	client    *mongo.Client
	filesColl *mongo.Collection
	usersColl *mongo.Collection
}

func NewMongoStore(uri string, dbName string) (*MongoStore, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return nil, err
	}
	db := client.Database(dbName)
	filesColl := db.Collection("files")
	usersColl := db.Collection("users")

	// Index on ID and Path for files
	_, _ = filesColl.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "id", Value: 1}},
		Options: options.Index().SetUnique(true),
	})

	// Index on ID and Email for users
	_, _ = usersColl.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "id", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	_, _ = usersColl.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "email", Value: 1}},
		Options: options.Index().SetUnique(true),
	})

	return &MongoStore{client: client, filesColl: filesColl, usersColl: usersColl}, nil
}

func (m *MongoStore) GetFileByID(id string) (models.FileMetadata, bool) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var meta models.FileMetadata
	err := m.filesColl.FindOne(ctx, bson.M{"id": id}).Decode(&meta)
	if err != nil {
		return models.FileMetadata{}, false
	}
	return meta, true
}

func (m *MongoStore) GetFileByPath(path string) (models.FileMetadata, bool) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var meta models.FileMetadata
	err := m.filesColl.FindOne(ctx, bson.M{"path": path}).Decode(&meta)
	if err != nil {
		return models.FileMetadata{}, false
	}
	return meta, true
}

func (m *MongoStore) Upsert(meta models.FileMetadata) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"id": meta.ID}
	update := bson.M{"$set": meta}
	opts := options.Update().SetUpsert(true)

	_, err := m.filesColl.UpdateOne(ctx, filter, update, opts)
	return err
}

func (m *MongoStore) ListFiles() ([]models.FileMetadata, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := m.filesColl.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var files []models.FileMetadata
	if err = cursor.All(ctx, &files); err != nil {
		return nil, err
	}
	return files, nil
}

func (m *MongoStore) GetUserByEmail(email string) (models.User, bool) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var u models.User
	err := m.usersColl.FindOne(ctx, bson.M{"email": email}).Decode(&u)
	if err != nil {
		return models.User{}, false
	}
	return u, true
}

func (m *MongoStore) GetUserByID(id string) (models.User, bool) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var u models.User
	err := m.usersColl.FindOne(ctx, bson.M{"id": id}).Decode(&u)
	if err != nil {
		return models.User{}, false
	}
	return u, true
}

func (m *MongoStore) UpsertUser(user models.User) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"id": user.ID}
	update := bson.M{"$set": user}
	opts := options.Update().SetUpsert(true)

	_, err := m.usersColl.UpdateOne(ctx, filter, update, opts)
	return err
}

func (m *MongoStore) Close() {
	_ = m.client.Disconnect(context.Background())
}
