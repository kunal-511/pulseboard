package models

import "time"

type Status string

const (
	StatusPending    Status = "pending"
	StatusInProgress Status = "in_progress"
	StatusDone       Status = "done"
)

type Item struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Status    Status    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CreateItemRequest struct {
	Title  string `json:"title"`
	Status Status `json:"status"`
}

func (r *CreateItemRequest) Validate() string {
	if r.Title == "" {
		return "title is required"
	}
	if len(r.Title) > 200 {
		return "title must be 200 characters or fewer"
	}
	switch r.Status {
	case StatusPending, StatusInProgress, StatusDone:
	case "":
		r.Status = StatusPending
	default:
		return "status must be pending, in_progress, or done"
	}
	return ""
}
