import { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import Layout from '../common/Layout';

const AttendanceManagement = () => {
  const [filters, setFilters] = useState({
    date: '',
    class: '',
    subject: '',
  });

  // Sample data - will be replaced with API calls
  const students = [
    { id: 1, name: 'John Doe', rollNo: '101', status: 'Present' },
    { id: 2, name: 'Jane Smith', rollNo: '102', status: 'Absent' },
    { id: 3, name: 'Mike Johnson', rollNo: '103', status: 'Late' },
  ];

  const classes = ['Class A', 'Class B', 'Class C'];
  const subjects = ['Mathematics', 'Physics', 'Chemistry'];

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = () => {
    // TODO: Implement attendance submission
    console.log('Submitting attendance...');
  };

  return (
    <Layout>
      <Typography variant="h4" component="h1" className="mb-6">
        Attendance Management
      </Typography>

      <Paper className="p-4 mb-4">
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="date"
              name="date"
              label="Date"
              value={filters.date}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Class</InputLabel>
              <Select
                name="class"
                value={filters.class}
                label="Class"
                onChange={handleFilterChange}
              >
                {classes.map((cls) => (
                  <MenuItem key={cls} value={cls}>
                    {cls}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Subject</InputLabel>
              <Select
                name="subject"
                value={filters.subject}
                label="Subject"
                onChange={handleFilterChange}
              >
                {subjects.map((subject) => (
                  <MenuItem key={subject} value={subject}>
                    {subject}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Roll No</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>{student.rollNo}</TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.status}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    className="mr-2"
                  >
                    Present
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    className="mr-2"
                  >
                    Absent
                  </Button>
                  <Button
                    variant="contained"
                    color="warning"
                    size="small"
                  >
                    Late
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box className="mt-4 text-right">
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
        >
          Submit Attendance
        </Button>
      </Box>
    </Layout>
  );
};

export default AttendanceManagement; 