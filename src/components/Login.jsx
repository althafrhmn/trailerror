const handleLogin = async (values) => {
  try {
    const response = await axios.post('http://localhost:5001/api/auth/login', values);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userRole', response.data.role);
      
      // Redirect based on role
      if (response.data.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    }
  } catch (error) {
    console.error('Login error:', error);
  }
};