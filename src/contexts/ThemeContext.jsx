import { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        light: darkMode ? '#4CAF50' : '#2E7D32',
        main: darkMode ? '#388E3C' : '#1B5E20',
        dark: darkMode ? '#2E7D32' : '#1A4314',
        contrastText: '#fff',
      },
      secondary: {
        light: darkMode ? '#424242' : '#F8FAFC',
        main: darkMode ? '#303030' : '#F1F5F9',
        dark: darkMode ? '#212121' : '#E2E8F0',
        contrastText: darkMode ? '#fff' : '#1E293B',
      },
      accent: {
        light: darkMode ? '#81C784' : '#66BB6A',
        main: darkMode ? '#66BB6A' : '#4CAF50',
        dark: darkMode ? '#4CAF50' : '#2E7D32',
      },
      text: {
        primary: darkMode ? '#FFFFFF' : '#1E293B',
        secondary: darkMode ? '#B0BEC5' : '#475569',
      },
      background: {
        default: darkMode ? '#121212' : '#F8FAFC',
        paper: darkMode ? '#1E1E1E' : '#FFFFFF',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            transition: 'background-color 0.3s ease, color 0.3s ease',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease',
          },
        },
      },
    },
  });

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem('darkMode', JSON.stringify(newMode));
      return newMode;
    });
  };

  useEffect(() => {
    document.body.style.backgroundColor = theme.palette.background.default;
    document.body.style.color = theme.palette.text.primary;
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};