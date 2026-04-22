package middleware

import (
	"bytes"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

type localizedResponseWriter struct {
	orig       http.ResponseWriter
	header     http.Header
	body       bytes.Buffer
	statusCode int
	buffered   bool
	wroteHdr   bool
}

func newLocalizedResponseWriter(orig http.ResponseWriter) *localizedResponseWriter {
	return &localizedResponseWriter{
		orig:   orig,
		header: make(http.Header),
	}
}

func (w *localizedResponseWriter) Header() http.Header {
	return w.header
}

func (w *localizedResponseWriter) WriteHeader(statusCode int) {
	if w.wroteHdr {
		return
	}

	w.wroteHdr = true
	w.statusCode = statusCode
	if statusCode >= http.StatusBadRequest {
		w.buffered = true
		return
	}

	copyHeader(w.orig.Header(), w.header)
	w.orig.WriteHeader(statusCode)
}

func (w *localizedResponseWriter) Write(p []byte) (int, error) {
	if !w.wroteHdr {
		w.WriteHeader(http.StatusOK)
	}

	if w.buffered {
		return w.body.Write(p)
	}
	return w.orig.Write(p)
}

func LocalizeErrorResponse() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			origWriter := c.Response().Writer
			writer := newLocalizedResponseWriter(origWriter)
			c.Response().Writer = writer

			err := next(c)

			c.Response().Writer = origWriter
			if err != nil {
				return err
			}

			if !writer.wroteHdr {
				return nil
			}

			if !writer.buffered {
				return nil
			}

			body := writer.body.Bytes()
			if shouldLocalizeJSON(writer.header) {
				if localized, ok := localizeJSONBody(getLanguage(c), body); ok {
					body = localized
				}
			}

			copyHeader(origWriter.Header(), writer.header)
			origWriter.Header().Del(echo.HeaderContentLength)
			origWriter.WriteHeader(writer.statusCode)
			_, writeErr := origWriter.Write(body)
			return writeErr
		}
	}
}

func shouldLocalizeJSON(header http.Header) bool {
	contentType := strings.ToLower(header.Get(echo.HeaderContentType))
	return strings.Contains(contentType, echo.MIMEApplicationJSON)
}

func localizeJSONBody(lang string, body []byte) ([]byte, bool) {
	var payload any
	if err := json.Unmarshal(body, &payload); err != nil {
		return nil, false
	}

	payload = localizeValue(lang, "", payload)
	encoded, err := json.Marshal(payload)
	if err != nil {
		return nil, false
	}
	return encoded, true
}

func localizeValue(lang, key string, value any) any {
	switch v := value.(type) {
	case string:
		if key == "status" {
			return v
		}
		return model.LocalizeErrorText(lang, v)
	case map[string]any:
		for childKey, childValue := range v {
			v[childKey] = localizeValue(lang, childKey, childValue)
		}
		return v
	case []any:
		for i, item := range v {
			v[i] = localizeValue(lang, key, item)
		}
		return v
	default:
		return value
	}
}

func copyHeader(dst, src http.Header) {
	for key := range dst {
		dst.Del(key)
	}
	for key, values := range src {
		for _, value := range values {
			dst.Add(key, value)
		}
	}
}
