package storage

import (
	"bytes"
	"io"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
)

type S3ChunkStore struct {
	svc    *s3.S3
	bucket string
}

func NewS3ChunkStore(region, bucket string) (*S3ChunkStore, error) {
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(region),
	})
	if err != nil {
		return nil, err
	}
	return &S3ChunkStore{
		svc:    s3.New(sess),
		bucket: bucket,
	}, nil
}

func (s *S3ChunkStore) HasChunk(hash string) bool {
	key := "chunks/" + hash
	_, err := s.svc.HeadObject(&s3.HeadObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	return err == nil
}

func (s *S3ChunkStore) WriteChunk(hash string, r io.Reader) error {
	// S3 requires a Seekable reader or known length significantly for efficiency, 
	// but we can just read all into buffer if we assume 4MB chunks which is small.
	// For production we might stream, but AWS SDK often wants bytes.
	buf := new(bytes.Buffer)
	_, err := io.Copy(buf, r)
	if err != nil {
		return err
	}

	key := "chunks/" + hash
	_, err = s.svc.PutObject(&s3.PutObjectInput{
		Bucket:        aws.String(s.bucket),
		Key:           aws.String(key),
		Body:          bytes.NewReader(buf.Bytes()),
		ContentLength: aws.Int64(int64(buf.Len())),
		ContentType:   aws.String("application/octet-stream"),
	})
	return err
}

func (s *S3ChunkStore) ReadChunk(hash string) (io.ReadCloser, error) {
	key := "chunks/" + hash
	out, err := s.svc.GetObject(&s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, err
	}
	return out.Body, nil
}
