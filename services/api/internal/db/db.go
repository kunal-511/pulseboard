package db

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func Connect(databaseURL string) (*pgxpool.Pool, error) {
	cfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("parse config: %w", err)
	}

	cfg.MaxConns = 20
	cfg.MinConns = 2
	cfg.MaxConnLifetime = time.Hour
	cfg.MaxConnIdleTime = 30 * time.Minute

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("create pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("ping database: %w", err)
	}

	return pool, nil
}

func Migrate(pool *pgxpool.Pool) error {
	ctx := context.Background()

	_, err := pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS items (
			id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			title      TEXT        NOT NULL CHECK (length(title) > 0 AND length(title) <= 200),
			status     TEXT        NOT NULL DEFAULT 'pending'
			                       CHECK (status IN ('pending', 'in_progress', 'done')),
			created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
		);

		CREATE OR REPLACE FUNCTION update_updated_at()
		RETURNS TRIGGER AS $$
		BEGIN
			NEW.updated_at = now();
			RETURN NEW;
		END;
		$$ LANGUAGE plpgsql;

		DROP TRIGGER IF EXISTS set_updated_at ON items;
		CREATE TRIGGER set_updated_at
			BEFORE UPDATE ON items
			FOR EACH ROW EXECUTE FUNCTION update_updated_at();
	`)
	if err != nil {
		return fmt.Errorf("migrate: %w", err)
	}

	return nil
}
