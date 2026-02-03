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
	client *mongo.Client
	coll   *mongo.Collection
}

func NewMongoStore(uri string, dbName string) (*MongoStore, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return nil, err
	}
	coll := client.Database(dbName).Collection("files")
	
	// Index on ID and Path
	_, _ = coll.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "id", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	
	return &MongoStore{client: client, coll: coll}, nil
}

func (m *MongoStore) GetFileByID(id string) (models.FileMetadata, bool) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	var meta models.FileMetadata
	err := m.coll.FindOne(ctx, bson.M{"id": id}).Decode(&meta)
	if err != nil {
		return models.FileMetadata{}, false
	}
	return meta, true
}

func (m *MongoStore) GetFileByPath(path string) (models.FileMetadata, bool) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var meta models.FileMetadata
	err := m.coll.FindOne(ctx, bson.M{"path": path}).Decode(&meta)
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
	
	_, err := m.coll.UpdateOne(ctx, filter, update, opts)
	return err
}

func (m *MongoStore) ListFiles() ([]models.FileMetadata, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := m.coll.Find(ctx, bson.M{})
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

func (m *MongoStore) Close() {
	_ = m.client.Disconnect(context.Background())
}
