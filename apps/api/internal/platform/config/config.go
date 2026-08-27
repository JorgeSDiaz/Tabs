package config

import (
	"errors"
	"fmt"
	"io/fs"
	"os"
	"strings"
)

type Config struct {
	DatabaseURL string
}

func Load() (Config, error) {
	url := os.Getenv("DATABASE_URL")
	if url == "" {
		var err error
		url, err = fromEnvFile(".env")
		if err != nil {
			return Config{}, err
		}
	}
	if url == "" {
		return Config{}, errors.New("DATABASE_URL is not set (environment or .env)")
	}
	return Config{DatabaseURL: url}, nil
}

func fromEnvFile(path string) (string, error) {
	data, err := os.ReadFile(path)
	if errors.Is(err, fs.ErrNotExist) {
		return "", nil
	}
	if err != nil {
		return "", fmt.Errorf("read %s: %w", path, err)
	}
	for line := range strings.SplitSeq(string(data), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, value, ok := strings.Cut(line, "=")
		if ok && strings.TrimSpace(key) == "DATABASE_URL" {
			return strings.TrimSpace(value), nil
		}
	}
	return "", nil
}
