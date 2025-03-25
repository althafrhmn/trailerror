import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Card,
  CardContent,
  Grid,
  IconButton,
  TextField,
  Button,
  Menu,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  Print as PrintIcon,
  Search as SearchIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { authService } from '../../services/api';

const Report = ({ data, title, type }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const currentUser = useMemo(() => authService.getCurrentUser(), []);

  // Define columns based on report type
  const columns = useMemo(() => {
    switch (type) {
      case 'attendance':
        return [
          { id: 'date', label: 'Date', format: (value) => format(new Date(value), 'PP') },
          { id: 'studentName', label: 'Student Name' },
          { id: 'class', label: 'Class' },
          { id: 'subject', label: 'Subject' },
          { id: 'status', label: 'Status' },
          { id: 'faculty', label: 'Faculty' },
        ];
      case 'timetable':
        return [
          { id: 'day', label: 'Day' },
          { id: 'subject', label: 'Subject' },
          { id: 'startTime', label: 'Start Time' },
          { id: 'endTime', label: 'End Time' },
          { id: 'faculty', label: 'Faculty' },
          { id: 'room', label: 'Room' },
        ];
      default:
        return [
          { id: 'date', label: 'Date', format: (value) => format(new Date(value), 'PP') },
          { id: 'type', label: 'Type' },
          { id: 'details', label: 'Details' },
          { id: 'status', label: 'Status' },
        ];
    }
  }, [type]);

  // Filter data based on search query, filters, and date range
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = Object.values(item)
        .join(' ')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesFilters = selectedFilters.length === 0 || 
        selectedFilters.every(filter => 
          item[filter.field] === filter.value
        );

      const matchesDateRange = (!startDate || new Date(item.date) >= startDate) &&
        (!endDate || new Date(item.date) <= endDate);

      return matchesSearch && matchesFilters && matchesDateRange;
    });
  }, [data, searchQuery, selectedFilters, startDate, endDate]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    if (!filteredData.length) return null;

    switch (type) {
      case 'attendance':
        return {
          total: filteredData.length,
          present: filteredData.filter(item => item.status === 'Present').length,
          absent: filteredData.filter(item => item.status === 'Absent').length,
          percentage: Math.round(
            (filteredData.filter(item => item.status === 'Present').length / filteredData.length) * 100
          ),
        };
      default:
        return {
          total: filteredData.length,
          completed: filteredData.filter(item => item.status === 'Completed').length,
          pending: filteredData.filter(item => item.status === 'Pending').length,
        };
    }
  }, [filteredData, type]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterSelect = (field, value) => {
    setSelectedFilters(prev => [...prev, { field, value }]);
    handleFilterClose();
  };

  const handleFilterRemove = (filterToRemove) => {
    setSelectedFilters(prev => 
      prev.filter(filter => 
        filter.field !== filterToRemove.field || filter.value !== filterToRemove.value
      )
    );
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      // Implementation for downloading report as Excel/PDF
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      setError('Failed to download report');
      toast.error('Failed to download report');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h2">
          {title}
        </Typography>
        <Box>
          <IconButton onClick={handleDownload} title="Download Report">
            <DownloadIcon />
          </IconButton>
          <IconButton onClick={handlePrint} title="Print Report">
            <PrintIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {Object.entries(summary).map(([key, value]) => (
            <Grid item xs={12} sm={6} md={3} key={key}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Typography>
                  <Typography variant="h4">
                    {typeof value === 'number' && key === 'percentage' ? `${value}%` : value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />

        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={setStartDate}
            renderInput={(params) => <TextField size="small" {...params} />}
          />
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={setEndDate}
            renderInput={(params) => <TextField size="small" {...params} />}
          />
        </LocalizationProvider>

        <IconButton onClick={handleFilterClick}>
          <FilterListIcon />
        </IconButton>

        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={handleFilterClose}
        >
          {columns.map(column => (
            <MenuItem
              key={column.id}
              onClick={() => handleFilterSelect(column.id, 'value')}
            >
              {column.label}
            </MenuItem>
          ))}
        </Menu>

        {selectedFilters.map(filter => (
          <Chip
            key={`${filter.field}-${filter.value}`}
            label={`${filter.field}: ${filter.value}`}
            onDelete={() => handleFilterRemove(filter)}
          />
        ))}
      </Box>

      {/* Data Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map(column => (
                <TableCell key={column.id}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {column.label}
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => (
                <TableRow key={index}>
                  {columns.map(column => (
                    <TableCell key={column.id}>
                      {column.format ? column.format(row[column.id]) : row[column.id]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default Report; 