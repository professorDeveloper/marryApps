package middleware

import (
    // "context"
    "github.com/labstack/echo/v4"
)

// ExpandQuery extracts and validates expand query parameter
type ExpandQuery struct {
    Fields []string
}

// ExpandMiddleware parses expand query param and adds to context
func ExpandMiddleware() echo.MiddlewareFunc {
    return func(next echo.HandlerFunc) echo.HandlerFunc {
        return func(c echo.Context) error {
            expandParam := c.QueryParam("expand")
            
            // Will be used by handlers as c.Get("expand")
            c.Set("expand", expandParam)
            
            return next(c)
        }
    }
}

// GetExpandFields gets expand fields from context
func GetExpandFields(c echo.Context) []string {
    expandParam, ok := c.Get("expand").(string)
    if !ok || expandParam == "" {
        return nil
    }
    
    // This assumes you have pg.ParseExpandFields available
    // import "your-module/internal/repository/pg"
    // return pg.ParseExpandFields(expandParam)
    return parseExpandFields(expandParam)
}

// Local helper
func parseExpandFields(raw string) []string {
    // Same as pg.ParseExpandFields
    // ... implement or import
    return nil
}