package handler

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/service"
)

// SyncPull retrieves changes since last_sync_cursor
// @Summary Sync pull
// @Description Get changes since last_sync_cursor
// @Tags Sync
// @Accept json
// @Produce json
// @Param request body model.SyncPullRequest true "Sync pull request"
// @Success 200 {object} model.SyncPullResponse
// @Router /api/v1/sync/pull [post]
// @Security BearerAuth
func (h *Handler) SyncPull(c echo.Context) error {
	var req model.SyncPullRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request body", err.Error(), http.StatusBadRequest))
	}

	resp, err := h.service.Sync().Pull(c.Request().Context(), req.LastSyncCursor, req.Limit)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to sync", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("sync successful", resp, http.StatusOK))
}

// SyncPush receives changes from offline server
// @Summary Sync push
// @Description Apply changes from offline server
// @Tags Sync
// @Accept json
// @Produce json
// @Param request body model.SyncPushRequest true "Sync push request"
// @Success 200 {object} model.SyncPushResult
// @Router /api/v1/sync/push [post]
// @Security BearerAuth
func (h *Handler) SyncPush(c echo.Context) error {
	var req model.SyncPushRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request body", err.Error(), http.StatusBadRequest))
	}

	resp, err := h.service.Sync().Push(c.Request().Context(), req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to sync push", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("sync push successful", resp, http.StatusOK))
}

// GetChangeLogs returns change_log entries with filters
// @Summary Get change logs
// @Description Get change_log entries with filters
// @Tags Sync
// @Accept json
// @Produce json
// @Param entity query string false "Entity name (table)"
// @Param action query string false "Action (create/update/delete)"
// @Param from_id query int false "Start ID (inclusive)"
// @Param to_id query int false "End ID (inclusive)"
// @Param from_time query string false "Start time (RFC3339)"
// @Param to_time query string false "End time (RFC3339)"
// @Param limit query int false "Limit"
// @Param offset query int false "Offset"
// @Param order query string false "asc or desc"
// @Success 200 {object} model.ChangeLogListResponse
// @Router /api/v1/sync/change-logs [get]
// @Security BearerAuth
func (h *Handler) GetChangeLogs(c echo.Context) error {
	filter, err := parseChangeLogFilter(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid query params", err.Error(), http.StatusBadRequest))
	}

	resp, err := h.service.Sync().ListChangeLogs(c.Request().Context(), filter)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to fetch change logs", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("change logs retrieved successfully", resp, http.StatusOK))
}

func parseChangeLogFilter(c echo.Context) (service.ChangeLogFilter, error) {
	filter := service.ChangeLogFilter{}
	filter.Entity = strings.TrimSpace(c.QueryParam("entity"))
	filter.Action = strings.TrimSpace(c.QueryParam("action"))
	filter.Order = strings.TrimSpace(c.QueryParam("order"))

	if v := strings.TrimSpace(c.QueryParam("from_id")); v != "" {
		i, err := strconv.ParseInt(v, 10, 64)
		if err != nil {
			return filter, err
		}
		filter.FromID = &i
	}
	if v := strings.TrimSpace(c.QueryParam("to_id")); v != "" {
		i, err := strconv.ParseInt(v, 10, 64)
		if err != nil {
			return filter, err
		}
		filter.ToID = &i
	}
	if v := strings.TrimSpace(c.QueryParam("from_time")); v != "" {
		t, err := time.Parse(time.RFC3339, v)
		if err != nil {
			return filter, err
		}
		filter.FromTime = &t
	}
	if v := strings.TrimSpace(c.QueryParam("to_time")); v != "" {
		t, err := time.Parse(time.RFC3339, v)
		if err != nil {
			return filter, err
		}
		filter.ToTime = &t
	}
	if v := strings.TrimSpace(c.QueryParam("limit")); v != "" {
		i, err := strconv.ParseInt(v, 10, 32)
		if err != nil {
			return filter, err
		}
		filter.Limit = int32(i)
	}
	if v := strings.TrimSpace(c.QueryParam("offset")); v != "" {
		i, err := strconv.ParseInt(v, 10, 32)
		if err != nil {
			return filter, err
		}
		filter.Offset = int32(i)
	}

	return filter, nil
}
