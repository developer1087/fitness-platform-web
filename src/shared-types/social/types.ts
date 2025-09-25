// Social Features Types for Fitness Platform

export interface SocialProfile {
  userId: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  coverPhoto?: string;

  // Stats
  stats: SocialStats;

  // Privacy
  isPublic: boolean;
  allowFollowers: boolean;
  allowDMs: boolean;

  // Verification
  isVerified: boolean;
  verificationBadge?: VerificationBadge;

  // Social Links
  socialLinks?: SocialLink[];

  createdAt: Date;
  updatedAt: Date;
}

export interface SocialStats {
  followers: number;
  following: number;
  posts: number;
  workouts: number;
  totalLikes: number;
  totalComments: number;
  influence: number; // 0-100 score
}

export type VerificationBadge =
  | 'trainer'
  | 'nutritionist'
  | 'athlete'
  | 'influencer'
  | 'expert';

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
  username?: string;
}

export type SocialPlatform =
  | 'instagram'
  | 'youtube'
  | 'tiktok'
  | 'twitter'
  | 'linkedin'
  | 'website'
  | 'blog';

// Connections and Following
export interface Connection {
  id: string;
  followerId: string;
  followingId: string;
  status: ConnectionStatus;
  createdAt: Date;
  acceptedAt?: Date;
}

export type ConnectionStatus =
  | 'pending'
  | 'accepted'
  | 'blocked'
  | 'muted';

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  respondedAt?: Date;
}

// Posts and Content
export interface Post {
  id: string;
  authorId: string;
  author: SocialProfile;
  type: PostType;
  content: PostContent;

  // Engagement
  likes: number;
  comments: number;
  shares: number;
  saves: number;

  // Visibility
  visibility: PostVisibility;
  allowComments: boolean;

  // Tags and Location
  tags: string[];
  mentions: string[]; // User IDs
  location?: Location;

  // Scheduling
  scheduledFor?: Date;
  publishedAt?: Date;

  // Status
  status: PostStatus;

  createdAt: Date;
  updatedAt: Date;
}

export type PostType =
  | 'workout'
  | 'progress'
  | 'meal'
  | 'text'
  | 'photo'
  | 'video'
  | 'achievement'
  | 'transformation'
  | 'tip'
  | 'motivation';

export interface PostContent {
  text?: string;
  media?: MediaItem[];
  workoutId?: string;
  progressId?: string;
  mealId?: string;
  achievementId?: string;
  poll?: Poll;
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  caption?: string;
  duration?: number; // for videos in seconds
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface Poll {
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
  endsAt?: Date;
  totalVotes: number;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  percentage: number;
}

export type PostVisibility =
  | 'public'
  | 'followers'
  | 'friends'
  | 'private';

export type PostStatus =
  | 'draft'
  | 'scheduled'
  | 'published'
  | 'archived'
  | 'deleted';

export interface Location {
  name: string;
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  placeId?: string; // For Google Places
}

// Interactions
export interface Like {
  id: string;
  userId: string;
  targetType: 'post' | 'comment' | 'workout';
  targetId: string;
  type: LikeType;
  createdAt: Date;
}

export type LikeType =
  | 'like'
  | 'love'
  | 'strong'
  | 'inspiring'
  | 'fire';

export interface Comment {
  id: string;
  authorId: string;
  author: SocialProfile;
  targetType: 'post' | 'workout' | 'recipe';
  targetId: string;

  content: string;
  mentions?: string[]; // User IDs

  // Engagement
  likes: number;
  replyCount: number;

  // Hierarchy
  parentCommentId?: string;
  replies?: Comment[];

  // Status
  isEdited: boolean;
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface Share {
  id: string;
  userId: string;
  targetType: 'post' | 'workout' | 'recipe';
  targetId: string;
  platform?: 'internal' | 'instagram' | 'facebook' | 'twitter';
  caption?: string;
  createdAt: Date;
}

export interface Save {
  id: string;
  userId: string;
  targetType: 'post' | 'workout' | 'recipe';
  targetId: string;
  collection?: string; // Optional collection name
  createdAt: Date;
}

// Groups and Communities
export interface Group {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  category: GroupCategory;

  // Settings
  privacy: GroupPrivacy;
  allowInvites: boolean;
  requireApproval: boolean;

  // Stats
  memberCount: number;
  postCount: number;

  // Admins
  ownerId: string;
  moderators: string[]; // User IDs

  // Rules
  rules?: GroupRule[];
  tags: string[];

  createdAt: Date;
  updatedAt: Date;
}

export type GroupCategory =
  | 'general_fitness'
  | 'weight_loss'
  | 'muscle_building'
  | 'cardio'
  | 'strength_training'
  | 'yoga'
  | 'running'
  | 'cycling'
  | 'nutrition'
  | 'motivation'
  | 'challenges'
  | 'beginners'
  | 'advanced'
  | 'women_only'
  | 'men_only'
  | 'age_specific'
  | 'local'
  | 'sport_specific';

export type GroupPrivacy =
  | 'public'
  | 'private'
  | 'secret';

export interface GroupRule {
  title: string;
  description: string;
  order: number;
}

export interface GroupMembership {
  id: string;
  groupId: string;
  userId: string;
  role: GroupRole;
  status: MembershipStatus;
  joinedAt: Date;
  invitedBy?: string; // User ID
}

export type GroupRole =
  | 'member'
  | 'moderator'
  | 'admin'
  | 'owner';

export type MembershipStatus =
  | 'active'
  | 'pending'
  | 'banned'
  | 'left';

// Challenges and Competitions
export interface Challenge {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  category: ChallengeCategory;

  // Creator
  createdBy: string; // User ID or 'platform'
  isOfficial: boolean;

  // Timing
  startDate: Date;
  endDate: Date;
  duration: number; // days

  // Rules
  rules: ChallengeRule[];
  eligibility: EligibilityRequirements;

  // Metrics
  metric: ChallengeMetric;
  goal: ChallengeGoal;

  // Participation
  participantCount: number;
  maxParticipants?: number;

  // Rewards
  rewards?: ChallengeReward[];

  // Privacy
  isPublic: boolean;
  requiresApproval: boolean;

  // Status
  status: ChallengeStatus;

  createdAt: Date;
  updatedAt: Date;
}

export type ChallengeCategory =
  | 'steps'
  | 'workouts'
  | 'weight_loss'
  | 'distance'
  | 'strength'
  | 'consistency'
  | 'nutrition'
  | 'habit_building'
  | 'transformation';

export interface ChallengeRule {
  title: string;
  description: string;
  order: number;
}

export interface EligibilityRequirements {
  minAge?: number;
  maxAge?: number;
  fitnessLevel?: string[];
  geography?: string[]; // Country codes
  gender?: 'male' | 'female' | 'any';
}

export interface ChallengeMetric {
  type: 'count' | 'total' | 'average' | 'max' | 'improvement';
  unit: string;
  trackingMethod: 'manual' | 'auto' | 'photo_verification';
}

export interface ChallengeGoal {
  type: 'individual' | 'team' | 'collective';
  target?: number; // For individual goals
  calculation: 'sum' | 'average' | 'max';
}

export interface ChallengeReward {
  rank: number; // 1st, 2nd, 3rd place, etc.
  type: 'badge' | 'points' | 'discount' | 'prize';
  value: string; // Description or value
  criteria?: string; // Additional criteria
}

export type ChallengeStatus =
  | 'upcoming'
  | 'active'
  | 'completed'
  | 'cancelled';

export interface ChallengeParticipation {
  id: string;
  challengeId: string;
  userId: string;
  teamId?: string;

  // Progress
  currentValue: number;
  rank: number;
  submissions: ChallengeSubmission[];

  // Status
  status: ParticipationStatus;
  joinedAt: Date;
  completedAt?: Date;

  // Rewards
  rewardsEarned: ChallengeReward[];
}

export type ParticipationStatus =
  | 'active'
  | 'completed'
  | 'disqualified'
  | 'withdrawn';

export interface ChallengeSubmission {
  id: string;
  participationId: string;
  value: number;
  evidence?: MediaItem[];
  notes?: string;
  submittedAt: Date;
  verified: boolean;
  verifiedBy?: string; // User ID or 'auto'
}

// Teams and Groups for Challenges
export interface Team {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  challengeId: string;

  // Members
  members: TeamMember[];
  maxMembers: number;
  captainId: string;

  // Performance
  totalScore: number;
  rank: number;

  createdAt: Date;
}

export interface TeamMember {
  userId: string;
  role: 'captain' | 'member';
  contribution: number;
  joinedAt: Date;
}

// Leaderboards
export interface Leaderboard {
  id: string;
  type: LeaderboardType;
  period: LeaderboardPeriod;
  category?: string;

  // Entries
  entries: LeaderboardEntry[];
  lastUpdated: Date;

  // Settings
  isPublic: boolean;
  includeAnonymous: boolean;
}

export type LeaderboardType =
  | 'workouts'
  | 'strength'
  | 'endurance'
  | 'consistency'
  | 'weight_loss'
  | 'challenges'
  | 'social_engagement';

export type LeaderboardPeriod =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'all_time';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  metric: string;
  change?: number; // Change from previous period
  streak?: number;
}

// Notifications
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;

  // Data
  data?: NotificationData;

  // Actions
  actions?: NotificationAction[];

  // Status
  isRead: boolean;
  isArchived: boolean;

  // Delivery
  channels: NotificationChannel[];
  sentAt: Date;
  readAt?: Date;

  createdAt: Date;
}

export type NotificationType =
  | 'like'
  | 'comment'
  | 'follow'
  | 'mention'
  | 'workout_reminder'
  | 'goal_reminder'
  | 'achievement'
  | 'challenge_invite'
  | 'challenge_update'
  | 'friend_request'
  | 'group_invite'
  | 'milestone'
  | 'streak_reminder'
  | 'system'
  | 'promotional';

export interface NotificationData {
  [key: string]: any;
  userId?: string;
  postId?: string;
  workoutId?: string;
  challengeId?: string;
  groupId?: string;
}

export interface NotificationAction {
  type: 'view' | 'accept' | 'decline' | 'join' | 'dismiss';
  label: string;
  url?: string;
}

export type NotificationChannel =
  | 'in_app'
  | 'push'
  | 'email'
  | 'sms';

// Messages and Direct Communication
export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  participants: string[]; // User IDs

  // Metadata
  title?: string; // For group conversations
  avatar?: string;

  // Last Activity
  lastMessage?: Message;
  lastActivity: Date;

  // Status
  isArchived: boolean;
  isMuted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: MessageContent;

  // Status
  isEdited: boolean;
  isDeleted: boolean;
  readBy: MessageRead[];

  // Replies
  replyToId?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface MessageContent {
  text?: string;
  media?: MediaItem[];
  workoutId?: string;
  exerciseId?: string;
  recipeId?: string;
  location?: Location;
}

export interface MessageRead {
  userId: string;
  readAt: Date;
}