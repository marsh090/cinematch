import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4b80ca',
      dark: '#3568d4',
      light: '#99bbff',
      subtle: '#b7ccea',
    },
    secondary: {
      main: '#43436b',
      light: '#7b7b97',
    },
    error: {
      main: '#ff3b3b',
    },
    warning: {
      main: '#ffcc00',
    },
    info: {
      main: '#0063f7',
    },
    success: {
      main: '#06c270',
    },
    accent: {
      main: '#fa7e70',
      light: '#fca59b',
      two: '#719a8b',
      twoLight: '#a2dcc7',
    },
    background: {
      default: '#161718',
      paper: '#2d2e2f',
      dark2: '#454545',
      dark3: '#747474',
      light1: '#ebebeb',
      light2: '#c7c9d9',
      light3: '#b9b9b9',
    },
    text: {
      primary: '#fff',
      secondary: '#b7ccea',
    },
  },
  typography: {
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    fontSize: 22,
    h1: { fontSize: 44 },
    h2: { fontSize: 36 },
    h3: { fontSize: 28 },
    h4: { fontSize: 32 }, // subtitulo
    body1: { fontSize: 22 },
    body2: { fontSize: 16 },
    caption: { fontSize: 12 },
    small: { fontSize: 16 },
    smaller: { fontSize: 12 },
    allVariants: {
      color: '#fff',
    },
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: {
          borderColor: '#99bbff',
        },
        input: {
          paddingTop: 14,
          paddingBottom: 14,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderColor: '#99bbff',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderColor: '#99bbff',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderColor: '#99bbff',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
            borderColor: '#99bbff',
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          borderColor: '#99bbff',
        },
        input: {
          paddingTop: 14,
          paddingBottom: 14,
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          borderColor: '#99bbff',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderColor: '#99bbff',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#99bbff',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: 'rgba(255,255,255,0.5)',
          fontSize: 16,
          fontWeight: 400,
        },
      },
    },
  },
});

export default theme; 