import { createTheme } from '@mui/material/styles';

export const theme = {
  colors: {
    primary: '#2E7D32', // The green color from ATTENDEASE header
    white: '#FFFFFF',
    background: '#F5F5F5',
    text: {
      primary: '#333333',
      secondary: '#666666',
      white: '#FFFFFF'
    },
    card: {
      background: '#FFFFFF',
      border: '#E0E0E0'
    },
    button: {
      primary: '#2E7D32',
      hover: '#256E29'
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem'
  },
  shadows: {
    card: '0 2px 4px rgba(0,0,0,0.1)',
    dropdown: '0 4px 6px rgba(0,0,0,0.1)'
  }
};

const themeMui = createTheme({
  palette: {
    primary: {
      light: '#2E7D32',
      main: '#1B5E20',
      dark: '#1A4314',
      contrastText: '#fff',
    },
    secondary: {
      light: '#F8FAFC',
      main: '#F1F5F9',
      dark: '#E2E8F0',
      contrastText: '#1E293B',
    },
    accent: {
      light: '#66BB6A',
      main: '#4CAF50',
      dark: '#2E7D32',
    },
    text: {
      primary: '#1E293B',
      secondary: '#475569',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Inter", "system-ui", "-apple-system", "sans-serif"',
    h1: {
      fontWeight: 600,
      fontSize: '2.5rem',
      transition: 'color 0.3s ease',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      transition: 'color 0.3s ease',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      transition: 'color 0.3s ease',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      transition: 'color 0.3s ease',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      transition: 'color 0.3s ease',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      transition: 'color 0.3s ease',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
          fontWeight: 500,
          transition: 'all 0.3s ease !important',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 2px 15px -3px rgba(0,0,0,0.07), 0 10px 20px -2px rgba(0,0,0,0.04)',
          transition: 'all 0.3s ease !important',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          transition: 'all 0.3s ease !important',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            transition: 'all 0.3s ease !important',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            },
            '&.Mui-focused': {
              transform: 'scale(1.02)',
            },
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          transition: 'all 0.3s ease !important',
          '&:hover': {
            transform: 'translateX(4px)',
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.3s ease !important',
          '&:hover': {
            transform: 'scale(1.1) rotate(5deg)',
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'all 0.3s ease !important',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            transform: 'translateX(4px)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          transition: 'all 0.3s ease !important',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          transition: 'all 0.3s ease !important',
          '&:hover': {
            transform: 'translateY(-1px)',
            textDecoration: 'none',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          transition: 'all 0.3s ease !important',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          transition: 'all 0.3s ease !important',
          '&:hover': {
            transform: 'scale(1.01)',
          },
        },
      },
    },
  },
});

export default themeMui; 