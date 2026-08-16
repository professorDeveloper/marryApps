import type { Theme, SxProps } from '@mui/material/styles';

import { useState } from 'react';

import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';

// ----------------------------------------------------------------------

type Props = {
  title?: string;
  description?: string;
  sx?: SxProps<Theme>;
};

export function BlankView({ title = 'Blank', description, sx }: Props) {
    const [checkedOrder, setCheckedOrder] = useState<string[]>([]);

  const handleChange = (id: string) => {
    setCheckedOrder((prev) => {
      // Agar allaqachon yoqilgan bo‘lsa → o‘chiramiz
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }

      // Agar 2 ta yoqilgan bo‘lsa → birinchisini olib tashlaymiz
      if (prev.length === 3) {
        return [...prev.slice(1), id];
      }

      // Aks holda qo‘shamiz
      return [...prev, id];
    });
  };

  const isChecked = (id: string) => checkedOrder.includes(id);


  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4"> {title} </Typography>
      {description && <Typography sx={{ mt: 1 }}> {description} </Typography>}

       {/* <div style={{ padding: 20 }}>

      <label>
        <input
          type="checkbox"
          checked={isChecked("a")}
          onChange={() => handleChange("a")}
        />
        Checkbox A
      </label>
      <br />

      <label>
        <input
          type="checkbox"
          checked={isChecked("b")}
          onChange={() => handleChange("b")}
        />
        Checkbox B
      </label>
      <br />

      <label>
        <input
          type="checkbox"
          checked={isChecked("c")}
          onChange={() => handleChange("c")}
        />
        Checkbox C
      </label>
      <br />
      
        <label>
        <input
          type="checkbox"
          checked={isChecked("d")}
          onChange={() => handleChange("d")}
        />
        Checkbox D
      </label>
    </div> */}
    </DashboardContent>
  );
}
