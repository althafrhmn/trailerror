import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Badge,
  Alert,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Send as SendIcon,
  Delete as DeleteIcon,
  AccountCircle as AccountCircleIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  AdminPanelSettings as AdminIcon,
  School as SchoolIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { userService, messageService, authService } from '../../services/api';
import axios from 'axios';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [useMockData, setUseMockData] = useState(false);
  const pollIntervalRef = useRef(null);
  const currentUser = useMemo(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      // Redirect to login if no user found
      window.location.href = '/login';
      return null;
    }
    return user;
  }, []);

  // Add a ref to track the last auto-reply timestamp
  const lastAutoReplyRef = useRef(0);

  // Helper function to generate realistic auto-replies based on user roles
  const getAutoReply = useCallback((senderRole, receiverRole) => {
    const responses = {
      admin: [
        "Thank you for your message. I'll look into this and get back to you soon.",
        "Your request has been noted. We'll process it shortly.",
        "Thanks for reaching out. Is there anything else you need assistance with?",
        "I've received your message and will address it as soon as possible."
      ],
      faculty: [
        "Thank you for your message. I'll check my schedule and respond accordingly.",
        "I've received your inquiry. Please allow some time for me to prepare a proper response.",
        "Thanks for contacting me. I'll address your concerns during office hours.",
        "Message received. I'll follow up with more information shortly."
      ],
      student: [
        "Thanks for your message. I'll read through it carefully.",
        "Got it! I'll respond after my classes.",
        "Thank you for the information. I'll get back to you soon.",
        "Message received. I'll check with my classmates and get back to you."
      ]
    };

    // Pick a random response based on the sender's role
    const roleResponses = responses[senderRole] || responses.admin;
    return roleResponses[Math.floor(Math.random() * roleResponses.length)];
  }, []);

  // Generate mock contacts based on user role when API fails
  const generateMockContacts = useCallback(() => {
    if (!currentUser?.role) return [];
    
    const mockUsers = [];
    
    // Generate appropriate contacts based on user role
    switch (currentUser.role) {
      case 'admin':
        mockUsers.push(
          {
            _id: 'faculty-1',
            name: 'John Smith',
            role: 'faculty',
            email: 'john.smith@example.com'
          },
          {
            _id: 'student-1',
            name: 'Mary Johnson',
            role: 'student',
            email: 'mary.j@example.com'
          }
        );
        break;
      case 'faculty':
        mockUsers.push(
          {
            _id: 'admin-1',
            name: 'Admin User',
            role: 'admin',
            email: 'admin@example.com'
          },
          {
            _id: 'student-1',
            name: 'Mary Johnson',
            role: 'student',
            email: 'mary.j@example.com'
          },
          {
            _id: 'student-2',
            name: 'James Wilson',
            role: 'student',
            email: 'james.w@example.com'
          }
        );
        break;
      case 'student':
        mockUsers.push(
          {
            _id: 'admin-1',
            name: 'Admin User',
            role: 'admin',
            email: 'admin@example.com'
          },
          {
            _id: 'faculty-1',
            name: 'John Smith',
            role: 'faculty',
            email: 'john.smith@example.com'
          }
        );
        break;
      default:
        break;
    }
    
    return mockUsers;
  }, [currentUser]);

  // Fetch all users with error handling and fallback
  const fetchUsers = useCallback(async () => {
    try {
      // If we're already using mock data, don't make real API calls
      if (useMockData) {
        return generateMockContacts();
      }

      setError(null);
      // Check auth token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      try {
        // Try to fetch users from API
      const result = await userService.getUsers();
        
        if (result?.success && Array.isArray(result.data)) {
          // Define role-based permissions to filter locally
          const rolePermissions = {
            admin: ['admin', 'faculty', 'student', 'parent'],
            faculty: ['student'],
            student: ['faculty', 'admin'],
            parent: ['faculty']
          };

          const allowedRoles = rolePermissions[currentUser?.role] || [];
          
          // Filter users locally based on role permissions
          const filteredUsers = result.data.filter(user => 
            user._id !== currentUser?._id && 
            allowedRoles.includes(user.role)
          );
          
        setUsers(filteredUsers);
          return filteredUsers;
      } else {
          // If API returns empty data or error, use mock data
          throw new Error(result?.error || 'Failed to fetch users');
        }
      } catch (apiError) {
        console.warn('API error, using mock contacts:', apiError);
        // Use mock data as fallback
        const mockContacts = generateMockContacts();
        setUsers(mockContacts);
        
        // Set flag to use mock data going forward
        setUseMockData(true);
        
        // Show a toast but don't set error state to not disrupt the UI
        toast('Using demo contacts. Some features may be limited.', {
          icon: '🔔',
          style: {
            border: '1px solid #3498db',
            padding: '16px',
            color: '#3498db',
          },
        });
        
        return mockContacts;
      }
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      if (error.message === 'Authentication required') {
        window.location.href = '/login';
        return [];
      }
      
      // Use mock data as final fallback
      const mockContacts = generateMockContacts();
      setUsers(mockContacts);
      
      // Set flag to use mock data going forward
      setUseMockData(true);
      
      setError('Using demo mode. Limited functionality available.');
      toast.error('Failed to connect to server. Using demo mode.');
      return mockContacts;
    }
  }, [currentUser, generateMockContacts, useMockData]);

  // Filter available users based on role and search query
  const filteredUsers = useMemo(() => {
    if (!users.length) return [];

    return users.filter(user => 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  // Generate mock messages with guaranteed unique IDs
  const generateMockMessages = useCallback(() => {
    if (!currentUser) return [];
    
    // If users array is empty but we need mock messages, create some default users
    const usersToUse = users.length > 0 ? users : generateMockContacts();
    
    const mockMessages = [];
    const now = new Date();
    const baseTimestamp = now.getTime();
    
    // Pre-defined conversation starters by role
    const conversationStarters = {
      admin: [
        "Hello, I need to inform you about some important updates to our system.",
        "We're updating the attendance policy. Please review the changes.",
        "Could you please provide feedback on the recent changes?",
        "There will be a staff meeting next week. Please confirm your availability."
      ],
      faculty: [
        "I would like to discuss a student's performance with you.",
        "The upcoming exam schedule has been posted. Please review it.",
        "We need to reschedule tomorrow's session. Is that possible?",
        "I've uploaded new learning materials for the students."
      ],
      student: [
        "I have a question about the recent assignment.",
        "Could you please explain the grading criteria for the project?",
        "I'll be absent for tomorrow's class due to a medical appointment.",
        "When will the results for the mid-term exam be announced?"
      ]
    };
    
    // Create conversations with each contact
    usersToUse.forEach((user, userIndex) => {
      if (!user || !user._id) return; // Skip invalid users
      
      // Use the userIndex to create time offsets that are guaranteed not to overlap
      const userTimeOffset = userIndex * 5 * 60 * 1000; // 5 minutes * user index
      
      // Determine who starts the conversation based on roles
      let starterRole, responderRole, starterUser, responderUser;
      
      if (user.role === 'admin' || (user.role === 'faculty' && currentUser.role === 'student')) {
        // Admin or faculty typically initiates to lower roles
        starterRole = user.role;
        responderRole = currentUser.role;
        starterUser = user;
        responderUser = currentUser;
      } else {
        // Otherwise current user initiates
        starterRole = currentUser.role;
        responderRole = user.role;
        starterUser = currentUser;
        responderUser = user;
      }
      
      // Get conversation starters for the initiator
      const starters = conversationStarters[starterRole] || conversationStarters.student;
      const starterMessage = starters[Math.floor(Math.random() * starters.length)];
      
      // First message - from conversation starter (3 hours ago)
      mockMessages.push({
        _id: `static-mock-msg-${user._id}-1-${Date.now()}`,
        content: starterMessage,
        sender: {
          _id: starterUser._id,
          name: starterUser.name,
          role: starterUser.role
        },
        receiver: {
          _id: responderUser._id,
          name: responderUser.name,
          role: responderUser.role
        },
        createdAt: new Date(baseTimestamp - (3 * 60 * 60 * 1000) - userTimeOffset).toISOString(), // 3 hours ago + offset
        status: 'read'
      });
      
      // Second message - reply from responder (2 hours ago)
      mockMessages.push({
        _id: `static-mock-msg-${user._id}-2-${Date.now()}`,
        content: getAutoReply(responderRole, starterRole),
        sender: {
          _id: responderUser._id,
          name: responderUser.name,
          role: responderUser.role
        },
        receiver: {
          _id: starterUser._id,
          name: starterUser.name,
          role: starterUser.role
        },
        createdAt: new Date(baseTimestamp - (2 * 60 * 60 * 1000) - userTimeOffset).toISOString(), // 2 hours ago + offset
        status: 'read'
      });
      
      // Third message - follow up from starter (1 hour ago)
      const followUps = {
        admin: [
          "Please confirm that you've received this information.",
          "Let me know if you have any questions about this.",
          "I need your response by end of day today.",
          "This is important for our upcoming planning."
        ],
        faculty: [
          "Could you also review the attached materials?",
          "Please let me know your thoughts on this matter.",
          "I would appreciate your input on this decision.",
          "Do you think we should involve other departments?"
        ],
        student: [
          "I also wanted to ask about the upcoming project deadline.",
          "Can you recommend any additional study materials?",
          "Should I submit the assignment via email or the portal?",
          "I'm hoping to get some feedback on my draft submission."
        ]
      };
      
      const followUpMessage = followUps[starterRole] || followUps.student;
      mockMessages.push({
        _id: `static-mock-msg-${user._id}-3-${Date.now()}`,
        content: followUpMessage[Math.floor(Math.random() * followUpMessage.length)],
        sender: {
          _id: starterUser._id,
          name: starterUser.name,
          role: starterUser.role
        },
        receiver: {
          _id: responderUser._id,
          name: responderUser.name,
          role: responderUser.role
        },
        createdAt: new Date(baseTimestamp - (1 * 60 * 60 * 1000) - userTimeOffset).toISOString(), // 1 hour ago + offset
        status: 'read'
      });
      
      // Fourth message - recent unread message (30 minutes ago)
      mockMessages.push({
        _id: `static-mock-msg-${user._id}-4-${Date.now()}`,
        content: getAutoReply(responderRole, starterRole),
        sender: {
          _id: responderUser._id,
          name: responderUser.name,
          role: responderUser.role
        },
        receiver: {
          _id: starterUser._id,
          name: starterUser.name,
          role: starterUser.role
        },
        createdAt: new Date(baseTimestamp - (30 * 60 * 1000) - userTimeOffset).toISOString(), // 30 minutes ago + offset
        status: currentUser._id === responderUser._id ? 'read' : 'unread'
      });
    });
    
    // Sort messages by creation date (newest first)
    return mockMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [currentUser, users, getAutoReply, generateMockContacts]);

  // Fetch messages with direct API call and fallback
  const fetchMessages = useCallback(async () => {
    if (!currentUser?._id) return [];
    
    // If we're in mock mode, just return mock messages
    if (useMockData || localStorage.getItem('useMockData') === 'true') {
      try {
        const mockMessages = generateMockMessages();
        setMessages(prev => {
          // Keep recent user messages and add mock ones
          const userSentMessages = prev.filter(msg => 
            msg.sender._id === currentUser._id && 
            Date.now() - new Date(msg.createdAt).getTime() < 60 * 60 * 1000
          );
          return [...userSentMessages, ...mockMessages];
        });
        return mockMessages;
      } catch (error) {
        console.error("Error generating mock messages:", error);
        return [];
      }
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      try {
        // Try API call first
        const response = await axios.get('http://localhost:5000/api/messages', {
          headers: {
            Authorization: `Bearer ${token}`
          },
          timeout: 5000 // Add timeout to prevent hanging requests
        });

        if (response?.data) {
          let messageData = response.data;
          
          // Handle different response formats
          if (response.data.success && Array.isArray(response.data.data)) {
            messageData = response.data.data;
          } else if (!Array.isArray(response.data)) {
            throw new Error('Invalid message format received');
          }
          
          // Filter messages for current user
          const userMessages = messageData.filter(msg => 
            msg.sender._id === currentUser._id || msg.receiver._id === currentUser._id
          );
          
          setMessages(prevMessages => {
            // If we already have messages, only add new ones that don't exist
            if (prevMessages.length > 0) {
              const existingIds = new Set(prevMessages.map(m => m._id));
              const newMessages = userMessages.filter(m => !existingIds.has(m._id));
              return [...newMessages, ...prevMessages].sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
              );
            }
            return userMessages;
          });
          
          return userMessages;
        } else {
          throw new Error('Invalid message format received');
        }
      } catch (apiError) {
        console.warn('API error fetching messages, using mock data:', apiError);
        
        // Only show toast notification if this is the first time switching to mock mode
        if (!useMockData) {
          setUseMockData(true);
          localStorage.setItem('useMockData', 'true');
          
          // Show info toast but don't disrupt the UI
          toast('Using demo messages due to connection issues.', {
            icon: '🔔',
            style: {
              border: '1px solid #3498db',
              padding: '16px',
              color: '#3498db',
            },
          });
        }
        
        // Use mock messages if API fails
        const mockMessages = generateMockMessages();
        setMessages(mockMessages);
        
        return mockMessages;
      }
    } catch (error) {
      console.error('Error in fetchMessages:', error);
      if (error.message === 'Authentication required') {
        window.location.href = '/login';
        return [];
      }
      
      // Use mock data as final fallback
      if (!useMockData) {
        setUseMockData(true);
        localStorage.setItem('useMockData', 'true');
      }
      
      const mockMessages = generateMockMessages();
      setMessages(mockMessages);
      
      return mockMessages;
    }
  }, [currentUser, generateMockMessages, useMockData]);

  // Initialize data with auth check
  useEffect(() => {
    let isMounted = true;
    
    const initializeData = async () => {
      if (!isMounted) return;
      setInitialLoading(true);
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          window.location.href = '/login';
          return;
        }

        if (!currentUser) {
          window.location.href = '/login';
          return;
        }

        // Check if there's any stored preference for mock mode
        if (localStorage.getItem('useMockData') === 'true') {
          setUseMockData(true);
          const mockUsers = generateMockContacts();
          setUsers(mockUsers);
          
          if (isMounted) {
            const mockMessages = generateMockMessages();
            setMessages(mockMessages);
          }
        } else {
          // Try real API first - this will set useMockData if needed
          if (isMounted) {
            try {
              const fetchedUsers = await fetchUsers();
              if (isMounted && fetchedUsers) {
                await fetchMessages();
              }
            } catch (error) {
              console.error("Error fetching initial data:", error);
              if (isMounted) {
                setUseMockData(true);
                localStorage.setItem('useMockData', 'true');
                const mockUsers = generateMockContacts();
                setUsers(mockUsers);
                const mockMessages = generateMockMessages();
                setMessages(mockMessages);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        if (error.message === 'Authentication required' && isMounted) {
          window.location.href = '/login';
        }
        // Set mock mode if initialization fails
        if (isMounted) {
          setUseMockData(true);
          localStorage.setItem('useMockData', 'true');
          const mockUsers = generateMockContacts();
          setUsers(mockUsers);
          const mockMessages = generateMockMessages();
          setMessages(mockMessages);
        }
      } finally {
        if (isMounted) {
          setInitialLoading(false);
        }
      }
    };

    initializeData();

    // Clear any existing interval first
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    // Poll for new messages only if we're not in mock mode
    if (!useMockData) {
      pollIntervalRef.current = setInterval(async () => {
        if (!isMounted) return;
        
        // Ensure we're not in mock mode before fetching to prevent looping
        if (localStorage.getItem('token') && !localStorage.getItem('useMockData')) {
          try {
            await fetchMessages();
          } catch (error) {
            console.warn('Error during polling, switching to mock mode:', error);
            if (isMounted) {
              setUseMockData(true);
              localStorage.setItem('useMockData', 'true');
            }
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          }
        }
      }, 5000);
    }

    // Persist mock mode preference
    if (useMockData) {
      localStorage.setItem('useMockData', 'true');
    }

    // Ensure we clean up any interval on component unmount
    return () => {
      isMounted = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [currentUser, useMockData]);

  // Filter messages for selected contact
  const filteredMessages = useMemo(() => {
    if (!selectedContact || !messages.length) return [];
    
    return messages
      .filter(msg => 
        (msg.sender._id === selectedContact._id && msg.receiver._id === currentUser._id) ||
        (msg.sender._id === currentUser._id && msg.receiver._id === selectedContact._id)
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [messages, selectedContact, currentUser]);

  const handleContactSelect = useCallback((contact) => {
    setSelectedContact(contact);
    setMessageText('');
    setError(null);
  }, []);

  // Update the handleSendMessage function to be more robust
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedContact) {
      toast.error('Please select a contact and enter a message');
      return;
    }

    // Create a unique ID for this message
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Add outgoing message to UI immediately for better UX
    const tempMessage = {
      _id: tempId,
      content: messageText.trim(),
      sender: {
        _id: currentUser._id,
        name: currentUser.name,
        role: currentUser.role
      },
      receiver: {
        _id: selectedContact._id,
        name: selectedContact.name,
        role: selectedContact.role
      },
      createdAt: new Date().toISOString(),
      status: 'sending'
    };
    
    setMessages(prev => [tempMessage, ...prev]);
    setMessageText('');
    
    // Determine if we're using mock data
    const isMockMode = useMockData || 
                     localStorage.getItem('useMockData') === 'true' ||
                     selectedContact._id.startsWith('mock-') ||
                     selectedContact._id.startsWith('admin-') ||
                     selectedContact._id.startsWith('faculty-') ||
                     selectedContact._id.startsWith('student-');
    
    try {
      let finalMessage;
      
      if (!isMockMode) {
        try {
          // Attempt to send via real API
          const token = localStorage.getItem('token');
          if (!token) throw new Error('Authentication required');
          
          const messageData = {
        receiver: selectedContact._id,
            content: tempMessage.content,
            subject: `Message from ${currentUser.role}`,
            senderRole: currentUser.role,
            receiverRole: selectedContact.role
          };
          
          const response = await axios.post('http://localhost:5000/api/messages', messageData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 5000 // Prevent hanging requests
          });
          
          if (response?.data?._id) {
            // Update with the real message data from API
            finalMessage = {
              ...tempMessage,
              _id: response.data._id,
              status: 'sent',
              createdAt: response.data.createdAt || tempMessage.createdAt
            };
            
            toast.success('Message sent');
          } else {
            throw new Error('Invalid response from server');
          }
        } catch (apiError) {
          console.warn('API error sending message, using mock mode:', apiError);
          
          // Switch to mock mode for future operations
          setUseMockData(true);
          localStorage.setItem('useMockData', 'true');
          
          // Update the message to a successful mock message
          finalMessage = {
            ...tempMessage,
            _id: `mock-${Date.now()}`,
            status: 'sent'
          };
          
          toast('Message sent in demo mode', {
            icon: '🔔',
            style: {
              border: '1px solid #3498db',
              padding: '16px',
              color: '#3498db',
            },
          });
        }
      } else {
        // We're in mock mode already, just create a mock message
        finalMessage = {
          ...tempMessage,
          _id: `mock-${Date.now()}`,
          status: 'sent'
        };
        
        toast.success('Message sent');
      }
      
      // Update the message in state
      setMessages(prev => 
        prev.map(msg => msg._id === tempId ? finalMessage : msg)
      );
      
      // In mock mode, generate an auto-reply (with rate limiting)
      if (isMockMode) {
        const now = Date.now();
        
        // Only generate replies if we haven't recently generated one (rate limiting)
        if (now - lastAutoReplyRef.current > 3000) {
          lastAutoReplyRef.current = now;
          
          // Generate reply after a delay for realism
          setTimeout(() => {
            const replyMessage = {
              _id: `mock-reply-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              content: getAutoReply(selectedContact.role, currentUser.role),
              sender: {
                _id: selectedContact._id,
                name: selectedContact.name,
                role: selectedContact.role
              },
              receiver: {
                _id: currentUser._id,
                name: currentUser.name,
                role: currentUser.role
              },
              createdAt: new Date(Date.now() + 500).toISOString(), // Slightly after current time
              status: 'unread'
            };
            
            // Add to message list
            setMessages(prev => [replyMessage, ...prev]);
          }, 1500 + Math.random() * 1000); // 1.5-2.5 second delay
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update the temp message to show error state
      setMessages(prev => 
        prev.map(msg => 
          msg._id === tempId 
            ? { ...msg, status: 'error', error: error.message } 
            : msg
        )
      );
      
      toast.error('Failed to send message');
    }
  };

  // Fix handleDeleteMessage to work with both API and mock data
  const handleDeleteMessage = async (messageId) => {
    if (!messageId) return;
    
    setLoading(true);
    try {
      // Check if we're dealing with a mock message
      const isMockMessage = messageId.startsWith('mock-') || 
                           messageId.startsWith('temp-') || 
                           messageId.startsWith('static-mock-') || 
                           useMockData || 
                           localStorage.getItem('useMockData') === 'true';
      
      // For real messages, try API deletion
      if (!isMockMessage) {
        try {
          const token = localStorage.getItem('token');
          if (!token) throw new Error('Authentication required');
          
          await axios.delete(`http://localhost:5000/api/messages/${messageId}`, {
            headers: {
              Authorization: `Bearer ${token}`
            },
            timeout: 5000 // Prevent hanging requests
          });
          
          toast.success('Message deleted');
        } catch (apiError) {
          console.warn('API error deleting message, continuing with local deletion:', apiError);
          
          // If API fails, set mock mode for future operations
          setUseMockData(true);
          localStorage.setItem('useMockData', 'true');
          
          toast('Message deleted in demo mode', {
            icon: '🔔',
            style: {
              border: '1px solid #3498db',
              padding: '16px',
              color: '#3498db',
            },
          });
        }
      } else {
        // For mock messages, just show success
        toast.success('Message deleted');
      }

      // Remove from local state regardless of mode
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    } finally {
      setLoading(false);
    }
  };

  // Fix handleRefresh to ensure consistent behavior
  const handleRefresh = async () => {
    setLoading(true);
    try {
      // If we're in mock mode by setting or by checking localStorage
      const isMockMode = useMockData || localStorage.getItem('useMockData') === 'true';
      
      if (isMockMode) {
        // Regenerate mock data
        const mockUsers = generateMockContacts();
        setUsers(mockUsers);
        
        const mockMessages = generateMockMessages();
        setMessages(mockMessages);
        
        toast.success('Chat refreshed');
        return;
      }
      
      // Try API refresh if we're not in mock mode
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication required');
        
        // First try to fetch users - this sets mock mode if needed
        const fetchedUsers = await fetchUsers();
        
        // Only fetch messages if users fetch succeeded and didn't set mock mode
        if (fetchedUsers && !useMockData) {
          await fetchMessages();
          toast.success('Messages refreshed');
        } else if (useMockData) {
          // If fetchUsers set mock mode, fetch mock messages
          const mockMessages = generateMockMessages();
          setMessages(mockMessages);
          toast('Using demo mode due to connection issues', {
            icon: '🔔',
            style: {
              border: '1px solid #3498db',
              padding: '16px',
              color: '#3498db',
            },
          });
        }
      } catch (apiError) {
        console.warn('Error refreshing data from API, using mock data:', apiError);
        
        // Set mock mode for future operations
        setUseMockData(true);
        localStorage.setItem('useMockData', 'true');
        
        // Fallback to mock data
        const mockUsers = generateMockContacts();
        setUsers(mockUsers);
        
        const mockMessages = generateMockMessages();
        setMessages(mockMessages);
        
        toast('Using demo mode due to connection issues', {
          icon: '🔔',
          style: {
            border: '1px solid #3498db',
            padding: '16px',
            color: '#3498db',
          },
        });
      }
    } catch (error) {
      console.error('Error during refresh:', error);
      
      // Set mock mode as final fallback
      setUseMockData(true);
      localStorage.setItem('useMockData', 'true');
      
      toast.error('Failed to refresh messages');
    } finally {
      setLoading(false);
    }
  };

  // Add this new function to handle exiting mock mode
  const handleExitMockMode = () => {
    setUseMockData(false);
    localStorage.removeItem('useMockData');
    toast.success('Exiting demo mode. Reconnecting to server...');
    // Refresh data
    handleRefresh();
  };

  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 100px)', gap: 2, p: 2 }}>
      {/* Contacts List */}
      <Paper sx={{ width: 300, overflow: 'auto' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Available Contacts
        </Typography>

          <TextField
            fullWidth
            size="small"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <IconButton onClick={handleRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Box>
          
          {useMockData && (
            <Box sx={{ mt: 1, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'white' }}>
                Using demo mode
              </Typography>
              <Button 
                size="small" 
                variant="outlined" 
                sx={{ 
                  bgcolor: 'white', 
                  fontSize: '0.7rem',
                  '&:hover': { bgcolor: 'white' }
                }}
                onClick={handleExitMockMode}
              >
                Try reconnecting
              </Button>
            </Box>
          )}
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        <List>
          {filteredUsers.map((user) => (
            <ListItem
              key={user._id}
              button
              selected={selectedContact?._id === user._id}
              onClick={() => handleContactSelect(user)}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: user.role === 'admin' ? 'error.main' : user.role === 'faculty' ? 'success.main' : 'primary.main' }}>
                  {user.role === 'admin' ? <AdminIcon /> : user.role === 'faculty' ? <SchoolIcon /> : <PersonIcon />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={user.name}
                secondary={
                  <Typography 
                    component="span" 
                    variant="body2" 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1 
                    }}
                  >
                    <Chip 
                      label={user.role.toUpperCase()} 
                      size="small"
                      color={user.role === 'admin' ? 'error' : user.role === 'faculty' ? 'success' : 'primary'}
                    />
                  </Typography>
                }
                primaryTypographyProps={{
                  fontWeight: selectedContact?._id === user._id ? 'bold' : 'normal'
                }}
              />
              {messages.filter(m => 
                m.sender._id === user._id && 
                m.receiver._id === currentUser._id && 
                m.status === 'unread'
              ).length > 0 && (
                <Badge 
                  badgeContent={messages.filter(m => 
                    m.sender._id === user._id && 
                    m.receiver._id === currentUser._id && 
                    m.status === 'unread'
                  ).length} 
                  color="error"
                />
              )}
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Messages Area */}
      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
          {selectedContact ? (
            <>
              <Avatar sx={{ bgcolor: selectedContact.role === 'admin' ? 'error.main' : selectedContact.role === 'faculty' ? 'success.main' : 'primary.main' }}>
                {selectedContact.role === 'admin' ? <AdminIcon /> : selectedContact.role === 'faculty' ? <SchoolIcon /> : <PersonIcon />}
              </Avatar>
              <Box>
                <Typography variant="h6">{selectedContact.name}</Typography>
                <Chip 
                  label={selectedContact.role.toUpperCase()} 
                  size="small"
                  color={selectedContact.role === 'admin' ? 'error' : selectedContact.role === 'faculty' ? 'success' : 'primary'}
                />
              </Box>
            </>
          ) : (
            <Typography variant="h6">Select a contact to start messaging</Typography>
          )}
        </Box>

        {/* Messages List */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {loading && !messages.length ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : filteredMessages.length > 0 ? (
            filteredMessages.map((message) => (
              <Box
                key={message._id}
                sx={{
                  display: 'flex',
                  justifyContent: message.sender._id === currentUser._id ? 'flex-end' : 'flex-start',
                  mb: 2,
                }}
              >
                <Paper
                  sx={{
                    p: 2,
                    maxWidth: '70%',
                    bgcolor: message.sender._id === currentUser._id ? 'primary.main' : 'grey.100',
                    color: message.sender._id === currentUser._id ? 'white' : 'inherit',
                  }}
                >
                  <Typography variant="body1">{message.content}</Typography>
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Typography variant="caption">
                    {new Date(message.createdAt).toLocaleString()}
                  </Typography>
                    {message.sender._id === currentUser._id && (
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteMessage(message._id)}
                        sx={{ color: 'inherit' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                  </Box>
                </Paper>
              </Box>
            ))
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography color="text.secondary">
                {selectedContact ? 'No messages yet' : 'Select a contact to start messaging'}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Message Input */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 8 }}>
            <TextField
              fullWidth
              placeholder={selectedContact ? "Type a message..." : "Select a contact to start messaging"}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              disabled={!selectedContact || loading}
              variant="outlined"
              size="small"
              multiline
              maxRows={4}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={!selectedContact || !messageText.trim() || loading}
              endIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
            >
              Send
            </Button>
          </form>
        </Box>
      </Paper>
    </Box>
  );
};

export default Messages; 