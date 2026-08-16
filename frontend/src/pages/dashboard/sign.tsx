import { Box, Container, Typography } from '@mui/material';

export default function SignPage() {
  return (
    <Container>
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Sign Page
        </Typography>
        <Typography variant="body1">
          Welcome to the sign page. This is the default page after sign-in.
        </Typography>
      </Box>
    </Container>
  );
}
