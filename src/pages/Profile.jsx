import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    address: '',
    profilePic: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        address: user.address || '',
        profilePic: user.profilePic || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfilePicChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({
          ...prev,
          profilePic: event.target.result
        }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const success = await updateUserProfile(formData);
      
      if (success) {
        setEditMode(false);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
      setError('Failed to save profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <Box p={3}>
        <Alert severity="warning">User not found. Please log in again.</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Paper elevation={3}>
        <Box p={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4">Profile</Typography>
            <Button
              variant="outlined"
              color={editMode ? "secondary" : "primary"}
              startIcon={editMode ? <SaveIcon /> : <EditIcon />}
              onClick={() => editMode ? handleSave() : setEditMode(true)}
              disabled={saving}
            >
              {saving ? (
                <CircularProgress size={24} />
              ) : editMode ? (
                'Save Changes'
              ) : (
                'Edit Profile'
              )}
            </Button>
          </Box>

          <Divider sx={{ mb: 4 }} />

          <Grid container spacing={4}>
            <Grid item xs={12} md={4} display="flex" flexDirection="column" alignItems="center">
              <Avatar
                src={formData.profilePic || '/placeholder-avatar.png'}
                alt={formData.name}
                sx={{ width: 200, height: 200, mb: 2 }}
              />
              
              {editMode && (
                <Box mt={2}>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="profile-pic-upload"
                    type="file"
                    onChange={handleProfilePicChange}
                  />
                  <label htmlFor="profile-pic-upload">
                    <Button
                      variant="contained"
                      component="span"
                      startIcon={<PhotoCameraIcon />}
                    >
                      Change Photo
                    </Button>
                  </label>
                </Box>
              )}
              
              <Typography variant="h6" mt={2}>
                Role: {user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || 'N/A'}
              </Typography>
            </Grid>

            <Grid item xs={12} md={8}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    rows={4}
                    margin="normal"
                    disabled={!editMode}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default Profile; 