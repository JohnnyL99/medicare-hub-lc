import { Box, Stack, Typography } from '@mui/material';

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <Stack
      spacing={2}
      direction={{ xs: 'column', md: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', md: 'flex-end' }}
    >
      <Box>
        {eyebrow ? (
          <Typography variant="overline" color="primary" fontWeight={800}>
            {eyebrow}
          </Typography>
        ) : null}
        <Typography variant="h3" component="h1" sx={{ mt: 0.5 }}>
          {title}
        </Typography>
        {description ? (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 760 }}>
            {description}
          </Typography>
        ) : null}
      </Box>
      {actions ? <Box>{actions}</Box> : null}
    </Stack>
  );
}
