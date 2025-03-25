const seedEvents = [
  {
    title: 'Annual College Day',
    description: 'Join us for our annual college day celebration featuring cultural performances, awards ceremony, and guest speakers.',
    startDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    endDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // 8 hours duration
    location: 'College Auditorium',
    type: 'cultural',
    organizer: 'Student Council',
    status: 'upcoming'
  },
  {
    title: 'Tech Symposium 2024',
    description: 'A technical symposium featuring workshops, paper presentations, and project exhibitions.',
    startDate: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    endDate: new Date(new Date().getTime() + 15 * 24 * 60 * 60 * 1000), // 2 days duration
    location: 'Engineering Block',
    type: 'academic',
    organizer: 'Department of Computer Science',
    status: 'upcoming'
  },
  {
    title: 'Sports Meet 2024',
    description: 'Annual inter-department sports competition featuring various indoor and outdoor games.',
    startDate: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    endDate: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000), // 5 days duration
    location: 'College Sports Complex',
    type: 'sports',
    organizer: 'Physical Education Department',
    status: 'ongoing'
  },
  {
    title: 'Semester Break',
    description: 'Mid-semester break for all students and faculty.',
    startDate: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    endDate: new Date(new Date().getTime() + 45 * 24 * 60 * 60 * 1000), // 15 days duration
    location: 'College Campus',
    type: 'holiday',
    organizer: 'College Administration',
    status: 'upcoming'
  },
  {
    title: 'Alumni Meet 2023',
    description: 'Annual alumni gathering with networking sessions and cultural events.',
    startDate: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date(new Date().getTime() - 29 * 24 * 60 * 60 * 1000), // 1 day duration
    location: 'College Convention Center',
    type: 'cultural',
    organizer: 'Alumni Association',
    status: 'completed'
  },
  {
    title: 'Placement Drive',
    description: 'Campus recruitment drive with multiple companies visiting for placements.',
    startDate: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    endDate: new Date(new Date().getTime() - 5 * 24 * 60 * 60 * 1000), // 2 days duration
    location: 'Placement Cell',
    type: 'academic',
    organizer: 'Training and Placement Cell',
    status: 'completed'
  },
  {
    title: 'Hackathon 2024',
    description: '24-hour coding competition for students to showcase their programming skills.',
    startDate: new Date(new Date().getTime() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
    endDate: new Date(new Date().getTime() + 22 * 24 * 60 * 60 * 1000), // 1 day duration
    location: 'Computer Labs',
    type: 'academic',
    organizer: 'Department of Computer Science',
    status: 'upcoming'
  },
  {
    title: 'Cultural Festival',
    description: 'Three-day cultural extravaganza featuring music, dance, and art performances.',
    startDate: new Date(new Date().getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    endDate: new Date(new Date().getTime() - 13 * 24 * 60 * 60 * 1000), // 3 days duration
    location: 'College Grounds',
    type: 'cultural',
    organizer: 'Cultural Committee',
    status: 'completed'
  }
];

module.exports = seedEvents; 