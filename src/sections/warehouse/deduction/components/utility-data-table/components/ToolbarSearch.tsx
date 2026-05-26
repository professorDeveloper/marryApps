import { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

import type { ToolbarSearchProps, SearchOutput } from '../types/types';

interface Chip_Item {
  type: 'option' | 'custom';
  id?: string;
  label: string;
}

export function ToolbarSearch({
  mode = 'simple',
  allowFreeText = false,
  options = [],
  onSearch,
  value = '',
}: ToolbarSearchProps) {
  const [simpleInputVal, setSimpleInputVal] = useState(value);
  const [chips, setChips] = useState<Chip_Item[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [highlightedOption, setHighlightedOption] = useState<{ id: string; label: string } | null>(null);
  const [showNoMatchTooltip, setShowNoMatchTooltip] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastParentValueRef = useRef<string>(value);

  const updateSearch = useCallback(
    (updatedChips: Chip_Item[]) => {
      const result: SearchOutput = {
        optionIds: updatedChips
          .filter((c) => c.type === 'option')
          .map((c) => c.id!)
          .filter(Boolean),
        customQueries: updatedChips
          .filter((c) => c.type === 'custom')
          .map((c) => c.label),
      };
      onSearch(result);
    },
    [onSearch],
  );

  const handleChipDelete = useCallback(
    (index: number) => {
      const updated = chips.filter((_, i) => i !== index);
      setChips(updated);
      updateSearch(updated);
    },
    [chips, updateSearch],
  );

  useEffect(() => {
    if (mode === 'simple') {
      // Only sync if the parent value has changed externally (not from user typing)
      if (value !== lastParentValueRef.current) {
        setSimpleInputVal(value);
        lastParentValueRef.current = value;
      }
    }
  }, [value, mode]);

  useLayoutEffect(() => {
    if (mode !== 'simple' && containerRef.current) {
      const width = containerRef.current.offsetWidth;
      setContainerWidth(width);

      const resizeObserver = new ResizeObserver(() => {
        if (containerRef.current) {
          setContainerWidth(containerRef.current.offsetWidth);
        }
      });
      resizeObserver.observe(containerRef.current);

      return () => resizeObserver.disconnect();
    }
  }, [mode]);

  if (mode === 'simple') {

    const handleSimpleChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setSimpleInputVal(newValue);

        // Auto-trigger search when clearing the input
        if (newValue === '' && simpleInputVal !== '') {
          onSearch({ query: '' });
        }
      },
      [onSearch, simpleInputVal],
    );

    const handleSimpleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          onSearch({ query: simpleInputVal });
        }
      },
      [simpleInputVal, onSearch],
    );

    return (
      <TextField
        size="small"
        placeholder="Search cases..."
        value={simpleInputVal}
        onChange={handleSimpleChange}
        onKeyDown={handleSimpleKeyDown}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Iconify
                  icon="eva:search-fill"
                  width={18}
                  sx={{ color: 'var(--text-3)' }}
                />
              </InputAdornment>
            ),
            endAdornment: null,
          },
        }}
        sx={{
          minWidth: 200,
          maxWidth: 320,
          '& .MuiInputBase-root': {
            height: 36,
            fontSize: 13.5,
            backgroundColor: 'var(--bg2)',
            borderRadius: '6px',
            fontFamily: 'var(--font-sans)',
          },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border)' },
          '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border2)' },
          '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--border2)',
            boxShadow: 'none',
          },
        }}
      />
    );
  }

  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(inputVal.toLowerCase()),
  );

  const handleOptionSelect = useCallback(
    (option: { id: string; label: string }) => {
      const alreadyExists = chips.some((c) => c.type === 'option' && c.id === option.id);
      if (alreadyExists) {
        setInputVal('');
        setHighlightedOption(null);
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 100);
        return;
      }

      const newChip: Chip_Item = { type: 'option', id: option.id, label: option.label };
      const updated = [...chips, newChip];
      setChips(updated);
      setInputVal('');
      setHighlightedOption(null);
      updateSearch(updated);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    },
    [chips, updateSearch],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Backspace') {
        if (inputVal === '' && chips.length > 0) {
          handleChipDelete(chips.length - 1);
        }
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        event.nativeEvent.stopImmediatePropagation();

        if (highlightedOption) {
          handleOptionSelect(highlightedOption);
          return;
        }

        if (allowFreeText) {
          if (inputVal.trim()) {
            const trimmed = inputVal.trim();
            const alreadyExists = chips.some((c) => c.type === 'custom' && c.label === trimmed);
            if (alreadyExists) {
              setInputVal('');
              setTimeout(() => {
                if (inputRef.current) {
                  inputRef.current.focus();
                }
              }, 0);
              return;
            }

            const newChip: Chip_Item = { type: 'custom', label: trimmed };
            const updated = [...chips, newChip];
            setChips(updated);
            setInputVal('');
            updateSearch(updated);
            setTimeout(() => {
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }, 0);
          }
          return;
        }

        if (filteredOptions.length > 0) {
          handleOptionSelect(filteredOptions[0]);
          return;
        }

        if (!allowFreeText && filteredOptions.length === 0) {
          setShowNoMatchTooltip(true);
          if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
          tooltipTimeoutRef.current = setTimeout(() => {
            setShowNoMatchTooltip(false);
          }, 1500);
        }
      }
    },
    [
      highlightedOption,
      allowFreeText,
      inputVal,
      chips,
      filteredOptions,
      handleOptionSelect,
      updateSearch,
    ],
  );

  return (
    <Tooltip title="No match found" open={showNoMatchTooltip} placement="top">
      <Box
        ref={containerRef}
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          gap: 0.5,
          p: 0.5,
          backgroundColor: 'var(--surface)',
          borderRadius: 1,
          border: '1px solid var(--border)',
          minWidth: 200,
          maxWidth: 600,
          position: 'relative',
        }}
      >
      {chips.map((chip, index) => (
        <Chip
          key={`${chip.type}-${chip.id || chip.label}-${index}`}
          label={chip.label}
          onDelete={() => handleChipDelete(index)}
          size="small"
          sx={{
            height: 24,
            fontSize: 12.5,
          }}
        />
      ))}

      <Autocomplete
        freeSolo
        autoSelect={false}
        blurOnSelect={false}
        selectOnFocus={false}
        open={inputVal.length > 0}
        inputValue={inputVal}
        onInputChange={(_, newInputValue) => {
          setInputVal(newInputValue);
          setHighlightedOption(null);
        }}
        options={filteredOptions}
        getOptionLabel={(option) =>
          typeof option === 'string' ? option : option.label
        }
        onHighlightChange={(_, option) => {
          setHighlightedOption(option || null);
        }}
        onChange={(_, value) => {
          // Clear input to prevent MUI from setting it to the selected option's label
          setInputVal('');
        }}
        onKeyDown={handleKeyDown}
        renderInput={(params) => (
          <TextField
            {...params}
            inputRef={inputRef}
            size="small"
            placeholder={chips.length === 0 ? 'Search...' : ''}
            variant="standard"
            sx={{
              '& .MuiInput-underline:before': { borderBottom: 'none' },
              '& .MuiInput-underline:hover:before': { borderBottom: 'none' },
              '& .MuiInput-underline:after': { borderBottom: 'none' },
              '& .MuiInputBase-root': {
                fontSize: 12.5,
                fontFamily: 'var(--font-sans)',
              },
              minWidth: 100,
            }}
          />
        )}
        slotProps={{
          popper: {
            anchorEl: containerRef.current,
            style: {
              width: containerWidth ? `${containerWidth}px` : 'auto',
            },
            disablePortal: false,
          },
        }}
        sx={{
          flex: 1,
          minWidth: 100,
          '& .MuiAutocomplete-listbox': {
            fontSize: 12.5,
            maxHeight: 200,
          },
        }}
      />
      </Box>
    </Tooltip>
  );
}
