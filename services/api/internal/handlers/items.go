package handlers

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"

	"pulseboard-api/internal/models"
)

var tracer = otel.Tracer("pulseboard-api/handlers")

type ItemHandler struct {
	db *pgxpool.Pool
}

func NewItemHandler(db *pgxpool.Pool) *ItemHandler {
	return &ItemHandler{db: db}
}

func (h *ItemHandler) List(w http.ResponseWriter, r *http.Request) {
	ctx, span := tracer.Start(r.Context(), "items.list")
	defer span.End()

	items, err := h.listItems(ctx)
	if err != nil {
		slog.ErrorContext(ctx, "list items", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to fetch items")
		return
	}

	writeJSON(w, http.StatusOK, items)
}

func (h *ItemHandler) Create(w http.ResponseWriter, r *http.Request) {
	ctx, span := tracer.Start(r.Context(), "items.create")
	defer span.End()

	var req models.CreateItemRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if msg := req.Validate(); msg != "" {
		writeError(w, http.StatusUnprocessableEntity, msg)
		return
	}

	span.SetAttributes(attribute.String("item.status", string(req.Status)))

	item, err := h.createItem(ctx, req)
	if err != nil {
		slog.ErrorContext(ctx, "create item", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to create item")
		return
	}

	writeJSON(w, http.StatusCreated, item)
}

func (h *ItemHandler) Get(w http.ResponseWriter, r *http.Request) {
	ctx, span := tracer.Start(r.Context(), "items.get")
	defer span.End()

	id := chi.URLParam(r, "id")
	span.SetAttributes(attribute.String("item.id", id))

	item, err := h.getItem(ctx, id)
	if err == pgx.ErrNoRows {
		writeError(w, http.StatusNotFound, "item not found")
		return
	}
	if err != nil {
		slog.ErrorContext(ctx, "get item", "id", id, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to fetch item")
		return
	}

	writeJSON(w, http.StatusOK, item)
}

func (h *ItemHandler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx, span := tracer.Start(r.Context(), "items.delete")
	defer span.End()

	id := chi.URLParam(r, "id")
	span.SetAttributes(attribute.String("item.id", id))

	n, err := h.deleteItem(ctx, id)
	if err != nil {
		slog.ErrorContext(ctx, "delete item", "id", id, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to delete item")
		return
	}
	if n == 0 {
		writeError(w, http.StatusNotFound, "item not found")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *ItemHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	ctx, span := tracer.Start(r.Context(), "items.updateStatus")
	defer span.End()

	id := chi.URLParam(r, "id")

	var body struct {
		Status models.Status `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	switch body.Status {
	case models.StatusPending, models.StatusInProgress, models.StatusDone:
	default:
		writeError(w, http.StatusUnprocessableEntity, "status must be pending, in_progress, or done")
		return
	}

	span.SetAttributes(
		attribute.String("item.id", id),
		attribute.String("item.status", string(body.Status)),
	)

	item, err := h.updateItemStatus(ctx, id, body.Status)
	if err == pgx.ErrNoRows {
		writeError(w, http.StatusNotFound, "item not found")
		return
	}
	if err != nil {
		slog.ErrorContext(ctx, "update item status", "id", id, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to update item")
		return
	}

	writeJSON(w, http.StatusOK, item)
}

// DB helpers

func (h *ItemHandler) listItems(ctx context.Context) ([]models.Item, error) {
	rows, err := h.db.Query(ctx,
		`SELECT id, title, status, created_at, updated_at FROM items ORDER BY created_at DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.Item
	for rows.Next() {
		var item models.Item
		if err := rows.Scan(&item.ID, &item.Title, &item.Status, &item.CreatedAt, &item.UpdatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if items == nil {
		items = []models.Item{}
	}
	return items, rows.Err()
}

func (h *ItemHandler) createItem(ctx context.Context, req models.CreateItemRequest) (models.Item, error) {
	var item models.Item
	err := h.db.QueryRow(ctx,
		`INSERT INTO items (title, status) VALUES ($1, $2)
		 RETURNING id, title, status, created_at, updated_at`,
		req.Title, req.Status,
	).Scan(&item.ID, &item.Title, &item.Status, &item.CreatedAt, &item.UpdatedAt)
	return item, err
}

func (h *ItemHandler) getItem(ctx context.Context, id string) (models.Item, error) {
	var item models.Item
	err := h.db.QueryRow(ctx,
		`SELECT id, title, status, created_at, updated_at FROM items WHERE id = $1`, id,
	).Scan(&item.ID, &item.Title, &item.Status, &item.CreatedAt, &item.UpdatedAt)
	return item, err
}

func (h *ItemHandler) deleteItem(ctx context.Context, id string) (int64, error) {
	result, err := h.db.Exec(ctx, `DELETE FROM items WHERE id = $1`, id)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected(), nil
}

func (h *ItemHandler) updateItemStatus(ctx context.Context, id string, status models.Status) (models.Item, error) {
	var item models.Item
	err := h.db.QueryRow(ctx,
		`UPDATE items SET status = $1 WHERE id = $2
		 RETURNING id, title, status, created_at, updated_at`,
		status, id,
	).Scan(&item.ID, &item.Title, &item.Status, &item.CreatedAt, &item.UpdatedAt)
	return item, err
}

// Response helpers

type errorResponse struct {
	Error string `json:"error"`
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		slog.Error("encode response", "error", err)
	}
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, errorResponse{Error: msg})
}

