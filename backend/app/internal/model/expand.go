package model

import "encoding/json"

// ExpandableResponse wraps any response with expand data
type ExpandableResponse struct {
    Data   any                `json:"data"`
    Expand map[string]any `json:"_expand,omitempty"`
}

// StructToMap converts a struct to map[string]any
func StructToMap(s any) (map[string]any, error) {
    data, err := json.Marshal(s)
    if err != nil {
        return nil, err
    }

    var m map[string]any
    if err := json.Unmarshal(data, &m); err != nil {
        return nil, err
    }

    return m, nil
}

// StructToMapSlice converts slice of structs to slice of maps
func StructToMapSlice(s any) ([]map[string]any, error) {
    data, err := json.Marshal(s)
    if err != nil {
        return nil, err
    }

    var m []map[string]any
    if err := json.Unmarshal(data, &m); err != nil {
        return nil, err
    }

    return m, nil
}

// MapToStruct converts map back to struct
func MapToStruct(m map[string]any, target any) error {
    data, err := json.Marshal(m)
    if err != nil {
        return err
    }
    return json.Unmarshal(data, target)
}