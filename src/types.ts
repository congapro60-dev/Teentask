export type UserRole = 'student' | 'parent' | 'business' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role?: UserRole;
  dob?: string;
  gender?: 'Nam' | 'Nữ' | 'Khác';
  parentEmail?: string;
  trustScore: number;
  bio?: string;
  skills: string[];
  savedJobs?: string[];
  savedShadowing?: string[];
  createdAt: number;
  
  // Verification fields
  isVerified?: boolean;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  fullName?: string;
  idNumber?: string;
  idCardPhoto?: string;
  verificationSubmittedAt?: number;
  
  // Student specific
  class?: string;
  school?: string;
  achievements?: string[];
  portfolioLinks?: { title: string; url: string }[];
  location?: string;
  phone?: string;
  parentalVerification?: 'pending' | 'verified' | 'rejected';
  
  // Parent specific
  occupation?: string;
  workplaceName?: string;
  workplaceAddress?: string;
  
  // Business specific
  representativeName?: string;
  businessName?: string;
  businessAddress?: string;
  businessField?: string;
  industry?: string;
  website?: string;
  companySize?: string;
  foundedYear?: number;

  // Financial & VIP fields
  balance: number;
  isVip: boolean;
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  friends?: string[];
  following?: string[];
  followers?: string[];
  cvId?: string;
  lastCheckIn?: string;
  claimedTasks?: string[];
  tutorialCompleted?: { [role: string]: boolean };
  geminiApiKey?: string;
}

export interface CV {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  summary: string;
  education: {
    school: string;
    degree: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  experience: {
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  skills: string[];
  projects: {
    title: string;
    description: string;
    link?: string;
  }[];
  languages: string[];
  photoURL?: string;
  lastUpdated: number;
}

export interface ShadowingBooking {
  id: string;
  userId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime?: string;
  company: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: number;
}

export interface FriendRequest {
  id: string;
  fromId: string;
  fromName: string;
  fromPhoto?: string;
  fromRole: UserRole;
  toId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface Relationship {
  id: string;
  userId: string;
  userName?: string;
  userPhoto?: string;
  relatedUserId: string;
  relatedUserName: string;
  relatedUserPhoto?: string;
  type: 'Family' | 'Professional';
  title: string; // 'Father', 'Mother', 'Son', 'Daughter', 'Director', 'Manager', etc.
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface Job {
  id: string;
  businessId: string;
  businessName: string;
  businessLogo?: string;
  title: string;
  description: string;
  salary: number;
  slotsTotal: number;
  slotsFilled: number;
  deadline: number;
  location: string;
  type: 'online' | 'offline';
  category: string;
  status: 'active' | 'closed';
  isApproved: boolean;
  tags: string[];
  createdAt: number;
}

export interface Advertisement {
  id: string;
  businessId: string;
  businessName: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export interface ShadowingEvent {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorTitle: string;
  mentorPhoto?: string;
  companyName: string;
  title: string;
  description: string;
  date: number;
  price: number;
  slotsTotal: number;
  slotsRemaining: number;
  location: string;
  category: string;
  createdAt: number;
}

export interface Application {
  id: string;
  jobId: string;
  businessId: string;
  studentId: string;
  studentName: string;
  studentPhoto?: string;
  studentEmail?: string;
  studentPhone?: string;
  studentSchool?: string;
  studentClass?: string;
  parentEmail?: string;
  guardianId?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianAddress?: string;
  guardianRelation?: string;
  isManualGuardian?: boolean;
  portfolioUrl?: string;
  parentStatus: 'pending' | 'approved' | 'rejected';
  finalStatus: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: number;
}

export interface Review {
  id: string;
  businessId: string;
  studentId: string;
  studentName: string;
  studentPhoto?: string;
  rating: number;
  comment: string;
  jobId: string;
  jobTitle: string;
  createdAt: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  applicationId?: string;
  createdAt: number;
  read: boolean;
}

export interface Rating {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  jobId?: string;
  score: number;
  comment?: string;
  createdAt: number;
}

export interface Chat {
  id: string;
  participants: string[];
  participantDetails: {
    [uid: string]: {
      displayName: string;
      photoURL?: string;
      role: string;
    };
  };
  lastMessage?: string;
  lastMessageAt?: number;
  relatedTo?: {
    type: 'job' | 'shadowing';
    id: string;
    title: string;
  };
  createdAt: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'reward';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  createdAt: number;
}

export interface NameChangeRequest {
  id: string;
  userId: string;
  currentName: string;
  newName: string;
  reason: string;
  proofUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  reviewedAt?: number;
  adminComment?: string;
}
