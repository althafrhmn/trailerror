import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Divider,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Download as DownloadIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';

const Report = () => {
  const [reportType, setReportType] = useState('attendance');
  const [timeframe, setTimeframe] = useState('month');
  const [loading, setLoading] = useState(false);

  // Sample data - replace with actual data from your backend
  const attendanceData = [
    { name: 'Week 1', present: 85, absent: 15, total: 100 },
    { name: 'Week 2', present: 90, absent: 10, total: 100 },
    { name: 'Week 3', present: 88, absent: 12, total: 100 },
    { name: 'Week 4', present: 92, absent: 8, total: 100 },
  ];

  const subjectWiseData = [
    { subject: 'Mathematics', attendance: 90 },
    { subject: 'Physics', attendance: 85 },
    { subject: 'Chemistry', attendance: 88 },
    { subject: 'Biology', attendance: 92 },
    { subject: 'Computer Science', attendance: 95 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const downloadReport = () => {
    // Implement report download logic here
    toast.success('Report downloaded successfully');
  };

  const renderAttendanceReport = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Attendance Overview
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" fill="#4CAF50" />
                <Bar dataKey="absent" fill="#f44336" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Subject-wise Attendance
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={subjectWiseData}
                  dataKey="attendance"
                  nameKey="subject"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {subjectWiseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Detailed Attendance Records
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Subject</TableCell>
                    <TableCell align="right">Total Classes</TableCell>
                    <TableCell align="right">Present</TableCell>
                    <TableCell align="right">Absent</TableCell>
                    <TableCell align="right">Percentage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subjectWiseData.map((row) => (
                    <TableRow key={row.subject}>
                      <TableCell component="th" scope="row">
                        {row.subject}
                      </TableCell>
                      <TableCell align="right">100</TableCell>
                      <TableCell align="right">{row.attendance}</TableCell>
                      <TableCell align="right">{100 - row.attendance}</TableCell>
                      <TableCell align="right">{row.attendance}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <div className="p-4">
      <Box className="flex justify-between items-center mb-4">
        <Typography variant="h5" component="h2">
          Reports Dashboard
        </Typography>
        <Box className="flex gap-4">
          <FormControl variant="outlined" size="small">
            <InputLabel>Report Type</InputLabel>
            <Select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              label="Report Type"
            >
              <MenuItem value="attendance">Attendance Report</MenuItem>
              <MenuItem value="performance">Performance Report</MenuItem>
              <MenuItem value="behavior">Behavior Report</MenuItem>
            </Select>
          </FormControl>
          <FormControl variant="outlined" size="small">
            <InputLabel>Timeframe</InputLabel>
            <Select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              label="Timeframe"
            >
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="semester">This Semester</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={downloadReport}
          >
            Download Report
          </Button>
        </Box>
      </Box>

      <Divider className="mb-4" />

      {renderAttendanceReport()}
    </div>
  );
};

export default Report; 